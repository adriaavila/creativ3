-- Demos de la prospección en frío (/demo/<slug>): un agente que ya conoce un
-- negocio, armado solo con lo que su web dice en público (scripts/demo-build.ts).
-- El mismo DDL vive en src/lib/demo-db.ts (`ensureDemoAgentTable`), que la carga
-- corre antes de escribir: aplicar esta migración a mano no es obligatorio.
CREATE TABLE IF NOT EXISTS demo_agent (
  slug text PRIMARY KEY,
  business_name text NOT NULL,
  sector text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  website text,
  profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  chat_count integer NOT NULL DEFAULT 0,
  last_chat_at timestamptz,
  signup_clicks integer NOT NULL DEFAULT 0,
  -- El techo de turnos por día (CHAT_SLUG_DAILY_TURNS): el día y cuántos van.
  chat_day date,
  chat_day_count integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS demo_agent_website_idx ON demo_agent (website);
