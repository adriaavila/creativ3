import type { Metadata } from "next";
import Link from "next/link";
import { faqJsonLd, jsonLdHtml } from "@/lib/seo";
import { FROM_PRICE } from "@/lib/plans";
import { whatsappUrl } from "@/lib/contact";
import { CASOS, FEATURED_CASOS, LIVE_SYSTEMS, SOLUTIONS, casoBySlug, casosFor, type Caso } from "@/lib/casos";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import Rise from "@/components/allok/Rise";
import Reveal from "@/components/allok/Reveal";
import Screen from "@/components/allok/Screen";
import DiagnosticoForm from "@/components/allok/DiagnosticoForm";

const TITLE = "allok · optimizamos negocios con IA y software a medida";
const DESCRIPTION =
  "allok encuentra dónde pierde tiempo y dinero tu negocio y construye el sistema que lo resuelve: agentes de IA en WhatsApp, software de operación, plataformas para tus clientes y webs que venden. Proyectos con alcance y precio cerrados.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const NAV = [
  { href: "#soluciones", label: "Soluciones" },
  { href: "#casos", label: "Casos" },
  { href: "#metodo", label: "Cómo trabajamos" },
  { href: "/agente-whatsapp", label: "Agente de WhatsApp" },
];

const CTA = { href: "#diagnostico", label: "Agenda un diagnóstico" };

const SECTORS = ["Salud", "Construcción", "Educación", "Servicios", "Inmobiliaria", "Comunidades", "Consultoría", "Comercio"];

const METHOD = [
  {
    n: "01",
    name: "Diagnóstico",
    body: "Revisamos tu negocio antes de hablar y en la conversación mapeamos dónde se va el tiempo y dónde se escapa la venta.",
    out: "Sales con el mapa y la primera jugada",
  },
  {
    n: "02",
    name: "Propuesta cerrada",
    body: "Alcance, fecha y precio por escrito antes de escribir una línea de código. Lo que no está en la propuesta no te lo cobramos.",
    out: "Sin sorpresas en la factura",
  },
  {
    n: "03",
    name: "Construcción a la vista",
    body: "Diseñamos sobre tu operación real y te mostramos avances que puedes probar cada semana, no una presentación al final.",
    out: "Ves el sistema crecer",
  },
  {
    n: "04",
    name: "Lanzamiento y ajuste",
    body: "Lo soltamos con tu equipo mirando, lo ajustamos sobre uso real y lo dejamos documentado. Todo queda a tu nombre.",
    out: "Tuyo desde el primer día",
  },
] as const;

const PROMISES = [
  ["Precio cerrado", "La propuesta dice qué, cuándo y cuánto. Si algo cambia, se conversa antes, no en la factura."],
  ["Todo a tu nombre", "El código, las cuentas y los datos son de tu empresa. Si mañana te vas, te llevas todo."],
  ["Avances que se prueban", "Cada semana hay algo nuevo funcionando que puedes tocar, no un informe de avance."],
  ["IA que no inventa", "Los agentes responden con tu información real y le pasan a una persona lo que no saben."],
] as const;

const OFFERS = [
  {
    name: "Diagnóstico",
    price: "Sin costo",
    unit: "una conversación",
    line: "Para saber qué haríamos primero y cuánto costaría, antes de comprometer nada.",
    items: ["Revisión previa de tu web y tu operación", "Mapa de dónde se pierde tiempo y venta", "La primera jugada, con su orden de magnitud"],
    cta: CTA,
    featured: false,
  },
  {
    name: "Proyecto de optimización",
    price: "desde US$10.000",
    unit: "alcance y precio cerrados",
    line: "El sistema que tu negocio necesita, diseñado, construido y lanzado sobre tu operación real.",
    items: [
      "Diagnóstico profundo y propuesta por escrito",
      "Diseño y construcción con avances semanales",
      "Agentes de IA, software y web integrados",
      "Lanzamiento acompañado y documentación",
      "50% al arrancar, 50% contra entrega",
    ],
    cta: { href: "#diagnostico", label: "Empezar por el diagnóstico" },
    featured: true,
  },
  {
    name: "Operación continua",
    price: "Mensual",
    unit: "se cotiza según el sistema",
    line: "Para quien quiere que el sistema siga mejorando después del lanzamiento.",
    items: ["Mejoras y nuevas automatizaciones", "Soporte con tiempos acordados", "Revisión mensual de resultados"],
    cta: { href: whatsappUrl("Hola, vengo de allok.fun. Quiero hablar de operación continua para mi sistema."), label: "Conversarlo" },
    featured: false,
  },
] as const;

