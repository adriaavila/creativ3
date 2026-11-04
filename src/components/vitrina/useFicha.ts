import { useCallback, useEffect, useState } from "react";

const HASH = "#pieza=";

/**
 * Marca las entradas del historial que esta página puso en ESTE documento. Con
 * ella, cerrar sabe que la entrada de abajo es la misma página sin la ficha y
 * que volver a ella no recarga nada. Después de recargar es otra: se cierra en
 * el sitio.
 */
const SESION = Math.random().toString(36).slice(2);

/** El estado propio va en un objeto nuevo, nunca en `history.state`: con `__NA` dentro, Next no se enteraría del cambio de URL. */
const marca = () => ({ akFicha: SESION });
const propia = () => (history.state as { akFicha?: unknown } | null)?.akFicha === SESION;

function idDelHash(): string | null {
  const h = window.location.hash;
  if (!h.startsWith(HASH)) return null;
  // Un enlace mal escrito (`#pieza=%`) no abre nada, pero tampoco tumba la página.
  try {
    return decodeURIComponent(h.slice(HASH.length)) || null;
  } catch {
    return null;
  }
}

/**
 * Qué ficha está abierta, escrito en la URL (`#pieza=rei-fm`) para que se
 * pueda compartir. Lo comparten la portada (FichaIsla) y /trabajo (Archivo):
 *
 * - `abrir`: una entrada nueva en el historial, así Atrás (el del celular
 *   también) la cierra.
 * - `ir` («Siguiente», las flechas): cambia de pieza en la misma entrada.
 * - `cerrar` (✕, el fondo, Escape): vuelve atrás si la entrada es nuestra; si
 *   se llegó con un enlace directo, quita el hash sin salir de la página.
 *
 * Atrás y Adelante (popstate) y un hash escrito a mano (hashchange) se leen de
 * la URL. `ids`, si viene, es la lista de piezas que se pueden abrir.
 */
export function useFicha(ids?: readonly string[]) {
  const [abierta, setAbierta] = useState<string | null>(null);
  // La lista llega del servidor: se compara por contenido para no rehacer los oyentes en cada render.
  const clave = ids ? ids.join(" ") : null;

  useEffect(() => {
    const validos = clave === null ? null : new Set(clave.split(" "));
    const leer = () => {
      const id = idDelHash();
      setAbierta(id && (!validos || validos.has(id)) ? id : null);
    };
    leer();
    window.addEventListener("popstate", leer);
    window.addEventListener("hashchange", leer);
    return () => {
      window.removeEventListener("popstate", leer);
      window.removeEventListener("hashchange", leer);
    };
  }, [clave]);

  const abrir = useCallback((id: string) => {
    setAbierta(id);
    const url = HASH + encodeURIComponent(id);
    // Si ya hay una ficha en la URL, se cambia esa: Atrás no pasa por dos fichas.
    if (idDelHash() !== null) history.replaceState(propia() ? marca() : null, "", url);
    else history.pushState(marca(), "", url);
  }, []);

  const ir = useCallback((id: string) => {
    setAbierta(id);
    history.replaceState(propia() ? marca() : null, "", HASH + encodeURIComponent(id));
  }, []);

  const cerrar = useCallback(() => {
    setAbierta(null);
    if (propia()) history.back();
    else history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  return { abierta, abrir, ir, cerrar };
}
