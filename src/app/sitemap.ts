import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { CITIES, cityVerticalPath } from "@/lib/cities";
import { VERTICAL_LIST } from "@/lib/verticals";

const LOCALIZED_ROUTES = [
  ["/es", "/en", "weekly" as const, 1],
  ["/es/desk", "/en/desk", "weekly" as const, 0.9],
  ["/es/privacidad", "/en/privacy", "yearly" as const, 0.3],
  ["/es/terminos", "/en/terms", "yearly" as const, 0.3],
] as const;

const SPANISH_ONLY_ROUTES: [path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number][] = [
  ["/cotizar", "monthly", 0.8],
  ["/docs", "monthly", 0.8],
  ["/projects", "weekly", 0.7],
  ["/projects/mistica", "yearly", 0.4],
  ["/automatizar", "monthly", 0.6],
  ...VERTICAL_LIST.map(
    (vertical): [string, MetadataRoute.Sitemap[number]["changeFrequency"], number] => [
      `/${vertical.slug}`,
      "monthly",
      0.7,
    ]
  ),
  ...CITIES.flatMap((city) =>
    VERTICAL_LIST.map(
      (vertical): [string, MetadataRoute.Sitemap[number]["changeFrequency"], number] => [
        cityVerticalPath(city.slug, vertical.slug),
        "monthly",
        0.5,
      ]
    )
  ),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const localized = LOCALIZED_ROUTES.flatMap(([es, en, changeFrequency, priority]) =>
    [
      ["es", es, en],
      ["en", en, es],
    ].map(([language, path, alternate]) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority: language === "es" ? priority : priority - 0.1,
      alternates: {
        languages: {
          [language]: `${SITE_URL}${path}`,
          [language === "es" ? "en" : "es"]: `${SITE_URL}${alternate}`,
        },
      },
    }))
  );

  const spanishOnly = SPANISH_ONLY_ROUTES.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  return [...localized, ...spanishOnly];
}
