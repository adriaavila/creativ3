import Script from "next/script";
import MotionInit from "./MotionInit";
import "@/styles/allok/tokens.css";
import "@/styles/allok/allok.css";
import "@/styles/allok/site.css";

// Las páginas con el sistema de diseño de allok («All business OK.»): CSS
// plano bajo `.ak` y un solo script, motion.js. El resto del sitio conserva
// sus estilos. El CSS se regenera con `node scripts/build-allok-ds.mjs`.

// Sistema, Build §1: .motion en <html> antes de pintar, para que nada parpadee
// antes de esconderse; si motion.js no llega en 3 s, se quita y todo se ve.
const MOTION_GUARD =
  "(function(h){if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&'IntersectionObserver' in window){h.classList.add('motion');setTimeout(function(){if(!window.AllokMotion)h.classList.remove('motion')},3000)}})(document.documentElement)";

/** El marco que comparten la portada y /trabajo: la misma raíz, la misma fuente y el mismo movimiento. */
export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ak" data-theme="cloud" id="top">
      <script dangerouslySetInnerHTML={{ __html: MOTION_GUARD }} />
      <link rel="preload" href="/allok/Geist-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      {children}
      <Script src="/allok/motion.js" strategy="afterInteractive" />
      <MotionInit />
    </div>
  );
}
