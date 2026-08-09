import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";

export const SITE_URL = "https://allok.fun";
export const SITE_NAME = "Allok";

// Organization + WebSite — emitted once in the root layout.
export function siteJsonLd(locale: "es" | "en" = "es") {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.svg`,
      email: CONTACT_EMAIL,
      description:
        locale === "es"
          ? "Sistema comercial conectado a WhatsApp: consultas, seguimiento y oportunidades en un solo lugar."
          : "A commercial system connected to WhatsApp: inquiries, follow-up, and opportunities in one place.",
      areaServed: ["VE", "Latin America"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: `+${WHATSAPP_NUMBER}`,
        availableLanguage: ["es", "en"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: locale,
    },
  ];
}

// Service schema for vertical/service pages.
export function serviceJsonLd(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${SITE_URL}${path}`,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    areaServed: ["VE", "Latin America"],
  };
}

// FAQPage schema. Pass [{q, a}] — also render the same Q&A visibly on the page.
export function faqJsonLd(items: { q: string; a: string }[], locale = "es") {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

// Tiny helper to drop a JSON-LD <script>. Use inside a server component.
export function jsonLdScript(data: unknown) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
