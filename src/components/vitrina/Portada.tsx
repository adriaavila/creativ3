import { Outcome, Rise, vars } from "@/components/ak/Brand";
import { CUENTAS } from "@/lib/vitrina";

/** La apertura: una frase que sube línea por línea, su punto aterriza, y una oración debajo. */
export default function Portada() {
  return (
    <section id="inicio" className="hero" data-theme="cloud" data-stagger aria-label="Portada">
      <p className="label" data-reveal="fade">allok · estudio de Adrián Avila</p>
      <h1 className="display" data-reveal="rise" style={vars({ "--d": "120ms" })}>
        <Rise>Cosas reales,</Rise>
        <Rise line={1}>
          <Outcome>hechas con obsesión</Outcome>
        </Rise>
      </h1>
      <div className="hero-foot">
        <p className="lead" data-reveal style={vars({ "--d": "520ms" })}>
          Webs, productos y agentes de IA para negocios de verdad.{" "}
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
