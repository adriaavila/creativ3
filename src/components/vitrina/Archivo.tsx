"use client";

import { Rise, vars } from "@/components/ak/Brand";
import { CUENTAS, PIEZAS } from "@/lib/vitrina";
import Cabecera from "./Cabecera";
import Ficha from "./Ficha";
import Indice from "./Indice";
import Interior from "./Interior";
import { useFicha } from "./useFicha";

const IDS = PIEZAS.map((p) => p.id);

/**
 * /trabajo: todas las piezas, con filtros, y las pantallas de adentro. La
 * portada cuenta cuatro; aquí están todas. La ficha se abre con el mismo
 * `#pieza=` que en la portada. `children` son las secciones que siguen al
 * trabajo (quién lo hace, cómo se empieza), dentro de `main`; `pie`, el
 * cierre con los enlaces, fuera.
 */
export default function Archivo({ children, pie }: { children?: React.ReactNode; pie?: React.ReactNode }) {
  const { abierta, abrir, ir, cerrar } = useFicha(IDS);

  return (
    <>
      <Cabecera />
      <main id="contenido">
        <section className="section-intro archivo-intro" data-theme="ink" data-stagger aria-labelledby="archivo-titulo">
          <p className="label" data-reveal="fade">
            Work
          </p>
          <h1 id="archivo-titulo" className="display" data-reveal="rise" style={vars({ "--d": "120ms" })}>
            <Rise>All the</Rise>
            <Rise line={1}>work.</Rise>
          </h1>
          <p className="lead" data-reveal style={vars({ "--d": "320ms" })}>
            {CUENTAS.piezas} projects across websites, systems and AI agents. {CUENTAS.lanzadas} are already in use. Tap any of them
            to open it.
          </p>
        </section>
        <Indice onOpen={abrir} />
        <Interior onOpen={abrir} />
        {children}
      </main>
      {pie}
      <Ficha id={abierta} onClose={cerrar} onGo={ir} />
    </>
  );
}
