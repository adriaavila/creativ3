import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Data access for the real WhatsApp inbox (migration 006). One conversation/message
// model shared by both channels, discriminated by channel_kind/channel_key — see
// db/migrations/006_whatsapp_channels_inbox.sql for the schema and the reasoning.

export type ChannelKind = "cloud_api" | "waha";
export type MessageDirection = "in" | "out";
export type MessageSource = "api" | "phone" | "ai";
export type ConversationStatus = "open" | "snoozed" | "closed";
export type AssignedMode = "human" | "ai";
/** Commercial result of the conversation — migration 008. Null = not marked yet. */
export type ConversationOutcome = "cita" | "cotizacion" | "descarte";

export type WaConversation = {
  id: number;
  connectionId: string | null;
  channelKind: ChannelKind;
  channelKey: string;
  contactWaId: string;
  contactName: string | null;
  status: ConversationStatus;
  assignedMode: AssignedMode;
  outcome: ConversationOutcome | null;
  outcomeAt: string | null;
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
  connectionId: string;
  workspaceId: string;
  wahaSessionId: string;
  stripePurchaseId: string | null;
  client: string | null;
  wahaBaseUrl: string;
  status: "pending" | "starting" | "scan_qr" | "passkey" | "connected" | "stopped" | "failed" | "deleted";
  phoneDisplay: string | null;
  connectedAt: string | null;
  lastSyncedAt: string | null;
  lastWebhookAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type WahaWebhookEventRecord = {
  eventId: string;
  connectionId: string | null;
  sessionId: string;
  payload: Record<string, unknown>;
  attempts: number;
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
    connectionId: row.connection_id ? String(row.connection_id) : null,
    channelKind: row.channel_kind,
    channelKey: String(row.channel_key),
    contactWaId: String(row.contact_wa_id),
    contactName: row.contact_name ? String(row.contact_name) : null,
    status: row.status,
    assignedMode: row.assigned_mode,
    outcome: row.outcome ?? null,
    outcomeAt: row.outcome_at ? new Date(String(row.outcome_at)).toISOString() : null,
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
    connectionId: String(row.connection_id),
    workspaceId: String(row.workspace_id),
    wahaSessionId: String(row.waha_session_id),
    stripePurchaseId: row.stripe_purchase_id ? String(row.stripe_purchase_id) : null,
    client: row.client ? String(row.client) : null,
    wahaBaseUrl: String(row.waha_base_url),
    status: row.status,
    phoneDisplay: row.phone_display ? String(row.phone_display) : null,
    connectedAt: row.connected_at ? new Date(String(row.connected_at)).toISOString() : null,
    lastSyncedAt: row.last_synced_at ? new Date(String(row.last_synced_at)).toISOString() : null,
    lastWebhookAt: row.last_webhook_at ? new Date(String(row.last_webhook_at)).toISOString() : null,
    lastInboundAt: row.last_inbound_at ? new Date(String(row.last_inbound_at)).toISOString() : null,
    lastOutboundAt: row.last_outbound_at ? new Date(String(row.last_outbound_at)).toISOString() : null,
    lastError: row.last_error ? String(row.last_error) : null,
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
  connectionId?: string | null;
}): Promise<WaConversation> {
  const sql = getSql();
  const occurredAt = input.occurredAt ?? new Date().toISOString();
  const rows = await sql`
    INSERT INTO wa_conversations (
      channel_kind, channel_key, contact_wa_id, contact_name, last_message_at, last_inbound_at, connection_id
    )
    VALUES (
      ${input.channelKind}, ${input.channelKey}, ${input.contactWaId}, ${input.contactName ?? null},
      ${occurredAt},
      ${input.direction === "in" ? occurredAt : null},
      ${input.connectionId ?? null}
    )
    ON CONFLICT (channel_kind, channel_key, contact_wa_id)
    DO UPDATE SET
      contact_name = COALESCE(EXCLUDED.contact_name, wa_conversations.contact_name),
      connection_id = COALESCE(EXCLUDED.connection_id, wa_conversations.connection_id),
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

/** Marks (or, with null, un-marks) the commercial result of a conversation. */
export async function setConversationOutcome(
  id: number,
  outcome: ConversationOutcome | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE wa_conversations
    SET outcome = ${outcome},
        outcome_at = ${outcome === null ? null : new Date().toISOString()},
        updated_at = now()
    WHERE id = ${id}
  `;
}

