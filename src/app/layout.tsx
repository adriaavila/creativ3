import type { Metadata } from "next";
import { JetBrains_Mono, Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteChrome from "@/components/site/SiteChrome";
import { siteJsonLd } from "@/lib/seo";
import { headers } from "next/headers";

const jetbrains = JetBrains_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// The one grotesque, at every size, on the site and in the product.
// Self-hosted by next/font, zero external requests.
const geist = Geist({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://allok.fun"),
  title: {
    default: "Allok — Agencia de producto, web y automatización",
    template: "%s | Allok",
  },
  description:
    "Diseñamos webs, productos digitales y automatizaciones con IA para negocios que necesitan vender y operar mejor.",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  keywords: [
    "allok",
    "agencia digital",
    "desarrollo de producto",
    "diseño web",
    "automatización con IA",
    "CRM WhatsApp",
    "seguimiento de clientes",
    "pipeline de ventas",
    "automatizacion de ventas",
    "inbox WhatsApp",
    "gestion de leads",
  ],
  openGraph: {
    title: "Allok — Agencia de producto, web y automatización",
    description:
      "Diseñamos webs, productos digitales y automatizaciones con IA para negocios que necesitan vender y operar mejor.",
    url: "https://allok.fun",
    siteName: "Allok",
    locale: "es_VE",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Allok" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Allok — Agencia de producto, web y automatización",
    description:
      "Webs, productos digitales y automatizaciones construidos para vender y operar mejor.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await headers()).get("x-allok-locale") === "en" ? "en" : "es";
  return (
    <html lang={locale} className={`${jetbrains.variable} ${geist.variable}`}>
      <body className="relative min-h-screen overflow-x-hidden antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd(locale)) }}
        />
        <SiteChrome>{children}</SiteChrome>
        <Analytics mode={process.env.VERCEL ? "auto" : "development"} debug={false} />
      </body>
    </html>
  );
}
