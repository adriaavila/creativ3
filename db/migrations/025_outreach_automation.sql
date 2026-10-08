-- La prospección en frío corriendo sola desde producción (/api/cron/outreach,
-- /ops/outreach). El mismo DDL vive en src/lib/outreach-db.ts
-- (`ensureOutreachTables`), que corre la primera vez que algo toca las tablas:
-- aplicar esta migración a mano no es obligatorio.

-- El estado que Resend reporta de cada envío (el cron lo consulta sin webhook).
ALTER TABLE outreach_event ADD COLUMN IF NOT EXISTS resend_last_event text;
ALTER TABLE outreach_event ADD COLUMN IF NOT EXISTS resend_checked_at timestamptz;

-- «Excluir» desde /ops/outreach.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'outreach_contact_status_check' AND pg_get_constraintdef(oid) LIKE '%excluded%'
  ) THEN
    ALTER TABLE outreach_contact DROP CONSTRAINT IF EXISTS outreach_contact_status_check;
    ALTER TABLE outreach_contact ADD CONSTRAINT outreach_contact_status_check CHECK (status IN
      ('queued', 'sent', 'replied', 'bounced', 'complained', 'unsubscribed', 'signed_up', 'excluded'));
  END IF;
END $$;

-- Ajustes: `sending` (el interruptor, apagado si no existe), `cron_lease`
-- (una corrida a la vez) y `last_run` (el resumen de la última corrida).
CREATE TABLE IF NOT EXISTS outreach_setting (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- La cola de demos: una por web (host sin www.). Dos intentos fallidos → failed,
-- y el paso 1 sale sin demo.
CREATE TABLE IF NOT EXISTS outreach_demo_job (
  host text PRIMARY KEY,
  website text NOT NULL,
  business_name text NOT NULL,
  sector text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  slug text,
  last_error text,
  started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_demo_job_pending_idx ON outreach_demo_job (created_at) WHERE status = 'pending';
