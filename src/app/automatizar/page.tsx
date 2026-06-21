import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, MessageCircle } from "lucide-react";
import OutcomeFooter from "@/components/landing/OutcomeFooter";
import { whatsappUrl } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Automatización para reducir trabajo repetitivo",
  description:
    "Calcula el costo de un proceso manual y revisa una automatización con alcance, supervisión y resultados visibles.",
};

const PROCESS = [
  ["01", "Medimos", "Personas, horas, pasos y excepciones del flujo actual."],
  ["02", "Recortamos", "Elegimos una sola repetición costosa para el primer alcance."],
  ["03", "Conectamos", "Automatizamos con trazabilidad y revisión humana donde importa."],
];

export default function AutomatizarPage() {
  const intake = whatsappUrl(
    "Hola, quiero revisar una automatización con creativv. El proceso repetitivo es:"
  );

  return (
    <>
      <main className="min-h-screen bg-[#f4f0e5] px-5 pb-24 pt-24 text-[#172016] sm:px-8 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-[1380px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#53624f] hover:text-[#172016]"
          >
            <ArrowLeft className="size-4" /> Volver a inicio
          </Link>

          <section className="mt-12 grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#456241]">
                Automatización con criterio
              </div>
              <h1 className="mt-5 max-w-5xl font-display text-[clamp(4rem,8vw,8.6rem)] leading-[0.82] tracking-[-0.055em]">
                Menos pasos.
                <span className="block italic text-[#31583a]">Más capacidad.</span>
              </h1>
            </div>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-base leading-7 text-[#53624f] sm:text-lg">
                Empezamos por medir el trabajo manual. Después diseñamos el flujo más pequeño que puede liberar tiempo sin perder control.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/cotizar"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#172016] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#31583a]"
                >
                  Calcular ahorro <ArrowRight className="size-4" />
                </Link>
                <a
                  href={intake}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#172016]/12 bg-white/60 px-6 text-sm font-semibold hover:bg-white"
                >
                  <MessageCircle className="size-4" /> Contar el proceso
                </a>
              </div>
            </div>
          </section>

          <section className="mt-20 overflow-hidden rounded-[2rem] border border-[#172016]/10 bg-[#172016] text-white shadow-[0_36px_100px_rgba(23,32,22,0.2)]">
            <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
              <div className="border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#b8d397]">Primer alcance</div>
                <h2 className="mt-5 font-display text-4xl leading-[0.95] sm:text-5xl">
                  Un flujo completo vale más que diez automatizaciones sueltas.
                </h2>
                <p className="mt-6 text-sm leading-6 text-white/48">
                  Desde USD 499 · 5–10 días · una integración medible de punta a punta.
                </p>
              </div>
              <div className="grid sm:grid-cols-3">
                {PROCESS.map(([index, title, description]) => (
                  <article key={index} className="border-b border-white/10 p-7 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-8">
                    <div className="font-mono text-[9px] text-[#b8d397]">{index}</div>
                    <h3 className="mt-8 font-display text-3xl">{title}</h3>
                    <p className="mt-4 text-sm leading-6 text-white/46">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              "Sin simulaciones ni grabaciones falsas.",
              "Sin outreach o decisiones automáticas.",
              "Con estados, errores y responsables visibles.",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-[#172016]/10 bg-white/60 p-5 text-sm text-[#435140]">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#dbe9c3]">
                  <Check className="size-3" />
                </span>
                {item}
              </div>
            ))}
          </section>
        </div>
      </main>
      <OutcomeFooter />
    </>
  );
}
