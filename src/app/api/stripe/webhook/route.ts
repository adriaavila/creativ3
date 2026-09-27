import Stripe from "stripe";
import { Resend } from "resend";
import { NextResponse, type NextRequest } from "next/server";
import {
  recordStripePurchase,
  upsertStripeSubscription,
} from "@/lib/stripe-purchases-db";
import { markLeadPaid } from "@/lib/growth-db";
import { projectPaymentEmail } from "@/lib/project-payment-email";

export const runtime = "nodejs";

const id = (value: string | Stripe.Customer | Stripe.DeletedCustomer | null) =>
  typeof value === "string" ? value : value?.id ?? null;

const PROJECT_LABELS: Record<string, string> = {
  juanete: "Juanete",
  "project-juanete": "Juanete",
  nodria: "Nodria",
  ainetworking: "AiNetworking",
  "allok-launch": "Launch",
  "allok-automate": "Automate",
  desk: "Desk",
  "desk-cohort": "Desk Cohort",
  "desk-scale": "Desk Scale",
  "puesta-en-marcha": "Puesta en marcha",
};

// ponytail: el único Payment Link que se usa para vender es el de la puesta en marcha (plans.ts);
// si aparece otro, ponerle `metadata.item` en Stripe en vez de adivinar aquí.
const itemOf = (session: Stripe.Checkout.Session) =>
  session.metadata?.item ?? session.metadata?.plan ?? (session.payment_link ? "puesta-en-marcha" : "");

async function sendProjectPaymentEmail(session: Stripe.Checkout.Session) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = session.customer_details?.email;
  if (!apiKey || !from || !to) return;

  const item = itemOf(session);
  const client = session.metadata?.client ?? "";
  const email = projectPaymentEmail({
    name: session.customer_details?.name ?? null,
    amount: session.amount_total,
    currency: session.currency,
    project: PROJECT_LABELS[client] ?? PROJECT_LABELS[item] ?? null,
    kind: item === "project-continuation" ? "continuation" : item === "puesta-en-marcha" ? "setup" : "deposit",
  });
  const { error } = await new Resend(apiKey).emails.send(
    { from, to, subject: email.subject, html: email.html, text: email.text },
    { idempotencyKey: `project-payment/${session.id}` },
  );
  if (error) throw new Error("Project payment email was rejected.");
}

/** Aviso a Adrian de que alguien pagó. Sin `OPS_ALERT_EMAIL` no hace nada. */
async function alertPaid(session: Stripe.Checkout.Session, businessName: string | null) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.OPS_ALERT_EMAIL;
  if (!apiKey || !from || !to) return;
  const total = session.amount_total != null ? `${(session.amount_total / 100).toFixed(2)} ${session.currency?.toUpperCase() ?? ""}` : "";
  const who = businessName ?? session.customer_details?.name ?? "Alguien";
  const { error } = await new Resend(apiKey).emails.send(
    {
      from,
      to,
      subject: `Pagó: ${who} · ${total}`.trim(),
      text: businessName ? `${who} pagó ${total}. En /ops Hoy queda como «Instalar».` : `${who} pagó ${total}.`,
    },
    { idempotencyKey: `lead-paid/${session.id}` },
  );
  if (error) throw new Error("Paid alert was rejected.");
}

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

      // El registro va PRIMERO: si Resend rechaza el recibo no puede tumbar la
      // escritura del pago. El recibo es best-effort porque Resend deduplica
      // por session.id, así que un reintento de Stripe no manda dos correos.
      await recordStripePurchase({
        stripeSessionId: session.id,
        plan: itemOf(session) || "unknown",
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

      if (session.payment_status === "paid") {
        // Sólo la puesta en marcha cierra un lead: el del link (client_reference_id) o el del
        // mismo teléfono. Un error de base cae al 500 y Stripe reintenta; markLeadPaid es idempotente.
        const lead =
          itemOf(session) === "puesta-en-marcha" || session.client_reference_id
            ? await markLeadPaid({
                leadId: session.client_reference_id ?? null,
                phone: session.customer_details?.phone ?? null,
                amountUsd:
                  session.currency === "usd" && session.amount_total != null ? Math.round(session.amount_total / 100) : null,
              })
            : null;
        // El recibo y el aviso no bloquean el registro: si Resend los rechaza, el pago ya quedó guardado.
        await sendProjectPaymentEmail(session).catch((error) =>
          console.error("Payment receipt not sent", session.id, error instanceof Error ? error.message : error),
        );
        await alertPaid(session, lead?.businessName ?? null).catch((error) =>
          console.error("Paid alert not sent", session.id, error instanceof Error ? error.message : error),
        );
      }
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
