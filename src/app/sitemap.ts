import type { MetadataRoute } from "next";
import { CITIES, cityVerticalPath } from "@/lib/cities";
import { VERTICAL_LIST } from "@/lib/verticals";

const BASE_URL = "https://www.servicioscreativos.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/cotizar",
    "/clinicas",
    "/inmobiliarias",
    "/ecommerce",
    "/academias",
    "/projects",
    "/automatizar",
    "/whatsapp",
  ];

  const cityRoutes = CITIES.flatMap((c) =>
    VERTICAL_LIST.map((v) => cityVerticalPath(c.slug, v.slug)),
  );

  return [...routes, ...cityRoutes].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/cotizar" ? 0.9 : 0.7,
  }));
}
