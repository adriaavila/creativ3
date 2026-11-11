"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefill, whatsappUrl, type Origen } from "@/lib/contact";

/** Un toque a la barra mientras las manos esperan: el lazo se cierra por detrás, sin frenar ni envolver el enlace. */
const avisarManos = () => document.dispatchEvent(new CustomEvent("manos:cerrar"));

// Un campo de la demo del agente con el foco: la pantalla es del teclado.
const CAMPO = "#agente input, #agente textarea, #agente select";

const esCampo = (t: EventTarget | null) => t instanceof Element && t.matches(CAMPO);

/**
 * La salida de la portada, siempre bajo el pulgar. Es un <a href> de wa.me
 * que llega del servidor y funciona antes de hidratar. `position: sticky` lo
 * deja al fondo de la pantalla en todo el recorrido y, como es el último hijo
 * de `.lienzo`, lo atraca solo bajo el cierre, sin JavaScript.
 *
 * Esta isla solo le cambia cosas al nodo, sin volver a pintarlo:
 * · la primera frase, según lo que cruza la mitad de la pantalla: un trabajo
 *   dice su nombre, el agente el suyo, lo demás la frase de siempre;
 * · Cloud sobre el campo azul de Cuadra (`data-sobre-azul`): nunca un botón
 *   azul sobre azul;
 * · escondida (`data-oculta`) mientras se escribe en la demo, para no subirse
 *   al teclado, y mientras hay una ficha abierta, que trae su propio botón.
 * Nunca se esconde al hacer scroll.
 *
 * El enlace mismo (`<Escribeme variante="barra" />`) llega como `children`
 * desde el servidor: su marcado ya está en el HTML y no viaja como JS.
 */
export default function BarraWhatsApp({ children }: { children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const a = caja.current?.querySelector<HTMLAnchorElement>("a.barra-wa");
    if (!a) return;
    const limpiar: (() => void)[] = [];
    a.addEventListener("click", avisarManos);
    limpiar.push(() => a.removeEventListener("click", avisarManos));

    // 1 · Lo que cruza la mitad de la pantalla: el margen deja la raíz en una línea, la del medio.
    const zonas = Array.from(document.querySelectorAll<HTMLElement>("article.obra[data-pieza], section#agente"));
    const cruzan = new Set<Element>();
    const frase = () => {
      const z = zonas.find((el) => cruzan.has(el));
      const nombre = z?.dataset.pieza;
      const origen: Origen = z?.id === "agente" ? "agente" : nombre ? "pieza" : "portada";
      const href = whatsappUrl(prefill(origen, nombre ? { nombre } : undefined));
      if (a.getAttribute("href") !== href) a.setAttribute("href", href);
      a.dataset.origen = origen;
    };
    const mitad = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) cruzan.add(e.target);
          else cruzan.delete(e.target);
        }
        frase();
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    zonas.forEach((z) => mitad.observe(z));
    limpiar.push(() => mitad.disconnect());

    // 2 · El campo azul bajo la barra. La raíz es el sitio de la barra pegada al fondo de la ventana (de ahí no se
    // mueve mientras va pegada): se mide de nuevo si cambia la ventana.
    const campos = Array.from(document.querySelectorAll<HTMLElement>("[data-campo]"));
    if (campos.length) {
      const debajo = new Set<Element>();
      let azul: IntersectionObserver | null = null;
      let espera = 0;
      const medir = () => {
        azul?.disconnect();
        debajo.clear();
        const ancho = document.documentElement.clientWidth;
        const alto = document.documentElement.clientHeight;
        // En el celular va en el flujo («auto», 0); desde 760 px, a 16 px de la esquina.
        const cs = getComputedStyle(a);
        const derecha = parseFloat(cs.right) || 0;
        const abajo = parseFloat(cs.bottom) || 0;
        const arriba = Math.max(0, alto - abajo - a.offsetHeight);
        const izquierda = Math.max(0, ancho - derecha - a.offsetWidth);
        const io = new IntersectionObserver(
          (entradas) => {
            for (const e of entradas) {
              if (e.isIntersecting) debajo.add(e.target);
              else debajo.delete(e.target);
            }
            a.toggleAttribute("data-sobre-azul", debajo.size > 0);
          },
          { rootMargin: `${-arriba}px ${-derecha}px ${-abajo}px ${-izquierda}px` },
        );
        campos.forEach((c) => io.observe(c));
        azul = io;
      };
      const alCambiar = () => {
        window.clearTimeout(espera);
        espera = window.setTimeout(medir, 150);
      };
      medir();
      window.addEventListener("resize", alCambiar);
      limpiar.push(() => {
        azul?.disconnect();
        window.clearTimeout(espera);
        window.removeEventListener("resize", alCambiar);
        a.removeAttribute("data-sobre-azul");
      });
    }

    // 3 · Escondida: escribiendo en la demo, o con una ficha abierta (su hoja es aria-modal mientras está abierta).
    let escribiendo = esCampo(document.activeElement);
    let ficha = false;
    const pintar = () => a.toggleAttribute("data-oculta", escribiendo || ficha);

    // El teclado: se esconde al tomar el foco, antes de que suba. Si el teclado se cierra con el foco todavía
    // puesto (Atrás en Android), visualViewport lo dice y la barra vuelve; si sube otra vez, se va otra vez.
    const vv = window.visualViewport;
    let base = vv?.height ?? 0;
    let tecladoArriba = false;
    const alEnfocar = (e: FocusEvent) => {
      if (!esCampo(e.target)) return;
      if (!escribiendo) {
        base = vv?.height ?? 0;
        tecladoArriba = false;
      }
      escribiendo = true;
      pintar();
    };
    const alSalir = (e: FocusEvent) => {
      if (!esCampo(e.target) || esCampo(e.relatedTarget)) return;
      escribiendo = false;
      pintar();
    };
    const alTeclado = () => {
      if (!vv || !esCampo(document.activeElement)) return;
      if (vv.height < base * 0.8) {
        tecladoArriba = true;
        escribiendo = true;
      } else if (tecladoArriba && vv.height > base * 0.9) {
        tecladoArriba = false;
        escribiendo = false;
      }
      pintar();
    };
    document.addEventListener("focusin", alEnfocar);
    document.addEventListener("focusout", alSalir);
    vv?.addEventListener("resize", alTeclado);

    const revisarFicha = () => {
      const abierta = document.querySelector('[aria-modal="true"]') !== null;
      if (abierta === ficha) return;
      ficha = abierta;
      pintar();
    };
    const hojas = new MutationObserver(revisarFicha);
    hojas.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-modal"] });
    revisarFicha();
    pintar();
    limpiar.push(() => {
      document.removeEventListener("focusin", alEnfocar);
      document.removeEventListener("focusout", alSalir);
      vv?.removeEventListener("resize", alTeclado);
      hojas.disconnect();
      a.removeAttribute("data-oculta");
    });

    return () => limpiar.forEach((f) => f());
  }, []);

  return (
    <div ref={caja} className="barra">
      {children}
    </div>
  );
}
