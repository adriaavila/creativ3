-- Durable Meta webhook inbox. The HTTP route stores the signed payload here
-- before acknowledging Meta; processing/retries happen separately.

ALTER TABLE whatsapp_connections
  ADD COLUMN IF NOT EXISTS connection_mode text NOT NULL DEFAULT 'META_COEXISTENCE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_connections_mode_check'
  ) THEN
    ALTER TABLE whatsapp_connections
      ADD CONSTRAINT whatsapp_connections_mode_check
      CHECK (connection_mode IN ('META_CLOUD_API', 'META_COEXISTENCE'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS whatsapp_connections_client_idx
  ON whatsapp_connections(client, status, connected_at DESC);

CREATE TABLE IF NOT EXISTS meta_whatsapp_webhook_events (
  id bigserial PRIMARY KEY,
  event_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'processed', 'failed')
  ),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  processed_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meta_whatsapp_webhook_events_retry_idx
  ON meta_whatsapp_webhook_events(status, next_attempt_at, received_at);
