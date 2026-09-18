import { WRITING } from "@/lib/writing";
import type { MetadataRoute } from "next";
import { EXPERIMENTS } from "@/components/lab/registry";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";
import { SITE_URL } from "@/lib/seo";

/**
 * The commercial pages (`/`, `/crm`, `/rei`, `/vocero`, `/agencia`), the
 * portfolio, plus the legal pages Meta requires for the WhatsApp
 * integration. The /ops product and checkout routes stay out on purpose —
 * they are not for search engines.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const core: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/rei`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE_URL}/crm`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${SITE_URL}/vocero`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/agencia`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/portfolio`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/work`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/lab`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${SITE_URL}/projects/mistica`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  const work: MetadataRoute.Sitemap = PORTFOLIO_PROJECTS.map((project) => ({
    url: `${SITE_URL}/work/${project.id}`,
    lastModified: new Date(project.githubPushedAt),
    changeFrequency: "monthly",
    priority: 0.7,
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

  const writing: MetadataRoute.Sitemap = ["/writing", ...WRITING.map(note => `/writing/${note.slug}`)].map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly", priority: .6 }));
  return [...core, ...work, ...lab, ...writing, ...legal];
}
