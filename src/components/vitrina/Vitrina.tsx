"use client";

import Cabecera from "./Cabecera";
import Ficha from "./Ficha";
import Historias from "./Historias";
import Otras from "./Otras";
import { useFicha } from "./useFicha";

/**
 * La portada entera: quién, el trabajo contado desde el problema del dueño,
 * el resto del trabajo, quién lo hace y cómo se empieza. Guarda una sola
 * cosa, qué ficha está abierta (`useFicha`, igual que /trabajo). Lo que no
 * abre fichas llega ya pintado del servidor: la portada, el agente con su
 * demo, lo que va después de las otras (`children`: Sobre mí y Cómo
 * empezamos) y el cierre.
 */
export default function Vitrina({
  portada,
  agente,
  children,
  cierre,
}: {
  portada: React.ReactNode;
  agente: React.ReactNode;
  children: React.ReactNode;
  cierre: React.ReactNode;
}) {
  const { abierta, abrir, cerrar } = useFicha();

  return (
    <>
      <Cabecera portada />
      <main id="contenido">
        {portada}
        <Historias onOpen={abrir} agente={agente} />
        <Otras onOpen={abrir} />
        {children}
      </main>
      {cierre}
      <Ficha id={abierta} onClose={cerrar} onGo={abrir} />
    </>
  );
}
