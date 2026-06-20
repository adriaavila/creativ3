import type { Metadata } from "next";
import { Fraunces, Italiana, JetBrains_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import SiteHeader from "@/components/sections/SiteHeader";
import RouteTheme from "@/components/sections/RouteTheme";

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

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.servicioscreativos.online"),
  title: {
    default: "creativv | Landing pages, automatizaciones y productos digitales",
    template: "%s | creativv",
  },
  description:
    "Creativv convierte tu presencia digital en mas clientes con landing pages desde USD 199, automatizaciones simples y productos digitales para captar leads y vender con menos friccion.",
  keywords: [
    "creativv",
    "landing pages",
    "landing page USD 199",
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
    title: "creativv | Convierte tu presencia digital en mas clientes",
    description:
      "Landing pages desde USD 199, automatizaciones simples y productos digitales para explicar mejor, captar leads y vender con menos friccion.",
    url: "https://www.servicioscreativos.online",
    siteName: "creativv",
    locale: "es_VE",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "creativv" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "creativv | Convierte tu presencia digital en mas clientes",
    description:
      "Landing pages, automatizaciones y productos digitales para captar leads y vender con menos friccion.",
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
        <SiteHeader />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
