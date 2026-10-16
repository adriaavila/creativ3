"use client";

import { useCallback, useEffect, useState } from "react";
import { PIEZAS } from "@/lib/vitrina";
import Cabecera from "./Cabecera";
import Cursor from "./Cursor";
import Estudio from "./Estudio";
import Ficha from "./Ficha";
import Indice from "./Indice";
import Interior from "./Interior";
import Laminas from "./Laminas";
import Muro from "./Muro";

const HASH = "#pieza=";

/**
 * La portada entera. Guarda una sola cosa: qué ficha está abierta, y la
 * escribe en la URL (`#pieza=rei-fm`) para que se pueda compartir.
 */
export default function Vitrina({ children }: { children: React.ReactNode }) {
  const [abierta, setAbierta] = useState<string | null>(null);

  useEffect(() => {
    const leer = () => {
      const h = window.location.hash;
      const id = h.startsWith(HASH) ? decodeURIComponent(h.slice(HASH.length)) : null;
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

  return (
    <div className="vitrina relative">
      <Cursor />
      <Cabecera />
      <main>
        <Muro />
        <Laminas onOpen={abrir} />
        <Interior onOpen={abrir} />
        <Estudio />
        <Indice onOpen={abrir} />
      </main>
      {children}
      <Ficha id={abierta} onClose={cerrar} onGo={abrir} />
    </div>
  );
}
