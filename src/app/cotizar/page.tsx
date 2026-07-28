import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QuoteConfigurator from "@/components/quote/QuoteConfigurator";
import Colofon from "@/components/landing/Colofon";

export const metadata: Metadata = {
  title: "Calculadora de ahorro operativo",
  description:
    "Estima horas recuperables, costo del trabajo repetitivo y valor potencial de automatizar un proceso con Creativv.",
  alternates: { canonical: "/cotizar" },
};

export default function CotizarPage() {
  return (
    <>
      <main className="min-h-screen bg-[#0a0f0b] px-5 pb-24 pt-24 text-white selection:bg-[#31583a] selection:text-white sm:px-8 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-[1380px]">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#a9c989] hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" /> Volver a inicio
          </Link>
          <section className="mb-12 mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a9c989]">
                Calculadora de ahorro
              </div>
              <h1 className="mt-5 max-w-5xl font-display text-[clamp(3.8rem,7vw,7.8rem)] leading-[0.84] tracking-[-0.05em] text-white">
                Ponle precio
                <span className="block italic text-[#a9c989]">al trabajo repetitivo.</span>
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-white/70 sm:text-lg lg:justify-self-end">
              Ajusta cuatro datos y mira cuánta capacidad podría recuperar tu equipo. Sin formularios largos y sin promesas infladas.
            </p>
          </section>
          <QuoteConfigurator />
        </div>
      </main>
      <Colofon />
    </>
  );
}

