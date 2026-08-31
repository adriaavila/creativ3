import { CONTACT_EMAIL } from "@/lib/contact";

export const SITE_URL = "https://allok.fun";
export const SITE_NAME = "Adrián Ávila Molina";

/**
 * Person schema — this is a portfolio, not a company. Emitted once in the
 * root layout.
 */
export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Adrián Ávila Molina",
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
      inLanguage: "en",
    },
  ];
}
