import { useCallback, useEffect, useState } from "react";
import { PIEZAS } from "@/lib/vitrina";

const HASH = "#pieza=";

/**
 * Qué ficha está abierta, escrito en la URL (`#pieza=rei-fm`) para que se
 * pueda compartir. Lo usan la portada y /trabajo: al cerrar, la URL vuelve a
 * la página en la que estabas, sin el hash.
 */
export function useFicha() {
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => {
    const leer = () => {
      const h = window.location.hash;
      let id: string | null = null;
      // Un enlace mal escrito (`#pieza=%`) no abre nada, pero tampoco tumba la página.
      if (h.startsWith(HASH)) {
        try {
          id = decodeURIComponent(h.slice(HASH.length));
        } catch {
          id = null;
        }
      }
      setAbierta(id && PIEZAS.some((p) => p.id === id) ? id : null);
    };
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, []);

  const abrir = useCallback((id: string) => {
    setAbierta(id);
    history.replaceState(null, "", `${HASH}${id}`);
  }, []);

  const cerrar = useCallback(() => {
    setAbierta(null);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  return { abierta, abrir, cerrar };
}
