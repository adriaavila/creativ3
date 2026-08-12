import type { Metadata } from "next";
import QualificationFlow from "@/components/site/QualificationFlow";
import Colofon from "@/components/landing/Colofon";
import es from "@/messages/es.json";

export const metadata: Metadata = {
  title: "Diseña tu sistema comercial",
  description:
    "Cuéntanos cómo recibe clientes tu negocio y te mostramos cómo funcionaría Allok en tu operación.",
  alternates: { canonical: "/cotizar" },
};

export default function CotizarPage() {
  return (
    <>
      <main className="min-h-screen px-5 pb-24 pt-28 sm:px-8 lg:px-12 lg:pt-36">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Demo personalizada
            </div>
            <h1 className="mt-5 max-w-2xl text-[clamp(2.5rem,6vw,3.75rem)] font-medium leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)]">
              Diseña tu sistema comercial.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
              Tres preguntas. Un plan inicial según el problema que quieres resolver.
            </p>
          </div>
          <div className="rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)]">
            <QualificationFlow locale="es" qualify={es.qualify} embedded />
          </div>
        </div>
      </main>
      <Colofon />
    </>
  );
}
