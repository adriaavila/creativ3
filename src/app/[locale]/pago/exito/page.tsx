import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Stripe from "stripe";
import PaymentResult from "@/components/billing/PaymentResult";
import { getMessages, isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Pago confirmado", robots: { index: false, follow: false } };

export default async function SuccessPage({
  params,
  searchParams,
}: PageProps<"/[locale]/pago/exito">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== "es") notFound();
  const { session_id: sessionId } = await searchParams;
  const projectPayment = await isProjectPayment(typeof sessionId === "string" ? sessionId : undefined);
  return <PaymentResult locale={locale} messages={getMessages(locale)} status="success" sessionId={typeof sessionId === "string" ? sessionId : undefined} projectPayment={projectPayment} />;
}

async function isProjectPayment(sessionId?: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!sessionId || !secret) return false;
  try {
    const session = await new Stripe(secret, { apiVersion: "2026-04-22.dahlia" })
      .checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid" && session.metadata?.item === "project-deposit";
  } catch {
    return false;
  }
}