export type NextStepSummary = {
  share: number | null; // % of this month's conversations that ended marked
  citas: number; // citas marked this month — the billable unit
  prevShare: number | null; // same share last month, the baseline to beat
};

/** Null rather than 0% for an empty month: "no data" and "nobody replied" are not the same claim. */
export function outcomeShare(marked: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((marked / total) * 100);
}

/**
 * This month vs last — the baseline comparison the results-based pricing is
 * argued from. Unmarked conversations count against the share, never for it.
 */
export async function getNextStepSummary(): Promise<NextStepSummary> {
  const sql = getSql();
  // ponytail: month buckets in UTC. Venezuela is UTC-4, so the first 4h of a
  // month land in the previous bucket. Add `AT TIME ZONE 'America/Caracas'` if a
  // close month ever decides an invoice.
  const rows = await sql`
    SELECT
      count(*) FILTER (WHERE last_message_at >= date_trunc('month', now()))::int AS cur_total,
      count(outcome) FILTER (WHERE last_message_at >= date_trunc('month', now()))::int AS cur_marked,
      count(*) FILTER (
        WHERE last_message_at >= date_trunc('month', now()) AND outcome = 'cita'
      )::int AS cur_citas,
      count(*) FILTER (WHERE last_message_at < date_trunc('month', now()))::int AS prev_total,
      count(outcome) FILTER (WHERE last_message_at < date_trunc('month', now()))::int AS prev_marked
    FROM wa_conversations
    WHERE last_message_at >= date_trunc('month', now()) - interval '1 month'
  `;
  const row = rows[0] ?? {};
  return {
    share: outcomeShare(Number(row.cur_marked ?? 0), Number(row.cur_total ?? 0)),
    citas: Number(row.cur_citas ?? 0),
    prevShare: outcomeShare(Number(row.prev_marked ?? 0), Number(row.prev_total ?? 0)),
  };
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
  workspaceId: string;
  stripePurchaseId?: string | null;
  client?: string | null;
  wahaBaseUrl: string;
  status?: WahaConnectionRecord["status"];
}): Promise<WahaConnectionRecord> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO waha_connections (
      id, workspace_id, waha_session_id, stripe_purchase_id, client, waha_base_url, status, updated_at
    )
    VALUES (
      ${input.id}, ${input.workspaceId}, ${input.id}, ${input.stripePurchaseId ?? null},
      ${input.client ?? null}, ${input.wahaBaseUrl}, ${input.status ?? "pending"}, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      workspace_id = EXCLUDED.workspace_id,
      waha_session_id = EXCLUDED.waha_session_id,
      stripe_purchase_id = COALESCE(EXCLUDED.stripe_purchase_id, waha_connections.stripe_purchase_id),
      client = EXCLUDED.client,
      waha_base_url = EXCLUDED.waha_base_url,
      status = EXCLUDED.status,
      updated_at = now()
    WHERE waha_connections.stripe_purchase_id IS NULL
       OR waha_connections.stripe_purchase_id = EXCLUDED.stripe_purchase_id
    RETURNING *
  `;
  if (!rows[0]) throw new Error("WAHA connection ownership conflict.");
  return mapWahaConnection(rows[0]);
}

export async function updateWahaConnectionStatus(
  id: string,
  status: WahaConnectionRecord["status"],
  phoneDisplay?: string | null,
  lastError?: string | null,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE waha_connections
    SET status = ${status},
        phone_display = COALESCE(${phoneDisplay ?? null}, phone_display),
        connected_at = CASE WHEN ${status} = 'connected' THEN now() ELSE connected_at END,
        disconnected_at = CASE WHEN ${status} IN ('stopped', 'failed', 'deleted') THEN now() ELSE disconnected_at END,
        last_error = ${lastError ?? null},
        last_synced_at = now(),
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function getWahaConnection(id: string): Promise<WahaConnectionRecord | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM waha_connections
    WHERE id = ${id} OR waha_session_id = ${id} OR connection_id::text = ${id}
    LIMIT 1
  `;
  return rows[0] ? mapWahaConnection(rows[0]) : null;
}

