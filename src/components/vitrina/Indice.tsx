"use client";

import { useMemo, useState } from "react";
import { Rise } from "@/components/ak/Brand";
import { DISCIPLINAS, ESTADO, PIEZAS, claseEstado, type Disciplina } from "@/lib/vitrina";

/**
 * Todo el trabajo, en /trabajo: una lista que abre con una regla y se filtra por disciplina. Al tocar una fila, se abre su ficha.
 * Los filtros son botones que se quedan apretados (`aria-pressed`), no pestañas: no hay paneles, solo la misma lista más corta,
 * y cuántos quedan se anuncia.
 */
export default function Indice({ onOpen }: { onOpen: (id: string) => void }) {
  const [filtro, setFiltro] = useState<Disciplina | "todo">("todo");
  const lista = useMemo(
    () => (filtro === "todo" ? PIEZAS : PIEZAS.filter((p) => p.disciplinas.includes(filtro))),
    [filtro],
  );

  return (
    <section id="indice" aria-labelledby="indice-titulo" className="section" data-theme="cloud" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">
          Todo
        </p>
        <h2 id="indice-titulo" className="headline" data-reveal="rise">
          <Rise>Los {PIEZAS.length},</Rise>
          <Rise line={1}>uno por uno.</Rise>
        </h2>
      </div>
      {/* La lista mide dos o tres pantallas: con el 15 % de siempre, en un teléfono hacía falta media pantalla de ella a
          la vista antes de aparecer, y bajo el título quedaba un hueco vacío. Entra apenas asoma. */}
      <div data-reveal data-threshold="0">
        <div role="group" aria-label="Filtrar por disciplina" className="chips indice-filtros">
          {DISCIPLINAS.map((d) => {
            const n = d.id === "todo" ? PIEZAS.length : PIEZAS.filter((p) => p.disciplinas.includes(d.id as Disciplina)).length;
            const on = filtro === d.id;
            return (
              <button key={d.id} type="button" aria-pressed={on} onClick={() => setFiltro(d.id)} className={on ? "chip on" : "chip"}>
                {d.label} <span className="tnum indice-n">{n}</span>
              </button>
            );
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {lista.length === 1 ? "1 trabajo" : `${lista.length} trabajos`}
        </p>
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
                <span className={claseEstado(p.status)}>{ESTADO[p.status]}</span>
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
