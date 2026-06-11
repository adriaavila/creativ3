import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const PLANS = {
  discover: {
    name: "Discover",
    currency: "usd",
    recurringAmount: 10000, // $100 in cents
    description: "Discovery mensual — diagnóstico, automatización básica, soporte.",
  },
  partner: {
    name: "Partner",
    currency: "usd",
    recurringAmount: 50000, // $500 in cents
    description: "Retainer mensual — 20h desarrollo, agentes IA, integraciones, soporte prioritario.",
  },
  whatsapp_starter: {
    name: "Starter Sprint",
    currency: "usd",
    setupAmount: 14900,
    recurringAmount: 4900,
    description: "Sistema WhatsApp Revenue — FAQ, seguimiento y mini base de leads.",
  },
  whatsapp_growth: {
    name: "Growth System",
    currency: "usd",
    setupAmount: 29900,
    recurringAmount: 8900,
    description: "Sistema WhatsApp Revenue — calificación, landing/cotizador, dashboard y scripts.",
  },
  whatsapp_premium: {
    name: "Premium Revenue System",
    currency: "usd",
    setupAmount: 69900,
    recurringAmount: 17900,
    description: "Sistema WhatsApp Revenue — funnel, dashboard avanzado, segmentación y optimización.",
  },
  whatsapp_founder: {
    name: "Founder Launch Deal",
    currency: "usd",
    setupAmount: 24900,
    recurringAmount: 6900,
    description: "Growth System founder LATAM — precio especial para los primeros 5 negocios.",
  },
} as const;

type CheckoutLineItem = {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description: string;
    };
    unit_amount: number;
    recurring?: { interval: "month" };
  };
  quantity: number;
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 });
    }

    const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

    const selectedPlan = PLANS[plan as keyof typeof PLANS];
    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
    const lineItems: CheckoutLineItem[] = [
      {
        price_data: {
          currency: selectedPlan.currency,
          product_data: {
            name: `Plan ${selectedPlan.name}`,
            description: selectedPlan.description,
          },
          unit_amount: selectedPlan.recurringAmount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ];

    if ("setupAmount" in selectedPlan) {
      lineItems.unshift({
        price_data: {
          currency: selectedPlan.currency,
          product_data: {
            name: `Setup ${selectedPlan.name}`,
            description: "Pago inicial de implementacion.",
          },
          unit_amount: selectedPlan.setupAmount,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: lineItems,
      success_url: `${origin}/pago/exito?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/pago/cancelado`,
      locale: "es",
      allow_promotion_codes: true,
      metadata: { plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