const FAQS = [
  {
    q: "¿Por qué un proyecto empieza en US$10.000?",
    a: "Porque no vendemos horas ni plantillas: vendemos un sistema que resuelve un problema de tu negocio, con diagnóstico, diseño, construcción, lanzamiento y ajuste sobre uso real. Queda a tu nombre y se paga con lo que deja de perderse. Si lo que necesitas es más chico, en el diagnóstico te lo decimos y te mandamos a la opción que te sirve.",
  },
  {
    q: "¿Cuánto tarda?",
    a: "Depende del alcance, y por eso la fecha va por escrito en la propuesta junto con el precio. Desde la primera semana ves avances que puedes probar.",
  },
  {
    q: "Ya uso otras herramientas. ¿Hay que tirarlas?",
    a: "No. Conectamos lo que ya funciona y reemplazamos solo lo que te frena. Muchas veces el trabajo es justamente que tus herramientas se hablen entre sí.",
  },
  {
    q: "¿De quién es el sistema cuando termina?",
    a: "Tuyo. El código, las cuentas (WhatsApp, dominio, servidores) y los datos quedan a nombre de tu empresa desde el primer día.",
  },
  {
    q: "¿Y si solo quiero el agente de WhatsApp?",
    a: `Para eso está allok como producto: un agente de WhatsApp con CRM desde US$${FROM_PRICE} al mes, que creas y pruebas tú mismo.`,
  },
  {
    q: "¿Trabajan con empresas de otros países?",
    a: "Sí. Trabajamos en remoto, en español y en inglés, con negocios de Latinoamérica y Norteamérica.",
  },
];

