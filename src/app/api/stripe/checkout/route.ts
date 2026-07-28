import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

// Prices reflect real AI cost per conversation (Sonnet 5 for qualifying/negotiating
// turns, Haiku 4.5 for FAQ — see src/lib/whatsapp-ai.ts) plus a sub-$50/mo fixed
// infra floor, not the old flat $49–$179 guesswork. See the pricing note in
// docs/whatsapp-dual-channel-plan.md for the full cost breakdown.
const PLANS = {
  starter: {
    name: "Starter",
    currency: "usd",
    setupAmount: 9900, // $99
    recurringAmount: 3900, // $39/mo
    description: "WhatsApp por WAHA — FAQ automatizado, seguimiento básico, mini base de leads.",
    defaultChannel: "waha" as const,
  },
  growth: {
    name: "Growth",
    currency: "usd",
    setupAmount: 19900, // $199
    recurringAmount: 6900, // $69/mo
    description:
      "Calificación de leads, landing/cotizador, dashboard y scripts. Elegís canal: WAHA o Cloud API.",
    defaultChannel: "waha" as const,
  },
  premium: {
    name: "Premium",
    currency: "usd",
    setupAmount: 39900, // $399
    recurringAmount: 12900, // $129/mo
    description:
      "Funnel completo, dashboard avanzado, segmentación y respuesta con IA supervisada. Cloud API recomendado, WAHA de respaldo.",
    defaultChannel: "cloud_api" as const,
  },
} as const;

type PlanKey = keyof typeof PLANS;
type Channel = "waha" | "cloud_api";

// Upcharge for choosing Cloud API on a plan whose default channel is WAHA — the
// manual onboarding/support cost of registering the number with Meta up front.
const CLOUD_API_UPCHARGE_CENTS = 2000; // $20 setup

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
    const { plan, channel, client } = (await req.json()) as {
      plan?: string;
      channel?: string;
      client?: string;
    };

    if (!plan || !(plan in PLANS)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }
    const planKey = plan as PlanKey;
    const selectedPlan = PLANS[planKey];

    const requestedChannel: Channel =
      channel === "waha" || channel === "cloud_api" ? channel : selectedPlan.defaultChannel;

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return NextResponse.json({ error: "Stripe no configurado" }, { status: 500 });
    }

    const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });

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
      {
        price_data: {
          currency: selectedPlan.currency,
          product_data: {
            name: `Setup ${selectedPlan.name}`,
            description: "Pago inicial de implementación.",
          },
          unit_amount: selectedPlan.setupAmount,
        },
        quantity: 1,
      },
    ];

    if (requestedChannel === "cloud_api" && selectedPlan.defaultChannel === "waha") {
      lineItems.push({
        price_data: {
          currency: selectedPlan.currency,
          product_data: {
            name: "Canal Cloud API (en vez de WAHA)",
            description: "Onboarding manual con registro oficial en Meta.",
          },
          unit_amount: CLOUD_API_UPCHARGE_CENTS,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: lineItems,
      success_url: `${origin}/pago/exito?session_id={CHECKOUT_SESSION_ID}&plan=${planKey}&channel=${requestedChannel}`,
      cancel_url: `${origin}/pago/cancelado`,
      locale: "es",
      allow_promotion_codes: true,
      metadata: { plan: planKey, channel: requestedChannel, client: client ?? "" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
