"use client";

import { useEffect, useRef } from "react";
import { WordmarkSvg } from "@/components/ak/Brand";

const NAV = [
  { href: "#trabajo", label: "Trabajo" },
  { href: "#por-dentro", label: "Por dentro" },
  { href: "#indice", label: "Índice" },
  { href: "#estudio", label: "Estudio" },
];

/**
 * La cabecera del sistema: la marca a la izquierda, los enlaces y la acción a
 * la derecha. Se aparta al bajar, y toma el tema de lo que tiene debajo: Ink
 * sobre la portada, Cloud sobre el trabajo.
 */
export default function Cabecera() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const h = ref.current;
    if (!h) return;
    let raf = 0;
    const seguir = () => {
      raf = 0;
      // Sticky at the top: its edge is always its height, even while it slides away.
      const debajo = document.elementsFromPoint(window.innerWidth / 2, h.offsetHeight + 1).find((e) => !h.contains(e));
      const tema = debajo?.closest<HTMLElement>("[data-theme]")?.dataset.theme;
      if (tema && h.dataset.theme !== tema) h.dataset.theme = tema;
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(seguir);
    };
    seguir();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, []);

  return (
    <header ref={ref} className="header" data-hide-on-scroll data-theme="ink">
      <a className="wordmark" href="#top" aria-label="allok, inicio">
        <WordmarkSvg />
      </a>
      <span />
      <nav className="header-end" aria-label="Principal">
        {NAV.map((n) => (
          <a key={n.href} className="btn btn-link" href={n.href}>
            {n.label}
          </a>
        ))}
        <a className="btn btn-primary" href="#contacto">
          Contacto
        </a>
      </nav>
    </header>
  );
}
