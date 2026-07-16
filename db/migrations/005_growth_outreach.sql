-- Human-approved outreach from Ops, with public business contact data and audit history.
-- Safe to re-run.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_phone text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_source_url text;

CREATE TABLE IF NOT EXISTS growth_outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp')),
  recipient text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_message_id text,
  sent_by text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS growth_outreach_lead_idx
  ON growth_outreach_messages(lead_id, created_at DESC);
