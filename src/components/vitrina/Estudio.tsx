import { Rise } from "@/components/ak/Brand";
import { CUENTAS } from "@/lib/vitrina";

const TEXTO =
  "Soy Adrián. Ingeniero industrial: aprendí a leer un negocio como un sistema, con sus cuellos de botella, su flujo y su desperdicio. Hoy diseño y construyo el software que los arregla, de la primera pantalla al despliegue. Los agentes de IA hacen la mitad aburrida; el criterio y el ok final siguen siendo míos.";

const CIFRAS = [
  { n: CUENTAS.piezas, label: "piezas en esta página" },
  { n: CUENTAS.capturas, label: "pantallas de proyectos reales" },
  { n: CUENTAS.lanzadas, label: "en producción" },
  { n: CUENTAS.tecnologias, label: "tecnologías distintas" },
];

/** El estudio, en Ink: quién lo hace y las cifras, contadas del portafolio real. */
export default function Estudio() {
  return (
    <section id="estudio" aria-labelledby="estudio-titulo" className="section" data-theme="ink" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">El estudio</p>
        <h2 id="estudio-titulo" className="headline" data-reveal="rise">
          <Rise>El</Rise>
          <Rise line={1}>estudio.</Rise>
        </h2>
      </div>
      <div>
        <p className="subhead estudio-texto" data-reveal>
          {TEXTO}
        </p>
        <dl className="cifras" data-stagger>
          {CIFRAS.map((c) => (
            <div key={c.label} data-reveal="row">
              <dd className="display tnum">{c.n}</dd>
              <dt className="caption">{c.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
