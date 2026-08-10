import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  Clock3,
  MessageCircle,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import SiteFooter from "@/components/site/SiteFooter";
import { getMessages } from "@/lib/i18n";
import { IMPLEMENTATION_TIMELINE_DAYS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Docs · Cómo funciona Allok con WhatsApp",
  description:
    "Guía clara del flujo de Allok: conexión de WhatsApp, inbox, oportunidades, respuestas supervisadas y seguimiento.",
  alternates: { canonical: "/docs" },
};

const SECTIONS = [
  ["vision-general", "Visión general"],
  ["flujo", "De mensaje a venta"],
  ["sistema", "Qué organiza Allok"],
  ["control", "Automatización y control"],
  ["reglas", "Reglas de WhatsApp"],
  ["implementacion", "Puesta en marcha"],
] as const;

const RESPONSIBILITIES = [
  {
    icon: Bot,
    title: "Allok organiza",
    body: "Centraliza conversaciones, crea oportunidades, resume contexto y mantiene visible el próximo paso.",
  },
  {
    icon: UserRoundCheck,
    title: "Tu equipo decide",
    body: "Revisa la respuesta final, confirma decisiones comerciales y mueve cada oportunidad hacia el cierre.",
  },
  {
    icon: ShieldCheck,
    title: "La automatización obedece reglas",
    body: "Asignaciones, recordatorios y mensajes se activan solo después de definir responsables, límites y casos de prueba.",
  },
] as const;

const WHATSAPP_RULES = [
  [
    "Tu número sigue siendo tuyo",
    "Allok se conecta al número acordado durante la implementación. No obliga a tus clientes a escribir a otro canal.",
  ],
  [
    "La conversación inicia en WhatsApp",
    "El cliente escribe como siempre. Allok recibe el evento, identifica el contacto y lo organiza en el inbox comercial.",
  ],
  [
    "Fuera de la ventana de atención se usa plantilla",
    "En el canal oficial, WhatsApp exige una plantilla aprobada para retomar conversaciones fuera de la ventana de 24 horas.",
  ],
  [
    "Tus datos no se usan para vender publicidad",
    "La información del negocio y de sus clientes se procesa únicamente para operar el servicio contratado.",
  ],
] as const;

