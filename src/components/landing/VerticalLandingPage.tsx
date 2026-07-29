import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import { VERTICAL_LIST, type Vertical } from "@/lib/verticals";
import { CITIES, VERTICAL_LABELS, cityVerticalPath } from "@/lib/cities";
import Colofon from "./Colofon";

type Props = {
  vertical: Vertical;
  city?: string;
};

export default function VerticalLandingPage({ vertical, city }: Props) {
  const Icon = vertical.icon;
  const label = VERTICAL_LABELS[vertical.slug];

  return (
    <main className="min-h-screen bg-[#08090a] text-white selection:bg-[#0a0a0a] selection:text-white">
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-24 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:pb-24 md:pt-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#c5f04a]/30 bg-[#0a0a0a]/30 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#c5f04a]">
            <Icon className="h-4 w-4" />
            {city ? `${vertical.eyebrow} · ${city}` : vertical.eyebrow}
          </div>
          <h1 className="max-w-4xl text-5xl font-normal leading-[0.95] text-white sm:text-6xl md:text-7xl">
            {vertical.title}
          </h1>
          {city && (
            <p className="mt-6 max-w-2xl text-base font-medium text-[#c5f04a] md:text-lg">
              Diseño web, automatización de WhatsApp y agentes IA para {label} en {city}
              {" "}y toda Venezuela.
            </p>
          )}
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
            {vertical.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappUrl(vertical.message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-6 py-3 text-sm font-semibold text-white border border-[#c5f04a]/30 shadow-lg shadow-[#0a0a0a]/20 transition-all hover:bg-[#26272b] hover:border-[#c5f04a]/60"
            >
              Quiero revisar mi caso
              <ArrowRight className="h-4 w-4 text-[#c5f04a]" />
            </a>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ver planes
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40 md:p-7">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#c5f04a]">
            Cuando vale la pena intervenir
          </div>
          <div className="mt-5 grid gap-4">
            {vertical.pain.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-relaxed text-white/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#c5f04a]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-sm font-semibold text-white">{vertical.pilot}</div>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{vertical.proof}</p>
          </div>
        </aside>
      </section>

      <section className="bg-[#08090a] border-y border-white/10 px-6 py-16 text-white md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#c5f04a]">
              Primer entregable
            </div>
            <h2 className="mt-4 max-w-xl text-4xl font-normal leading-[1] md:text-5xl">
              Primero probamos una mejora concreta. Luego escalamos con evidencia.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {vertical.outcomes.map((outcome) => (
              <div key={outcome} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <CheckCircle2 className="h-5 w-5 text-[#c5f04a]" />
                <p className="mt-4 text-sm leading-relaxed text-white/75">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#c5f04a]">
                Otras verticales
              </div>
              <h2 className="mt-3 text-3xl font-semibold text-white">Mismo criterio, distinto cuello de botella.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {VERTICAL_LIST.filter((item) => item.slug !== vertical.slug).map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white hover:border-[#c5f04a]/30"
                >
                  {item.eyebrow.split(",")[0]}
                  <ArrowRight className="h-3.5 w-3.5 text-[#c5f04a]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[#c5f04a]">
          <MapPin className="h-4 w-4" />
          Disponible para {label} en
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {CITIES.map((c) => {
            const active = c.label === city;
            return (
              <Link
                key={c.slug}
                href={cityVerticalPath(c.slug, vertical.slug)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-[#c5f04a]/50 bg-[#0a0a0a] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)} en {c.label}
              </Link>
            );
          })}
        </div>
      </section>

      <Colofon />
    </main>
  );
}

