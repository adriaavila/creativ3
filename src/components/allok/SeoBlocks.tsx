import type { ReactNode } from "react";
import Link from "next/link";
import { STATES } from "@/lib/brand";
import { faqJsonLd, jsonLdHtml } from "@/lib/seo";
import { COMPARISONS, VERTICALS, priceLine, seoCta, seoPath, type Faq, type SeoPage } from "@/lib/seo-pages";
import SiteHeader from "./SiteHeader";

/**
 * Las piezas que comparten las páginas de búsqueda (`/alternativa-a/*` y
 * `/whatsapp-para/*`). Mismo sistema `.allok` que la portada: negro para
 * abrir, papel en medio, cielo para cerrar.
 */

const NAV = [
  { href: "/#como", label: "Cómo funciona" },
  { href: "/#precios", label: "Precios" },
  { href: "/rei", label: "Inmobiliarias" },
];

/** La portada negra: cabecera, etiqueta, H1 y el párrafo. `pb` deja sitio al objeto que rompe el borde. */
export function SeoHero({ page }: { page: SeoPage }) {
  const cta = seoCta(page);
  return (
    <div className="allok-void pb-[170px]">
      <SiteHeader nav={NAV} cta={{ href: cta.href, label: page.cta === "rei" ? "Ver REI" : cta.label }} />
      <div className="mx-auto max-w-[980px] px-5 pt-10 text-center sm:px-10 sm:pt-16">
        <p className="mono text-[var(--on-void-60)]">{page.kicker}</p>
        <h1 className="hero mt-7 text-balance !text-[clamp(2.25rem,6vw,5.25rem)]">{page.h1}</h1>
        <p className="lede mx-auto mt-7 max-w-[620px] text-pretty text-[var(--on-void-60)]">{page.lede}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <CtaLink href={cta.href} className="allok-btn allok-btn-solid">
            {cta.label}
          </CtaLink>
          <Link href="#preguntas" className="allok-btn border border-[var(--hair-void)] text-[var(--on-void)]">
            Preguntas frecuentes
          </Link>
        </div>
      </div>
    </div>
  );
}

function CtaLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return href.startsWith("/") ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

/** Viñeta de lista, el punto verde de la portada. */
export function Dot() {
  return (
    <span
      className="mt-[8px] size-[5px] shrink-0 rounded-full"
      style={{ background: STATES.activo.dot }}
      aria-hidden="true"
    />
  );
}

export function SeoFaq({ faqs }: { faqs: Faq[] }) {
  return (
    <section id="preguntas" className="mx-auto max-w-[840px] scroll-mt-6 px-5 pt-20 sm:px-10 sm:pt-28">
      <h2 className="statement">Preguntas frecuentes</h2>
      <div className="mt-9 border-t border-[var(--line)]">
        {faqs.map(({ q, a }) => (
          <details key={q} className="group border-b border-[var(--line)]">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[17px] font-medium leading-snug marker:hidden">
              {q}
              <span
                aria-hidden="true"
                className="mt-1 shrink-0 text-[var(--dusk)] transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-[68ch] pb-6 text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd(faqs)) }} />
    </section>
  );
}

/** El cierre en cielo, con el botón y el precio. */
export function SeoClosing({ page, title }: { page: SeoPage; title: string }) {
  const cta = seoCta(page);
  return (
    <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
      <div className="allok-sky allok-sky-hush rounded-[26px] px-7 py-14 text-center sm:px-14 sm:py-20">
        <h2 className="hero text-balance !text-[clamp(2rem,4.6vw,3.75rem)]">{title}</h2>
        <p className="mx-auto mt-5 max-w-[620px] text-[17px] leading-relaxed text-pretty">
          {page.cta === "rei"
            ? "REI tiene los mismos planes que allok, con las etapas y el vocabulario de una corredora."
            : priceLine()}
        </p>
        <CtaLink href={cta.href} className="allok-btn allok-btn-solid mt-8">
          {cta.label}
        </CtaLink>
        {cta.note ? <p className="mono mt-4 opacity-80">{cta.note}</p> : null}
      </div>
    </section>
  );
}

/** Enlaces a las páginas hermanas, para quien todavía está comparando. */
export function SeoRelated({ current }: { current: SeoPage }) {
  const groups = [
    { title: "Comparaciones", pages: COMPARISONS, label: (p: SeoPage) => (p.kind === "comparison" ? `allok o ${p.competitor}` : "") },
    { title: "Por tipo de negocio", pages: VERTICALS, label: (p: SeoPage) => (p.kind === "vertical" ? p.sector : "") },
  ];
  return (
    <nav aria-label="Más páginas" className="mx-auto grid max-w-[1200px] gap-10 px-5 pt-20 sm:grid-cols-2 sm:px-10 sm:pt-28">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mono text-[var(--ink-60)]">{g.title}</p>
          <ul className="mt-3 border-t border-[var(--line)]">
            {g.pages
              .filter((p) => p.slug !== current.slug)
              .map((p) => (
                <li key={p.slug} className="border-b border-[var(--line)]">
                  <Link href={seoPath(p)} className="flex min-h-11 items-center justify-between gap-4 py-3 text-[15.5px]">
                    {g.label(p)}
                    <span aria-hidden="true" className="text-[var(--ink-40)]">→</span>
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
