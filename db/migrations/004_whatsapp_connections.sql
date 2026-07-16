-- Durable inventory for WhatsApp Embedded Signup / coexistence connections.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS whatsapp_connections (
  waba_id text NOT NULL,
  phone_number_id text NOT NULL,
  business_id text,
  business_token text,
  meta_user_id text,
  display_phone_number text,
  verified_name text,
  quality_rating text,
  name_status text,
  status text NOT NULL DEFAULT 'connected',
  client text,
  owner_user_id text,
  team_id text,
  account_id text,
  token_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_at timestamptz NOT NULL,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (waba_id, phone_number_id)
);

CREATE INDEX IF NOT EXISTS whatsapp_connections_status_idx
  ON whatsapp_connections(status, connected_at DESC);

CREATE INDEX IF NOT EXISTS whatsapp_connections_meta_user_idx
  ON whatsapp_connections(meta_user_id);
