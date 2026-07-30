import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalPage from "@/components/legal/LegalPage";
import { getMessages, isLocale, localePath } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[locale]/terminos">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  return {
    title: messages.legal.termsTitle,
    alternates: {
      canonical: localePath(locale, "/terminos"),
      languages: { es: "/es/terminos", en: "/en/terms" },
    },
  };
}

export default async function TermsPage({ params }: PageProps<"/[locale]/terminos">) {
  const { locale } = await params;
  if (!isLocale(locale) || locale !== "es") notFound();
  return <LegalPage locale={locale} messages={getMessages(locale)} type="terms" />;
}
