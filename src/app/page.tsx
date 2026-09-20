import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { BRAND } from "@/lib/brand";
import { FROM_PRICE, PLANS, SETUP_SERVICE, priceLabel, registerUrl } from "@/lib/plans";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import Conversation from "@/components/allok/Conversation";
import Status, { StatusDot } from "@/components/brand/Status";

const TITLE = "allok — conecta tu WhatsApp y deja que atienda tu negocio";
const DESCRIPTION =
  "allok conecta tu WhatsApp con agentes que contestan, califican y agendan por ti. Mensualidad fija desde US$49: la cuenta es de tu empresa y Meta te cobra los mensajes al costo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const DEMO = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

const NAV = [
  { href: "#como", label: "Cómo funciona" },
  { href: "#tablero", label: "Qué vas a ver" },
  { href: "#precios", label: "Precios" },
  { href: "/vocero", label: "A medida" },
];

/** Lo que hay que hacer, y nada más. Tres pasos porque son tres de verdad. */
const STEPS = [
  {
    n: "01",
    title: "Conecta tu WhatsApp",
    body: "Tu número de siempre, en un par de minutos. La cuenta queda a nombre de tu empresa: es tuya, no nuestra.",
    aside: "Sin cambiar de número",
  },
  {
    n: "02",
    title: "Cuéntale a qué te dedicas",
    body: "Qué vendes, a qué hora atiendes y qué no debe contestar. En tus palabras — no hay nada que programar.",
    aside: "Cuatro preguntas",
  },
  {
    n: "03",
    title: "Actívalo",
    body: "Pruébalo escribiéndole tú primero. Cuando te guste cómo responde, lo pones a atender de verdad.",
    aside: "Y se apaga igual de fácil",
  },
] as const;

const FACTS = [
  "Tu número de siempre",
  "La cuenta queda a nombre de tu empresa",
  "Meta te cobra los mensajes al costo",
  "Cancelas cuando quieras",
] as const;

const SECTORS = [
  ["Clínicas y estética", "¿Cuánto sale, cuánto dura y cuándo hay hora?"],
  ["Academias y cursos", "¿Queda cupo, cuándo empieza y cómo reservo?"],
  ["Servicios legales", "¿Atienden mi caso y qué necesito llevar?"],
  ["Talleres y servicio técnico", "¿Lo reparan, cuánto tarda y cuánto cuesta?"],
  ["Turismo y hospedaje", "¿Hay disponibilidad para esas fechas?"],
  ["Ecommerce y tiendas", "¿Tienen esta talla y cuánto es el envío?"],
] as const;

/**
 * El tablero, tal como lo ve el dueño al abrir. Contesta una sola pregunta —
 * «¿está funcionando?» — y la contesta en la primera línea, con el punto de la
 * marca. Los números son un ejemplo de un día cualquiera, no datos de nadie.
 */
