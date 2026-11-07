import { Outcome, Rise } from "@/components/ak/Brand";

/**
 * Quién lo hace, en Ink: la regla del ok primero, después de dónde viene.
 * Sin foto todavía: cuando la haya, entra como un hijo más de `.sobre-mi`,
 * antes del texto, sin tocar el resto.
 */
export default function SobreMi() {
  return (
    <section id="sobre-mi" aria-labelledby="sobre-mi-titulo" className="section" data-theme="ink" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">
          Sobre mí
        </p>
        <h2 id="sobre-mi-titulo" className="headline" data-reveal="rise">
          <Rise>Nada sale sin mi ok.</Rise>
          <Rise line={1}>
            <Outcome>Ni sin el tuyo</Outcome>
          </Rise>
        </h2>
      </div>
      <div className="sobre-mi">
        <p className="subhead" data-reveal>
          Yo decido qué se construye y reviso cada pantalla antes de que la veas. Tú decides qué llega a tus clientes.
        </p>
        <p className="body" data-reveal>
          Soy Adrián Avila, ingeniero industrial. Empecé midiendo la producción de una fábrica de cerámica en Tarija y pasé tres
          años en SAMER, la constructora, haciendo visibles con datos sus compras, sus costos y cómo iba cada proyecto. Ahí
          aprendí a mirar un negocio como un sistema: dónde se traba, dónde se repite el trabajo, dónde se pierde dinero.
        </p>
        <p className="body" data-reveal>
          Hoy, desde Venezuela, diseño y construyo el software que lo destraba. Trabajo solo, con agentes de IA que escriben
          buena parte del código, así que de la primera conversación a la entrega hablas conmigo.
        </p>
        <a className="btn btn-link" href="#empezar" data-reveal>
          Cómo empezamos <span className="arw arw-down" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
