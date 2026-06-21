-- Sales agents: draft sequences/proposals + CRM pipeline fields.
-- Idempotent: safe to re-run.

-- Phase 1/2: classify each outreach draft (DM, follow-ups, audio script, proposal).
ALTER TABLE outreach_drafts
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'dm';

-- Drop+recreate the kind check so re-runs don't fail if it already exists.
ALTER TABLE outreach_drafts DROP CONSTRAINT IF EXISTS outreach_drafts_kind_check;
ALTER TABLE outreach_drafts
  ADD CONSTRAINT outreach_drafts_kind_check
  CHECK (kind IN ('dm', 'followup_1', 'followup_2', 'audio_script', 'proposal'));

-- Phase 3: lightweight CRM pipeline fields on leads.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action       text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action_at    date;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS close_probability smallint;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS potential_value   integer;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_close_probability_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_close_probability_check
  CHECK (close_probability IS NULL OR close_probability BETWEEN 0 AND 100);
