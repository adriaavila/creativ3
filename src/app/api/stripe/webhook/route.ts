import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import {
  recordStripePurchase,
  upsertStripeSubscription,
} from "@/lib/stripe-purchases-db";

export const runtime = "nodejs";

const id = (value: string | Stripe.Customer | Stripe.DeletedCustomer | null) =>
  typeof value === "string" ? value : value?.id ?? null;

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-04-22.dahlia" });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid signature." },
      { status: 400 },
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await recordStripePurchase({
        stripeSessionId: session.id,
        plan: session.metadata?.item ?? session.metadata?.plan ?? "unknown",
        channel: session.metadata?.channel === "cloud_api" ? "cloud_api" : "waha",
        client: session.metadata?.client || null,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_details?.email ?? null,
        stripeCustomerId: id(session.customer),
        stripeSubscriptionId:
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null,
        paymentStatus: session.payment_status,
      });
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object;
      await upsertStripeSubscription({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: id(subscription.customer) ?? "unknown",
        plan: subscription.metadata.item ?? subscription.metadata.plan ?? "unknown",
        status: subscription.status,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end ?? null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    }
  } catch (error) {
    console.error("Could not persist Stripe event", event.id, error);
    return NextResponse.json({ error: "Webhook persistence failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
