"use client";

import { useMemo, useState } from "react";
import { Rise } from "@/components/ak/Brand";
import { DISCIPLINAS, PIEZAS, type Disciplina } from "@/lib/vitrina";

/** Todo el trabajo, en una lista que abre con una regla. Al tocar una fila, se abre su ficha. */
export default function Indice({ onOpen }: { onOpen: (id: string) => void }) {
  const [filtro, setFiltro] = useState<Disciplina | "todo">("todo");
  const lista = useMemo(
    () => (filtro === "todo" ? PIEZAS : PIEZAS.filter((p) => p.disciplinas.includes(filtro))),
    [filtro],
  );

  return (
    <section id="indice" aria-labelledby="indice-titulo" className="section" data-theme="cloud" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">Índice</p>
        <h2 id="indice-titulo" className="headline" data-reveal="rise">
          <Rise>Índice</Rise>
          <Rise line={1}>completo.</Rise>
        </h2>
      </div>
      <div data-reveal>
        <div role="tablist" aria-label="Filtrar por disciplina" className="chips indice-filtros">
          {DISCIPLINAS.map((d) => {
            const n = d.id === "todo" ? PIEZAS.length : PIEZAS.filter((p) => p.disciplinas.includes(d.id as Disciplina)).length;
            const on = filtro === d.id;
            return (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFiltro(d.id)}
                className={on ? "chip on" : "chip"}
              >
                {d.label} <span className="tnum indice-n">{n}</span>
              </button>
            );
          })}
        </div>
        <ol className="log">
          {lista.map((p) => (
            <li key={p.id}>
              <button type="button" className="log-row" onClick={() => onOpen(p.id)}>
                <span className="log-date">{p.year}</span>
                <span className="log-what">
                  <span className="log-name">{p.name}</span>
                  <span className="log-line">
                    {p.tipo} · {p.linea}
                  </span>
                </span>
                {p.liveUrl ? <span className="status live">En vivo</span> : <span className="status archived">Privado</span>}
                <span className="log-code">
                  Abrir <span className="arw arw-r" aria-hidden="true">→</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
