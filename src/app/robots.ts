import type { MetadataRoute } from "next";

const BASE_URL = "https://servicios.frontia.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/ops/", "/sign-in", "/pago/", "/proyecto"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
