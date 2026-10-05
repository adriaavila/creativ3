import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/allok/SiteFooter";
import { Dot, SeoClosing, SeoFaq, SeoHero, SeoRelated } from "@/components/allok/SeoBlocks";
import { ALLOK_INCLUDES, COMPARISONS, COMPETITOR_PRICES_CHECKED, seoMetadata } from "@/lib/seo-pages";

/** Sólo las comparaciones que existen; cualquier otra da 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISONS.map((page) => ({ competidor: page.slug }));
}

function find(slug: string) {
  return COMPARISONS.find((page) => page.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/alternativa-a/[competidor]">): Promise<Metadata> {
  const page = find((await params).competidor);
  return page ? seoMetadata(page) : {};
}

export default async function ComparisonPage({ params }: PageProps<"/alternativa-a/[competidor]">) {
  const page = find((await params).competidor);
  if (!page) notFound();

  return (
    <div className="allok">
      <SeoHero page={page} />

      {/* La tabla rompe el borde de la portada: es el objeto de esta página. */}
      <div className="relative z-[3] -mt-[150px] px-5 sm:px-10">
        <div className="mx-auto max-w-[900px] rounded-[22px] border border-[rgba(16,17,18,.08)] bg-white p-5 shadow-[0_30px_80px_-34px_rgba(0,0,0,.45)] sm:p-8">
          <table className="w-full border-collapse text-left text-[15px] leading-snug">
            <caption className="sr-only">
              allok y {page.competitor}, lado a lado
            </caption>
            <thead>
              <tr className="grid grid-cols-2 gap-x-4 sm:table-row">
                <th scope="col" className="hidden sm:table-cell sm:w-[30%] sm:pb-4">
                  <span className="sr-only">Qué se compara</span>
                </th>
                <th scope="col" className="pb-4 sm:pr-4">
                  <span className="display-sm text-[18px]">allok</span>
                </th>
                <th scope="col" className="pb-4">
                  <span className="display-sm text-[18px] text-[var(--ink-60)]">{page.competitor}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => (
                <tr key={row.label} className="grid grid-cols-2 gap-x-4 border-t border-[var(--line)] py-3.5 sm:table-row sm:py-0">
                  <th scope="row" className="col-span-2 pb-1.5 font-normal sm:py-4 sm:pr-4 sm:align-top">
                    <span className="mono text-[var(--ink-60)]">{row.label}</span>
                  </th>
                  <td className="font-semibold sm:py-4 sm:pr-4 sm:align-top">{row.allok}</td>
                  <td className="text-[var(--ink-60)] sm:py-4 sm:align-top">{row.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mono mt-5 border-t border-[var(--line)] pt-4 text-[var(--ink-60)]">
            {COMPETITOR_PRICES_CHECKED} · Fuente:{" "}
            <a href={page.source.url} rel="nofollow noopener" className="underline underline-offset-4">
              {page.source.label}
            </a>
          </p>
        </div>
      </div>

      <section className="mx-auto grid max-w-[1200px] gap-12 px-5 pt-20 sm:px-10 sm:pt-28 md:grid-cols-2">
        <div>
          <h2 className="display text-[clamp(1.75rem,3.2vw,2.5rem)]">Lo que trae allok</h2>
          <ul className="mt-7 grid gap-3.5">
            {ALLOK_INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15.5px] leading-relaxed">
                <Dot />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="display text-[clamp(1.75rem,3.2vw,2.5rem)]">Cuándo te conviene {page.competitor}</h2>
          <ul className="mt-7 grid gap-3.5">
            {page.pickThem.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-[var(--ink-60)]">
                <span aria-hidden="true" className="mt-[8px] size-[5px] shrink-0 rounded-[2px] bg-[var(--dusk)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SeoFaq faqs={page.faqs} />
      <SeoRelated current={page} />
      <SeoClosing page={page} title="Un precio fijo, y tu WhatsApp atendido." />

      <div className="pt-20 sm:pt-28" />
      <SiteFooter />
    </div>
  );
}
