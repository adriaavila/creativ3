import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal/LegalPage";
import { getMessages, isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  return {
    title: messages.legal.privacyTitle,
    alternates: {
      canonical: localePath(locale, "/privacy"),
      languages: { es: "/es/privacidad", en: "/en/privacy" },
    },
  };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== "en") notFound();
  return <LegalPage locale={locale} messages={getMessages(locale)} type="privacy" />;
}
