"use client";

import Link from "next/link";
import { Rise, vars } from "@/components/ak/Brand";
import { HISTORIAS, type Accion, type Historia } from "@/lib/historias";
import { ESTADO, PIEZAS, claseEstado } from "@/lib/vitrina";
import { Ventana } from "./Marcos";

/**
 * El trabajo, contado desde el problema del dueño: cuatro historias, una por
 * sección, cada una con su captura real y su estado, y después el agente con
 * su demo (`agente`, que llega pintado del servidor). La tercera va en el
 * campo azul.
 */
export default function Historias({ onOpen, agente }: { onOpen: (id: string) => void; agente: React.ReactNode }) {
  return (
    <section id="trabajo" aria-labelledby="trabajo-titulo">
      <div className="section section-intro" data-theme="cloud" data-stagger>
        <div className="section-title">
          <p className="label" data-reveal="fade">
            Trabajo
          </p>
          <h2 id="trabajo-titulo" className="headline" data-reveal="rise">
            <Rise>Problemas que</Rise>
            <Rise line={1}>seguro conoces.</Rise>
          </h2>
          <p data-reveal>
            Elegí estos trabajos porque cada uno resuelve algo distinto: vender, cobrar, cerrar la caja, ordenar el día y
            contestar a tiempo. Toca cualquier pantalla para verla por dentro.
          </p>
        </div>
      </div>
      {HISTORIAS.map((h, i) => (
        <Lamina key={h.id} historia={h} primera={i === 0} onOpen={onOpen} />
      ))}
      {agente}
    </section>
  );
}

/** Una historia: quién y qué le pasa, la captura que abre la ficha, y debajo lo que se construyó. */
function Lamina({ historia: h, primera, onOpen }: { historia: Historia; primera: boolean; onOpen: (id: string) => void }) {
  const pieza = PIEZAS.find((p) => p.id === h.id);
  if (!pieza) return null;
  const titulo = `historia-${h.id}`;
  const celular = h.capturas.some((c) => c.celular);
  // El nombre del botón es la acción; lo que muestra cada captura queda como su descripción.
  const capturaId = (k: number) => `${titulo}-captura-${k}`;
  return (
    <article
      className="show historia"
      data-theme={h.campo ? "blue" : "cloud"}
      data-reveal={h.campo ? "field" : undefined}
      data-stagger
      aria-labelledby={titulo}
    >
      <div className="historia-head">
        <p className="label" data-reveal="fade">
          {h.n} · {h.donde}
        </p>
        <p className="subhead historia-escena" data-reveal style={vars({ "--d": "80ms" })}>
          {h.escena}
        </p>
      </div>
      <div className="show-stage" data-reveal={h.campo ? undefined : "stage"}>
        <button
          type="button"
          className={celular ? "show-open is-phone" : "show-open"}
          onClick={() => onOpen(h.id)}
          aria-label={`Ver ${pieza.name} por dentro`}
          aria-describedby={h.capturas.map((_, k) => capturaId(k)).join(" ")}
        >
          {h.capturas.map((c, k) => (
            <Ventana
              key={c.src}
              src={c.src}
              alt={c.alt}
              url={c.celular ? undefined : h.url}
              ratio={c.celular ? c.ratio : 16 / 10}
              sizes={c.celular ? "(max-width: 760px) 80vw, 340px" : "(max-width: 1100px) 92vw, 1040px"}
              parallax={!h.campo}
              eager={primera && k === 0}
              enBoton
              imgId={capturaId(k)}
            />
          ))}
        </button>
      </div>
      {h.nota ? (
        <p className="caption historia-nota" data-reveal="fade">
          {h.nota}
        </p>
      ) : null}
      <div className="show-cap">
        <div>
          <h3 id={titulo} className="show-name" data-reveal="rise" style={vars({ "--d": "150ms" })}>
            <Rise>{pieza.name}</Rise>
          </h3>
          <p className="show-line" data-reveal style={vars({ "--d": "200ms" })}>
            {h.cuerpo}
          </p>
        </div>
        <div className="show-meta" data-reveal style={vars({ "--d": "250ms" })}>
          <span className="caption">{h.origen}</span>
          <span className={claseEstado(pieza.status)}>{ESTADO[pieza.status]}</span>
          {h.acciones.map((a, k) => (
            <Boton key={a.texto} accion={a} solido={k === 0} onFicha={() => onOpen(h.id)} />
          ))}
        </div>
      </div>
    </article>
  );
}

function Boton({ accion: a, solido, onFicha }: { accion: Accion; solido: boolean; onFicha: () => void }) {
  const clase = solido ? "btn btn-solid" : "btn btn-link";
  if (a.tipo === "web") {
    return (
      <a className={clase} href={a.href} target="_blank" rel="noopener noreferrer">
        {a.texto} <span className="arw arw-ne" aria-hidden="true">↗</span>
      </a>
    );
  }
  if (a.tipo === "caso") {
    return (
      <Link className={clase} href={a.href}>
        {a.texto} <span className="arw arw-r" aria-hidden="true">→</span>
      </Link>
    );
  }
  return (
    <button type="button" className={clase} onClick={onFicha}>
      {a.texto} <span className="arw arw-r" aria-hidden="true">→</span>
    </button>
  );
}
