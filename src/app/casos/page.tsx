import type { Metadata } from "next";
import Link from "next/link";
import { CASOS, LIVE_SYSTEMS, SOLUTIONS } from "@/lib/casos";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import Rise from "@/components/allok/Rise";
import Screen from "@/components/allok/Screen";

const TITLE = "Casos: sistemas que hoy usan negocios reales";
const DESCRIPTION =
  "Lo que construimos para clínicas, constructoras, escuelas, lavanderías y comunidades: qué se rompía, qué hicimos y qué cambió, con capturas reales.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/casos" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/casos", type: "website", locale: "es" },
};

const NAV = [
  { href: "/#soluciones", label: "Soluciones" },
  { href: "/#metodo", label: "Cómo trabajamos" },
  { href: "/#inversion", label: "Inversión" },
];

export default function CasosPage() {
  return (
    <div className="allok">
      <div className="allok-void pb-[clamp(56px,8vw,96px)]">
        <SiteHeader nav={NAV} cta={{ href: "/#diagnostico", label: "Agenda un diagnóstico" }} />
        <div className="mx-auto max-w-[1000px] px-5 pt-10 text-center sm:px-10 sm:pt-14">
          <p className="mono text-[var(--on-void-60)]">{LIVE_SYSTEMS} sistemas en producción</p>
          <h1 className="hero mt-6 text-balance !text-[clamp(2.4rem,6vw,5rem)]">El trabajo habla primero.</h1>
          <p className="lede mx-auto mt-6 max-w-[600px] text-pretty text-[var(--on-void-60)]">
            Cada caso cuenta qué se rompía, qué construimos y qué cambió. Las capturas son de los sistemas reales.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-[1240px] px-5 py-[clamp(56px,8vw,110px)] sm:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          {CASOS.map((c) => (
            <Rise key={c.slug}>
              <Link
                href={`/casos/${c.slug}`}
                className="group grid h-full content-start overflow-hidden rounded-[26px] bg-white ring-1 ring-[var(--line)] transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] active:scale-[.98]"
              >
                <div className="flex justify-center bg-[var(--paper-2)] p-6 sm:p-8">
                  <Screen
                    image={c.cover}
                    sizes="(min-width: 768px) 560px, 90vw"
                    className={c.cover.kind === "mobile" ? "w-[40%] max-w-[200px]" : "w-full"}
                  />
                </div>
                <div className="p-7">
                  <p className="mono text-[var(--ink-60)]">{c.sector}</p>
                  <h2 className="display mt-2 text-[clamp(24px,2.6vw,32px)]">{c.client}</h2>
                  <p className="mt-3 text-[16px] leading-snug text-pretty">{c.headline}</p>
                  <p className="mono mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[var(--ink-60)]">
                    {SOLUTIONS.filter((s) => c.solutions.includes(s.id)).map((s) => (
                      <span key={s.id}>{s.name}</span>
                    ))}
                  </p>
                  <span className="mono mt-6 inline-flex items-center gap-2">
                    Ver el caso
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </Rise>
          ))}
        </div>
        <p className="mt-10 text-[15.5px] text-[var(--ink-60)]">
          ¿Quieres ver más?{" "}
          <Link href="/work" className="text-[var(--ink)] underline underline-offset-4">
            Los {LIVE_SYSTEMS} sistemas, uno por uno
          </Link>
          .
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
