import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AllokHome from "@/components/home/AllokHome";
import {
  alternateLanguages,
  getMessages,
  isLocale,
  localePath,
} from "@/lib/i18n";
import { faqJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  return {
    title: messages.meta.title,
    description: messages.meta.description,
    alternates: {
      canonical: localePath(locale),
      languages: { ...alternateLanguages(), "x-default": "/es" },
    },
    openGraph: {
      title: messages.meta.title,
      description: messages.meta.description,
      url: localePath(locale),
      locale: locale === "es" ? "es_VE" : "en_US",
      alternateLocale: locale === "es" ? ["en_US"] : ["es_VE"],
    },
  };
}

export default async function LocaleHome({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(
              messages.home.faqs.map(([q, a]) => ({ q, a })),
              locale,
            ),
          ),
        }}
      />
      <AllokHome locale={locale} messages={messages} />
    </>
  );
}
