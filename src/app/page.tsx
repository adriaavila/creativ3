import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Cierre from "@/components/vitrina/Cierre";
import Vitrina from "@/components/vitrina/Vitrina";
import { CUENTAS } from "@/lib/vitrina";
import "./vitrina.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

const TITLE = "allok · el trabajo de Adrián Avila";
const DESCRIPTION = `Webs, productos y agentes de IA hechos para negocios reales. ${CUENTAS.piezas} piezas con capturas reales, ${CUENTAS.enVivo} de ellas vivas para abrir.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function Home() {
  return (
    <div className={serif.variable}>
      <Vitrina>
        <Cierre />
      </Vitrina>
    </div>
  );
}
