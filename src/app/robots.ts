import type { MetadataRoute } from "next";

const BASE_URL = "https://www.servicioscreativos.online";

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
