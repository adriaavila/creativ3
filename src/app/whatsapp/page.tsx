import type { Metadata } from "next";
import Home from "@/components/site/Home";
import { getMessages } from "@/lib/i18n";
import { faqJsonLd } from "@/lib/seo";

const locale = "es" as const;
const messages = getMessages(locale);

export const metadata: Metadata = {
  title: messages.meta.title,
  description: messages.meta.description,
  alternates: {
    canonical: "/whatsapp",
    languages: { es: "/whatsapp", en: "/en/whatsapp" },
  },
  openGraph: {
    title: messages.meta.title,
    description: messages.meta.description,
    url: "/whatsapp",
    locale: "es_VE",
    alternateLocale: ["en_US"],
  },
};

export default function WhatsAppPage() {
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
