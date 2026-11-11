"use client";

import { useEffect } from "react";

/**
 * La luz de la fila de Diecinueve donde el navegador no tiene línea de tiempo
 * de scroll: pone --p (0 a 1, lineal) desde que la fila entra entera por abajo
 * hasta que su centro llega al centro de la pantalla, lo mismo que
 * `animation-range: entry 100% cover 50%` en el CSS. Un solo listener pasivo,
 * a lo sumo un cálculo por cuadro, solo cerca de la pantalla, y la posición
 * medida una vez (y otra si algo cambia de tamaño). Con movimiento reducido no
 * hace nada: --p se queda en 1, todas encendidas.
 */
export default function DiecinueveLuz() {
  useEffect(() => {
    const fila = document.querySelector<HTMLElement>("#diecinueve .diecinueve");
    if (!fila) return;
    if (CSS.supports?.("animation-timeline: view()")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let arriba = 0;
    let alto = 0;
    let cuadro = 0;
    let cerca = false;
    const pintar = () => {
      cuadro = 0;
      const vh = window.innerHeight;
      const abajo = arriba + alto - window.scrollY;
      const p = Math.min(1, Math.max(0, (vh - abajo) / Math.max(1, (vh - alto) / 2)));
      fila.style.setProperty("--p", p.toFixed(3));
    };
    const medir = () => {
      const r = fila.getBoundingClientRect();
      arriba = r.top + window.scrollY;
      alto = r.height;
      pintar();
    };
    const alMover = () => {
      if (cerca && !cuadro) cuadro = requestAnimationFrame(pintar);
    };
    const vista = new IntersectionObserver(
      ([e]) => {
        cerca = !!e?.isIntersecting;
        alMover();
      },
      { rootMargin: "50% 0px" },
    );
    // Lo de arriba puede crecer (una fuente que llega, una captura): la página entera cambia de alto.
    const tamano = new ResizeObserver(medir);
    vista.observe(fila);
    tamano.observe(document.documentElement);
    window.addEventListener("scroll", alMover, { passive: true });
    return () => {
      window.removeEventListener("scroll", alMover);
      vista.disconnect();
      tamano.disconnect();
      cancelAnimationFrame(cuadro);
      fila.style.removeProperty("--p");
    };
  }, []);
  return null;
}
