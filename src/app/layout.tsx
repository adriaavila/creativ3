import type { Metadata } from "next";
import { Archivo_Black, JetBrains_Mono, Geist, Comfortaa } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { siteJsonLd } from "@/lib/seo";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";
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

// Rounded geometric display face for the REI product surface. Body copy stays
// on Geist — Comfortaa is a display voice and gets illegible below ~15px.
const comfortaa = Comfortaa({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-comfortaa",
  display: "swap",
});

// El conteo sale del portafolio real, nunca de un número escrito a mano, y
// cuenta sólo lo que está `launched`.
const SHIPPED = PORTFOLIO_PROJECTS.filter((p) => p.status === "launched").length;

export const metadata: Metadata = {
  metadataBase: new URL("https://allok.fun"),
  title: {
    default: "allok — software que atiende, vende y deja registro",
    // La casa firma todas las páginas. El portafolio es la sección de allok
    // donde manda Adrian, no un sitio aparte.
    template: "%s | allok",
  },
  description:
    "allok construye software comercial: REI, el CRM de WhatsApp para inmobiliarias; Vocero, agentes de WhatsApp a medida; y la agencia que diseña, programa y despliega el resto.",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  keywords: [
    "CRM de WhatsApp",
    "WhatsApp Business API",
    "agente de WhatsApp",
    "software para inmobiliarias",
    "automatización con IA",
    "desarrollo web a medida",
    "Next.js",
    "allok",
    "Adrian Avila Molina",
  ],
  openGraph: {
    title: "allok — software que atiende, vende y deja registro",
    description:
      `${SHIPPED} sistemas en producción. Un CRM de WhatsApp, agentes a medida y la agencia que construye el resto — diseño, código y despliegue por el mismo par de manos.`,
    url: "https://allok.fun",
    siteName: "allok",
    locale: "es",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "allok — software que atiende, vende y deja registro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "allok — software que atiende, vende y deja registro",
    description:
      `${SHIPPED} sistemas en producción. Diseño, frontend, backend y despliegue, con los agentes haciendo la mitad aburrida.`,
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nadie pone esta cabecera hoy (no hay middleware), así que el valor por
  // defecto es el que sale en todas las páginas — y la casa habla español.
  const locale = (await headers()).get("x-allok-locale") === "en" ? "en" : "es";
  return (
    <html lang={locale} className={`${jetbrains.variable} ${geist.variable} ${archivo.variable} ${comfortaa.variable}`}>
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
