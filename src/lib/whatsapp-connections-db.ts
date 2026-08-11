import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { MetaEmbeddedSignupPayload } from "@/lib/meta/embedded-signup";
import type { TokenMetadata } from "@/lib/meta/server";
import { decryptToken, encryptToken } from "@/lib/crypto/token-cipher";
import type { AutomationMode, ModelTier } from "@/lib/tenant-automation";

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
  connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  client: string | null;
  businessTokenStored: boolean;
  connectedAt: string;
  lastSyncedAt: string | null;
  registeredAt: string | null;
  webhookOverrideUri: string | null;
  webhookOverrideScope: string | null;
  crmOrganizationId: string | null;
  crmOrganizationName: string | null;
  crmProvider: string | null;
  crmConnectedAt: string | null;
  botConfigured: boolean;
  automationEnabled: boolean;
  operatingMode: AutomationMode | null;
  modelTier: ModelTier | null;
};

export type WhatsAppConnectionActivity = {
  conversations: number;
  waitingReplies: number;
  messages: number;
  lastMessageAt: string | null;
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
  connectionMode: "META_CLOUD_API" | "META_COEXISTENCE";
  /** Identifies one signed Embedded Signup session for one-shot Coexistence sync calls. */
  onboardingNonce?: string | null;
  /** Plaintext; encrypted here. Only set for META_CLOUD_API, which needs it to re-register. */
  registrationPin?: string | null;
  registeredAt?: string | null;
}) {
  const sql = getSql();
  const encryptedToken = encryptToken(input.businessToken);
  const encryptedPin = input.registrationPin ? encryptToken(input.registrationPin) : null;
  await sql`
    INSERT INTO whatsapp_connections (
      waba_id, phone_number_id, business_id, business_token, meta_user_id,
      display_phone_number, verified_name, quality_rating, name_status, status,
      client, owner_user_id, team_id, account_id, token_metadata, connection_mode,
      registration_pin, registered_at, connected_at, last_synced_at, updated_at
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
      ${input.connectionMode},
      ${encryptedPin},
      ${input.registeredAt ?? null},
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
      status = CASE
        WHEN ${input.connectionMode} = 'META_COEXISTENCE'
          AND ${input.onboardingNonce ?? null}::text IS NOT NULL
          AND whatsapp_connections.token_metadata #>> '{coexistence,onboarding_nonce}' = ${input.onboardingNonce ?? null}::text
        THEN whatsapp_connections.status
        ELSE EXCLUDED.status
      END,
      client = EXCLUDED.client,
      owner_user_id = EXCLUDED.owner_user_id,
      team_id = EXCLUDED.team_id,
      account_id = EXCLUDED.account_id,
      token_metadata = CASE
        WHEN ${input.connectionMode} = 'META_COEXISTENCE'
          AND ${input.onboardingNonce ?? null}::text IS NOT NULL
          AND whatsapp_connections.token_metadata #>> '{coexistence,onboarding_nonce}' = ${input.onboardingNonce ?? null}::text
        THEN EXCLUDED.token_metadata || jsonb_build_object(
          'coexistence', whatsapp_connections.token_metadata -> 'coexistence'
        )
        ELSE EXCLUDED.token_metadata
      END,
      connection_mode = EXCLUDED.connection_mode,
      -- Keep the stored pin when this run did not produce one: Meta requires the
      -- original pin on every later re-register, so overwriting it with null
      -- would lock the number out.
      registration_pin = COALESCE(EXCLUDED.registration_pin, whatsapp_connections.registration_pin),
      registered_at = COALESCE(EXCLUDED.registered_at, whatsapp_connections.registered_at),
      connected_at = EXCLUDED.connected_at,
      last_synced_at = now(),
      updated_at = now()
  `;
}

/** Decrypted pin from a previous registration, or null if the number never had one. */
export async function getStoredRegistrationPin(
  wabaId: string,
  phoneNumberId: string,
): Promise<string | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT registration_pin FROM whatsapp_connections
    WHERE waba_id = ${wabaId} AND phone_number_id = ${phoneNumberId}
    LIMIT 1
  `;
  const stored = rows[0]?.registration_pin;
  return stored ? decryptToken(String(stored)) : null;
}

export async function listWhatsAppConnections(): Promise<WhatsAppConnectionView[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT waba_id, phone_number_id, business_id, display_phone_number,
      verified_name, quality_rating, name_status, status, connection_mode, client,
      business_token IS NOT NULL AND business_token <> '' AS business_token_stored,
      connected_at, last_synced_at, registered_at, webhook_override_uri, webhook_override_scope,
      token_metadata #>> '{crm_handover,organization_id}' AS crm_organization_id,
      token_metadata #>> '{crm_handover,organization_name}' AS crm_organization_name,
      token_metadata #>> '{crm_handover,provider}' AS crm_provider,
      token_metadata #>> '{crm_handover,connected_at}' AS crm_connected_at,
      bot.phone_number_id IS NOT NULL AS bot_configured,
      COALESCE(bot.enabled, false) AS automation_enabled,
      bot.operating_mode, bot.model_tier
    FROM whatsapp_connections AS connection
    LEFT JOIN tenant_bot_config AS bot USING (phone_number_id)
    ORDER BY connection.connected_at DESC
  `;

  return rows.map(mapWhatsAppConnection);
}

