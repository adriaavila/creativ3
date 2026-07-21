import type { Metadata } from "next";
import ProductHome from "@/components/product-home/ProductHome";

export const metadata: Metadata = {
  title: "Web, apps, automatización e IA para negocios",
  description:
    "Creamos websites cinematográficos, aplicaciones y sistemas inteligentes para ayudar a tu negocio a vender, responder y operar mejor.",
  alternates: { canonical: "/" },
  keywords: [
    "diseño web para negocios",
    "aplicaciones web",
    "automatización",
    "inteligencia artificial para negocios",
    "WhatsApp ventas",
    "prototipos de aplicaciones",
  ],
  openGraph: {
    title: "Creativv | Experiencias digitales que convierten",
    description:
      "Web, apps, automatización e IA diseñados alrededor del resultado que tu negocio necesita.",
    url: "/",
    type: "website",
    locale: "es_VE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creativv | Experiencias digitales que convierten",
    description:
      "Creamos experiencias digitales para vender, responder y operar mejor.",
  },
};

export default function Home() {
  return <ProductHome />;
}
