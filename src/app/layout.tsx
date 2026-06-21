import type { Metadata } from "next";
import { Fraunces, Italiana, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "@/components/sections/SiteHeader";
import RouteTheme from "@/components/sections/RouteTheme";
import { siteJsonLd } from "@/lib/seo";
import AppProviders from "@/components/providers/AppProviders";

const fraunces = Fraunces({
  weight: ["300", "400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const italiana = Italiana({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-italiana",
  display: "swap",
  preload: false,
});

const jetbrains = JetBrains_Mono({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

const instrumentSans = Instrument_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.servicioscreativos.online"),
  title: {
    default: "creativv | Sistemas digitales y agentes IA para negocios",
    template: "%s | creativv",
  },
  description:
    "Creativv diseña landing pages, webs, productos, dashboards, automatizaciones y agentes IA para vender más y reducir el costo de operar.",
  alternates: { canonical: "/" },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  keywords: [
    "creativv",
    "landing pages",
    "agentes IA para negocios",
    "automatizaciones",
    "captacion de leads",
    "diseno web",
    "productos digitales",
    "MVP",
    "dashboard",
    "Next.js",
    "WhatsApp",
  ],
  openGraph: {
    title: "creativv | Vende más y reduce el costo de operar",
    description:
      "Sistemas digitales y agentes IA para convertir demanda en ventas y trabajo manual en operaciones visibles.",
    url: "https://www.servicioscreativos.online",
    siteName: "creativv",
    locale: "es_VE",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "creativv" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "creativv | Sistemas digitales y agentes IA",
    description:
      "Landing pages, productos, automatizaciones, dashboards y agentes para vender más y operar con menos fricción.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${italiana.variable} ${jetbrains.variable} ${instrumentSans.variable} theme-dark h-full`}
    >
      <body className="min-h-full overflow-x-hidden antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
        <AppProviders clerkPublishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
          <RouteTheme />
          <SiteHeader />
          {children}
          <Analytics mode={process.env.VERCEL ? "auto" : "development"} debug={false} />
        </AppProviders>
      </body>
    </html>
  );
}
