import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

// One product — the Desk — at three price points by client size, plus a cohort
// discount for the first 5. Not three feature tiers: the cheap tier buys feedback
// and a documented case, not a lesser system.
//
// The floor under these numbers is real AI cost per conversation (Sonnet 5 for
// qualifying/negotiating turns, Haiku 4.5 for FAQ — see src/lib/whatsapp-ai.ts)
// plus a sub-$50/mo fixed infra cost. See the pricing note in
// docs/whatsapp-dual-channel-plan.md for the full cost breakdown.
//
// Results-based billing (piso + cita atribuida) is quoted per contract and settled
// off Stripe — it needs the 30-day baseline from migration 008 first.
const PLANS = {
  starter: {
    name: "Desk Cohorte",
    currency: "usd",
    setupAmount: 39000, // $390
    recurringAmount: 7900, // $79/mo
    description:
      "El Desk completo a precio de cohorte, para los primeros 5 negocios: feedback semanal y permiso para documentar el proceso a cambio.",
    defaultChannel: "waha" as const,
  },
  growth: {
    name: "Desk",
    currency: "usd",
    setupAmount: 69000, // $690
    recurringAmount: 12900, // $129/mo
    description:
      "Inbox comercial, respuestas sugeridas con IA aprobadas por vos, calificación, landing/cotizador y tu línea base medida a los 30 días.",
    defaultChannel: "waha" as const,
  },
  premium: {
    name: "Desk Empresa",
    currency: "usd",
    setupAmount: 149000, // $1,490
    recurringAmount: 29000, // $290/mo
    description:
      "Varias sedes o números, funnel completo desde anuncios, Hermes Agent y reporte semanal. Habilita el Sprint a Resultado. Cloud API recomendado, WAHA de respaldo.",
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
