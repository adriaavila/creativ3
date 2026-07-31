import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to record purchases.");
  }
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export type StripePurchase = {
  id: string;
  stripeSessionId: string;
  plan: string;
  channel: "waha" | "cloud_api";
  client: string | null;
  customerEmail: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  paymentStatus: string | null;
  createdAt: string;
};

/**
 * Looks a purchase up by its Stripe checkout session id. That id is
 * unguessable and only the buyer has it, so it doubles as the bearer token for
 * the self-serve activation page (/conectar-whatsapp) — no ops login needed
 * there, and no public endpoint that lets a stranger enumerate sessions.
 */
export async function getStripePurchaseBySessionId(
  stripeSessionId: string,
): Promise<StripePurchase | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, stripe_session_id, plan, channel, client, customer_email,
      stripe_customer_id, stripe_subscription_id, payment_status, created_at
    FROM stripe_purchases
    WHERE stripe_session_id = ${stripeSessionId}
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    stripeSessionId: String(row.stripe_session_id),
    plan: String(row.plan),
    channel: row.channel === "cloud_api" ? "cloud_api" : "waha",
    client: row.client ? String(row.client) : null,
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    stripeCustomerId: row.stripe_customer_id ? String(row.stripe_customer_id) : null,
    stripeSubscriptionId: row.stripe_subscription_id
      ? String(row.stripe_subscription_id)
      : null,
    paymentStatus: row.payment_status ? String(row.payment_status) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function recordStripePurchase(input: {
  stripeSessionId: string;
  plan: string;
  channel: "waha" | "cloud_api";
  client?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  customerEmail?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  paymentStatus?: string | null;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO stripe_purchases (
      stripe_session_id, plan, channel, client, amount_total, currency, customer_email,
      stripe_customer_id, stripe_subscription_id, payment_status
    )
    VALUES (
      ${input.stripeSessionId}, ${input.plan}, ${input.channel}, ${input.client ?? null},
      ${input.amountTotal ?? null}, ${input.currency ?? null}, ${input.customerEmail ?? null},
      ${input.stripeCustomerId ?? null}, ${input.stripeSubscriptionId ?? null},
      ${input.paymentStatus ?? null}
    )
    ON CONFLICT (stripe_session_id) DO UPDATE SET
      plan = EXCLUDED.plan,
      channel = EXCLUDED.channel,
      client = COALESCE(EXCLUDED.client, stripe_purchases.client),
      amount_total = COALESCE(EXCLUDED.amount_total, stripe_purchases.amount_total),
      currency = COALESCE(EXCLUDED.currency, stripe_purchases.currency),
      customer_email = COALESCE(EXCLUDED.customer_email, stripe_purchases.customer_email),
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, stripe_purchases.stripe_customer_id),
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, stripe_purchases.stripe_subscription_id),
      payment_status = COALESCE(EXCLUDED.payment_status, stripe_purchases.payment_status)
  `;
}

export async function upsertStripeSubscription(input: {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  plan: string;
  status: string;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  const sql = getSql();
  const periodEnd = input.currentPeriodEnd
    ? new Date(input.currentPeriodEnd * 1000).toISOString()
    : null;
  await sql`
    INSERT INTO stripe_subscriptions (
      stripe_subscription_id, stripe_customer_id, plan, status,
      current_period_end, cancel_at_period_end
    )
    VALUES (
      ${input.stripeSubscriptionId}, ${input.stripeCustomerId}, ${input.plan},
      ${input.status}, ${periodEnd}, ${input.cancelAtPeriodEnd}
    )
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      plan = EXCLUDED.plan,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      updated_at = now()
  `;
}
