"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { WordmarkSvg } from "@/components/ak/Brand";
import Escribeme from "./Escribeme";

// Las secciones de la portada. Desde otra página llevan "/" delante.
const NAV = [
  { href: "#trabajo", label: "Trabajo" },
  { href: "#sobre-mi", label: "Sobre mí" },
  { href: "#empezar", label: "Cómo empezamos" },
];

/**
 * La cabecera del sistema: la marca a la izquierda, los enlaces y la acción a
 * la derecha. Se aparta al bajar, y toma el tema de lo que tiene debajo: Ink
 * sobre la portada, Cloud sobre el trabajo. En el celular quedan la marca y
 * el botón.
 */
export default function Cabecera({ portada = false }: { portada?: boolean }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const h = ref.current;
    if (!h) return;
    let raf = 0;
    const seguir = () => {
      raf = 0;
      // Sticky at the top: its edge is always its height, even while it slides away.
      // An open sheet (Ficha) doesn't count: under it the header keeps the page's theme.
      const debajo = document
        .elementsFromPoint(window.innerWidth / 2, h.offsetHeight + 1)
        .find((e) => !h.contains(e) && !e.closest(".ficha"));
      // The section's theme, not a window's inside it (a Cloud capture on a
      // blue sheet): the outermost one below the page's own.
      let tema: string | undefined;
      for (let t = debajo?.closest<HTMLElement>("[data-theme]"); t; t = t.parentElement?.closest<HTMLElement>("[data-theme]")) {
        if (tema && t.classList.contains("ak")) break;
        tema = t.dataset.theme;
      }
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
      {/* Lo primero que alcanza el teclado; fuera de la vista hasta entonces. */}
      <a className="btn btn-primary saltar" href="#contenido">
        Saltar al contenido
      </a>
      {portada ? (
        <a className="wordmark" href="#top" aria-label="allok, inicio">
          <WordmarkSvg />
        </a>
      ) : (
        <Link className="wordmark" href="/" aria-label="allok, inicio">
          <WordmarkSvg />
        </Link>
      )}
      <span />
      <nav className="header-end" aria-label="Principal">
        {NAV.map((n) =>
          portada ? (
            <a key={n.href} className="btn btn-link" href={n.href}>
              {n.label}
            </a>
          ) : (
            <Link key={n.href} className="btn btn-link" href={`/${n.href}`}>
              {n.label}
            </Link>
          ),
        )}
        <Link className="btn btn-link" href="/agente-whatsapp">
          Agente de WhatsApp
        </Link>
        <Escribeme flecha={false}>Escríbeme</Escribeme>
      </nav>
    </header>
  );
}
