"use client";

import { useCallback, useEffect, useState } from "react";
import { PIEZAS } from "@/lib/vitrina";
import Atiende from "./Atiende";
import Cabecera from "./Cabecera";
import Cursor from "./Cursor";
import Enciende from "./Enciende";
import Estudio from "./Estudio";
import Ficha from "./Ficha";
import Indice from "./Indice";
import Interior from "./Interior";
import Laminas from "./Laminas";
import MuroChats from "./MuroChats";
import Puente from "./Puente";
import TeContesta from "./TeContesta";

const HASH = "#pieza=";

export type Llamados = {
  /** El botón principal: crear la cuenta, o hablarlo por WhatsApp sin autoservicio. */
  cta: { href: string; label: string };
  /** La cabecera: crear la cuenta, o entrar. */
  cabecera: { href: string; label: string };
  /** Escribirle al agente de allok por WhatsApp. */
  probar: string;
  precio: number;
  nota: string;
  puesta: { precio: number; href: string };
};

/**
 * La portada entera: primero el agente (le contesta a tus clientes y te
 * contesta a ti), después el estudio que lo hace. Guarda una sola cosa: qué
 * ficha está abierta, y la escribe en la URL (`#pieza=rei-fm`) para que se
 * pueda compartir.
 */
export default function Vitrina({ llamados, children }: { llamados: Llamados; children: React.ReactNode }) {
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
      <Cabecera cta={llamados.cabecera} />
      <main>
        <MuroChats cta={llamados.cta} />
        <Atiende />
        <TeContesta />
        <Enciende cta={llamados.cta} probar={llamados.probar} precio={llamados.precio} nota={llamados.nota} puesta={llamados.puesta} />
        <Puente />
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
