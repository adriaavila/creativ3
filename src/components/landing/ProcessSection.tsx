import { CheckCircle2 } from "lucide-react";

const PROCESS = [
  "Entendemos tu objetivo",
  "Elegimos el plan correcto",
  "Diseñamos y desarrollamos",
  "Lanzamos",
  "Mejoramos o automatizamos",
];

export default function ProcessSection() {
  return (
    <section className="relative w-full bg-[#eef0e7] text-[#1f2a1d]">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-12 max-w-3xl">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#336443]">
            Proceso
          </div>
          <h2 className="text-4xl font-normal leading-[0.98] text-[#1f2a1d] sm:text-5xl md:text-6xl">
            Rápido, práctico y con el primer entregable claro.
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {PROCESS.map((step, index) => (
            <article
              key={step}
              className="flex min-h-40 flex-col justify-between rounded-lg border border-[#1f2a1d]/10 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#336443]/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <CheckCircle2 className="h-5 w-5 text-[#336443]" />
              </div>
              <h3 className="mt-8 text-lg font-semibold leading-tight text-[#1f2a1d]">
                {step}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
