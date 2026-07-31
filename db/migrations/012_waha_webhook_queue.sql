-- Retryable WAHA webhook queue. Migration 011 creates the durable inbox; this
-- adds atomic claiming/backoff so a process crash cannot strand an accepted event.

ALTER TABLE waha_webhook_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE waha_webhook_events
SET status = CASE
  WHEN processed_at IS NOT NULL AND last_error IS NULL THEN 'processed'
  WHEN processed_at IS NOT NULL AND last_error IS NOT NULL THEN 'failed'
  ELSE 'pending'
END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'waha_webhook_events_status_check'
  ) THEN
    ALTER TABLE waha_webhook_events
      ADD CONSTRAINT waha_webhook_events_status_check
      CHECK (status IN ('pending', 'processing', 'processed', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS waha_webhook_events_retry_idx
  ON waha_webhook_events(status, next_attempt_at, received_at);
