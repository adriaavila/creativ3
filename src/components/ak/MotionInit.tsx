"use client";

import { useLayoutEffect } from "react";

declare global {
  interface Window {
    AllokMotion?: { init: (root?: ParentNode) => void; reduced: boolean };
    /** El guardia de Shell.tsx ya corrió en este documento. */
    __akGuardia?: number;
    /** El guardia se rindió (motion.js tardó más de 3 s): la página se queda quieta, sin `.motion`. */
    __akMotionTarde?: number;
  }
}

/**
 * El guardia de Shell.tsx, para cuando se llega a esta página sin recargar
 * desde una que no tiene Shell: ahí el script en línea no corre (React no
 * ejecuta los que pinta en el cliente). Misma regla, mismas clases.
 */
function guardia() {
  const w = window;
  const h = document.documentElement;
  const n = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  w.__akGuardia = 1;
  const flojo = (n.deviceMemory ?? Infinity) <= 2 && (n.hardwareConcurrency ?? Infinity) <= 4;
  h.classList.add("WebGL2RenderingContext" in w && !n.connection?.saveData && !flojo ? "lienzo-3d" : "lienzo-trazo");
  if (w.AllokMotion || w.matchMedia?.("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in w)) return;
  h.classList.add("motion");
  setTimeout(() => {
    if (w.AllokMotion) return;
    h.classList.remove("motion");
    w.__akMotionTarde = 1;
  }, 3000);
}

/**
 * motion.js starts by itself on a full page load. After a client-side route
 * change into this page the script is already there, so the new markup has
 * to be handed to it (design system, Build §5). Before paint, so that what
 * waits for its reveal never shows first and hides after.
 */
export default function MotionInit() {
  useLayoutEffect(() => {
    if (!window.__akGuardia) guardia();
    const root = document.querySelector(".ak");
    if (root && window.AllokMotion) {
      document.documentElement.classList.toggle("motion", !window.AllokMotion.reduced && !window.__akMotionTarde);
      window.AllokMotion.init(root);
    }
  }, []);
  return null;
}
