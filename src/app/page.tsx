import type { Metadata } from "next";
import Script from "next/script";
import MotionInit from "@/components/ak/MotionInit";
import Cierre from "@/components/vitrina/Cierre";
import Vitrina from "@/components/vitrina/Vitrina";
import { CUENTAS } from "@/lib/vitrina";
import "@/styles/allok/tokens.css";
import "@/styles/allok/allok.css";
import "@/styles/allok/site.css";

// La portada, con el sistema de diseño de allok («All business OK.»): CSS
// plano bajo `.ak` y un solo script, motion.js. El resto del sitio conserva
// sus estilos. El CSS se regenera con `node scripts/build-allok-ds.mjs`.

const TITLE = "allok · el trabajo de Adrián Avila";
const DESCRIPTION = `Webs, sistemas y agentes de IA para negocios de verdad: tú das el ok y la IA hace el resto. ${CUENTAS.piezas} piezas, ${CUENTAS.enVivo} de ellas vivas para abrir.`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// Sistema, Build §1: .motion en <html> antes de pintar, para que nada parpadee
// antes de esconderse; si motion.js no llega en 3 s, se quita y todo se ve.
const MOTION_GUARD =
  "(function(h){if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&'IntersectionObserver' in window){h.classList.add('motion');setTimeout(function(){if(!window.AllokMotion)h.classList.remove('motion')},3000)}})(document.documentElement)";

export default function Home() {
  return (
    <div className="ak" data-theme="cloud" id="top">
      <script dangerouslySetInnerHTML={{ __html: MOTION_GUARD }} />
      <link rel="preload" href="/allok/Geist-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      <Vitrina>
        <Cierre />
      </Vitrina>
      <Script src="/allok/motion.js" strategy="afterInteractive" />
      <MotionInit />
    </div>
  );
}
