"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { apagar, crearPunto, escucharToques, montarTrazo } from "./manos-trazo";

/**
 * The close: the hero's sketch at full strength with the loop left open, one
 * tap from closing. The tap closes it the way the hero's twin does (the hands
 * 700 ms, the arc 700, the dot's flight 500 and its landing 400); with
 * reduced motion it is closed from the start, and without JavaScript it stays
 * open. Once closed it says so with data-cerrado on itself. The sketch
 * (ManosTrazo) comes as `children` from the server, like the hero's.
 */
export default function CierreLazo({ children }: { children: ReactNode }) {
  const caja = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = caja.current;
    const puntoEl = el?.querySelector<HTMLElement>(".manos-punto");
    if (!el || !puntoEl) return;
    let encender: (() => void) | null = null;
    const terminar = () => {
      if (!encender) encender = apagar(el);
    };
    const trazo = montarTrazo(el, crearPunto(puntoEl), {
      alCerrar: () => el.setAttribute("data-cerrado", ""),
      alTerminar: terminar,
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      trazo.fijar("cerrado");
      el.setAttribute("data-cerrado", "");
      terminar();
    }
    const dejar = escucharToques(el, (x, y) => trazo.tocar(x, y));
    return () => {
      dejar();
      trazo.destruir();
      encender?.();
      el.removeAttribute("data-cerrado");
      trazo.fijar("abierto");
    };
  }, []);

  return (
    <button ref={caja} type="button" className="cierre-lazo" aria-label="Cierra el lazo">
      {children}
      <span className="manos-punto" aria-hidden="true" />
    </button>
  );
}
