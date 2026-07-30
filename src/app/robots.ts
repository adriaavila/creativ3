import type { MetadataRoute } from "next";

const BASE_URL = "https://allok.fun";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/ops/", "/sign-in", "/pago/", "/es/pago/", "/en/payment/", "/proyecto"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