export async function recordWahaWebhookEvent(input: {
  eventId: string;
  connectionId: string | null;
  sessionId: string;
  eventType: string;
  payload: Record<string, unknown>;
}): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO waha_webhook_events (event_id, connection_id, session_id, event_type, payload)
    VALUES (
      ${input.eventId}, ${input.connectionId}::uuid, ${input.sessionId}, ${input.eventType},
      ${JSON.stringify(input.payload)}::jsonb
    )
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id
  `;
  if (input.connectionId) {
    await sql`
      UPDATE waha_connections SET last_webhook_at = now(), updated_at = now()
      WHERE connection_id = ${input.connectionId}::uuid
    `;
  }
  return rows.length > 0;
}

export async function claimWahaWebhookEvents(limit = 10): Promise<WahaWebhookEventRecord[]> {
  const sql = getSql();
  const rows = await sql`
    WITH candidates AS (
      SELECT event_id
      FROM waha_webhook_events
      WHERE (
          (status IN ('pending', 'failed') AND next_attempt_at <= now())
          OR (status = 'processing' AND processing_started_at < now() - interval '5 minutes')
        )
        AND attempts < 10
      ORDER BY received_at
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE waha_webhook_events AS event
    SET status = 'processing', attempts = event.attempts + 1,
        processing_started_at = now(), last_error = null, updated_at = now()
    FROM candidates
    WHERE event.event_id = candidates.event_id
    RETURNING event.event_id, event.connection_id::text, event.session_id,
      event.payload, event.attempts
  `;
  return rows.map((row) => ({
    eventId: String(row.event_id),
    connectionId: row.connection_id ? String(row.connection_id) : null,
    sessionId: String(row.session_id),
    payload: row.payload as Record<string, unknown>,
    attempts: Number(row.attempts),
  }));
}

export async function markWahaWebhookEventProcessed(eventId: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE waha_webhook_events
    SET status = 'processed', processed_at = now(), updated_at = now()
    WHERE event_id = ${eventId}
  `;
}

export async function markWahaWebhookEventFailed(
  eventId: string,
  attempts: number,
  error: unknown,
): Promise<void> {
  const sql = getSql();
  const retryAt = new Date(
    Date.now() + Math.min(3600, 2 ** Math.max(0, attempts - 1)) * 1000,
  ).toISOString();
  const safeError = error instanceof Error ? error.message.slice(0, 500) : "Webhook processing failed";
  await sql`
    UPDATE waha_webhook_events
    SET status = 'failed', last_error = ${safeError}, next_attempt_at = ${retryAt}, updated_at = now()
    WHERE event_id = ${eventId}
  `;
}

export async function getWahaWebhookEventStats() {
  const sql = getSql();
  const rows = await sql`
    SELECT status, count(*)::int AS count FROM waha_webhook_events GROUP BY status
  `;
  return Object.fromEntries(rows.map((row) => [String(row.status), Number(row.count)]));
}

export async function noteWahaConnectionActivity(
  connectionId: string,
  direction: "in" | "out",
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE waha_connections
    SET last_inbound_at = CASE WHEN ${direction} = 'in' THEN now() ELSE last_inbound_at END,
        last_outbound_at = CASE WHEN ${direction} = 'out' THEN now() ELSE last_outbound_at END,
        updated_at = now()
    WHERE connection_id = ${connectionId}::uuid
  `;
}

export async function listWahaConnections(): Promise<WahaConnectionRecord[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM waha_connections ORDER BY updated_at DESC`;
  return rows.map(mapWahaConnection);
}
