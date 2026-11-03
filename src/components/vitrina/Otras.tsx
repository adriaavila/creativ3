"use client";

import Link from "next/link";
import { Rise } from "@/components/ak/Brand";
import { OTRAS } from "@/lib/historias";
import { CUENTAS, DISCIPLINAS, ESTADO, claseEstado } from "@/lib/vitrina";

// Las filas, bajo el nombre de su disciplina; un grupo sin filas no se pinta.
const GRUPOS = DISCIPLINAS.flatMap((d) => {
  const filas = OTRAS.filter((f) => f.grupo === d.id);
  return filas.length ? [{ id: d.id, label: d.label, filas }] : [];
});

/** El resto del trabajo, una fila por pieza con su estado. Cada fila abre su ficha. */
export default function Otras({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section id="otras" aria-labelledby="otras-titulo" className="section" data-theme="cloud" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">
          Más trabajo
        </p>
        <h2 id="otras-titulo" className="headline" data-reveal="rise">
          <Rise>Los otros</Rise>
          <Rise line={1}>{OTRAS.length}.</Rise>
        </h2>
        <p data-reveal>
          {CUENTAS.lanzadas} de los {CUENTAS.piezas} ya están en uso, y cada fila dice en qué está.
        </p>
      </div>
      <div>
        {GRUPOS.map((g) => (
          <div key={g.id} className="otras-grupo" data-reveal>
            <h3 className="label">{g.label}</h3>
            <ol className="log">
              {g.filas.map(({ n, pieza: p }) => (
                <li key={p.id}>
                  <button type="button" className="log-row" onClick={() => onOpen(p.id)}>
                    <span className="log-date">{n}</span>
                    <span className="log-what">
                      <span className="log-name">{p.name}</span>
                      <span className="log-line">
                        {p.tipo} · {p.linea}
                      </span>
                    </span>
                    <span className={claseEstado(p.status)}>{ESTADO[p.status]}</span>
                    <span className="log-code">
                      Abrir <span className="arw arw-r" aria-hidden="true">→</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ))}
        <Link className="btn btn-link otras-todo" href="/trabajo" data-reveal>
          Ver todo el trabajo, con filtros <span className="arw arw-r" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
