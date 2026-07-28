-- Real WhatsApp inbox across both channels (Cloud API + WAHA), one conversation/message
-- model discriminated by channel_kind. Safe to re-run.

CREATE TABLE IF NOT EXISTS waha_connections (
  id text PRIMARY KEY,                 -- WAHA session name, e.g. "cliente-acme"
  client text,                          -- same convention as whatsapp_connections.client
  waha_base_url text NOT NULL,          -- allows a different VPS per tenant later
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'scan_qr', 'connected', 'disconnected')
  ),
  phone_display text,
  connected_at timestamptz,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wa_conversations (
  id bigserial PRIMARY KEY,
  channel_kind text NOT NULL CHECK (channel_kind IN ('cloud_api', 'waha')),
  channel_key text NOT NULL,           -- phone_number_id (cloud_api) or waha_connections.id (waha)
  contact_wa_id text NOT NULL,         -- contact number, E.164 without '+'
  contact_name text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'snoozed', 'closed')),
  assigned_mode text NOT NULL DEFAULT 'human' CHECK (assigned_mode IN ('human', 'ai')),
  last_message_at timestamptz,
  last_inbound_at timestamptz,         -- drives the 24h free-text window (cloud_api only)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_kind, channel_key, contact_wa_id)
);

CREATE INDEX IF NOT EXISTS wa_conversations_last_message_idx
  ON wa_conversations(last_message_at DESC NULLS LAST);

CREATE TABLE IF NOT EXISTS wa_messages (
  id bigserial PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  wa_message_id text,                  -- provider-native id; null allowed for internally generated msgs
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  source text NOT NULL DEFAULT 'api' CHECK (source IN ('api', 'phone', 'ai')), -- 'phone' = smb_message_echoes
  msg_type text NOT NULL DEFAULT 'text',
  body text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb, -- includes { model: "anthropic/claude-..." } for ai-sourced replies
  status text,                          -- sent|delivered|read|failed (outbound only)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_messages_wa_message_id_idx
  ON wa_messages(wa_message_id) WHERE wa_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS wa_messages_conversation_idx
  ON wa_messages(conversation_id, created_at DESC);
