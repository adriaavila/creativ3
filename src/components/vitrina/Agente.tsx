import Link from "next/link";
import { Rise, vars } from "@/components/ak/Brand";
import { AGENTE } from "@/lib/historias";
import DemoAgente from "./DemoAgente";

/**
 * El agente de allok, en Ink: el mismo ritmo de las historias, sin captura ni
 * ficha. Lo que hace va primero, y en el escenario, la demo: el dueño pega su
 * web y le escribe a su propio agente.
 */
export default function Agente() {
  return (
    <article id="agente" className="show historia" data-theme="ink" data-stagger aria-labelledby="agente-titulo">
      <div className="historia-head">
        <p className="label" data-reveal="fade">
          {AGENTE.kicker}
        </p>
        <p className="subhead historia-escena" data-reveal style={vars({ "--d": "80ms" })}>
          {AGENTE.escena}
        </p>
      </div>
      <div className="agente-texto">
        <h3 id="agente-titulo" className="show-name" data-reveal="rise" style={vars({ "--d": "150ms" })}>
          <Rise>{AGENTE.nombre}</Rise>
        </h3>
        <p className="show-line" data-reveal style={vars({ "--d": "200ms" })}>
          {AGENTE.cuerpo}
        </p>
      </div>
      <div className="show-stage agente-demo" data-reveal="stage">
        <DemoAgente titulo={AGENTE.prueba} />
      </div>
      <Link className="btn btn-link agente-enlace" href={AGENTE.enlace.href} data-reveal>
        {AGENTE.enlace.texto} <span className="arw arw-r" aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
