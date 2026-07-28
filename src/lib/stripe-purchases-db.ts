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
  stripeSessionId: string;
  plan: string;
  channel: "waha" | "cloud_api";
  client: string | null;
  customerEmail: string | null;
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
    SELECT stripe_session_id, plan, channel, client, customer_email, created_at
    FROM stripe_purchases
    WHERE stripe_session_id = ${stripeSessionId}
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    stripeSessionId: String(row.stripe_session_id),
    plan: String(row.plan),
    channel: row.channel === "cloud_api" ? "cloud_api" : "waha",
    client: row.client ? String(row.client) : null,
    customerEmail: row.customer_email ? String(row.customer_email) : null,
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
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO stripe_purchases (
      stripe_session_id, plan, channel, client, amount_total, currency, customer_email
    )
    VALUES (
      ${input.stripeSessionId}, ${input.plan}, ${input.channel}, ${input.client ?? null},
      ${input.amountTotal ?? null}, ${input.currency ?? null}, ${input.customerEmail ?? null}
    )
    ON CONFLICT (stripe_session_id) DO NOTHING
  `;
}
