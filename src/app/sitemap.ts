import { WRITING } from "@/lib/writing";
import type { MetadataRoute } from "next";
import { EXPERIMENTS } from "@/components/lab/registry";
import { CASOS } from "@/lib/casos";
import { SITE_URL } from "@/lib/seo";
import { SEO_PAGES, seoPath } from "@/lib/seo-pages";

/**
 * The commercial pages (`/`, `/agente-whatsapp`, `/trabajo`, `/casos`), the search
 * pages (`/alternativa-a/*`, `/whatsapp-para/*`), the
 * portfolio, plus the legal pages Meta requires for the WhatsApp
 * integration. The /ops product and checkout routes stay out on purpose —
 * they are not for search engines.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/trabajo`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/casos`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${SITE_URL}/agente-whatsapp`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE_URL}/lab`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  const casos: MetadataRoute.Sitemap = CASOS.map((c) => ({
    url: `${SITE_URL}/casos/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));


  const lab: MetadataRoute.Sitemap = EXPERIMENTS.map((experiment) => ({
    url: `${SITE_URL}/lab/${experiment.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const legal: MetadataRoute.Sitemap = [
    "/es/privacidad",
    "/en/privacy",
    "/es/terminos",
    "/en/terms",
    "/eliminacion-de-datos",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  // Las comparaciones y las páginas por tipo de negocio (`src/lib/seo-pages.ts`).
  const seo: MetadataRoute.Sitemap = SEO_PAGES.map((page) => ({
    url: `${SITE_URL}${seoPath(page)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const writing: MetadataRoute.Sitemap = ["/writing", ...WRITING.map(note => `/writing/${note.slug}`)].map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority: .6 }));
  return [...core, ...casos, ...seo, ...lab, ...writing, ...legal];
}
