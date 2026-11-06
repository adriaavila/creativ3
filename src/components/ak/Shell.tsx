import Script from "next/script";
import MotionInit from "./MotionInit";
import "@/styles/allok/tokens.css";
import "@/styles/allok/allok.css";
import "@/styles/allok/site.css";

// Las páginas con el sistema de diseño de allok («All business OK.»): CSS
// plano bajo `.ak` y un solo script, motion.js. El resto del sitio conserva
// sus estilos. El CSS se regenera con `node scripts/build-allok-ds.mjs`.

// Antes de pintar, una vez por documento (MotionInit repite lo mismo si se llega sin recargar):
// · El lienzo: `lienzo-3d` con WebGL2, sin ahorro de datos y sin equipo flojo (≤ 2 GB y ≤ 4 núcleos);
//   si no, `lienzo-trazo`, y la escena WebGL ni se pide. Va antes de pintar para que ninguna altura cambie.
// · `.motion`, para que nada parpadee antes de esconderse (Sistema, Build §1). Si motion.js no llega en
//   3 s se quita, todo se ve, y `__akMotionTarde` le dice a motion.js que no la vuelva a poner: lo que
//   ya se vio no se esconde dos veces.
const GUARDIA =
  "(function(w,h){w.__akGuardia=1;var n=navigator,c=n.connection,m=n.deviceMemory,k=n.hardwareConcurrency;h.classList.add(w.WebGL2RenderingContext&&!(c&&c.saveData)&&!(m<=2&&k<=4)?'lienzo-3d':'lienzo-trazo');if(!(w.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&'IntersectionObserver' in w){h.classList.add('motion');setTimeout(function(){if(!w.AllokMotion){h.classList.remove('motion');w.__akMotionTarde=1}},3000)}})(window,document.documentElement)";

// Sin precarga de /allok/Geist-Variable.woff2: el layout ya precarga la Geist de next/font, que declara
// la misma familia con las pesas exactas que usa el sistema (400, 500, 600) y es la que se pinta. La de
// /allok, de 100 a 900, solo entraría con otra pesa; precargada, eran 68 KB que nadie pintaba.

// motion.js sigue después de hidratar (afterInteractive). Antes, sus escrituras (--i del escalonado,
// .is-in, los textos de data-run y data-tick) tocarían nodos que React todavía no hidrató: desajustes de
// atributos en desarrollo y de texto en producción. beforeInteractive además va en el layout raíz y
// cargaría motion.js en todo el sitio, deteniendo la hidratación hasta que llegue.

/** El marco que comparten la portada y /trabajo: la misma raíz, la misma fuente y el mismo movimiento. */
export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="ak" data-theme="cloud" id="top">
      <script dangerouslySetInnerHTML={{ __html: GUARDIA }} />
      {children}
      {/* motion.min.js: motion.js sin comentarios, generado por scripts/build-allok-ds.mjs. */}
      <Script src="/allok/motion.min.js" strategy="afterInteractive" />
      <MotionInit />
    </div>
  );
}
