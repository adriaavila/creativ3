-- Link the lightweight Growth CRM to the unified WhatsApp inbox.
-- Safe to re-run.

ALTER TABLE wa_conversations
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS wa_conversations_lead_idx
  ON wa_conversations(lead_id, last_message_at DESC NULLS LAST);

ALTER TABLE growth_outreach_messages
  ADD COLUMN IF NOT EXISTS channel_kind text,
  ADD COLUMN IF NOT EXISTS conversation_id bigint REFERENCES wa_conversations(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'growth_outreach_messages_channel_kind_check'
  ) THEN
    ALTER TABLE growth_outreach_messages
      ADD CONSTRAINT growth_outreach_messages_channel_kind_check
      CHECK (channel_kind IS NULL OR channel_kind IN ('cloud_api', 'waha'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS growth_outreach_conversation_idx
  ON growth_outreach_messages(conversation_id, created_at DESC);
