import type { Metadata } from "next";
import Shell from "@/components/ak/Shell";
import Vitrina from "@/components/vitrina/Vitrina";

// «Te toca»: la portada es una pieza, las manos que esperan el toque, y casi
// sin texto. El título se lee como un mensaje suyo cuando alguien pega
// allok.fun en un chat. La imagen para compartir la pone
// app/opengraph-image.tsx, el cuadro final de la escena. Sobre mí y Cómo
// empezamos viven en /trabajo.

const TITLE = "Hola, soy Adrián · allok";
const DESCRIPTION = "Webs, sistemas y agentes de WhatsApp para tu negocio. Te contesto yo.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // Un openGraph propio reemplaza entero el del layout: el nombre del sitio va dicho aquí.
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", siteName: "allok", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function Home() {
  return (
    <Shell>
      <Vitrina />
    </Shell>
  );
}
