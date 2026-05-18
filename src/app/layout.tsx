import type { Metadata } from "next";
import { Fraunces, Italiana, JetBrains_Mono, Inter } from "next/font/google";
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
  title: "Servicios Creativos",
  description: "El software que merece Venezuela.",
  openGraph: {
    title: "Servicios Creativos",
    description: "El software que merece Venezuela.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
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
      </body>
    </html>
  );
}
