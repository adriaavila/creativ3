import { Outcome, Rise, vars } from "@/components/ak/Brand";
import { CUENTAS } from "@/lib/vitrina";
import Manos from "./Manos";

/**
 * La apertura, en Ink: una frase que sube línea por línea, dos manos que se
 * alcanzan y una oración debajo. Cada línea es una mano, en su color: la
 * humana (Cloud, a la izquierda) da el ok; la de la máquina (azul, a la
 * derecha) hace el resto; y la marca se cierra entre las dos.
 */
export default function Portada() {
  return (
    <section id="inicio" className="hero" data-theme="ink" data-stagger aria-label="Portada">
      <p className="label" data-reveal="fade">allok · estudio de Adrián Avila</p>
      <h1 className="display" data-reveal="rise" style={vars({ "--d": "120ms" })}>
        <Rise>Tú das el ok.</Rise>
        <Rise line={1}>
          <Outcome>La IA hace el resto</Outcome>
        </Rise>
      </h1>
      <Manos />
      <div className="hero-foot">
        <p className="lead" data-reveal style={vars({ "--d": "520ms" })}>
          Diseño y construyo webs, sistemas y agentes de IA para negocios de verdad.{" "}
          {CUENTAS.enVivo === CUENTAS.piezas
            ? `${CUENTAS.piezas} piezas, todas vivas: puedes abrirlas.`
            : `${CUENTAS.piezas} piezas, ${CUENTAS.enVivo} vivas para abrir ahora mismo.`}
        </p>
        <a className="btn btn-link" href="#trabajo" data-reveal style={vars({ "--d": "620ms" })}>
          Baja <span className="arw arw-down" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
