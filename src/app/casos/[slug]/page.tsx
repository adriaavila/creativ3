import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CASOS, SOLUTIONS, casoBySlug, casoLiveLinks, casoProjects } from "@/lib/casos";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import Rise from "@/components/allok/Rise";
import Screen from "@/components/allok/Screen";

export function generateStaticParams(): { slug: string }[] {
  return CASOS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/casos/[slug]">): Promise<Metadata> {
  const caso = casoBySlug((await params).slug);
  if (!caso) return {};
  const title = `${caso.client}: ${caso.headline}`;
  const description = `${caso.sector}. ${caso.problem} ${caso.outcome}`;
  return {
    title,
    description,
    alternates: { canonical: `/casos/${caso.slug}` },
    openGraph: { title, description, url: `/casos/${caso.slug}`, type: "article", locale: "es", images: [caso.cover.src] },
  };
}

const NAV = [
  { href: "/#soluciones", label: "Soluciones" },
  { href: "/casos", label: "Casos" },
  { href: "/#metodo", label: "Cómo trabajamos" },
];

export default async function CasoPage({ params }: PageProps<"/casos/[slug]">) {
  const caso = casoBySlug((await params).slug);
  if (!caso) notFound();

  const live = casoLiveLinks(caso);
  const stack = [...new Set(casoProjects(caso).flatMap((p) => p.stack))].filter((s) => s !== "Case study");
  const solutions = SOLUTIONS.filter((s) => caso.solutions.includes(s.id));
  const i = CASOS.findIndex((c) => c.slug === caso.slug);
  const next = CASOS[(i + 1) % CASOS.length];

  return (
    <div className="allok">
      <div className="allok-void pb-[clamp(200px,24vw,320px)]">
        <SiteHeader nav={NAV} cta={{ href: "/#diagnostico", label: "Agenda un diagnóstico" }} />
        <div className="mx-auto max-w-[1000px] px-5 pt-10 text-center sm:px-10 sm:pt-14">
          <p className="mono text-[var(--on-void-60)]">
            <Link href="/casos" className="inline-flex min-h-11 items-center underline underline-offset-4">
              Casos
            </Link>{" "}
            · {caso.sector}
          </p>
          <h1 className="hero mt-5 text-balance !text-[clamp(2.4rem,6vw,5.2rem)]">{caso.client}</h1>
          <p className="lede mx-auto mt-6 max-w-[640px] text-pretty text-[var(--on-void)]">{caso.headline}</p>
          <p className="mono mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[var(--on-void-60)]">
            {solutions.map((s) => (
              <span key={s.id}>{s.name}</span>
            ))}
          </p>
        </div>
      </div>

      <div className="relative z-[3] -mt-[clamp(180px,22vw,300px)] overflow-x-clip px-5 sm:px-10">
        <div className="mx-auto max-w-[1100px]">
          <div className="allok-bloom">
            <Screen
              image={caso.cover}
              sizes="(min-width: 1100px) 1000px, 92vw"
              priority
              className={caso.cover.kind === "mobile" ? "w-[56%] max-w-[300px]" : "w-full"}
            />
          </div>
        </div>
      </div>

      <section className="mx-auto grid max-w-[1240px] gap-x-12 gap-y-12 px-5 py-[clamp(72px,10vw,130px)] sm:px-10 md:grid-cols-3">
        <Rise>
          <div>
            <h2 className="mono text-[var(--dusk)]">01 · Lo que se rompía</h2>
            <p className="mt-4 text-[clamp(1.1rem,1.5vw,1.3rem)] leading-relaxed text-pretty">{caso.problem}</p>
          </div>
        </Rise>
        <Rise delay={1}>
          <div>
            <h2 className="mono text-[var(--dusk)]">02 · Lo que construimos</h2>
            <ul className="mt-4 grid gap-3">
              {caso.built.map((b) => (
                <li key={b} className="flex items-start gap-3 text-[16px] leading-snug">
                  <span className="mt-[8px] size-[6px] shrink-0 rounded-full bg-[var(--ok-ink)]" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </Rise>
        <Rise delay={2}>
          <div>
            <h2 className="mono text-[var(--dusk)]">03 · Lo que cambió</h2>
            <p className="mt-4 text-[clamp(1.1rem,1.5vw,1.3rem)] font-medium leading-relaxed text-pretty">{caso.outcome}</p>
          </div>
        </Rise>
      </section>

      {caso.gallery.length ? (
        <section className="bg-[var(--paper-2)] py-[clamp(64px,9vw,120px)]">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-10">
            <div className="grid items-end gap-8 md:grid-cols-2 lg:grid-cols-3">
              {caso.gallery.map((g) => (
                <Rise key={g.src}>
                  <figure className="grid justify-items-center gap-4">
                    <Screen
                      image={g}
                      sizes="(min-width: 1024px) 380px, (min-width: 768px) 45vw, 90vw"
                      className={g.kind === "mobile" ? "w-[62%] max-w-[260px]" : "w-full"}
                    />
                    <figcaption className="mono text-[var(--ink-60)]">{g.label}</figcaption>
                  </figure>
                </Rise>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-[clamp(64px,9vw,120px)] sm:px-10 md:grid-cols-2">
        <div>
          <h2 className="mono text-[var(--ink-60)]">Con qué está hecho</h2>
          <p className="mt-4 flex flex-wrap gap-2">
            {stack.map((s) => (
              <span key={s} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-[14px]">
                {s}
              </span>
            ))}
          </p>
        </div>
        {live.length ? (
          <div>
            <h2 className="mono text-[var(--ink-60)]">Míralo en vivo</h2>
            <p className="mt-2 grid">
              {live.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-[17px] font-medium underline underline-offset-4">
                  {l.name} ↗
                </a>
              ))}
            </p>
          </div>
        ) : null}
      </section>

      <section className="px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="allok-on-ink mx-auto grid max-w-[1240px] items-center gap-8 rounded-[30px] bg-[var(--ink)] px-7 py-14 text-[var(--cloud)] sm:px-14 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h2 className="hero !text-[clamp(1.9rem,3.6vw,3rem)]">¿Tu negocio tiene un problema parecido?</h2>
            <p className="lede mt-5 max-w-[46ch] text-[var(--on-void-60)]">
              Empieza por un diagnóstico sin costo. Te decimos qué haríamos primero y cuánto costaría.
            </p>
          </div>
          <div className="grid gap-3 md:justify-self-end">
            <Link href="/#diagnostico" className="allok-btn bg-[var(--ok)] font-semibold text-[var(--ink)]">
              Agenda un diagnóstico
            </Link>
            <Link href={`/casos/${next.slug}`} className="allok-btn border border-[rgba(245,244,240,.28)] text-[var(--cloud)]">
              Siguiente caso: {next.client}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