export default function DocsPage() {
  const messages = getMessages("es");
  const { story, system, timeline } = messages.home;

  return (
    <>
      <main className="min-h-screen pb-24 pt-32 sm:pt-40">
        <header className="border-b border-[var(--line)] px-4 pb-14 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              <span>Producto</span>
              <ArrowRight className="size-3" aria-hidden />
              <span className="text-[var(--lima)]">Docs</span>
            </div>
            <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_0.48fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl text-[clamp(2.8rem,7vw,5.6rem)] font-medium leading-[0.94] tracking-[-0.04em] text-[var(--text-primary)]">
                  Cómo funciona Allok con WhatsApp.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                  Allok no reemplaza WhatsApp. Le añade un inbox comercial, un pipeline y seguimiento para que cada
                  conversación tenga responsable, contexto y próximo paso.
                </p>
              </div>
              <div className="rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  <Clock3 className="size-4 text-[var(--lima)]" aria-hidden />
                  Lectura de 5 minutos
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Sin términos técnicos. Esta guía explica qué ve el cliente, qué hace Allok y qué controla tu equipo.
                </p>
              </div>
            </div>

            <ol className="mt-10 grid overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-5">
              {["Mensaje", "Inbox", "Oportunidad", "Seguimiento", "Resultado"].map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-3 bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--text-secondary)]"
                >
                  <span className="font-mono text-[10px] text-[var(--lima)]">0{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16 lg:pt-20">
          <aside className="hidden lg:block">
            <nav aria-label="Contenido de la documentación" className="sticky top-28">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                En esta guía
              </p>
              <ol className="mt-4 border-l border-[var(--line)]">
                {SECTIONS.map(([id, label], index) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="flex gap-3 border-l border-transparent py-2 pl-4 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--lima)] hover:text-[var(--text-primary)]"
                    >
                      <span className="font-mono text-[10px] text-[var(--text-tertiary)]">0{index + 1}</span>
                      {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="min-w-0 divide-y divide-[var(--line)]">
            <section id="vision-general" className="scroll-mt-28 pb-16">
              <DocHeading number="01" title="WhatsApp sigue al frente. Allok trabaja detrás." />
              <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                El cliente no aprende una herramienta nueva: escribe por WhatsApp como siempre. El cambio ocurre en
                la operación interna, donde la conversación deja de ser un chat aislado y pasa a formar parte de un
                proceso comercial visible.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Cliente", "Escribe y recibe respuesta en WhatsApp."],
                  ["Allok", "Ordena contacto, contexto, oportunidad y seguimiento."],
                  ["Equipo", "Atiende, decide y ve qué falta por cerrar."],
                ].map(([title, body]) => (
                  <article key={title} className="rounded-[var(--r-lg)] border border-[var(--line)] p-5">
                    <h3 className="text-base font-medium text-[var(--text-primary)]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="flujo" className="scroll-mt-28 py-16">
              <DocHeading number="02" title="De mensaje a venta, paso a paso." />
              <ol className="mt-8 overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)]">
                {story.steps.map(([number, title, description]) => (
                  <li
                    key={number}
                    className="grid gap-2 border-b border-[var(--line)] p-5 last:border-b-0 sm:grid-cols-[3rem_11rem_1fr] sm:gap-5 sm:p-6"
                  >
                    <span className="font-mono text-xs text-[var(--lima)]">{number}</span>
                    <h3 className="text-base font-medium text-[var(--text-primary)]">{title}</h3>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="sistema" className="scroll-mt-28 py-16">
              <DocHeading number="03" title="Qué organiza Allok." />
              <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                Las capas comparten la misma información. No hace falta copiar datos de WhatsApp a notas, hojas de
                cálculo o herramientas separadas.
              </p>
              <div className="mt-8 grid gap-px overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                {system.layers.map(([name, description], index) => (
                  <article key={name} className="bg-[var(--surface-1)] p-5 sm:p-6">
                    <span className="font-mono text-[10px] text-[var(--text-tertiary)]">0{index + 1}</span>
                    <h3 className="mt-4 text-lg font-medium text-[var(--text-primary)]">{name}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="control" className="scroll-mt-28 py-16">
              <DocHeading number="04" title="Automatización con control humano." />
              <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--text-secondary)]">
                Allok empieza supervisado. Primero ordena y sugiere; después automatiza únicamente los pasos que el
                negocio ya definió y probó.
              </p>
              <div className="mt-8 grid gap-3">
                {RESPONSIBILITIES.map(({ icon: Icon, title, body }) => (
                  <article
                    key={title}
                    className="grid gap-4 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-1)] p-5 sm:grid-cols-[2.5rem_12rem_1fr] sm:items-start sm:p-6"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-[var(--lima-dim)] text-[var(--lima)]">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <h3 className="text-base font-medium text-[var(--text-primary)] sm:pt-2">{title}</h3>
                    <p className="text-sm leading-6 text-[var(--text-secondary)] sm:pt-2">{body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="reglas" className="scroll-mt-28 py-16">
              <DocHeading number="05" title="Reglas importantes de WhatsApp." />
              <dl className="mt-8 grid gap-3 sm:grid-cols-2">
                {WHATSAPP_RULES.map(([term, description]) => (
                  <div key={term} className="rounded-[var(--r-lg)] border border-[var(--line)] p-5 sm:p-6">
                    <dt className="flex items-start gap-2 text-base font-medium text-[var(--text-primary)]">
                      <Check className="mt-0.5 size-4 shrink-0 text-[var(--lima)]" aria-hidden />
                      {term}
                    </dt>
                    <dd className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{description}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="implementacion" className="scroll-mt-28 py-16">
              <DocHeading number="06" title="Puesta en marcha en seis pasos." />
              <ol className="mt-8 grid gap-3 sm:grid-cols-2">
                {timeline.days.map((day, index) => (
                  <li key={day.title} className="rounded-[var(--r-lg)] border border-[var(--line)] p-5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--lima)]">
                      Día {IMPLEMENTATION_TIMELINE_DAYS[index]}
                    </span>
                    <h3 className="mt-3 text-base font-medium text-[var(--text-primary)]">{day.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{day.description}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-10 flex flex-col gap-6 rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <MessageCircle className="size-4 text-[var(--lima)]" aria-hidden />
                    ¿Quieres verlo con tu proceso real?
                  </div>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">
                    Cuéntanos cómo llegan hoy tus consultas y preparamos una demostración con tu flujo comercial.
                  </p>
                </div>
                <Link
                  href="/cotizar"
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--lima)] px-5 text-sm font-semibold text-[var(--lima-ink)] transition-transform hover:-translate-y-0.5"
                >
                  Ver demo personalizada
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter locale="es" messages={messages} />
    </>
  );
}

function DocHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-xs text-[var(--lima)]">{number}</span>
      <h2 className="text-2xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-3xl">{title}</h2>
    </div>
  );
}
