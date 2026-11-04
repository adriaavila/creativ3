import Link from "next/link";
import { MarkSvg, Rise } from "@/components/ak/Brand";
import Escribeme from "./Escribeme";

// Los pasos, con el ok del dueño donde le toca darlo: la marca se cierra en
// cada uno, como en la portada.
const PASOS: { n: string; titulo: string; texto: string; ok?: string }[] = [
  {
    n: "01",
    titulo: "Me cuentas.",
    texto:
      "Por WhatsApp o en una llamada corta: qué vendes, cómo trabajas y en qué se te va el día. Si no veo nada que valga la pena construir, te lo digo.",
  },
  {
    n: "02",
    titulo: "Te propongo por dónde empezar.",
    texto: "Primero va lo que más tiempo te devuelve. Te paso por escrito qué voy a construir y cuánto cuesta, antes de arrancar.",
    ok: "Tu ok: al plan y al precio",
  },
  {
    n: "03",
    titulo: "Lo construyo y lo vas probando.",
    texto:
      "Lo diseño yo y la IA me ayuda a construirlo. Lo pruebas funcionando mientras avanza, y nada llega a tus clientes sin tu ok.",
    ok: "Tu ok: a cada entrega",
  },
  {
    n: "04",
    titulo: "Si quieres, lo opero.",
    texto: "Después de estrenarlo me quedo cuidándolo y mejorándolo cada mes.",
    ok: "Tu ok: a cada cambio",
  },
];

// Las cifras de referencia esperan el visto bueno de Adrián: hasta entonces queda la promesa sin números. Con
// true vuelve el párrafo con los montos.
const MOSTRAR_REFERENCIA = false;

/**
 * Cómo se empieza, en Cloud, en /trabajo#empezar (salió de la portada): los
 * cuatro pasos, lo que hace falta del dueño y el precio cerrado antes de
 * empezar, para que nadie escriba a ciegas. El título va arriba y a todo el
 * ancho: en la columna estrecha, «Empezamos» no cabe.
 */
export default function Empezar() {
  return (
    <section id="empezar" aria-labelledby="empezar-titulo" className="section section-stack" data-theme="cloud" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">
          Cómo empezamos
        </p>
        <h2 id="empezar-titulo" className="headline" data-reveal="rise">
          <Rise>Empezamos por</Rise>
          <Rise line={1}>lo que más tiempo te quita.</Rise>
        </h2>
      </div>
      <div>
        <ol className="principles" data-reading data-stagger>
          {PASOS.map((p) => (
            <li key={p.n} data-reveal="row">
              <b>
                {p.n} {p.titulo}
              </b>
              <span>
                {p.texto}
                {p.ok ? (
                  <span className="ok" data-reveal="close">
                    <MarkSvg />
                    {p.ok}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
        <div className="empezar-pie">
          <p className="body" data-reveal>
            Lo que necesito de ti: alguien que decida, hablar con quien hace el trabajo todos los días y que tu ok no se demore.
          </p>
          {MOSTRAR_REFERENCIA ? (
            <p className="lead" data-reveal>
              Como referencia, un proyecto completo ronda los US$10.000, y operarlo cada mes, US$1.500. El número exacto te lo
              doy por escrito en el paso 02, antes de empezar.
            </p>
          ) : (
            <p className="lead" data-reveal>
              Precio cerrado antes de empezar.
            </p>
          )}
          <div className="empezar-agente" data-reveal>
            <p className="body">
              ¿Por ahora solo necesitas que tu WhatsApp conteste? El agente de allok ya está listo y se paga por mes.
            </p>
            <Link className="btn btn-link" href="/agente-whatsapp">
              Conocer el agente <span className="arw arw-r" aria-hidden="true">→</span>
            </Link>
          </div>
          <Escribeme data-reveal />
        </div>
      </div>
    </section>
  );
}
