import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Data access for the real WhatsApp inbox (migration 006). One conversation/message
// model shared by both channels, discriminated by channel_kind/channel_key — see
// db/migrations/006_whatsapp_channels_inbox.sql for the schema and the reasoning.

export type ChannelKind = "cloud_api" | "waha";
type MessageDirection = "in" | "out";
type MessageSource = "api" | "phone" | "ai";
type ConversationStatus = "open" | "snoozed" | "closed";
type AssignedMode = "human" | "ai";
/** Commercial result of the conversation — migration 008. Null = not marked yet. */
type ConversationOutcome = "cita" | "cotizacion" | "descarte";

export type WaConversation = {
  id: number;
  workspaceKey: string | null;
  connectionId: string | null;
  leadId: string | null;
  channelKind: ChannelKind;
  channelKey: string;
  contactWaId: string;
  contactPhone: string | null;
  contactName: string | null;
  status: ConversationStatus;
  assignedMode: AssignedMode;
  outcome: ConversationOutcome | null;
  outcomeAt: string | null;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  /** Rolling summary of older turns — migration 015. Null until one is written. */
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WaMessage = {
  id: number;
  conversationId: number;
  waMessageId: string | null;
  clientActionId: string | null;
  direction: MessageDirection;
  source: MessageSource;
  msgType: string;
  body: string | null;
  payload: Record<string, unknown>;
  status: string | null;
  createdAt: string;
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
    workspaceKey: row.workspace_key ? String(row.workspace_key) : null,
    connectionId: row.connection_id ? String(row.connection_id) : null,
    leadId: row.lead_id ? String(row.lead_id) : null,
    channelKind: row.channel_kind,
    channelKey: String(row.channel_key),
    contactWaId: String(row.contact_wa_id),
    contactPhone: row.contact_phone ? String(row.contact_phone) : null,
    contactName: row.contact_name ? String(row.contact_name) : null,
    status: row.status,
    assignedMode: row.assigned_mode,
    outcome: row.outcome ?? null,
    outcomeAt: row.outcome_at ? new Date(String(row.outcome_at)).toISOString() : null,
    lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : null,
    lastInboundAt: row.last_inbound_at ? new Date(String(row.last_inbound_at)).toISOString() : null,
    summary: row.summary ? String(row.summary) : null,
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
    clientActionId: row.client_action_id ? String(row.client_action_id) : null,
    direction: row.direction,
    source: row.source,
    msgType: String(row.msg_type),
    body: row.body ? String(row.body) : null,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    status: row.status ? String(row.status) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

/** Resolves the conversation before its message is inserted. Timestamps move in insertMessage(). */
export async function upsertConversation(input: {
  channelKind: ChannelKind;
  channelKey: string;
  contactWaId: string;
  contactPhone?: string | null;
  contactName?: string | null;
  direction: MessageDirection;
  occurredAt?: string;
  connectionId?: string | null;
}): Promise<WaConversation> {
  const sql = getSql();
  const leadPhone = input.contactPhone ?? input.contactWaId;
  const rows = await sql`
    INSERT INTO wa_conversations (
      channel_kind, channel_key, contact_wa_id, contact_phone, contact_name,
      last_message_at, last_inbound_at, connection_id, lead_id, assigned_mode
    )
    VALUES (
      ${input.channelKind}, ${input.channelKey}, ${input.contactWaId}, ${input.contactPhone ?? null}, ${input.contactName ?? null},
      ${null},
      ${null},
      ${input.connectionId ?? null},
      (SELECT id FROM leads
       WHERE regexp_replace(COALESCE(business_phone, ''), '\\D', '', 'g') = regexp_replace(${leadPhone}, '\\D', '', 'g')
       ORDER BY updated_at DESC
       LIMIT 1),
      CASE
        WHEN EXISTS (
          SELECT 1 FROM tenant_bot_config
          WHERE phone_number_id = ${input.channelKey}
            AND enabled = true AND operating_mode = 'automatic'
        ) THEN 'ai'
        ELSE 'human'
      END
    )
    ON CONFLICT (channel_kind, channel_key, contact_wa_id)
    DO UPDATE SET
      contact_phone = COALESCE(EXCLUDED.contact_phone, wa_conversations.contact_phone),
      contact_name = COALESCE(EXCLUDED.contact_name, wa_conversations.contact_name),
      connection_id = COALESCE(EXCLUDED.connection_id, wa_conversations.connection_id),
      lead_id = COALESCE(wa_conversations.lead_id, EXCLUDED.lead_id),
      status = CASE WHEN ${input.direction} = 'in' THEN 'open' ELSE wa_conversations.status END,
      assigned_mode = CASE
        WHEN ${input.direction} = 'in' AND wa_conversations.status = 'closed' AND EXISTS (
          SELECT 1 FROM tenant_bot_config
          WHERE phone_number_id = ${input.channelKey}
            AND enabled = true AND operating_mode = 'automatic'
        ) THEN 'ai'
        ELSE wa_conversations.assigned_mode
      END,
      updated_at = now()
    RETURNING *
  `;
  return mapConversation(rows[0]);
}

/** Applies the Business App address-book sync without fabricating a message. */
export async function syncMetaContact(input: {
  phoneNumberId: string;
  contactPhone: string;
  contactName?: string | null;
  action: "add" | "remove";
}): Promise<WaConversation> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO wa_conversations (
      channel_kind, channel_key, contact_wa_id, contact_phone, contact_name,
      last_message_at, last_inbound_at, lead_id, assigned_mode
    )
    VALUES (
      'cloud_api', ${input.phoneNumberId}, ${input.contactPhone}, ${input.contactPhone},
      ${input.action === "add" ? input.contactName ?? null : null},
      ${null}, ${null},
      (SELECT id FROM leads
       WHERE regexp_replace(COALESCE(business_phone, ''), '\\D', '', 'g') = regexp_replace(${input.contactPhone}, '\\D', '', 'g')
       ORDER BY updated_at DESC
       LIMIT 1),
      CASE
        WHEN EXISTS (
          SELECT 1 FROM tenant_bot_config
          WHERE phone_number_id = ${input.phoneNumberId}
            AND enabled = true AND operating_mode = 'automatic'
        ) THEN 'ai'
        ELSE 'human'
      END
    )
    ON CONFLICT (channel_kind, channel_key, contact_wa_id)
    DO UPDATE SET
      contact_phone = EXCLUDED.contact_phone,
      contact_name = CASE
        WHEN ${input.action} = 'remove' THEN NULL
        ELSE COALESCE(EXCLUDED.contact_name, wa_conversations.contact_name)
      END,
      lead_id = COALESCE(wa_conversations.lead_id, EXCLUDED.lead_id),
      updated_at = now()
    RETURNING *
  `;
  const conversation = mapConversation(rows[0]);
  return conversation;
}

export async function getConversationById(id: number): Promise<WaConversation | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT conversation.*,
      COALESCE(
        CASE WHEN conversation.channel_kind = 'cloud_api' THEN (
          SELECT connection.client FROM whatsapp_connections AS connection
          WHERE connection.phone_number_id = conversation.channel_key
          ORDER BY connection.updated_at DESC LIMIT 1
        ) ELSE (
          SELECT COALESCE(connection.workspace_id, connection.client)
          FROM waha_connections AS connection
          WHERE connection.id = conversation.channel_key OR connection.waha_session_id = conversation.channel_key
          ORDER BY connection.updated_at DESC LIMIT 1
        ) END,
        conversation.channel_kind || ':' || conversation.channel_key
      ) AS workspace_key
    FROM wa_conversations AS conversation
    WHERE conversation.id = ${id}
  `;
  return rows[0] ? mapConversation(rows[0]) : null;
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
  occurredAt?: string;
}): Promise<WaMessage | null> {
  const sql = getSql();
  const occurredAt = input.occurredAt ?? null;
  const rows = await sql`
    WITH inserted AS (
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
    ), updated AS (
      UPDATE wa_conversations AS conversation
      SET last_message_at = GREATEST(
            COALESCE(conversation.last_message_at, COALESCE(${occurredAt}::timestamptz, inserted.created_at)),
            COALESCE(${occurredAt}::timestamptz, inserted.created_at)
          ),
          last_inbound_at = CASE
            WHEN inserted.direction = 'in' THEN GREATEST(
              COALESCE(conversation.last_inbound_at, COALESCE(${occurredAt}::timestamptz, inserted.created_at)),
              COALESCE(${occurredAt}::timestamptz, inserted.created_at)
            )
            ELSE conversation.last_inbound_at
          END,
          updated_at = now()
      FROM inserted
      WHERE conversation.id = inserted.conversation_id
      RETURNING conversation.*
    )
    SELECT inserted.*, row_to_json(updated) AS conversation_row
    FROM inserted
    JOIN updated ON updated.id = inserted.conversation_id
  `;
  if (!rows[0]) return null;
  const message = mapMessage(rows[0]);
  return message;
}

