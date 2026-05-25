import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { VERTICAL_LIST } from "@/lib/verticals";

export default function VerticalsSection() {
  return (
    <section className="relative w-full bg-[#f5f3ec] text-[#1f2a1d]">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-12 grid gap-6 md:grid-cols-[0.85fr_1.15fr] md:items-end">
          <div>
            <div className="mb-4 text-xs font-medium uppercase tracking-widest text-[#336443]">
              Mercados foco
            </div>
            <h2 className="max-w-2xl text-4xl font-normal leading-[1] text-[#1f2a1d] sm:text-5xl md:text-6xl">
              Donde una mejor experiencia se convierte rapido en dinero.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-[#4b5b47] md:text-lg">
            Empezamos por verticales con demanda visible, conversaciones repetidas y procesos manuales.
            Eso permite diagnosticar rapido, probar pequeno y escalar solo lo que demuestra traccion.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {VERTICAL_LIST.map((vertical) => {
            const Icon = vertical.icon;
            return (
              <Link
                key={vertical.slug}
                href={`/${vertical.slug}`}
                className="group rounded-lg border border-[#1f2a1d]/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#336443]/30 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1f2a1d] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#4b5b47] transition-transform group-hover:translate-x-1 group-hover:text-[#336443]" />
                </div>
                <div className="mt-8 text-xs font-semibold uppercase tracking-widest text-[#336443]">
                  {vertical.eyebrow}
                </div>
                <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#1f2a1d]">
                  {vertical.title}
                </h3>
                <div className="mt-5 grid gap-2">
                  {vertical.outcomes.slice(0, 2).map((item) => (
                    <div key={item} className="flex gap-2 text-sm text-[#4b5b47]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#336443]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
