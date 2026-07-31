-- Separate the product connection identity from WAHA's mutable runtime session.
-- Safe to re-run and preserves rows created by migration 006.

ALTER TABLE waha_connections
  ADD COLUMN IF NOT EXISTS connection_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS workspace_id text,
  ADD COLUMN IF NOT EXISTS waha_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_purchase_id uuid REFERENCES stripe_purchases(id),
  ADD COLUMN IF NOT EXISTS engine text,
  ADD COLUMN IF NOT EXISTS disconnected_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_webhook_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_inbound_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_outbound_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

UPDATE waha_connections
SET workspace_id = COALESCE(workspace_id, client, id),
    waha_session_id = COALESCE(waha_session_id, id)
WHERE workspace_id IS NULL OR waha_session_id IS NULL;

ALTER TABLE waha_connections
  ALTER COLUMN workspace_id SET NOT NULL,
  ALTER COLUMN waha_session_id SET NOT NULL;

UPDATE waha_connections SET status = 'stopped' WHERE status = 'disconnected';

ALTER TABLE waha_connections DROP CONSTRAINT IF EXISTS waha_connections_status_check;
ALTER TABLE waha_connections ADD CONSTRAINT waha_connections_status_check CHECK (
  status IN ('pending', 'starting', 'scan_qr', 'passkey', 'connected', 'stopped', 'failed', 'deleted')
);

CREATE UNIQUE INDEX IF NOT EXISTS waha_connections_session_idx
  ON waha_connections(waha_session_id);

CREATE UNIQUE INDEX IF NOT EXISTS waha_connections_connection_idx
  ON waha_connections(connection_id);

CREATE UNIQUE INDEX IF NOT EXISTS waha_connections_purchase_idx
  ON waha_connections(stripe_purchase_id) WHERE stripe_purchase_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS waha_connections_workspace_idx
  ON waha_connections(workspace_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS waha_webhook_events (
  event_id text PRIMARY KEY,
  connection_id uuid REFERENCES waha_connections(connection_id) ON DELETE SET NULL,
  session_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text
);

CREATE INDEX IF NOT EXISTS waha_webhook_events_unprocessed_idx
  ON waha_webhook_events(received_at) WHERE processed_at IS NULL;

ALTER TABLE wa_conversations
  ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES waha_connections(connection_id) ON DELETE SET NULL;

UPDATE wa_conversations conversation
SET connection_id = connection.connection_id
FROM waha_connections connection
WHERE conversation.channel_kind = 'waha'
  AND conversation.channel_key = connection.waha_session_id
  AND conversation.connection_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS wa_conversations_connection_contact_idx
  ON wa_conversations(connection_id, contact_wa_id)
  WHERE connection_id IS NOT NULL;
