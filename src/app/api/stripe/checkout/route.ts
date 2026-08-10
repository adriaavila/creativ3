import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import {
  getBillingItem,
  isBillingKey,
  type BillingChannel,
} from "@/lib/billing/catalog";
import { isLocale, type Locale } from "@/lib/i18n";

// ponytail: ad-hoc prices inline; move to Stripe dashboard prices if they need editing without a deploy
const AD_HOC = {
  "project-deposit": { currency: "usd", unit_amount: 20_000, name: "Depósito de proyecto allok" },
  nodria: { currency: "eur", unit_amount: 20_000, name: "Nodria" },
} as const;

const isAdHoc = (key: string): key is keyof typeof AD_HOC => key in AD_HOC;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      item?: string;
      plan?: string;
      channel?: string;
      client?: string;
      locale?: string;
    };
    const key = body.item ?? body.plan;
    if (!key || (!isAdHoc(key) && !isBillingKey(key))) {
      return NextResponse.json({ error: "Invalid billing item." }, { status: 400 });
    }

    const locale: Locale = body.locale && isLocale(body.locale) ? body.locale : "es";
    const adHoc = isAdHoc(key) ? AD_HOC[key] : null;
    const catalogItem = adHoc ? null : getBillingItem(key as Exclude<typeof key, keyof typeof AD_HOC>);
    const channel: BillingChannel =
      body.channel === "cloud_api" || body.channel === "waha"
        ? body.channel
        : catalogItem && "defaultChannel" in catalogItem
          ? catalogItem.defaultChannel
          : "waha";
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
    }

    const stripe = new Stripe(secret, { apiVersion: "2026-04-22.dahlia" });
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.APP_URL ??
      request.headers.get("origin") ??
      "http://localhost:3000";
    const successPath =
      locale === "es" ? "/es/pago/exito" : "/en/payment/success";
    const cancelPath =
      locale === "es" ? "/es/pago/cancelado" : "/en/payment/canceled";

    const session = await stripe.checkout.sessions.create({
      mode: catalogItem?.kind === "subscription" ? "subscription" : "payment",
      line_items: catalogItem
        ? catalogItem.prices.map((price) => ({ price, quantity: 1 }))
        : [{
            price_data: {
              currency: adHoc!.currency,
              product_data: { name: adHoc!.name },
              unit_amount: adHoc!.unit_amount,
            },
            quantity: 1,
          }],
      success_url: `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      locale,
      allow_promotion_codes: true,
      customer_creation: catalogItem?.kind !== "subscription" ? "always" : undefined,
      integration_identifier: "allok-project-payment-qnplrxav",
      metadata: { item: key, plan: key, channel, client: body.client ?? "", locale },
      subscription_data:
        catalogItem?.kind === "subscription"
          ? { metadata: { item: key, plan: key, channel, locale } }
          : undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Could not create Stripe Checkout session", error);
    return NextResponse.json(
      { error: "Could not start secure checkout." },
      { status: 500 },
    );
  }
}
