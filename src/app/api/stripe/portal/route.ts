import Stripe from "stripe";
import { NextResponse, type NextRequest } from "next/server";
import { getStripePurchaseBySessionId } from "@/lib/stripe-purchases-db";
import { isLocale } from "@/lib/i18n";

export async function POST(request: NextRequest) {
  const { sessionId, locale: requestedLocale } = (await request.json()) as {
    sessionId?: string;
    locale?: string;
  };
  const locale = requestedLocale && isLocale(requestedLocale) ? requestedLocale : "es";
  if (!sessionId) {
    return NextResponse.json({ error: "Missing Checkout session." }, { status: 400 });
  }

  const purchase = await getStripePurchaseBySessionId(sessionId);
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!purchase?.stripeCustomerId || !secret) {
    return NextResponse.json({ error: "Customer portal is not available." }, { status: 404 });
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-04-22.dahlia" });
  const origin =
    process.env.NEXT_PUBLIC_URL ??
    request.headers.get("origin") ??
    "http://localhost:3000";
  const portal = await stripe.billingPortal.sessions.create({
    customer: purchase.stripeCustomerId,
    return_url: `${origin}/${locale}/desk`,
  });
  return NextResponse.json({ url: portal.url });
}