export async function beginOutboundMessage(input: {
  conversationId: number;
  clientActionId: string;
  source: MessageSource;
  msgType: string;
  body: string | null;
  payload?: Record<string, unknown>;
}): Promise<{ message: WaMessage; created: boolean }> {
  const sql = getSql();
  const rows = await sql`
    WITH inserted AS (
      INSERT INTO wa_messages (
        conversation_id, client_action_id, direction, source, msg_type, body, payload, status
      ) VALUES (
        ${input.conversationId}, ${input.clientActionId}, 'out', ${input.source},
        ${input.msgType}, ${input.body}, ${JSON.stringify(input.payload ?? {})}::jsonb, 'pending'
      )
      ON CONFLICT (client_action_id) WHERE client_action_id IS NOT NULL DO NOTHING
      RETURNING *
    ), updated AS (
      UPDATE wa_conversations AS conversation
      SET last_message_at = GREATEST(COALESCE(conversation.last_message_at, inserted.created_at), inserted.created_at),
          updated_at = now()
      FROM inserted
      WHERE conversation.id = inserted.conversation_id
      RETURNING conversation.*
    )
    SELECT inserted.*, row_to_json(updated) AS conversation_row
    FROM inserted
    JOIN updated ON updated.id = inserted.conversation_id
  `;

  if (rows[0]) {
    const message = mapMessage(rows[0]);
      return { message, created: true };
  }

  const existing = await sql`
    SELECT * FROM wa_messages WHERE client_action_id = ${input.clientActionId} LIMIT 1
  `;
  if (!existing[0]) throw new Error("No se pudo recuperar la acción outbound persistida.");
  return { message: mapMessage(existing[0]), created: false };
}

