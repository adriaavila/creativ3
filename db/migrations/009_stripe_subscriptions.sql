ALTER TABLE stripe_purchases
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS payment_status text;

CREATE INDEX IF NOT EXISTS stripe_purchases_customer_idx
  ON stripe_purchases(stripe_customer_id);

CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  stripe_subscription_id text PRIMARY KEY,
  stripe_customer_id text NOT NULL,
  plan text NOT NULL,
  status text NOT NULL,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_subscriptions_customer_idx
  ON stripe_subscriptions(stripe_customer_id);
