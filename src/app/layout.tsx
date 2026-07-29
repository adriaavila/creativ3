import type { Metadata } from "next";
import { Fraunces, Italiana, Instrument_Sans, JetBrains_Mono, Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "@/components/sections/SiteHeader";
import RouteTheme from "@/components/sections/RouteTheme";
import { siteJsonLd } from "@/lib/seo";

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

// Grotesque for the studio landing. Cabinet Grotesk (the face in the reference
// asset pack) only ships via Fontshare's runtime @import — a render-blocking
// external request with no next/font optimisation. Geist is the same modern
// grotesque genre, self-hosted by next/font, zero external requests. Swap in
// Cabinet Grotesk with next/font/local if you download its woff2 files.
const geist = Geist({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://servicios.frontia.app"),
  title: {
    default: "Releva | Aumenta ingresos o reduce costos",
    template: "%s | Releva",
  },
  description:
    "Releva diseña landing pages, sitios web y ecommerce para aumentar ingresos; automatizaciones, dashboards y apps para reducir costos.",
  alternates: { canonical: "/" },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  keywords: [
    "Releva",
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
    title: "Releva | Diseño digital para crecer u operar mejor",
    description:
      "Landing pages, sitios web y ecommerce para vender más. Automatizaciones, dashboards y apps para operar con menos fricción.",
    url: "https://servicios.frontia.app",
    siteName: "Releva",
    locale: "es_VE",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Releva" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Releva | Aumenta ingresos o reduce costos",
    description:
      "Estrategia, UX/UI y software diseñados alrededor del resultado que tu negocio necesita.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No `h-full` on <html>: a fixed 100%-height root makes the document a
  // viewport-height scroller with the body overflowing it, which breaks
  // ScrollTrigger's start/end measurement. `min-h-screen` on <body> gives the
  // same full-viewport floor without pinning the root's height.
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${italiana.variable} ${jetbrains.variable} ${instrumentSans.variable} ${geist.variable} theme-dark`}
    >
      {/* relative: GSAP ScrollTrigger's documented requirement whenever overflow
          is set on <body> — without it, offset math against the window
          scroller silently no-ops instead of erroring. */}
      <body className="relative min-h-screen overflow-x-hidden antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
        <RouteTheme />
        <SiteHeader />
        {children}
        <Analytics mode={process.env.VERCEL ? "auto" : "development"} debug={false} />
      </body>
    </html>
  );
}