export async function finalizeOutboundMessage(
  id: number,
  waMessageId: string | null,
): Promise<WaMessage | null> {
  const sql = getSql();
  const rows = await sql`
    UPDATE wa_messages
    SET wa_message_id = ${waMessageId}, status = 'sent'
    WHERE id = ${id} AND status = 'pending'
    RETURNING *
  `;
  if (!rows[0]) return null;
  const message = mapMessage(rows[0]);
  return message;
}

export async function markOutboundMessageUnknown(id: number, error: unknown): Promise<WaMessage | null> {
  const sql = getSql();
  const safeError = error instanceof Error ? error.message.slice(0, 300) : "Resultado del proveedor no confirmado.";
  const rows = await sql`
    UPDATE wa_messages
    SET status = 'unknown',
        payload = payload || ${JSON.stringify({ deliveryError: safeError })}::jsonb
    WHERE id = ${id} AND status = 'pending'
    RETURNING *
  `;
  if (!rows[0]) return null;
  const message = mapMessage(rows[0]);
  return message;
}

/**
 * Delivery lifecycle, weakest to strongest. Meta delivers status webhooks out of
 * order, so a late `delivered` must never overwrite a `read` already stored.
 * `failed` sits outside the ladder: it always wins, and nothing overwrites it.
 */
const WA_STATUS_LADDER = ["accepted", "sent", "delivered", "read"] as const;

/** Pure twin of the SQL guard in updateMessageStatusByWaId — same array drives both. */
function statusOutranks(current: string | null, next: string): boolean {
  if (current === next) return false;
  if (current === "failed") return false;
  if (next === "failed") return true;
  const rank = (value: string | null) =>
    value ? WA_STATUS_LADDER.indexOf(value as (typeof WA_STATUS_LADDER)[number]) + 1 : 0;
  return rank(next) > rank(current);
}

export async function updateMessageStatusByWaId(waMessageId: string, status: string): Promise<WaMessage | null> {
  const sql = getSql();
  const ladder = [...WA_STATUS_LADDER];
  const rows = await sql`
    UPDATE wa_messages
    SET status = ${status}
    WHERE wa_message_id = ${waMessageId}
      AND status IS DISTINCT FROM ${status}
      AND status IS DISTINCT FROM 'failed'
      AND (
        ${status} = 'failed'
        OR COALESCE(array_position(${ladder}::text[], status), 0)
         < COALESCE(array_position(${ladder}::text[], ${status}), 0)
      )
    RETURNING *
  `;
  if (!rows[0]) return null;
  const message = mapMessage(rows[0]);
  return message;
}
