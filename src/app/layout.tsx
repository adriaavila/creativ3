import type { Metadata } from "next";
import { Archivo_Black, JetBrains_Mono, Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { siteJsonLd } from "@/lib/seo";
import { headers } from "next/headers";

const jetbrains = JetBrains_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// The macro voice of the portfolio: one weight, uppercase, set enormous.
// Structure on the page is typographic, so the display face is a real
// industrial black rather than the body grotesque pushed to 800.
const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
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
    default: "Adrian Avila Molina — Industrial engineer building software",
    template: "%s | Adrian Avila Molina",
  },
  description:
    "Industrial engineer turned design engineer. I design and build commercial software — storefronts, CRMs, property platforms, booking apps and AI agents — from blank canvas to live checkout.",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  keywords: [
    "design engineer",
    "industrial engineer",
    "portfolio",
    "Next.js",
    "TypeScript",
    "AI agents",
    "product design",
    "Adrian Avila Molina",
  ],
  openGraph: {
    title: "Adrian Avila Molina — Industrial engineer building software",
    description:
      "24 systems in production: storefronts, CRMs, property platforms, booking apps and AI agents. Design through deploy, by the same pair of hands.",
    url: "https://allok.fun",
    siteName: "Adrian Avila Molina",
    locale: "en",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
    alt: "Adrian Avila Molina — industrial engineer building software",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrian Avila Molina — Industrial engineer building software",
    description:
      "24 systems in production. Design, frontend, backend and deploy, with agents doing the boring half.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await headers()).get("x-allok-locale") === "es" ? "es" : "en";
  return (
    <html lang={locale} className={`${jetbrains.variable} ${geist.variable} ${archivo.variable}`}>
      <body className="relative min-h-screen overflow-x-hidden antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
        {children}
        <Analytics mode={process.env.VERCEL ? "auto" : "development"} debug={false} />
      </body>
    </html>
  );
}