export default function Home() {
  const featured = FEATURED_CASOS.map((s) => casoBySlug(s)).filter((c): c is Caso => Boolean(c));
  const rest = CASOS.filter((c) => !(FEATURED_CASOS as readonly string[]).includes(c.slug));
  const hero = { desk: casoBySlug("vistacampo")!.cover, board: casoBySlug("soapy")!.cover, phone: casoBySlug("mistica")!.cover };

  return (
    <div className="allok">
      {/* ── Portada negra: la promesa a tamaño de cartel, y debajo, el trabajo. ── */}
      <div className="allok-void pb-[clamp(190px,24vw,330px)]">
        <SiteHeader nav={NAV} cta={CTA} />
        <div className="mx-auto max-w-[1100px] px-5 pt-10 text-center sm:px-10 sm:pt-16">
          <p className="mono text-[var(--on-void-60)]">Estudio de optimización · IA, software y operación</p>
          <h1 className="hero mt-7 text-balance !text-[clamp(2.4rem,5.8vw,5.25rem)]">
            Encontramos dónde pierde dinero tu negocio. Y construimos el sistema que lo arregla.
          </h1>
          <p className="lede mx-auto mt-7 max-w-[640px] text-pretty text-[var(--on-void-60)]">
            Agentes de IA que venden por WhatsApp, software que ordena la operación y plataformas que atienden a
            tus clientes. Proyectos con alcance y precio cerrados, desde US$10.000.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href="#diagnostico" className="allok-btn allok-btn-solid">
              Agenda un diagnóstico
            </a>
            <a href="#casos" className="allok-btn border border-[var(--hair-void)] text-[var(--on-void)]">
              Ver el trabajo
            </a>
          </div>
        </div>
      </div>

      {/* El objeto que rompe el borde: tres sistemas reales, no una ilustración. */}
      <div className="relative z-[3] -mt-[clamp(170px,22vw,310px)] overflow-x-clip px-5 sm:px-10">
        <div className="mx-auto max-w-[1180px]">
          <div className="allok-bloom">
            <div className="relative w-full">
              <Screen image={hero.desk} sizes="(min-width: 1180px) 820px, 80vw" priority className="mx-auto w-[86%] sm:w-[70%]" />
              <Screen
                image={hero.board}
                sizes="(min-width: 1180px) 420px, 36vw"
                className="absolute right-0 top-[18%] hidden w-[34%] sm:block"
              />
              <Screen
                image={hero.phone}
                sizes="(min-width: 1180px) 200px, 22vw"
                className="absolute bottom-[-8%] left-[2%] w-[24%] sm:left-[6%] sm:w-[15%]"
              />
            </div>
          </div>
        </div>
        <p className="mono mx-auto mt-[clamp(40px,6vw,72px)] max-w-[1180px] text-center text-[var(--ink-60)]">
          {LIVE_SYSTEMS} sistemas en producción ·{" "}
          {SECTORS.join(" · ")}
        </p>
      </div>

      {/* ── La frase: el problema, en una línea. ── */}
      <section className="mx-auto max-w-[1240px] px-5 pb-[clamp(56px,8vw,110px)] pt-[clamp(72px,10vw,140px)] sm:px-10">
        <Reveal className="statement max-w-[24ch]">
          La mayoría de los negocios no necesita otra herramienta. Necesita que su operación funcione como un solo
          sistema.
        </Reveal>
      </section>

      {/* ── Soluciones ── */}
      <section id="soluciones" className="mx-auto max-w-[1240px] scroll-mt-6 px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <Rise>
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
            <h2 className="display text-[clamp(30px,4vw,50px)]">Cuatro formas de hacer que tu negocio rinda más.</h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
              Casi siempre combinamos dos o tres. El diagnóstico dice por cuál empezar: la que más dinero deja
              sobre la mesa.
            </p>
          </div>
        </Rise>

        <div className="mt-12 border-t border-[var(--line)]">
          {SOLUTIONS.map((s) => (
            <Rise key={s.id}>
              <article className="grid gap-x-10 gap-y-5 border-b border-[var(--line)] py-10 md:grid-cols-[minmax(0,.42fr)_minmax(0,.58fr)]">
                <div>
                  <p className="mono tabular-nums text-[var(--dusk)]">
                    {s.n} · {s.name}
                  </p>
                  <h3 className="display-sm mt-4 text-[clamp(1.5rem,2.6vw,2.2rem)] leading-[1.1] tracking-[-0.03em]">{s.promise}</h3>
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] leading-relaxed text-[var(--ink-60)] text-pretty">{s.body}</p>
                  <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    {s.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[14.5px] leading-snug">
                        <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-[var(--ok-ink)]" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 flex flex-wrap items-center gap-x-1 gap-y-1 text-[14px] text-[var(--ink-60)]">
                    <span className="mono mr-2">Visto en</span>
                    {casosFor(s.id).map((c) => (
                      <Link
                        key={c.slug}
                        href={`/casos/${c.slug}`}
                        className="inline-flex min-h-11 items-center rounded-full px-2.5 font-medium text-[var(--ink)] underline decoration-[var(--line)] underline-offset-4 transition-[text-decoration-color] hover:decoration-[var(--ink)]"
                      >
                        {c.client}
                      </Link>
                    ))}
                  </p>
                </div>
              </article>
            </Rise>
          ))}
        </div>
      </section>

      {/* ── Casos: el trabajo, con capturas reales. ── */}
      <section id="casos" className="scroll-mt-6 bg-[var(--paper-2)] py-[clamp(72px,10vw,140px)]">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-10">
          <Rise>
            <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
              <h2 className="display text-[clamp(30px,4vw,50px)]">El trabajo, en producción.</h2>
              <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
                Capturas reales de sistemas que hoy usan negocios reales. Cada caso cuenta qué se rompía, qué
                construimos y qué cambió.
              </p>
            </div>
          </Rise>

          <div className="mt-14 grid gap-6">
            {featured.map((c, i) => (
              <Rise key={c.slug}>
                <Link
                  href={`/casos/${c.slug}`}
                  className="group grid overflow-hidden rounded-[28px] bg-white transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] active:scale-[.98] lg:grid-cols-2"
                >
                  <div className={`flex items-center justify-center bg-[var(--cloud)] p-6 sm:p-10 ${i % 2 ? "lg:order-2" : ""}`}>
                    <Screen
                      image={c.cover}
                      sizes="(min-width: 1024px) 520px, 90vw"
                      className={c.cover.kind === "mobile" ? "w-[46%] max-w-[230px]" : "w-full"}
                    />
                  </div>
                  <div className="grid content-between gap-8 p-7 sm:p-10">
                    <div>
                      <p className="mono text-[var(--ink-60)]">{c.sector}</p>
                      <h3 className="display mt-3 text-[clamp(28px,3.2vw,40px)]">{c.client}</h3>
                      <p className="mt-4 text-[clamp(1.1rem,1.5vw,1.3rem)] font-medium leading-snug tracking-[-0.01em] text-pretty">{c.headline}</p>
                      <dl className="mt-7 grid gap-4 text-[15px] leading-relaxed">
                        <div>
                          <dt className="mono text-[var(--ink-60)]">Lo que se rompía</dt>
                          <dd className="mt-1 text-[var(--ink-60)] text-pretty">{c.problem}</dd>
                        </div>
                        <div>
                          <dt className="mono text-[var(--ink-60)]">Lo que cambió</dt>
                          <dd className="mt-1 text-pretty">{c.outcome}</dd>
                        </div>
                      </dl>
                    </div>
                    <span className="mono inline-flex items-center gap-2 text-[var(--ink)]">
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

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((c) => (
              <Rise key={c.slug}>
                <Link
                  href={`/casos/${c.slug}`}
                  className="group grid h-full content-start overflow-hidden rounded-[22px] bg-white transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] active:scale-[.98]"
                >
                  <div className="bg-[var(--cloud)] p-4">
                    <Screen image={c.cover} sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" />
                  </div>
                  <div className="p-6">
                    <p className="mono text-[var(--ink-60)]">{c.sector}</p>
                    <h3 className="display-sm mt-2 text-[20px]">{c.client}</h3>
                    <p className="mt-2 text-[14.5px] leading-snug text-[var(--ink-60)] text-pretty">{c.headline}</p>
                  </div>
                </Link>
              </Rise>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/casos" className="allok-btn border border-[rgba(11,13,14,.2)] text-[var(--ink)]">
              Todos los casos
            </Link>
            <Link href="/work" className="mono inline-flex min-h-11 items-center text-[var(--ink-60)] underline underline-offset-4">
              Los {LIVE_SYSTEMS} sistemas, uno por uno ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cómo trabajamos ── */}
      <section id="metodo" className="mx-auto max-w-[1240px] scroll-mt-6 px-5 py-[clamp(72px,10vw,140px)] sm:px-10">
        <Rise>
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
            <h2 className="display text-[clamp(30px,4vw,50px)]">Del diagnóstico al sistema andando, sin sorpresas.</h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
              Un proceso pensado para que sepas en todo momento qué estás pagando, qué viene y qué ya funciona.
            </p>
          </div>
        </Rise>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-[26px] bg-[var(--line)] md:grid-cols-2 lg:grid-cols-4">
          {METHOD.map((m, i) => (
            <Rise key={m.n} delay={(i % 4) as 0 | 1 | 2 | 3} className="grid bg-white">
              <li className="grid h-full content-between gap-8 bg-white p-8">
                <div>
                  <span className="mono tabular-nums text-[var(--ok-ink)]">{m.n}</span>
                  <h3 className="display-sm mt-4 text-[clamp(1.25rem,1.8vw,1.5rem)]">{m.name}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-60)] text-pretty">{m.body}</p>
                </div>
                <p className="mono text-[var(--ink-60)]">{m.out}</p>
              </li>
            </Rise>
          ))}
        </ol>

        <dl className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(([t, d]) => (
            <div key={t} className="border-t border-[var(--line)] pt-5">
              <dt className="flex items-center gap-2.5 text-[16px] font-semibold">
                <span className="size-2 rounded-full bg-[var(--ok)]" aria-hidden="true" />
                {t}
              </dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Inversión ── */}
      <section id="inversion" className="mx-auto max-w-[1240px] scroll-mt-6 px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <Rise>
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
            <h2 className="display text-[clamp(30px,4vw,50px)]">Una inversión, no un gasto en horas.</h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
              Empieza por una conversación sin costo. Si tiene sentido, te mandamos una propuesta cerrada; si no,
              te decimos qué te conviene más.
            </p>
          </div>
        </Rise>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] bg-[var(--line)] lg:grid-cols-3">
          {OFFERS.map((o) => (
            <div
              key={o.name}
              className={`grid min-w-0 content-start p-8 ${o.featured ? "allok-on-ink bg-[var(--ink)] text-[var(--cloud)]" : "bg-white"}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="display-sm text-[19px]">{o.name}</h3>
                {o.featured ? <span className="mono text-[var(--ok)]">El corazón de allok</span> : null}
              </div>
              <p className="display mt-6 text-[clamp(34px,3.6vw,46px)] leading-none">{o.price}</p>
              <p className="mono mt-2.5 opacity-65">{o.unit}</p>
              <p className="mb-7 mt-4 text-[15px] leading-snug opacity-75">{o.line}</p>
              <a
                href={o.cta.href}
                className={`allok-btn w-full !py-3.5 !text-[15px] font-semibold ${
                  o.featured ? "bg-[var(--ok)] text-[var(--ink)]" : "border border-[rgba(11,13,14,.2)] font-medium text-[var(--ink)]"
                }`}
              >
                {o.cta.label}
              </a>
              <ul className={`allok-hair mt-7 grid gap-3 pt-6 ${o.featured ? "border-white/12" : ""}`}>
                {o.items.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14.5px] leading-snug">
                    <span className="mt-[7px] size-[5px] shrink-0 rounded-full bg-[var(--ok)]" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* El producto de autoservicio sigue a un clic: quien solo quiere el agente no se pierde. */}
        <div className="allok-hair mt-10 grid items-center gap-x-10 gap-y-4 pt-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h3 className="display-sm text-[17px]">¿Solo necesitas el agente de WhatsApp? Desde US${FROM_PRICE} al mes.</h3>
            <p className="mt-2 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
              allok también es un producto: un agente de WhatsApp con CRM que creas, pruebas y activas tú mismo, con
              7 días de prueba. Pega tu web y en 30 segundos ves cómo le contestaría a tus clientes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:justify-self-end">
            <Link href="/agente-whatsapp#tu-demo" className="allok-btn bg-[var(--ink)] font-semibold text-[var(--cloud)]">
              Arma tu demo
            </Link>
            <Link href="/agente-whatsapp" className="allok-btn border border-[rgba(11,13,14,.2)] text-[var(--ink)]">
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* ── Preguntas ── */}
      <section id="preguntas" className="mx-auto max-w-[1240px] scroll-mt-6 px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-[minmax(0,.7fr)_minmax(0,1fr)]">
          <h2 className="statement max-w-[12ch]">Lo que nos preguntan antes.</h2>
          <div className="border-t border-[var(--line)]">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group border-b border-[var(--line)]">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[17px] font-medium leading-snug [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-[20px] leading-none text-[var(--ink-40)] transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[62ch] pb-6 text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{a}</p>
              </details>
            ))}
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd(FAQS)) }} />
      </section>

      {/* ── Cierre: el diagnóstico, con el formulario a la vista. ── */}
      <section id="diagnostico" className="scroll-mt-4 px-5 pb-[clamp(56px,7vw,96px)] sm:px-10">
        <div className="allok-on-ink mx-auto grid max-w-[1240px] items-start gap-10 rounded-[30px] bg-[var(--ink)] px-4 py-12 text-[var(--cloud)] sm:px-12 sm:py-16 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-14">
          <div className="lg:sticky lg:top-10">
            <p className="mono text-[var(--on-void-60)]">Diagnóstico sin costo</p>
            <h2 className="hero mt-5 !text-[clamp(2.1rem,4.2vw,3.6rem)]">Hablemos de tu negocio.</h2>
            <p className="lede mt-6 max-w-[42ch] text-[var(--on-void-60)]">
              Cuéntanos qué te quita tiempo o dinero. Revisamos tu negocio antes de hablar, para que la primera
              conversación ya traiga ideas concretas.
            </p>
            <ul className="mt-8 grid gap-3 text-[15px]">
              {["Una conversación, sin costo ni compromiso", "El mapa de dónde se pierde venta y tiempo", "La primera jugada, con su orden de magnitud"].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-[7px] size-2 shrink-0 rounded-full bg-[var(--ok)]" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[14.5px] text-[var(--on-void-60)]">
              ¿Prefieres escribir?{" "}
              <a
                href={whatsappUrl("Hola, vengo de allok.fun. Quiero agendar un diagnóstico para mi negocio.")}
                className="font-semibold text-[var(--on-void)] underline underline-offset-4"
              >
                WhatsApp
              </a>
            </p>
          </div>
          <DiagnosticoForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
