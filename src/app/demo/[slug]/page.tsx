import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DemoChat from "@/components/allok/DemoChat";
import DemoCta from "@/components/allok/DemoCta";
import { Lockup } from "@/components/allok/Marks";
import { Dot } from "@/components/allok/SeoBlocks";
import SiteFooter from "@/components/allok/SiteFooter";
import { demoCta, greeting, sectorKind, suggestedQuestions } from "@/lib/demo-agent";
import { getDemoAgent } from "@/lib/demo-db";
import { FROM_PRICE } from "@/lib/plans";
import { CONTACT_EMAIL } from "@/lib/contact";

/**
 * `/demo/<slug>`: la pieza central de la prospección en frío. Una demo por
 * negocio, cargada con `scripts/demo-build.ts`. Fuera del sitemap y del
 * índice: es un enlace que se manda, no una página que se busca.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/demo/[slug]">): Promise<Metadata> {
  const agent = await getDemoAgent((await params).slug);
  const robots = { index: false, follow: false, googleBot: { index: false, follow: false } };
  if (!agent) return { title: "Demo no encontrada", robots };
  const title = `Así contestaría el WhatsApp de ${agent.businessName}`;
  const description = `Un agente que ya conoce ${agent.businessName}, armado por allok con su web pública. Escríbale.`;
  return {
    title,
    description,
    robots,
    openGraph: { title, description, url: `/demo/${agent.slug}`, type: "website", siteName: "allok" },
    twitter: { card: "summary_large_image", title, description },
  };
}

const WHO = { clinica: "un paciente", academia: "un alumno", otro: "un cliente" } as const;

export default async function DemoPage({ params, searchParams }: PageProps<"/demo/[slug]">) {
  const agent = await getDemoAgent((await params).slug);
  if (!agent) notFound();
  // `?tuya=1`: la armó el propio dueño desde «Arma tu demo» del sitio. Le hablamos de tú y a él.
  const own = (await searchParams).tuya === "1";

  const kind = sectorKind(agent.sector);
  const cta = demoCta(agent.slug, agent.businessName, { own });
  const suggestions = suggestedQuestions(agent.profile, agent.sector);
  const knows = [
    agent.profile.services.length > 0 && "servicios",
    agent.profile.services.some((s) => s.price) && "precios",
    agent.profile.hours.length > 0 && "horarios",
    agent.profile.address && "dirección",
  ].filter(Boolean) as string[];

  return (
    <div className="allok">
      <div className="allok-void pb-14 sm:pb-20">
        <header className="flex items-center justify-between px-5 py-5 sm:px-10">
          {/* No a `/`: la portada vende proyectos de estudio; quien llega de una demo busca el agente. */}
          <Link href="/agente-whatsapp" aria-label="allok, el agente de WhatsApp" className="inline-flex min-h-11 min-w-11 items-center">
            <Lockup live />
          </Link>
          <span className="mono rounded-full border border-[var(--hair-void)] px-3 py-1.5 text-[var(--on-void-60)]">Demo</span>
        </header>

        <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(0,1fr)] gap-8 px-4 pt-4 sm:px-10 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-x-16 lg:gap-y-10">
          <div className="px-1 text-center lg:px-0 lg:pt-10 lg:text-left">
            <p className="mono text-[var(--on-void-60)]">
              {own ? `Tu demo de ${agent.businessName}` : `Demo hecha por allok para ${agent.businessName}`}
            </p>
            <h1 className="hero mt-5 text-balance !text-[clamp(2rem,5.4vw,4.4rem)]">
              Así contestaría el WhatsApp de {agent.businessName}.
            </h1>
            {own ? (
              <p className="lede mx-auto mt-5 max-w-[560px] text-pretty text-[var(--on-void-60)] lg:mx-0">
                Tu agente ya leyó tu web{knows.length ? ` (${listJoin(knows)})` : ""}. Escríbele como lo haría {WHO[kind]}: lo que tu
                web no dice, no lo inventa.
              </p>
            ) : (
              <p className="lede mx-auto mt-5 max-w-[560px] text-pretty text-[var(--on-void-60)] lg:mx-0">
                Le enseñamos a un agente lo que dice su web
                {knows.length ? ` (${listJoin(knows)})` : ""}. Escríbale como lo haría {WHO[kind]}.
              </p>
            )}
          </div>

          <div className="min-w-0 lg:row-span-2">
            <DemoChat
              slug={agent.slug}
              businessName={agent.businessName}
              greeting={greeting(agent)}
              suggestions={suggestions}
              website={agent.website}
            />
          </div>

          <div className="rounded-[22px] border border-[var(--hair-void)] p-6 text-left sm:p-8 lg:self-start">
            <h2 className="display-sm text-[clamp(1.35rem,2.2vw,1.75rem)] leading-tight">
              {own ? "¿Lo quieres en tu WhatsApp?" : "¿Le gustaría que su WhatsApp contestara así?"}
            </h2>
            <ul className="mt-5 grid gap-2.5 text-[15.5px] text-[var(--on-void-60)]">
              {(own
                ? [
                    "Al crear tu cuenta, tu agente ya trae lo que leyó de tu web. Solo lo revisas.",
                    "Lo pruebas todo lo que quieras antes de conectar tu número.",
                    "Tu número de siempre, y cada conversación queda en una bandeja.",
                  ]
                : [
                    "Su número de siempre, sin cambiar nada.",
                    "Contesta con lo que usted le enseñe, y lo prueba antes de soltarlo con clientes reales.",
                    "Cada conversación queda en una bandeja, con la ficha del cliente.",
                  ]
              ).map((line) => (
                <li key={line} className="flex gap-3">
                  <Dot />
                  <span className="text-pretty">{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <DemoCta slug={agent.slug} href={cta.href} label={cta.label} />
            </div>
            <p className="mt-3 text-[13.5px] text-[var(--on-void-40)]">Desde US${FROM_PRICE} al mes.</p>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-[760px] px-5 py-12 text-[14px] leading-relaxed text-[var(--ink-60)] sm:px-10">
        {own ? (
          <p className="text-pretty">
            Esta demo no está conectada a ningún WhatsApp: nadie más que tú le escribe. Si algo está mal o quieres que la borremos,
            escríbenos a{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        ) : (
        <p className="text-pretty">
          Esta demo no es de {agent.businessName} ni está conectada a su WhatsApp. allok la armó con la información pública de
          {agent.website ? (
            <>
              {" "}
              <a href={agent.website} rel="nofollow noopener" target="_blank" className="underline underline-offset-2">
                su sitio web
              </a>
            </>
          ) : (
            " su sitio web"
          )}
          ; lo que no aparece ahí, el agente no lo inventa: dice que lo confirma con el equipo. Si algo está mal o quiere que la
          retiremos, escríbanos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}
