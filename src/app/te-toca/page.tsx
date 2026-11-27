import type { Metadata } from "next";
import Shell from "@/components/ak/Shell";
import Vitrina from "@/components/vitrina/Vitrina";

// «Te toca»: fue la portada del 11 al 27 de noviembre de 2026; hoy es una pieza del
// portafolio (la portada es «I never lift the pen»). Es una pieza, las manos que esperan el toque, y casi
// sin texto. El título se lee como un mensaje suyo cuando alguien pega
// allok.fun en un chat. La imagen para compartir la pone
// app/opengraph-image.tsx, el cuadro final de la escena. Sobre mí y Cómo
// empezamos viven en /trabajo.

const TITLE = "Te toca · a piece by Adrián Ávila";
const DESCRIPTION = "Two glowing hands wait for your tap. A WebGL2 piece with its own renderer, and the index of everything I have built.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/te-toca" },
  // Un openGraph propio reemplaza entero el del layout: el nombre del sitio va dicho aquí.
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/te-toca", siteName: "allok", type: "website", locale: "en" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function TeToca() {
  return (
    <Shell>
      <Vitrina />
    </Shell>
  );
}
