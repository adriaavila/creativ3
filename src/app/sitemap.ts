import type { MetadataRoute } from "next";

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
    "/embedded-whatsapp",
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/cotizar" ? 0.9 : 0.7,
  }));
}
