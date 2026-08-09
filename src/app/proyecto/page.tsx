import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Colofon from "@/components/landing/Colofon";

export const metadata: Metadata = {
  title: "Cuéntanos tu proyecto",
  description: "Cuéntanos cómo recibe clientes tu negocio y te mostramos cómo funcionaría Allok en tu operación.",
  alternates: { canonical: "/proyecto" },
};

export default function ProyectoPage() {
  return (
    <>
      <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 pt-32 pb-24 text-center">
        <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
          Nuevo proyecto
        </span>
        <h1 className="mt-6 max-w-2xl text-4xl font-medium leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)] sm:text-6xl">
          Cuéntanos cómo recibe clientes tu negocio.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--text-secondary)]">
          Cinco preguntas cortas y te mostramos cómo funcionaría Allok en tu operación.
        </p>
        <Link
          href="/cotizar"
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--lima)] px-6 text-sm font-semibold text-[var(--lima-ink)] transition-transform hover:-translate-y-0.5"
        >
          Empezar
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </main>
      <Colofon />
    </>
  );
}
