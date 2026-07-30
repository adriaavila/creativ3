import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const routes = [
  ["/es", "/en"],
  ["/es/desk", "/en/desk"],
  ["/es/privacidad", "/en/privacy"],
  ["/es/terminos", "/en/terms"],
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.flatMap(([es, en], index) =>
    [
      ["es", es, en],
      ["en", en, es],
    ].map(([language, path, alternate]) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency: index < 2 ? ("weekly" as const) : ("yearly" as const),
      priority: index === 0 ? 1 : index === 1 ? 0.9 : 0.3,
      alternates: {
        languages: {
          [language]: `${SITE_URL}${path}`,
          [language === "es" ? "en" : "es"]: `${SITE_URL}${alternate}`,
        },
      },
    })),
  );
}
