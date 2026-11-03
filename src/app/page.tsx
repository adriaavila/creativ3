import type { Metadata } from "next";
import Shell from "@/components/ak/Shell";
import Agente from "@/components/vitrina/Agente";
import Cierre from "@/components/vitrina/Cierre";
import Empezar from "@/components/vitrina/Empezar";
import Portada from "@/components/vitrina/Portada";
import SobreMi from "@/components/vitrina/SobreMi";
import Vitrina from "@/components/vitrina/Vitrina";
import { CUENTAS } from "@/lib/vitrina";

// La portada: el trabajo contado desde el problema del dueño, quién lo hace,
// cómo se empieza y una sola salida, WhatsApp. El marco (CSS, motion.js) lo
// comparte con /trabajo en `Shell`. Las secciones que no abren fichas se
// pintan aquí, en el servidor, y `Vitrina` solo las coloca.

const TITLE = "allok · Software para tu negocio, de Adrián Avila";
const DESCRIPTION = `Webs, sistemas para el día a día y agentes que contestan tu WhatsApp, para negocios de Latinoamérica. Precio cerrado antes de empezar y ${CUENTAS.piezas} trabajos que puedes abrir.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function Home() {
  return (
    <Shell>
      <Vitrina portada={<Portada />} agente={<Agente />} cierre={<Cierre />}>
        <SobreMi />
        <Empezar />
      </Vitrina>
    </Shell>
  );
}
