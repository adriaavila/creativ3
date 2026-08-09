import type { MetadataRoute } from "next";

const BASE_URL = "https://allok.fun";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/ops/",
        "/ops-login",
        "/demo/",
        "/sign-in",
        "/embedded-whatsapp",
        "/conectar-whatsapp",
        "/pago",
        "/pago/",
        "/es/pago/",
        "/en/payment/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