export async function getLatestWhatsAppConnectionForClient(
  client: string,
): Promise<WhatsAppConnectionView | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT waba_id, phone_number_id, business_id, display_phone_number,
      verified_name, quality_rating, name_status, status, connection_mode, client,
      business_token IS NOT NULL AND business_token <> '' AS business_token_stored,
      connected_at, last_synced_at,
      token_metadata #>> '{crm_handover,organization_id}' AS crm_organization_id,
      token_metadata #>> '{crm_handover,organization_name}' AS crm_organization_name,
      token_metadata #>> '{crm_handover,provider}' AS crm_provider,
      token_metadata #>> '{crm_handover,connected_at}' AS crm_connected_at
    FROM whatsapp_connections
    WHERE client = ${client} AND status != 'deauthorized'
    ORDER BY connected_at DESC
    LIMIT 1
  `;
  return rows[0] ? mapWhatsAppConnection(rows[0]) : null;
}

export async function getWhatsAppConnectionByPhoneNumberId(
  phoneNumberId: string,
): Promise<WhatsAppConnectionView | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT connection.waba_id, connection.phone_number_id, connection.business_id,
      connection.display_phone_number, connection.verified_name, connection.quality_rating,
      connection.name_status, connection.status, connection.connection_mode, connection.client,
      connection.business_token IS NOT NULL AND connection.business_token <> '' AS business_token_stored,
      connection.connected_at, connection.last_synced_at, connection.registered_at,
      connection.webhook_override_uri, connection.webhook_override_scope,
      connection.token_metadata #>> '{crm_handover,organization_id}' AS crm_organization_id,
      connection.token_metadata #>> '{crm_handover,organization_name}' AS crm_organization_name,
      connection.token_metadata #>> '{crm_handover,provider}' AS crm_provider,
      connection.token_metadata #>> '{crm_handover,connected_at}' AS crm_connected_at,
      bot.phone_number_id IS NOT NULL AS bot_configured,
      COALESCE(bot.enabled, false) AS automation_enabled,
      bot.operating_mode, bot.model_tier
    FROM whatsapp_connections AS connection
    LEFT JOIN tenant_bot_config AS bot USING (phone_number_id)
    WHERE connection.phone_number_id = ${phoneNumberId}
    ORDER BY connection.updated_at DESC
    LIMIT 1
  `;
  return rows[0] ? mapWhatsAppConnection(rows[0]) : null;
}

