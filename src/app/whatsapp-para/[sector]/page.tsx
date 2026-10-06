import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/allok/SiteFooter";
import { CloseMark } from "@/components/allok/Ambient";
import { SeoClosing, SeoFaq, SeoHero, SeoRelated } from "@/components/allok/SeoBlocks";
import { VERTICALS, seoMetadata } from "@/lib/seo-pages";

/** Sólo los sectores que existen; cualquier otro da 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return VERTICALS.map((page) => ({ sector: page.slug }));
}

function find(slug: string) {
  return VERTICALS.find((page) => page.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/whatsapp-para/[sector]">): Promise<Metadata> {
  const page = find((await params).sector);
  return page ? seoMetadata(page) : {};
}

export default async function VerticalPage({ params }: PageProps<"/whatsapp-para/[sector]">) {
  const page = find((await params).sector);
  if (!page) notFound();

  return (
    <div className="allok">
      <SeoHero page={page} />

      {/* El hilo de ejemplo rompe el borde de la portada. Rotulado: no es de nadie. */}
      <div className="relative z-[3] -mt-[150px] px-5 sm:px-10">
        <div className="mx-auto max-w-[620px] rounded-[20px] border border-[rgba(16,17,18,.08)] bg-white p-4 shadow-[0_30px_80px_-34px_rgba(0,0,0,.45)] sm:p-6">
          <p className="mono mb-4 text-[var(--ink-60)]">Conversación de ejemplo · no es de un cliente real</p>
          <div className="grid gap-2.5">
            {page.example.map((m) => (
              <p
                key={m.text}
                className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[14.5px] leading-snug text-[var(--ink)] ${
                  m.from === "allok" ? "justify-self-end bg-[#E7F3EC]" : "justify-self-start bg-[var(--paper-2)]"
                }`}
              >
                <span className="sr-only">{m.from === "allok" ? "allok: " : "Cliente: "}</span>
                {m.text}
              </p>
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <h2 className="statement max-w-[18ch]">Las preguntas que llegan todos los días</h2>
        <ul className="mt-10">
          {page.questions.map((q) => (
            <li
              key={q}
              className="allok-hair allok-close-row flex items-baseline gap-3 py-4 text-[16.5px] last:border-b last:border-[var(--line)]"
            >
              <CloseMark className="inline-block size-[18px] shrink-0 translate-y-[3px] text-[var(--ink-40)]" />
              «{q}»
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <h2 className="statement max-w-[18ch]">Lo que hace allok</h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-[26px] bg-[var(--line)] sm:grid-cols-2">
          {page.does.map((d) => (
            <div key={d.title} className="min-w-0 bg-white p-7 sm:p-8">
              <h3 className="display-sm text-[clamp(1.2rem,1.7vw,1.45rem)]">{d.title}</h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{d.body}</p>
            </div>
          ))}
        </div>
      </section>

      <SeoFaq faqs={page.faqs} />
      <SeoRelated current={page} />
      <SeoClosing
        page={page}
        title={page.cta === "rei" ? "Tu corredora, atendida en WhatsApp." : "Tu WhatsApp, atendido mientras trabajas."}
      />

      <div className="pt-20 sm:pt-28" />
      <SiteFooter />
    </div>
  );
}
