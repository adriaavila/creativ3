import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaymentResult from "@/components/billing/PaymentResult";
import { getMessages, isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Pago cancelado", robots: { index: false, follow: false } };

export default async function CanceledPage({ params }: PageProps<"/[locale]/pago/cancelado">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== "es") notFound();
  return <PaymentResult locale={locale} messages={getMessages(locale)} status="canceled" />;
}
