import type { Metadata } from "next";
import { Fraunces, Italiana, JetBrains_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "@/components/sections/SiteHeader";
import RouteTheme from "@/components/sections/RouteTheme";
import CustomCursor from "@/components/landing/CustomCursor";

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
});

const jetbrains = JetBrains_Mono({
  weight: ["300", "400"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.servicioscreativos.online"),
  title: {
    default: "creativv | Estudio AI de diseno y codigo",
    template: "%s | creativv",
  },
  description:
    "creativv crea websites premium, productos digitales, automatizaciones y sistemas IA para convertir visitas en conversaciones y operaciones en procesos medibles.",
  keywords: [
    "creativv",
    "estudio AI",
    "diseno web premium",
    "automatizacion IA",
    "Next.js",
    "WhatsApp automation",
    "SaaS LATAM",
  ],
  openGraph: {
    title: "creativv | Estudio AI de diseno y codigo",
    description:
      "Websites premium, productos digitales y automatizaciones IA para negocios que necesitan vender y operar mejor.",
    url: "https://www.servicioscreativos.online",
    siteName: "creativv",
    locale: "es_VE",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "creativv" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "creativv | Estudio AI de diseno y codigo",
    description:
      "Websites premium, productos digitales y automatizaciones IA para generar conversaciones calificadas.",
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
      className={`${fraunces.variable} ${italiana.variable} ${jetbrains.variable} ${inter.variable} theme-dark h-full`}
    >
      <body className="min-h-full overflow-x-hidden antialiased">
        <RouteTheme />
        <CustomCursor />
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
