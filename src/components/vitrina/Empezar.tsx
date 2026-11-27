import Link from "next/link";
import { MarkSvg, Rise } from "@/components/ak/Brand";
import Escribeme from "./Escribeme";

// Los pasos, con el ok del dueño donde le toca darlo: la marca se cierra en
// cada uno, como en la portada.
const PASOS: { n: string; titulo: string; texto: string; ok?: string }[] = [
  {
    n: "01",
    titulo: "You tell me.",
    texto:
      "On WhatsApp or a short call: what you sell, how you work and where your day goes. If I don't see anything worth building, I'll tell you.",
  },
  {
    n: "02",
    titulo: "I propose where to start.",
    texto: "First comes what gives you the most time back. You get in writing what I'll build and what it costs, before we begin.",
    ok: "Your ok: on the plan and the price",
  },
  {
    n: "03",
    titulo: "I build it, you try it as it grows.",
    texto:
      "I design it and AI helps me build it. You use it working while it moves forward, and nothing reaches your customers without your ok.",
    ok: "Your ok: on every delivery",
  },
  {
    n: "04",
    titulo: "If you want, I run it.",
    texto: "After launch I stay on, looking after it and improving it every month.",
    ok: "Your ok: on every change",
  },
];

// Las cifras de referencia esperan el visto bueno de Adrián: hasta entonces queda la promesa sin números. Con
// true vuelve el párrafo con los montos.
const MOSTRAR_REFERENCIA = false;

/**
 * Cómo se empieza, en Cloud, en /work#empezar (salió de la portada): los
 * cuatro pasos, lo que hace falta del dueño y el precio cerrado antes de
 * empezar, para que nadie escriba a ciegas. El título va arriba y a todo el
 * ancho: en la columna estrecha, «Empezamos» no cabe.
 */
export default function Empezar() {
  return (
    <section id="empezar" aria-labelledby="empezar-titulo" className="section section-stack" data-theme="cloud" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">
          How we start
        </p>
        <h2 id="empezar-titulo" className="headline" data-reveal="rise">
          <Rise>We start with what</Rise>
          <Rise line={1}>eats most of your time.</Rise>
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
            What I need from you: someone who decides, time with the people who do the work every day, and an ok that doesn&apos;t keep me waiting.
          </p>
          {MOSTRAR_REFERENCIA ? (
            <p className="lead" data-reveal>
              For reference, a full project is around US$10,000, and running it each month, US$1,500. You get the exact number
              in writing at step 02, before we start.
            </p>
          ) : (
            <p className="lead" data-reveal>
              Fixed price before we start.
            </p>
          )}
          <div className="empezar-agente" data-reveal>
            <p className="body">
              Just need your WhatsApp to answer for now? The allok agent is ready and paid monthly.
            </p>
            <Link className="btn btn-link" href="/agente-whatsapp">
              Meet the agent <span className="arw arw-r" aria-hidden="true">→</span>
            </Link>
          </div>
          <Escribeme data-reveal />
        </div>
      </div>
    </section>
  );
}
