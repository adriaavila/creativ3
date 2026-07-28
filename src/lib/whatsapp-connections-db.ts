import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { MetaEmbeddedSignupPayload } from "@/lib/meta/embedded-signup";
import type { TokenMetadata } from "@/lib/meta/server";
import { decryptToken, encryptToken } from "@/lib/crypto/token-cipher";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export type WhatsAppPhoneProfile = {
  id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
  name_status?: string;
};

export type WhatsAppConnectionView = {
  wabaId: string;
  phoneNumberId: string;
  businessId: string | null;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  qualityRating: string | null;
  nameStatus: string | null;
  status: string;
  client: string | null;
  connectedAt: string;
  lastSyncedAt: string | null;
};

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to store WhatsApp connections.");
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function upsertWhatsAppConnection(input: {
  payload: MetaEmbeddedSignupPayload;
  businessToken: string;
  tokenMetadata: TokenMetadata;
  phoneProfile: WhatsAppPhoneProfile;
  status: string;
  connectedAt: string;
}) {
  const sql = getSql();
  const encryptedToken = encryptToken(input.businessToken);
  await sql`
    INSERT INTO whatsapp_connections (
      waba_id, phone_number_id, business_id, business_token, meta_user_id,
      display_phone_number, verified_name, quality_rating, name_status, status,
      client, owner_user_id, team_id, account_id, token_metadata, connected_at,
      last_synced_at, updated_at
    )
    VALUES (
      ${input.payload.waba_id},
      ${input.payload.phone_number_id},
      ${input.payload.business_id ?? null},
      ${encryptedToken},
      ${input.tokenMetadata.user_id ?? null},
      ${input.phoneProfile.display_phone_number ?? null},
      ${input.phoneProfile.verified_name ?? null},
      ${input.phoneProfile.quality_rating ?? null},
      ${input.phoneProfile.name_status ?? null},
      ${input.status},
      ${input.payload.client ?? null},
      ${input.payload.user_id ?? null},
      ${input.payload.team_id ?? null},
      ${input.payload.account_id ?? null},
      ${JSON.stringify(input.tokenMetadata)}::jsonb,
      ${input.connectedAt},
      now(),
      now()
    )
    ON CONFLICT (waba_id, phone_number_id)
    DO UPDATE SET
      business_id = EXCLUDED.business_id,
      business_token = EXCLUDED.business_token,
      meta_user_id = EXCLUDED.meta_user_id,
      display_phone_number = EXCLUDED.display_phone_number,
      verified_name = EXCLUDED.verified_name,
      quality_rating = EXCLUDED.quality_rating,
      name_status = EXCLUDED.name_status,
      status = EXCLUDED.status,
      client = EXCLUDED.client,
      owner_user_id = EXCLUDED.owner_user_id,
      team_id = EXCLUDED.team_id,
      account_id = EXCLUDED.account_id,
      token_metadata = EXCLUDED.token_metadata,
      connected_at = EXCLUDED.connected_at,
      last_synced_at = now(),
      updated_at = now()
  `;
}

export async function listWhatsAppConnections(): Promise<WhatsAppConnectionView[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT waba_id, phone_number_id, business_id, display_phone_number,
      verified_name, quality_rating, name_status, status, client,
      connected_at, last_synced_at
    FROM whatsapp_connections
    ORDER BY connected_at DESC
  `;

  return rows.map((row) => ({
    wabaId: String(row.waba_id),
    phoneNumberId: String(row.phone_number_id),
    businessId: row.business_id ? String(row.business_id) : null,
    displayPhoneNumber: row.display_phone_number ? String(row.display_phone_number) : null,
    verifiedName: row.verified_name ? String(row.verified_name) : null,
    qualityRating: row.quality_rating ? String(row.quality_rating) : null,
    nameStatus: row.name_status ? String(row.name_status) : null,
    status: String(row.status),
    client: row.client ? String(row.client) : null,
    connectedAt: new Date(String(row.connected_at)).toISOString(),
    lastSyncedAt: row.last_synced_at
      ? new Date(String(row.last_synced_at)).toISOString()
      : null,
  }));
}

export async function markWhatsAppConnectionsDeauthorized(metaUserId: string) {
  const sql = getSql();
  await sql`
    UPDATE whatsapp_connections
    SET status = 'deauthorized', business_token = null,
      token_metadata = '{}'::jsonb, updated_at = now()
    WHERE meta_user_id = ${metaUserId}
  `;
}

export async function deleteWhatsAppConnectionsForMetaUser(metaUserId: string) {
  const sql = getSql();
  await sql`
    DELETE FROM whatsapp_connections
    WHERE meta_user_id = ${metaUserId}
  `;
}

/** Decrypts and returns the live business token for a connection, or null if not connected. */
export async function getWhatsAppConnectionToken(
  wabaId: string,
  phoneNumberId: string,
): Promise<string | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT business_token
    FROM whatsapp_connections
    WHERE waba_id = ${wabaId} AND phone_number_id = ${phoneNumberId}
  `;
  const raw = rows[0]?.business_token;
  if (!raw) return null;
  return decryptToken(String(raw));
}

/**
 * Same as getWhatsAppConnectionToken but keyed by phone_number_id alone — the
 * inbox (wa_conversations.channel_key) only carries the phone number id, not the
 * waba_id. A phone number id is only ever attached to one WABA in practice.
 */
export async function getWhatsAppConnectionTokenByPhoneNumberId(
  phoneNumberId: string,
): Promise<string | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT business_token
    FROM whatsapp_connections
    WHERE phone_number_id = ${phoneNumberId} AND status != 'deauthorized'
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  const raw = rows[0]?.business_token;
  if (!raw) return null;
  return decryptToken(String(raw));
}
