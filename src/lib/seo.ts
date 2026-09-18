import { CONTACT_EMAIL } from "@/lib/contact";

export const SITE_URL = "https://allok.fun";
export const SITE_NAME = "allok";

/**
 * Two entities on purpose: `allok` is the company that sells REI, Vocero and
 * the agency; Adrian is the person who builds them and whose portfolio lives
 * at /portfolio. Emitted once in the root layout.
 */
export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "allok",
      url: SITE_URL,
      email: CONTACT_EMAIL,
      description:
        "Software comercial: REI (CRM de WhatsApp para inmobiliarias), Vocero (agentes de WhatsApp a medida) y desarrollo web y de producto.",
      brand: { "@type": "Brand", name: "allok" },
      founder: { "@type": "Person", name: "Adrian Avila Molina" },
      makesOffer: [
        {
          "@type": "Offer",
          name: "allok — CRM de WhatsApp para negocios de servicios",
          url: `${SITE_URL}/crm`,
        },
        {
          "@type": "Offer",
          name: "REI — CRM de WhatsApp para inmobiliarias",
          url: `${SITE_URL}/rei`,
        },
        {
          "@type": "Offer",
          name: "Vocero — agente de WhatsApp a medida",
          url: `${SITE_URL}/vocero`,
        },
        {
          "@type": "Offer",
          name: "Agencia — web, automatización y producto a medida",
          url: `${SITE_URL}/agencia`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Adrian Avila Molina",
      url: SITE_URL,
      email: CONTACT_EMAIL,
      jobTitle: "Industrial engineer · design engineer",
      description:
        "Industrial engineer who designs and builds commercial software: storefronts, CRMs, property platforms, booking apps and AI agents.",
      knowsAbout: [
        "Product design",
        "Design engineering",
        "Next.js",
        "TypeScript",
        "AI agents",
        "Stripe",
      ],
      sameAs: ["https://github.com/adriaavila"],
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
