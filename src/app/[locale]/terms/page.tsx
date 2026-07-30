import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal/LegalPage";
import { getMessages, isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[locale]/terms">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  return {
    title: messages.legal.termsTitle,
    alternates: {
      canonical: localePath(locale, "/terms"),
      languages: { es: "/es/terminos", en: "/en/terms" },
    },
  };
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terms">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== "en") notFound();
  return <LegalPage locale={locale} messages={getMessages(locale)} type="terms" />;
}
