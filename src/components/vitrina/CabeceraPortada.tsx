import { WordmarkSvg } from "@/components/ak/Brand";

/**
 * La cabecera de la portada: la marca (con su alto de 44 px para el dedo) y
 * un solo enlace, al agente de WhatsApp: el producto que se vende hoy, y quien
 * llega a la portada tiene que poder encontrarlo (Adrián, 2026-11-11). Sin
 * botón, porque la salida es la barra de WhatsApp, y sin apartarse al bajar,
 * porque no se queda pegada. Es HTML del servidor: no hay nada que hidratar,
 * así que no suma JavaScript. Los dos son <a> simples, sin next/link.
 */
export default function CabeceraPortada() {
  return (
    <header className="header header-portada" data-theme="ink">
      {/* Lo primero que alcanza el teclado; fuera de la vista hasta entonces. */}
      <a className="btn btn-primary saltar" href="#contenido">
        Skip to content
      </a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a propósito: la portada no carga next/link (JS) */}
      <a className="wordmark" href="/" aria-label="allok, home">
        <WordmarkSvg />
      </a>
      <nav className="portada-nav" aria-label="Main">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a propósito: la portada no carga next/link (JS) */}
        <a className="btn btn-link agente-enlace" href="/agente-whatsapp">
          WhatsApp agent
        </a>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a propósito: la portada no carga next/link (JS) */}
        <a className="btn btn-link" href="/trabajo">
          Work
        </a>
      </nav>
    </header>
  );
}
