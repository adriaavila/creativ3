import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Cierre from "@/components/vitrina/Cierre";
import Vitrina, { type Llamados } from "@/components/vitrina/Vitrina";
import { TRY_AGENT_MESSAGE, whatsappUrl } from "@/lib/contact";
import { CANCEL_NOTE, FROM_PRICE, SETUP_SERVICE, headerCta, heroCta } from "@/lib/plans";
import "./vitrina.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

const TITLE = "allok · Agente de IA para WhatsApp que también te contesta a ti";
const DESCRIPTION =
  "allok atiende tu WhatsApp con tus precios y tu tono, agenda citas y te pasa lo que no sabe. Y le preguntas lo que quieras de tu WhatsApp: quién te necesita, quién se enfría, cómo va la semana.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const START = "Hola, vengo de allok.fun. Quiero un agente de WhatsApp para mi negocio.";

export default function Home() {
  const llamados: Llamados = {
    cta: heroCta(whatsappUrl(START)),
    cabecera: headerCta(),
    probar: whatsappUrl(TRY_AGENT_MESSAGE),
    precio: FROM_PRICE,
    nota: CANCEL_NOTE,
    puesta: { precio: SETUP_SERVICE.price, href: whatsappUrl(SETUP_SERVICE.talkTo) },
  };
  return (
    <div className={serif.variable}>
      <Vitrina llamados={llamados}>
        <Cierre cta={llamados.cta} precio={llamados.precio} />
      </Vitrina>
    </div>
  );
}
