import { WordmarkSvg } from "@/components/ak/Brand";

/**
 * La cabecera de la portada: solo la marca (con su alto de 44 px para el
 * dedo). Sin enlaces ni botón, porque la salida es la barra de WhatsApp, y
 * sin apartarse al bajar, porque no se queda pegada. Es HTML del servidor:
 * no hay nada que hidratar, así que no suma JavaScript. La marca es un <a>
 * simple; desde aquí solo recarga la portada.
 */
export default function CabeceraPortada() {
  return (
    <header className="header header-portada" data-theme="ink">
      {/* Lo primero que alcanza el teclado; fuera de la vista hasta entonces. */}
      <a className="btn btn-primary saltar" href="#contenido">
        Saltar al contenido
      </a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a propósito: la portada no carga next/link (JS) */}
      <a className="wordmark" href="/" aria-label="allok, inicio">
        <WordmarkSvg />
      </a>
    </header>
  );
}
