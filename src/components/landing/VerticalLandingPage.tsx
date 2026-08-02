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
    <main className="studio min-h-screen bg-white pt-16 text-black selection:bg-[#c5f04a] selection:text-black sm:pt-20">
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:pb-24 md:pt-12">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/70 px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-neutral-700">
            <Icon className="h-4 w-4" />
            {city ? `${vertical.eyebrow} · ${city}` : vertical.eyebrow}
          </div>
          <h1 className="max-w-4xl text-5xl font-normal leading-[0.95] text-black sm:text-6xl md:text-7xl">
            {vertical.title}
          </h1>
          {city && (
            <p className="mt-6 max-w-2xl text-base font-medium text-[#587615] md:text-lg">
              Diseño web, automatización de WhatsApp y agentes IA para {label} en {city}
              {" "}y toda Venezuela.
            </p>
          )}
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-neutral-600 md:text-lg">
            {vertical.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappUrl(vertical.message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              Quiero revisar mi caso
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[var(--studio-surface)]"
            >
              Ver planes
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-black/10 bg-[var(--studio-surface)] p-6 md:p-7">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-500">
            Cuando vale la pena intervenir
          </div>
          <div className="mt-5 grid gap-4">
            {vertical.pain.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-relaxed text-neutral-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#587615]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-xl border border-black/10 bg-white p-5">
            <div className="text-sm font-semibold text-black">{vertical.pilot}</div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{vertical.proof}</p>
          </div>
        </aside>
      </section>

      <section className="border-y border-black/10 bg-[var(--studio-surface)] px-6 py-16 text-black md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-500">
              Primer entregable
            </div>
            <h2 className="mt-4 max-w-xl text-4xl font-normal leading-[1] md:text-5xl">
              Primero probamos una mejora concreta. Luego escalamos con evidencia.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {vertical.outcomes.map((outcome) => (
              <div key={outcome} className="rounded-2xl border border-black/10 bg-white p-5">
                <CheckCircle2 className="h-5 w-5 text-[#587615]" />
                <p className="mt-4 text-sm leading-relaxed text-neutral-700">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <div className="rounded-2xl border border-black/10 bg-[var(--studio-surface)] p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                Otras verticales
              </div>
              <h2 className="mt-3 text-3xl font-semibold text-black">Mismo criterio, distinto cuello de botella.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {VERTICAL_LIST.filter((item) => item.slug !== vertical.slug).map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-colors hover:border-black/25 hover:text-black"
                >
                  {item.eyebrow.split(",")[0]}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
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
                    ? "border-black/25 bg-black text-white"
                    : "border-black/10 bg-white text-neutral-600 hover:border-black/25 hover:text-black"
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

