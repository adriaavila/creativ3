import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaymentResult from "@/components/billing/PaymentResult";
import { getMessages, isLocale } from "@/lib/i18n";

export const metadata: Metadata = { title: "Payment canceled", robots: { index: false, follow: false } };

export default async function CanceledPage({ params }: PageProps<"/[locale]/payment/canceled">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== "en") notFound();
  return <PaymentResult locale={locale} messages={getMessages(locale)} status="canceled" />;
}
