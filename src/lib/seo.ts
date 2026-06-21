import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";

export const SITE_URL = "https://www.servicioscreativos.online";
export const SITE_NAME = "creativv";

// Organization + WebSite — emitted once in the root layout.
export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      email: CONTACT_EMAIL,
      description:
        "Estudio creativo: landing pages, automatizaciones y productos digitales para captar leads y vender con menos fricción.",
      areaServed: ["VE", "Latin America"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: `+${WHATSAPP_NUMBER}`,
        availableLanguage: ["es"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: "es",
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
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
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
