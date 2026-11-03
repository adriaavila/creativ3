import { Outcome, Rise, vars } from "@/components/ak/Brand";
import Escribeme from "./Escribeme";
import Manos from "./Manos";

/**
 * La apertura, en Ink: quién lo hace y qué hace, en una frase que sube línea
 * por línea; las dos manos que se alcanzan; y debajo, lo que hace y la única
 * salida, con el trabajo a un toque.
 */
export default function Portada() {
  return (
    <section id="inicio" className="hero" data-theme="ink" data-stagger aria-label="Portada">
      <p className="label" data-reveal="fade">
        Adrián Avila · Venezuela y Bolivia
      </p>
      <h1 className="display" data-reveal="rise" style={vars({ "--d": "120ms" })}>
        <Rise>Hago el software</Rise>
        <Rise line={1}>
          <Outcome>con el que trabaja tu negocio</Outcome>
        </Rise>
      </h1>
      <Manos />
      <div className="hero-foot">
        <p className="lead" data-reveal style={vars({ "--d": "520ms" })}>
          Webs, sistemas para el día a día y agentes que contestan tu WhatsApp, para negocios de Latinoamérica. Los diseño yo y
          la IA me ayuda a construirlos.
        </p>
        <div className="hero-acciones" data-reveal style={vars({ "--d": "620ms" })}>
          <Escribeme />
          <a className="btn btn-link" href="#trabajo">
            Ver el trabajo <span className="arw arw-down" aria-hidden="true">↓</span>
          </a>
          <p className="caption">Precio cerrado antes de empezar · Te contesto yo</p>
        </div>
      </div>
    </section>
  );
}
