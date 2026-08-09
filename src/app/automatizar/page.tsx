import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import Colofon from "@/components/landing/Colofon";
import { whatsappUrl } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Automatización con supervisión",
  description:
    "Automatizaciones de seguimiento y respuesta dentro del sistema comercial de Allok, con revisión humana donde importa.",
  alternates: { canonical: "/automatizar" },
};

const PROCESS = [
  ["01", "Medimos", "Consultas, horas y pasos del flujo comercial actual."],
  ["02", "Recortamos", "Elegimos el seguimiento que más oportunidades enfría hoy."],
  ["03", "Conectamos", "Automatizamos con trazabilidad y revisión humana donde importa."],
];

export default function AutomatizarPage() {
  const intake = whatsappUrl(
    "Hola, quiero revisar automatizaciones con Allok. El proceso que quiero ordenar es:"
  );

  return (
    <>
      <main className="min-h-screen px-5 pb-24 pt-28 sm:px-8 lg:px-12 lg:pt-36">
        <div className="mx-auto max-w-[1380px]">
          <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Automatización supervisada
              </div>
              <h1 className="mt-5 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)]">
                Menos seguimiento manual.
                <span className="block text-[var(--lima)]">Más ventas cerradas.</span>
              </h1>
            </div>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                Empezamos por medir cómo se pierde una oportunidad hoy. Después automatizamos el seguimiento más
                pequeño que puede recuperarla, sin quitarle el control a tu equipo.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/cotizar"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--lima)] px-6 text-sm font-semibold text-[var(--lima-ink)] transition-all hover:-translate-y-0.5"
                >
                  Diseñar mi sistema <ArrowRight className="size-4" aria-hidden />
                </Link>
                <a
                  href={intake}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--line)] px-6 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  <MessageCircle className="size-4" aria-hidden /> Contar el proceso
                </a>
              </div>
            </div>
          </section>

          <section className="mt-20 overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)]">
            <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
              <div className="border-b border-[var(--line)] p-7 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Primer alcance
                </div>
                <h2 className="mt-5 text-3xl font-medium leading-[1.05] text-[var(--text-primary)] sm:text-4xl">
                  Un seguimiento automatizado bien hecho vale más que diez reglas sueltas.
                </h2>
                <p className="mt-6 text-sm leading-6 text-[var(--text-tertiary)]">
                  Incluido en la implementación · 7 días · una automatización medible de punta a punta.
                </p>
              </div>
              <div className="grid sm:grid-cols-3">
                {PROCESS.map(([index, title, description]) => (
                  <article
                    key={index}
                    className="border-b border-[var(--line)] p-7 last:border-b-0 sm:border-b-0 sm:border-r sm:p-8 sm:last:border-r-0"
                  >
                    <div className="font-mono text-[9px] text-[var(--text-tertiary)]">{index}</div>
                    <h3 className="mt-8 text-2xl font-medium text-[var(--text-primary)]">{title}</h3>
                    <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              "Sin simulaciones ni respuestas falsas.",
              "Sin outreach o decisiones automáticas sin revisión.",
              "Con estados, errores y responsables visibles.",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-1)] p-5 text-sm text-[var(--text-secondary)]"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--lima)] text-[var(--lima-ink)]">
                  <Check className="size-3" aria-hidden />
                </span>
                {item}
              </div>
            ))}
          </section>
        </div>
      </main>
      <Colofon />
    </>
  );
}
