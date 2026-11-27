import type { Metadata } from "next";
import { Archivo_Black, JetBrains_Mono, Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import WhatsappClickTracker from "@/components/analytics/WhatsappClickTracker";
import SignupAttribution from "@/components/analytics/SignupAttribution";
import MetaPixel from "@/components/analytics/MetaPixel";
import "./globals.css";
import { siteJsonLd } from "@/lib/seo";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";

// Sin precarga: la portada y /trabajo (el sistema `.ak`) solo pintan con Geist, y precargadas estas dos
// eran 50 KB que en Slow 4G le quitaban ancho de banda al CSS antes del primer pintado. Las páginas que sí
// las usan las siguen teniendo (el @font-face y la variable van en <html>): el navegador las pide al
// encontrar el primer texto que las usa, con `swap` y el respaldo ajustado de next/font.
const jetbrains = JetBrains_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

// The macro voice of the portfolio: one weight, uppercase, set enormous.
// Structure on the page is typographic, so the display face is a real
// industrial black rather than the body grotesque pushed to 800.
const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
  preload: false,
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

// El conteo sale del portafolio real, nunca de un número escrito a mano, y
// cuenta sólo lo que está `launched`.
const SHIPPED = PORTFOLIO_PROJECTS.filter((p) => p.status === "launched").length;

export const metadata: Metadata = {
  metadataBase: new URL("https://allok.fun"),
  title: {
    default: "allok · Adrián Ávila",
    // La casa firma todas las páginas. El portafolio es la sección de allok
    // donde manda Adrian, no un sitio aparte.
    template: "%s | allok",
  },
  description:
    "Adrián Ávila, AI engineer and artist. allok is his studio: websites, systems and AI agents, designed, built and shipped by the same hands.",
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
  keywords: [
    "AI engineer",
    "AI agents",
    "WhatsApp AI agent",
    "AI automation",
    "custom software",
    "creative developer",
    "Next.js",
    "allok",
    "Adrian Avila Molina",
  ],
  openGraph: {
    title: "Hi, I'm Adrián · allok",
    description:
      `${SHIPPED} systems in production. Websites, systems and AI agents, designed, built and shipped by the same hands.`,
    url: "https://allok.fun",
    siteName: "allok",
    locale: "en",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        // Describe la imagen (app/opengraph-image.tsx): el titular y la línea de la portada.
        alt: "I never lift the pen. Adrián Ávila: websites, systems and AI agents.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hi, I'm Adrián · allok",
    description:
      `${SHIPPED} systems in production. Design, frontend, backend and deploy, with agents doing the boring half.`,
    images: ["/opengraph-image"],
  },
};

// allok.fun habla inglés (Adrián, 2026-11-27: «todo en inglés»). Las páginas de producto y de
// búsqueda en español siguen aquí hasta mudarse a whatsapp.allok.fun; mientras, este script les
// pone `lang="es"`.
const SPANISH_SECTIONS = [
  "es",
  "casos",
  "agente-whatsapp",
  "rei",
  "vocero",
  "agencia",
  "alternativa-a",
  "whatsapp-para",
  "para",
  "conectar-whatsapp",
  "eliminacion-de-datos",
  "embedded-whatsapp",
  "pago",
  "ops",
  "ops-login",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Leer la petición aquí (headers/cookies) vuelve dinámico todo el sitio:
  // cada visita sería una función en Vercel. El HTML sale en inglés, que es lo
  // que Google lee en la portada y el portafolio, y este script corrige `lang`
  // antes de pintar en las secciones en español.
  const setLang = `if(${JSON.stringify(SPANISH_SECTIONS)}.includes(location.pathname.split("/")[1]))document.documentElement.lang="es"`;
  return (
    <html lang="en" suppressHydrationWarning className={`${jetbrains.variable} ${geist.variable} ${archivo.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setLang }} />
      </head>
      <body className="relative min-h-screen overflow-x-hidden antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
        {children}
        <Analytics mode={process.env.VERCEL ? "auto" : "development"} debug={false} />
        <WhatsappClickTracker />
        <SignupAttribution />
        <MetaPixel />
      </body>
    </html>
  );
}
