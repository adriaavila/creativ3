-- One operator action maps to one durable outbound intent, even across retries.
-- Safe to re-run.

ALTER TABLE wa_messages
  ADD COLUMN IF NOT EXISTS client_action_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS wa_messages_client_action_id_idx
  ON wa_messages(client_action_id)
  WHERE client_action_id IS NOT NULL;

ALTER TABLE growth_outreach_messages
  ADD COLUMN IF NOT EXISTS client_action_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS growth_outreach_messages_client_action_id_idx
  ON growth_outreach_messages(client_action_id)
  WHERE client_action_id IS NOT NULL;

ALTER TABLE growth_outreach_messages
  DROP CONSTRAINT IF EXISTS growth_outreach_messages_status_check;

ALTER TABLE growth_outreach_messages
  ADD CONSTRAINT growth_outreach_messages_status_check
  CHECK (status IN ('pending', 'sent', 'failed', 'unknown'));
