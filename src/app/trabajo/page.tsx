import type { Metadata } from "next";
import Shell from "@/components/ak/Shell";
import Archivo from "@/components/vitrina/Archivo";
import Empezar from "@/components/vitrina/Empezar";
import PieTrabajo from "@/components/vitrina/PieTrabajo";
import SobreMi from "@/components/vitrina/SobreMi";
import { CUENTAS } from "@/lib/vitrina";

// Todo el trabajo en una sola página, con el mismo marco que la portada. La
// portada es la pieza «Te toca» y casi no tiene texto; lo largo vive aquí:
// las piezas una por una, quién las hace (#sobre-mi), cómo se empieza
// (#empezar) y el pie con los enlaces y el colofón.

const TITLE = "Todo el trabajo · allok";
const DESCRIPTION = `Los ${CUENTAS.piezas} trabajos de allok: webs, sistemas y agentes de IA, con capturas reales y su estado. ${CUENTAS.lanzadas} ya están en uso.`;
// La imagen para compartir es la de la portada (app/opengraph-image.tsx). Un openGraph propio reemplaza
// entero el del layout, imagen incluida, así que va dicha aquí.
const IMAGEN = "/opengraph-image";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/trabajo" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/trabajo", type: "website", locale: "es", images: [IMAGEN] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [IMAGEN] },
};

export default function Trabajo() {
  return (
    <Shell>
      <Archivo pie={<PieTrabajo />}>
        <SobreMi />
        <Empezar />
      </Archivo>
    </Shell>
  );
}
