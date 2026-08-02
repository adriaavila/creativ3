-- Keep the provider identity separate from the real phone shown to operators.
-- Auto-reply jobs are durable, retryable, and unique per inbound message.

ALTER TABLE wa_conversations
  ADD COLUMN IF NOT EXISTS contact_phone text;

UPDATE wa_conversations
SET contact_phone = regexp_replace(contact_wa_id, '[^0-9]', '', 'g')
WHERE contact_phone IS NULL
  AND length(regexp_replace(contact_wa_id, '[^0-9]', '', 'g')) BETWEEN 8 AND 15;

CREATE TABLE IF NOT EXISTS auto_reply_jobs (
  id bigserial PRIMARY KEY,
  conversation_id bigint NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  message_id bigint NOT NULL REFERENCES wa_messages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'skipped', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  rule_key text,
  reply_text text,
  last_error text,
  processing_started_at timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id)
);

CREATE INDEX IF NOT EXISTS auto_reply_jobs_claim_idx
  ON auto_reply_jobs(status, next_attempt_at, created_at);
