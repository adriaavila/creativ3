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
    <main className="min-h-screen pt-16 sm:pt-20">
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:pb-24 md:pt-12">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
            <Icon className="h-4 w-4" aria-hidden />
            {city ? `${vertical.eyebrow} · ${city}` : vertical.eyebrow}
          </div>
          <h1 className="max-w-4xl text-5xl font-medium leading-[0.95] text-[var(--text-primary)] sm:text-6xl md:text-7xl">
            {vertical.title}
          </h1>
          {city && (
            <p className="mt-6 max-w-2xl text-base font-medium text-[var(--lima)] md:text-lg">
              Sistema comercial, WhatsApp y seguimiento para {label} en {city} y toda Venezuela.
            </p>
          )}
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] md:text-lg">
            {vertical.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappUrl(vertical.message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--lima)] px-6 text-sm font-semibold text-[var(--lima-ink)] transition-all hover:-translate-y-0.5"
            >
              Quiero revisar mi caso
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <Link
              href="/cotizar"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--line)] px-6 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
            >
              Ver precios
            </Link>
          </div>
        </div>

        <aside className="rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-6 md:p-7">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Cuándo vale la pena intervenir
          </div>
          <div className="mt-5 grid gap-4">
            {vertical.pain.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lima)]" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-2)] p-5">
            <div className="text-sm font-semibold text-[var(--text-primary)]">{vertical.pilot}</div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{vertical.proof}</p>
          </div>
        </aside>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface-1)] px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Primer entregable
            </div>
            <h2 className="mt-4 max-w-xl text-4xl font-medium leading-[1] text-[var(--text-primary)] md:text-5xl">
              Primero probamos una mejora concreta. Luego escalamos con evidencia.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {vertical.outcomes.map((outcome) => (
              <div key={outcome} className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-2)] p-5">
                <CheckCircle2 className="h-5 w-5 text-[var(--lima)]" aria-hidden />
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <div className="rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Otras verticales
              </div>
              <h2 className="mt-3 text-3xl font-medium text-[var(--text-primary)]">
                Mismo criterio, distinto cuello de botella.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {VERTICAL_LIST.filter((item) => item.slug !== vertical.slug).map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
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
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-tertiary)]">
          <MapPin className="h-4 w-4" aria-hidden />
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
                    ? "border-[var(--lima)] bg-[var(--lima)] text-[var(--lima-ink)]"
                    : "border-[var(--line)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
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
