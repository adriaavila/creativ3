import type { Metadata } from "next";
import QuoteConfigurator from "@/components/quote/QuoteConfigurator";
import Colofon from "@/components/landing/Colofon";

export const metadata: Metadata = {
  title: "Calculadora de ahorro operativo",
  description:
    "Estima horas recuperables, costo del trabajo repetitivo y valor potencial de automatizar un proceso con allok.",
  alternates: { canonical: "/cotizar" },
};

export default function CotizarPage() {
  return (
    <>
      <main className="studio min-h-screen bg-white px-5 pb-24 pt-24 text-black selection:bg-[#c5f04a] selection:text-black sm:px-8 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-[1380px]">
          <section className="mb-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Calculadora de ahorro
              </div>
              <h1 className="mt-5 max-w-5xl text-[clamp(3.8rem,7vw,7.8rem)] leading-[0.84] tracking-[-0.05em] text-black">
                Ponle precio
                <span className="block italic text-[#587615]">al trabajo repetitivo.</span>
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-neutral-600 sm:text-lg lg:justify-self-end">
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

