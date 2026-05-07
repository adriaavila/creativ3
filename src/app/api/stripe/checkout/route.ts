import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const PLANS = {
  discover: {
    name: "Discover",
    amount: 10000, // $100 in cents
    currency: "usd",
    description: "Discovery mensual — diagnóstico, automatización básica, soporte.",
  },
  partner: {
    name: "Partner",
    amount: 50000, // $500 in cents
    currency: "usd",
    description: "Retainer mensual — 20h desarrollo, agentes IA, integraciones, soporte prioritario.",
  },
} as const;

export async function POST(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 });
  }

  const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

  try {
    const { plan } = await req.json();

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: selectedPlan.currency,
            product_data: {
              name: `Plan ${selectedPlan.name}`,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/pago/exito?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/pago/cancelado`,
      locale: "es",
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
