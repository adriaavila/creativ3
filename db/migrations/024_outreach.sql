-- Prospección en frío por correo (scripts/outreach.ts, docs/cold-email.md).
-- Sale de hola.allok.fun por Resend. El mismo DDL vive en src/lib/outreach-db.ts
-- (`ensureOutreachTables`), que el script corre antes de escribir.

-- Un negocio al que se le escribe. `step` = cuántos pasos de la secuencia ya
-- salieron (0–3); `next_send_at` = cuándo toca el siguiente (NULL: ya no toca).
CREATE TABLE IF NOT EXISTS outreach_contact (
  email text PRIMARY KEY CHECK (email = lower(email)),
  business_name text NOT NULL,
  website text,
  demo_slug text,
  sector text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  country text NOT NULL CHECK (country IN ('MX', 'CO')),
  offer text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'replied', 'bounced', 'complained', 'unsubscribed', 'signed_up')),
  step integer NOT NULL DEFAULT 0 CHECK (step BETWEEN 0 AND 3),
  last_sent_at timestamptz,
  next_send_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_contact_due_idx ON outreach_contact (next_send_at) WHERE status IN ('queued', 'sent');

-- A quién no se le vuelve a escribir, nunca: bajas, rebotes, quejas.
CREATE TABLE IF NOT EXISTS outreach_suppression (
  email text PRIMARY KEY CHECK (email = lower(email)),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- La bitácora: sent, bounced, complained, unsubscribed, marked, imported…
-- `resend_id` liga un rebote con el envío que lo causó (tasa de rebote).
CREATE TABLE IF NOT EXISTS outreach_event (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  type text NOT NULL,
  step integer,
  resend_id text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS outreach_event_type_created_idx ON outreach_event (type, created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_event_resend_id_idx ON outreach_event (resend_id) WHERE resend_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_event_email_idx ON outreach_event (email);
