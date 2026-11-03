"use client";

import { Rise, vars } from "@/components/ak/Brand";
import { PIEZAS, PIEZAS_DESTACADAS, type Pieza } from "@/lib/vitrina";
import { Ventana } from "./Marcos";

/**
 * El trabajo más reciente, una pieza por sección: la captura primero y a todo
 * el ancho, después el nombre y su línea. La primera va en el campo azul.
 */
export default function Laminas({ onOpen }: { onOpen: (id: string) => void }) {
  const total = PIEZAS_DESTACADAS.length;
  return (
    <section id="trabajo" aria-labelledby="trabajo-titulo">
      <div className="section section-intro" data-theme="cloud" data-stagger>
        <div className="section-title">
          <p className="label" data-reveal="fade">Trabajo</p>
          <h2 id="trabajo-titulo" className="headline" data-reveal="rise">
            <Rise>Lo más</Rise>
            <Rise line={1}>reciente.</Rise>
          </h2>
          <p data-reveal>
            {total} de {PIEZAS.length} piezas · toca cualquiera para abrirla
          </p>
        </div>
      </div>
      {PIEZAS_DESTACADAS.map((p, i) => (
        <Lamina key={p.id} pieza={p} campo={i === 0} onOpen={onOpen} />
      ))}
    </section>
  );
}

function Lamina({ pieza, campo, onOpen }: { pieza: Pieza; campo: boolean; onOpen: (id: string) => void }) {
  const desktop = pieza.images.find((img) => !img.mobile);
  return (
    <article
      className="show"
      data-theme={campo ? "blue" : "cloud"}
      data-reveal={campo ? "field" : undefined}
      data-stagger
    >
      <div className="show-stage" data-reveal={campo ? undefined : "stage"}>
        <button type="button" className="show-open" onClick={() => onOpen(pieza.id)} aria-label={`Abrir ${pieza.name}`}>
          <Ventana
            src={desktop?.src ?? pieza.cover}
            alt={desktop?.alt ?? pieza.name}
            url={pieza.liveUrl}
            sizes="(max-width: 1100px) 92vw, 1040px"
            parallax={!campo}
            eager={campo}
          />
        </button>
      </div>
      <div className="show-cap">
        <div>
          <p className="label" data-reveal="fade">{pieza.tipo}</p>
          <h3 className="show-name" data-reveal="rise" style={vars({ "--d": "150ms" })}>
            <Rise>{pieza.name}</Rise>
          </h3>
          <p className="show-line" data-reveal style={vars({ "--d": "200ms" })}>
            {pieza.linea}
          </p>
        </div>
        <div className="show-meta" data-reveal style={vars({ "--d": "250ms" })}>
          <span className="caption">{pieza.year}</span>
          {pieza.liveUrl ? <span className="status live">En vivo</span> : <span className="status archived">Privado</span>}
          <button type="button" className="btn btn-solid" onClick={() => onOpen(pieza.id)}>
            Abrir <span className="arw arw-r" aria-hidden="true">→</span>
          </button>
          {pieza.liveUrl ? (
            <a className="btn btn-link" href={pieza.liveUrl} target="_blank" rel="noopener noreferrer">
              Visitar <span className="arw arw-ne" aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
