CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS growth_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  market text NOT NULL DEFAULT 'Caracas, Venezuela',
  summary text,
  error text,
  leads_requested integer NOT NULL DEFAULT 10 CHECK (leads_requested BETWEEN 1 AND 10),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES growth_runs(id) ON DELETE SET NULL,
  business_name text NOT NULL,
  vertical text NOT NULL,
  location text NOT NULL DEFAULT 'Caracas, Venezuela',
  website_url text,
  instagram_url text,
  evidence text NOT NULL,
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  problem_detected text NOT NULL,
  offer_angle text NOT NULL,
  lead_score smallint NOT NULL CHECK (lead_score BETWEEN 1 AND 10),
  status text NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'researched', 'drafted', 'approved', 'contacted', 'replied', 'meeting_booked', 'won', 'lost')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outreach_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('instagram', 'email', 'whatsapp')),
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public_agent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES growth_runs(id) ON DELETE SET NULL,
  agent text NOT NULL CHECK (agent IN ('Research Agent', 'Proposal Agent', 'Project Operator')),
  action text NOT NULL,
  detail text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status, created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_drafts_status_idx ON outreach_drafts(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS public_agent_events_public_idx ON public_agent_events(is_public, created_at DESC);
