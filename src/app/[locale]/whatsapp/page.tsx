import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Home from "@/components/site/Home";
import { getMessages, isLocale } from "@/lib/i18n";
import { faqJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/whatsapp">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  return {
    title: messages.meta.title,
    description: messages.meta.description,
    alternates: {
      canonical: locale === "es" ? "/whatsapp" : "/en/whatsapp",
      languages: { es: "/whatsapp", en: "/en/whatsapp" },
    },
    openGraph: {
      title: messages.meta.title,
      description: messages.meta.description,
      url: locale === "es" ? "/whatsapp" : "/en/whatsapp",
      locale: locale === "es" ? "es_VE" : "en_US",
      alternateLocale: locale === "es" ? ["en_US"] : ["es_VE"],
    },
  };
}

export default async function LocalizedWhatsAppPage({ params }: PageProps<"/[locale]/whatsapp">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (locale === "es") redirect("/whatsapp");
  const messages = getMessages(locale);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            faqJsonLd(messages.home.faqs.map(([q, a]) => ({ q, a })), locale),
          ),
        }}
      />
      <Home locale={locale} messages={messages} />
    </>
  );
}