export async function getWhatsAppConnectionActivity(
  phoneNumberId: string,
  channelKind: "cloud_api" | "waha" = "cloud_api",
): Promise<WhatsAppConnectionActivity> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      count(DISTINCT conversation.id)::int AS conversations,
      count(DISTINCT conversation.id) FILTER (
        WHERE conversation.status = 'open'
          AND conversation.assigned_mode = 'human'
          AND conversation.last_inbound_at = conversation.last_message_at
          AND conversation.last_inbound_at >= now() - interval '7 days'
      )::int AS waiting_replies,
      count(message.id)::int AS messages,
      max(message.created_at) AS last_message_at
    FROM wa_conversations AS conversation
    LEFT JOIN wa_messages AS message ON message.conversation_id = conversation.id
    WHERE conversation.channel_kind = ${channelKind}
      AND conversation.channel_key = ${phoneNumberId}
  `;
  const row = rows[0] ?? {};
  return {
    conversations: Number(row.conversations ?? 0),
    waitingReplies: Number(row.waiting_replies ?? 0),
    messages: Number(row.messages ?? 0),
    lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : null,
  };
}

/**
 * Request-facing lookup. `client` is required: a caller that takes the
 * phone_number_id from a request body must scope it to its own workspace, or one
 * operator can send through another workspace's number.
 */
export async function getWhatsAppProviderConnection(phoneNumberId: string, client: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT waba_id, phone_number_id, business_token, connection_mode
    FROM whatsapp_connections
    WHERE phone_number_id = ${phoneNumberId} AND client = ${client}
      AND status != 'deauthorized'
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  return mapProviderConnection(rows[0]);
}

/**
 * Trusted lookup — only for a phone_number_id already read from a stored row
 * (wa_conversations.channel_key), never one supplied by a request. The stored row
 * is what scopes the tenant, so there is no workspace left to check.
 */
export async function getWhatsAppProviderConnectionForStoredChannel(phoneNumberId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT waba_id, phone_number_id, business_token, connection_mode
    FROM whatsapp_connections
    WHERE phone_number_id = ${phoneNumberId} AND status != 'deauthorized'
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  return mapProviderConnection(rows[0]);
}

export async function recordWhatsAppCrmHandover(input: {
  wabaId: string;
  phoneNumberId: string;
  /** `rei_crm` o `custom`: la app propia del cliente, a la que allok no le habla. */
  provider: string;
  organizationId: string | null;
  organizationName: string | null;
  webhookUri: string;
  connectedAt: string;
}) {
  const sql = getSql();
  const rows = await sql`
    UPDATE whatsapp_connections
    SET webhook_override_uri = ${input.webhookUri},
        webhook_override_scope = 'waba',
        token_metadata = jsonb_set(
          COALESCE(token_metadata, '{}'::jsonb),
          '{crm_handover}',
          ${JSON.stringify({
            provider: input.provider,
            organization_id: input.organizationId,
            organization_name: input.organizationName,
            connected_at: input.connectedAt,
          })}::jsonb,
          true
        ),
        updated_at = now()
    WHERE waba_id = ${input.wabaId} AND phone_number_id = ${input.phoneNumberId}
    RETURNING phone_number_id
  `;
  if (!rows[0]) throw new Error("crm_handover_connection_not_found");
}

/**
 * Devuelve la conexión a la bandeja de allok: sin destino externo y sin
 * override registrado. En Meta el callback sigue apuntando acá, que es lo
 * mismo que no tener override.
 */
export async function clearWhatsAppCrmHandover(input: { wabaId: string; phoneNumberId: string }) {
  const sql = getSql();
  const rows = await sql`
    UPDATE whatsapp_connections
    SET webhook_override_uri = null,
        webhook_override_scope = null,
        token_metadata = COALESCE(token_metadata, '{}'::jsonb) - 'crm_handover',
        updated_at = now()
    WHERE waba_id = ${input.wabaId} AND phone_number_id = ${input.phoneNumberId}
    RETURNING phone_number_id
  `;
  if (!rows[0]) throw new Error("crm_handover_connection_not_found");
}

function mapProviderConnection(row: Record<string, unknown> | undefined) {
  if (!row?.business_token) return null;
  return {
    id: String(row.phone_number_id),
    mode: row.connection_mode === "META_CLOUD_API" ? "META_CLOUD_API" as const : "META_COEXISTENCE" as const,
    wabaId: String(row.waba_id),
    phoneNumberId: String(row.phone_number_id),
    businessToken: decryptToken(String(row.business_token)),
  };
}

export async function markWhatsAppConnectionDisconnected(
  wabaId: string,
  phoneNumberId: string,
) {
  const sql = getSql();
  await sql`
    UPDATE whatsapp_connections
    SET status = 'deauthorized', business_token = null,
      token_metadata = '{}'::jsonb, updated_at = now()
    WHERE waba_id = ${wabaId} AND phone_number_id = ${phoneNumberId}
  `;
}

export async function markWhatsAppConnectionStatusByWaba(wabaId: string, status: string) {
  const sql = getSql();
  await sql`
    UPDATE whatsapp_connections
    SET status = ${status}, updated_at = now()
    WHERE waba_id = ${wabaId}
  `;
}

/**
 * Atomically claims Meta's one-shot contact/history requests for one signup
 * nonce. A repeated exchange with the same signed state reads the stored result
 * instead of issuing either Graph request again.
 */
export async function claimWhatsAppCoexistenceSync(input: {
  wabaId: string;
  phoneNumberId: string;
  onboardingNonce: string;
  requestedAt: string;
}): Promise<{ claimed: boolean; status: string; metadata: Record<string, unknown> | null }> {
  const sql = getSql();
  const marker = {
    onboarding_nonce: input.onboardingNonce,
    request_started_at: input.requestedAt,
    state: "requesting",
  };
  const rows = await sql`
    WITH claimed AS (
      UPDATE whatsapp_connections
      SET token_metadata = jsonb_set(
            COALESCE(token_metadata, '{}'::jsonb),
            '{coexistence}',
            ${JSON.stringify(marker)}::jsonb,
            true
          ),
          updated_at = now()
      WHERE waba_id = ${input.wabaId}
        AND phone_number_id = ${input.phoneNumberId}
        AND NOT (COALESCE(token_metadata, '{}'::jsonb) ? 'coexistence')
      RETURNING status, token_metadata -> 'coexistence' AS metadata
    )
    SELECT true AS claimed, status, metadata FROM claimed
    UNION ALL
    SELECT false AS claimed, status, token_metadata -> 'coexistence' AS metadata
    FROM whatsapp_connections
    WHERE waba_id = ${input.wabaId} AND phone_number_id = ${input.phoneNumberId}
      AND NOT EXISTS (SELECT 1 FROM claimed)
    LIMIT 1
  `;
  if (!rows[0]) throw new Error("coexistence_sync_connection_not_found");
  const metadata = rows[0].metadata;
  return {
    claimed: rows[0].claimed === true,
    status: String(rows[0].status),
    metadata:
      metadata && typeof metadata === "object" && !Array.isArray(metadata)
        ? metadata as Record<string, unknown>
        : null,
  };
}

export async function recordWhatsAppCoexistenceSync(input: {
  wabaId: string;
  phoneNumberId: string;
  status: string;
  metadata: Record<string, unknown>;
}) {
  const sql = getSql();
  await sql`
    UPDATE whatsapp_connections
    SET status = ${input.status},
        token_metadata = jsonb_set(
          COALESCE(token_metadata, '{}'::jsonb),
          '{coexistence}',
          ${JSON.stringify(input.metadata)}::jsonb,
          true
        ),
        last_synced_at = now(),
        updated_at = now()
    WHERE waba_id = ${input.wabaId} AND phone_number_id = ${input.phoneNumberId}
  `;
}

function mapWhatsAppConnection(row: Record<string, unknown>): WhatsAppConnectionView {
  return {
    wabaId: String(row.waba_id),
    phoneNumberId: String(row.phone_number_id),
    businessId: row.business_id ? String(row.business_id) : null,
    displayPhoneNumber: row.display_phone_number ? String(row.display_phone_number) : null,
    verifiedName: row.verified_name ? String(row.verified_name) : null,
    qualityRating: row.quality_rating ? String(row.quality_rating) : null,
    nameStatus: row.name_status ? String(row.name_status) : null,
    status: String(row.status),
    connectionMode:
      row.connection_mode === "META_CLOUD_API" ? "META_CLOUD_API" : "META_COEXISTENCE",
    client: row.client ? String(row.client) : null,
    businessTokenStored: row.business_token_stored === true,
    connectedAt: new Date(String(row.connected_at)).toISOString(),
    lastSyncedAt: row.last_synced_at
      ? new Date(String(row.last_synced_at)).toISOString()
      : null,
    registeredAt: row.registered_at ? new Date(String(row.registered_at)).toISOString() : null,
    webhookOverrideUri: row.webhook_override_uri ? String(row.webhook_override_uri) : null,
    webhookOverrideScope: row.webhook_override_scope ? String(row.webhook_override_scope) : null,
    crmOrganizationId: row.crm_organization_id ? String(row.crm_organization_id) : null,
    crmOrganizationName: row.crm_organization_name ? String(row.crm_organization_name) : null,
    crmProvider: row.crm_provider ? String(row.crm_provider) : null,
    crmConnectedAt: row.crm_connected_at ? new Date(String(row.crm_connected_at)).toISOString() : null,
    botConfigured: row.bot_configured === true,
    automationEnabled: row.automation_enabled === true,
    operatingMode: row.operating_mode === "off" || row.operating_mode === "approval" || row.operating_mode === "automatic"
      ? row.operating_mode
      : null,
    modelTier: row.model_tier === "fast" || row.model_tier === "balanced" ? row.model_tier : null,
  };
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

export async function deleteWhatsAppDataForMetaUser(metaUserId: string) {
  const sql = getSql();
  await sql`
    WITH target_connections AS MATERIALIZED (
      SELECT phone_number_id FROM whatsapp_connections WHERE meta_user_id = ${metaUserId}
    ), deleted_conversations AS (
      DELETE FROM wa_conversations
      WHERE channel_kind = 'cloud_api'
        AND channel_key IN (SELECT phone_number_id FROM target_connections)
      RETURNING id
    )
    DELETE FROM whatsapp_connections WHERE meta_user_id = ${metaUserId}
  `;
}
