-- Campaign attribution and approval-gated content publishing.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS growth_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  intent text NOT NULL CHECK (intent IN ('increase_revenue', 'reduce_costs')),
  vertical text NOT NULL,
  offer text NOT NULL,
  utm_campaign text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  starts_at date,
  ends_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE growth_runs ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES growth_campaigns(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES growth_campaigns(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES growth_campaigns(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('linkedin', 'instagram', 'x', 'facebook', 'threads', 'tiktok', 'whatsapp_status', 'whatsapp_channel')),
  content text NOT NULL,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected', 'failed')),
  scheduled_for timestamptz,
  approved_by text,
  approved_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  external_id text,
  external_url text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS growth_campaigns_status_idx ON growth_campaigns(status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_items_review_idx ON content_items(status, scheduled_for, created_at DESC);
