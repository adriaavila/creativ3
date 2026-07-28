-- Minimal purchase log for the WhatsApp product checkout. One row per completed
-- Stripe session — no separate billing system, this is a solo operator with a
-- handful of clients. `client` is the same free-text identifier used on
-- whatsapp_connections.client / waha_connections.client, so a purchase links to
-- its eventual connection just by sharing that string, no foreign key needed.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS stripe_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text NOT NULL UNIQUE,
  plan text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('waha', 'cloud_api')),
  client text,
  amount_total integer,
  currency text,
  customer_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_purchases_client_idx
  ON stripe_purchases(client);
