import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaymentResult from "@/components/billing/PaymentResult";
import { getMessages, isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Payment confirmed", robots: { index: false, follow: false } };

export default async function SuccessPage({
  params,
  searchParams,
}: PageProps<"/[locale]/payment/success">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== "en") notFound();
  const { session_id: sessionId } = await searchParams;
  return <PaymentResult locale={locale} messages={getMessages(locale)} status="success" sessionId={typeof sessionId === "string" ? sessionId : undefined} />;
}