function Tablero() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--hair-void)] bg-[var(--void-2)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hair-void)] px-6 py-5">
        <div className="flex items-center gap-3">
          <StatusDot state="activo" size={10} />
          <span className="display-sm text-[22px]">allok activo</span>
          <span className="mono text-[var(--on-void-40)]">+58 412 ··· ····</span>
        </div>
        <Status state="atendiendo" tone="void" />
      </div>

      <dl className="grid gap-px bg-[var(--hair-void)] sm:grid-cols-4">
        {[
          ["Conversaciones", "18", null],
          ["Atendidas sola", "11", "activo"],
          ["Leads nuevos", "4", null],
          ["Requieren atención", "2", "atencion"],
        ].map(([label, value, state]) => (
          <div key={label as string} className="bg-[var(--void-2)] px-6 py-6">
            <dt className="mono text-[var(--on-void-40)]">{label}</dt>
            <dd className="display mt-2 flex items-baseline gap-2 text-[40px] leading-none tabular-nums">
              {value}
              {state ? <StatusDot state={state as "activo" | "atencion"} /> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-px bg-[var(--hair-void)]">
        {[
          ["Carla M.", "Reservó el cupo del sábado", "activo", "3:16"],
          ["Taller Sur", "Pidió un presupuesto que allok no tiene", "atencion", "2:41"],
          ["J. Pérez", "Preguntó si atienden sábados", "activo", "ayer"],
        ].map(([who, what, state, at]) => (
          <div key={who as string} className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[var(--void-2)] px-6 py-4">
            <StatusDot state={state as "activo" | "atencion"} />
            <span className="text-[15px] font-medium">{who}</span>
            <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--on-void-60)]">{what}</span>
            <span className="mono text-[var(--on-void-40)]">{at}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const fallback = whatsappUrl(DEMO);
  const connect = registerUrl("pro");

  return (
    <div className="allok">
      {/* ── Portada ─────────────────────────────────────────────────────── */}
      <div className="allok-void">
        <SiteHeader nav={NAV} cta={{ href: connect, label: "Conectar mi WhatsApp" }} />

        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-16 pt-8 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-6 lg:pb-24 lg:pt-12">
          <div>
            <p className="mono text-[var(--accent-lit)]">{BRAND.tagline}</p>
            <h1 className="hero mt-6 !text-[clamp(2.5rem,5.6vw,4.75rem)]">
              Conecta tu WhatsApp.
              <br />
              <span className="text-[var(--on-void-40)]">allok se encarga</span>
              <br />
              <span className="text-[var(--on-void-40)]">de tus clientes.</span>
            </h1>
            <p className="lede mt-7 max-w-[46ch] text-[var(--on-void-60)]">
              Contesta al instante con lo que de verdad vendes, pregunta lo que
              hay que preguntar y agenda la cita. Tú ves lo que pasó y decides
              cuándo entrar.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={connect}
                className="allok-btn bg-[var(--accent)] font-semibold text-[var(--on-accent)]"
              >
                Conectar mi WhatsApp
              </a>
              <a href={fallback} className="allok-btn allok-btn-outline">
                Probarlo como cliente
              </a>
            </div>

            <ul className="allok-hair mt-11 grid gap-x-8 gap-y-2.5 pt-7 sm:grid-cols-2">
              {FACTS.map((f) => (
                <li key={f} className="flex gap-2.5 text-[13.5px] leading-snug text-[var(--on-void-60)]">
                  <StatusDot state="activo" size={5} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="allok-bloom lg:-mr-24 lg:justify-end xl:-mr-32">
            <Conversation />
          </div>
        </div>
      </div>

      {/* ── Cómo funciona ───────────────────────────────────────────────── */}
      <section id="como" className="mx-auto max-w-[1240px] px-5 py-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
          <h2 className="statement max-w-[13ch]">Tres pasos y queda andando.</h2>
          <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
            No hay nada que instalar, ni que integrar, ni que programar. Si sabes
            explicarle tu negocio a un empleado nuevo, sabes configurar allok.
          </p>
        </div>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-[26px] bg-[var(--line)] md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="grid content-start bg-white p-8">
              <span className="mono tabular-nums text-[var(--st-activo-ink)]">{s.n}</span>
              <h3 className="display-sm mt-4 text-[clamp(1.25rem,1.8vw,1.55rem)]">{s.title}</h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{s.body}</p>
              <p className="mono mt-6 text-[var(--ink-60)]">{s.aside}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href={connect} className="allok-btn bg-[var(--ink)] font-semibold text-[var(--paper)]">
            Conectar mi WhatsApp
          </a>
          <p className="text-[14.5px] text-[var(--ink-60)]">
            7 días de prueba en Completo. Sin tarjeta para probarlo como cliente.
          </p>
        </div>
      </section>

      {/* ── Qué vas a ver ───────────────────────────────────────────────── */}
      <section id="tablero" className="allok-void">
        <div className="mx-auto max-w-[1240px] px-5 py-[clamp(72px,10vw,140px)] sm:px-10">
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
            <h2 className="statement max-w-[16ch]">
              Abres allok y en un segundo sabes si está bien.
            </h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--on-void-60)] text-pretty">
              El color es el estado. Verde: atendiendo sola. Ámbar: algo necesita
              que entres tú. No hay que leer un informe para enterarse.
            </p>
          </div>

          <div className="mt-14">
            <Tablero />
          </div>

          <p className="mono mt-6 text-[var(--on-void-40)]">
            Ejemplo de un día. No son datos de ningún cliente.
          </p>
        </div>
      </section>

      {/* ── Para quién ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 py-[clamp(72px,10vw,140px)] sm:px-10">
        <h2 className="statement max-w-[17ch]">
          Si tu negocio vive de una pregunta que se repite, ya está hecho.
        </h2>
        <dl className="mt-12">
          {SECTORS.map(([sector, question]) => (
            <div
              key={sector}
              className="allok-hair grid items-baseline gap-x-10 gap-y-1 py-5 last:border-b last:border-[var(--line)] sm:grid-cols-[minmax(0,.4fr)_minmax(0,.6fr)]"
            >
              <dt className="display-sm text-[17px]">{sector}</dt>
              <dd className="text-[15.5px] leading-relaxed text-[var(--ink-60)]">«{question}»</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
          ¿Inmobiliaria? El mismo producto con el vocabulario de una corredora se
          llama{" "}
          <Link href="/rei" className="text-[var(--ink)] underline underline-offset-4">REI</Link>. ¿Reglas
          propias o tu propio servidor? Eso es{" "}
          <Link href="/vocero" className="text-[var(--ink)] underline underline-offset-4">allok a tu medida</Link>.
        </p>
      </section>

      {/* ── Precios ─────────────────────────────────────────────────────── */}
      <section id="precios" className="mx-auto max-w-[1240px] px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)]">
          <h2 className="statement max-w-[14ch]">Precio fijo. Mensajes al costo.</h2>
          <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
            La cuenta de WhatsApp queda a nombre de tu empresa y Meta te factura
            el consumo directo, a su tarifa. Cobramos el software, no tus
            conversaciones.
          </p>
        </div>

        {/* Columnas iguales; la elegida cambia de polaridad, no de tamaño. */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] bg-[var(--line)] md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`grid content-start p-8 ${
                plan.featured ? "bg-[var(--void)] text-[var(--on-void)]" : "bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display-sm text-[19px]">{plan.name}</h3>
                {plan.featured ? (
                  <span className="mono text-[var(--st-activo)]">Más elegido</span>
                ) : null}
              </div>
              <p className="mono mt-1.5 opacity-55">{plan.kicker}</p>

              <p className="display mt-6 text-[56px] leading-none tabular-nums">
                {plan.from ? <span className="mono mr-2 align-middle opacity-55">desde</span> : null}
                <span className="align-super text-[22px]">$</span>
                {plan.price}
              </p>
              <p className="mono mt-2.5 opacity-55">{priceLabel(plan).unit}</p>
              <p className="mt-4 mb-7 text-[15px] leading-snug opacity-70">{plan.line}</p>

              <a
                href={plan.appPlan ? registerUrl(plan.appPlan) : whatsappUrl(plan.talkTo ?? DEMO)}
                className={`allok-btn w-full !py-3.5 !text-[15px] font-semibold ${
                  plan.featured
                    ? "bg-[var(--accent)] text-[var(--on-accent)]"
                    : "border border-[rgba(16,17,18,.22)] font-medium text-[var(--ink)]"
                }`}
              >
                {plan.appPlan ? "Conectar mi WhatsApp" : "Hablemos"}
              </a>
              {plan.trialDays ? (
                <p className="mono mt-3 text-center opacity-55">{plan.trialDays} días de prueba</p>
              ) : null}

              <ul className={`allok-hair mt-7 grid gap-3 pt-6 ${plan.featured ? "border-[var(--hair-void)]" : ""}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14.5px] leading-snug">
                    <span className="mt-[6px]">
                      <StatusDot state="activo" size={5} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="allok-hair mt-10 grid items-baseline gap-x-10 gap-y-3 pt-8 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h3 className="display-sm text-[17px]">
              {SETUP_SERVICE.name} · ${SETUP_SERVICE.price} una vez
            </h3>
            <p className="mt-2 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
              {SETUP_SERVICE.line} Cargamos tu agente, armamos tus etapas y
              conectamos WhatsApp con Meta de punta a punta.
            </p>
          </div>
          <a
            href={whatsappUrl(SETUP_SERVICE.talkTo)}
            className="allok-btn border border-[rgba(16,17,18,.22)] text-[var(--ink)] md:justify-self-end"
          >
            Que lo dejen andando
          </a>
        </div>
      </section>

      {/* ── Cierre ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="grid items-center gap-8 rounded-[30px] bg-[var(--void)] px-7 py-16 text-[var(--on-void)] sm:px-14 sm:py-20 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="mono text-[var(--accent-lit)]">{BRAND.tagline}</p>
            <h2 className="hero mt-5 !text-[clamp(2rem,4.4vw,3.6rem)]">{BRAND.promise}</h2>
            <p className="lede mt-5 max-w-[46ch] text-[var(--on-void-60)]">
              Desde US${FROM_PRICE} al mes. Pruébalo primero escribiéndole tú, como
              si fueras un cliente tuyo.
            </p>
          </div>
          <div className="grid gap-3 md:justify-self-end">
            <a
              href={connect}
              className="allok-btn bg-[var(--accent)] font-semibold text-[var(--on-accent)]"
            >
              Conectar mi WhatsApp
            </a>
            <a href={fallback} className="allok-btn allok-btn-outline">
              Probarlo como cliente
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
