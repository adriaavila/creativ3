import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Data access for the real WhatsApp inbox (migration 006). One conversation/message
// model shared by both channels, discriminated by channel_kind/channel_key — see
// db/migrations/006_whatsapp_channels_inbox.sql for the schema and the reasoning.

export type ChannelKind = "cloud_api" | "waha";
export type MessageDirection = "in" | "out";
export type MessageSource = "api" | "phone" | "ai";
export type ConversationStatus = "open" | "snoozed" | "closed";
export type AssignedMode = "human" | "ai";

export type WaConversation = {
  id: number;
  channelKind: ChannelKind;
  channelKey: string;
  contactWaId: string;
  contactName: string | null;
  status: ConversationStatus;
  assignedMode: AssignedMode;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WaMessage = {
  id: number;
  conversationId: number;
  waMessageId: string | null;
  direction: MessageDirection;
  source: MessageSource;
  msgType: string;
  body: string | null;
  payload: Record<string, unknown>;
  status: string | null;
  createdAt: string;
};

export type WahaConnectionRecord = {
  id: string;
  client: string | null;
  wahaBaseUrl: string;
  status: "pending" | "scan_qr" | "connected" | "disconnected";
  phoneDisplay: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
};

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for the WhatsApp inbox.");
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConversation(row: any): WaConversation {
  return {
    id: Number(row.id),
    channelKind: row.channel_kind,
    channelKey: String(row.channel_key),
    contactWaId: String(row.contact_wa_id),
    contactName: row.contact_name ? String(row.contact_name) : null,
    status: row.status,
    assignedMode: row.assigned_mode,
    lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : null,
    lastInboundAt: row.last_inbound_at ? new Date(String(row.last_inbound_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapMessage(row: any): WaMessage {
  return {
    id: Number(row.id),
    conversationId: Number(row.conversation_id),
    waMessageId: row.wa_message_id ? String(row.wa_message_id) : null,
    direction: row.direction,
    source: row.source,
    msgType: String(row.msg_type),
    body: row.body ? String(row.body) : null,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    status: row.status ? String(row.status) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWahaConnection(row: any): WahaConnectionRecord {
  return {
    id: String(row.id),
    client: row.client ? String(row.client) : null,
    wahaBaseUrl: String(row.waha_base_url),
    status: row.status,
    phoneDisplay: row.phone_display ? String(row.phone_display) : null,
    connectedAt: row.connected_at ? new Date(String(row.connected_at)).toISOString() : null,
    lastSyncedAt: row.last_synced_at ? new Date(String(row.last_synced_at)).toISOString() : null,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

/** Upserts the conversation and bumps last_message_at (+ last_inbound_at on inbound). */
export async function upsertConversation(input: {
  channelKind: ChannelKind;
  channelKey: string;
  contactWaId: string;
  contactName?: string | null;
  direction: MessageDirection;
  occurredAt?: string;
}): Promise<WaConversation> {
  const sql = getSql();
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const rows = await sql`
    INSERT INTO wa_conversations (
      channel_kind, channel_key, contact_wa_id, contact_name, last_message_at, last_inbound_at
    )
    VALUES (
      ${input.channelKind}, ${input.channelKey}, ${input.contactWaId}, ${input.contactName ?? null},
      ${occurredAt},
      ${input.direction === "in" ? occurredAt : null}
    )
    ON CONFLICT (channel_kind, channel_key, contact_wa_id)
    DO UPDATE SET
      contact_name = COALESCE(EXCLUDED.contact_name, wa_conversations.contact_name),
      last_message_at = ${occurredAt},
      last_inbound_at = CASE WHEN ${input.direction} = 'in' THEN ${occurredAt}::timestamptz ELSE wa_conversations.last_inbound_at END,
      updated_at = now()
    RETURNING *
  `;
  return mapConversation(rows[0]);
}

export async function getConversationById(id: number): Promise<WaConversation | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM wa_conversations WHERE id = ${id}`;
  return rows[0] ? mapConversation(rows[0]) : null;
}

export async function listConversations(limit = 100): Promise<WaConversation[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM wa_conversations
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT ${limit}
  `;
  return rows.map(mapConversation);
}

export async function setConversationAssignedMode(id: number, mode: AssignedMode): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE wa_conversations SET assigned_mode = ${mode}, updated_at = now() WHERE id = ${id}
  `;
}

/**
 * Inserts a message. Idempotent by wa_message_id via a partial unique index — a
 * duplicate delivery (webhook retry) returns null instead of a second row.
 */
export async function insertMessage(input: {
  conversationId: number;
  waMessageId?: string | null;
  direction: MessageDirection;
  source: MessageSource;
  msgType?: string;
  body?: string | null;
  payload?: Record<string, unknown>;
  status?: string | null;
}): Promise<WaMessage | null> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO wa_messages (
      conversation_id, wa_message_id, direction, source, msg_type, body, payload, status
    )
    VALUES (
      ${input.conversationId},
      ${input.waMessageId ?? null},
      ${input.direction},
      ${input.source},
      ${input.msgType ?? "text"},
      ${input.body ?? null},
      ${JSON.stringify(input.payload ?? {})}::jsonb,
      ${input.status ?? null}
    )
    ON CONFLICT (wa_message_id) WHERE wa_message_id IS NOT NULL DO NOTHING
    RETURNING *
  `;
  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function updateMessageStatusByWaId(waMessageId: string, status: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE wa_messages SET status = ${status} WHERE wa_message_id = ${waMessageId}
  `;
}

export async function listMessages(conversationId: number, limit = 200): Promise<WaMessage[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM wa_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
  return rows.map(mapMessage);
}

export async function getRecentMessagesForAi(conversationId: number, limit = 20): Promise<WaMessage[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM wa_messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapMessage).reverse();
}

// --- WAHA connections (sessions) ---

export async function upsertWahaConnection(input: {
  id: string;
  client?: string | null;
  wahaBaseUrl: string;
  status?: WahaConnectionRecord["status"];
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO waha_connections (id, client, waha_base_url, status, updated_at)
    VALUES (${input.id}, ${input.client ?? null}, ${input.wahaBaseUrl}, ${input.status ?? "pending"}, now())
    ON CONFLICT (id) DO UPDATE SET
      client = EXCLUDED.client,
      waha_base_url = EXCLUDED.waha_base_url,
      status = EXCLUDED.status,
      updated_at = now()
  `;
}

export async function updateWahaConnectionStatus(
  id: string,
  status: WahaConnectionRecord["status"],
  phoneDisplay?: string | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE waha_connections
    SET status = ${status},
        phone_display = COALESCE(${phoneDisplay ?? null}, phone_display),
        connected_at = CASE WHEN ${status} = 'connected' THEN now() ELSE connected_at END,
        last_synced_at = now(),
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function getWahaConnection(id: string): Promise<WahaConnectionRecord | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM waha_connections WHERE id = ${id}`;
  return rows[0] ? mapWahaConnection(rows[0]) : null;
}

export async function listWahaConnections(): Promise<WahaConnectionRecord[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM waha_connections ORDER BY updated_at DESC`;
  return rows.map(mapWahaConnection);
}
