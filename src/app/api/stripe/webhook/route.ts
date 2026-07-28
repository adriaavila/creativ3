import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { recordStripePurchase } from "@/lib/stripe-purchases-db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !webhookSecret) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta stripe-signature." }, { status: 400 });
  }

  // Must read the raw body: Stripe signs the exact bytes it sent.
  const rawBody = await req.text();
  const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Firma inválida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const plan = session.metadata?.plan ?? "unknown";
    const channel = session.metadata?.channel === "cloud_api" ? "cloud_api" : "waha";
    const client = session.metadata?.client || null;

    try {
      await recordStripePurchase({
        stripeSessionId: session.id,
        plan,
        channel,
        client,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email ?? null,
      });
    } catch (error) {
      // Stripe retries on non-2xx — a DB blip here shouldn't blindly retry
      // forever, but we do want it logged for manual reconciliation.
      console.error("Could not record Stripe purchase", event.id, error);
    }
  }

  return NextResponse.json({ received: true });
}
