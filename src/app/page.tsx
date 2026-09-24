import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { BRAND, STATES } from "@/lib/brand";
import { FROM_PRICE, PLANS, SETUP_SERVICE, planCta, priceLabel } from "@/lib/plans";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import Conversation from "@/components/allok/Conversation";
import ControlCenter from "@/components/allok/ControlCenter";
import Rise from "@/components/allok/Rise";
import AllokLogo from "@/components/brand/AllokLogo";
import OkDot from "@/components/brand/OkDot";
import NightOrbit from "@/components/allok/NightOrbit";
import { CloseMark, NightSky, NightTicker, StepGlyph } from "@/components/allok/Ambient";

const TITLE = "allok — tu negocio sigue funcionando";
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
const START = "Hola, vengo de allok.fun. Quiero un agente de WhatsApp para mi negocio.";

const NAV = [
  { href: "#control", label: "El sistema" },
  { href: "#como", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "/vocero", label: "A medida" },
];

const STEPS = [
  {
    n: "01",
    title: "Hablamos 15 minutos",
    body: "Por WhatsApp. Nos cuentas qué vendes, a qué hora atiendes y qué no debe contestar, y te decimos qué plan te sirve.",
    aside: "Sin compromiso",
  },
  {
    n: "02",
    title: "Lo dejamos andando",
    body: "Conectamos tu número de siempre y cargamos tu agente con tus precios y servicios. La cuenta queda a nombre de tu empresa: es tuya, no nuestra.",
    aside: "Sin cambiar de número",
  },
  {
    n: "03",
    title: "Actívalo",
    body: "Pruébalo escribiéndole tú primero. Cuando te guste cómo responde, lo pones a atender de verdad.",
    aside: "Y se apaga igual de fácil",
  },
] as const;

const SECTORS = [
  ["Clínicas y estética", "¿Cuánto sale, cuánto dura y cuándo hay hora?"],
  ["Academias y cursos", "¿Queda cupo, cuándo empieza y cómo reservo?"],
  ["Servicios legales", "¿Atienden mi caso y qué necesito llevar?"],
  ["Talleres y servicio técnico", "¿Lo reparan, cuánto tarda y cuánto cuesta?"],
  ["Turismo y hospedaje", "¿Hay disponibilidad para esas fechas?"],
  ["Ecommerce y tiendas", "¿Tienen esta talla y cuánto es el envío?"],
] as const;

export default function Home() {
  const fallback = whatsappUrl(DEMO);
  const connect = whatsappUrl(START);

  return (
    <div className="allok">
      {/* ── Portada en Cloud. El logotipo a tamaño de cartel, y el punto vivo:
             la marca es lo primero que se ve y ya está diciendo el estado. ── */}
      <div className="overflow-x-clip bg-[var(--cloud)]">
        <SiteHeader nav={NAV} cta={{ href: connect, label: "Quiero mi agente" }} onCloud />

        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-14 pt-6 sm:px-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,.98fr)] lg:gap-8 lg:pb-20 lg:pt-10">
          <div>
            <AllokLogo variant="wordmark" state="activo" size={112} live className="!text-[clamp(64px,9vw,112px)]" />
            <p className="mono mt-6 text-[var(--ink-60)]">{BRAND.positioning}</p>

            {/* La estructura del anuncio: tres líneas, y la tercera es la marca. */}
            <div className="mt-10 font-display text-[clamp(1.75rem,3.4vw,2.6rem)] font-bold leading-[1.12] tracking-[-0.04em]">
              <p>Te fuiste a dormir.</p>
              <p className="text-[var(--ink-40)]">Tu WhatsApp no.</p>
              <p className="mt-1 flex items-center gap-2.5">
                <OkDot state="activo" size={17} />
                <span>all ok</span>
              </p>
            </div>

            <p className="lede mt-8 max-w-[44ch] text-[var(--ink-60)]">
              allok contesta con lo que de verdad vendes, pregunta lo que hay que
              preguntar y agenda la cita. Tú ves lo que pasó y decides cuándo entrar.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a href={connect} className="allok-btn bg-[var(--ink)] font-semibold text-[var(--cloud)]">
                Quiero mi agente
              </a>
              <a
                href={fallback}
                className="allok-btn border border-[rgba(11,13,14,.2)] text-[var(--ink)]"
              >
                Probarlo como cliente
              </a>
            </div>
          </div>

          {/* Los mensajes de la noche orbitan el teléfono: entran ámbar, salen verdes. */}
          <div className="relative flex justify-center">
            <NightOrbit className="absolute left-1/2 top-1/2 hidden w-[640px] max-w-none xl:w-[740px] -translate-x-1/2 -translate-y-1/2 sm:block" />
            <Rise delay={1} className="relative w-full max-w-[320px]">
              <Conversation />
            </Rise>
          </div>
        </div>
      </div>

      {/* ── El sistema es la estética. Nada de ilustraciones. ─────────────── */}
      <section id="control" className="bg-[var(--ink)] text-[var(--cloud)]">
        {/* La noche que pasó: las preguntas llegaron igual. */}
        <div className="pt-[clamp(56px,7vw,96px)]" aria-hidden="true">
          <p className="mono mx-auto max-w-[1240px] px-5 text-[var(--on-void-60)] sm:px-10">Mientras dormías</p>
          <div className="mt-5">
            <NightTicker />
          </div>
        </div>
        <div className="mx-auto max-w-[1240px] px-5 py-[clamp(72px,10vw,140px)] sm:px-10">
          <Rise>
            <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.66fr)]">
              <h2 className="statement max-w-[15ch]">Abres allok y ya sabes si está bien.</h2>
              <p className="text-[15.5px] leading-relaxed text-white/55 text-pretty">
                El color es el estado, no adorno. Verde: atendido. Azul: trabajando
                ahora. Ámbar: algo necesita que entres tú. No hay informe que leer.
              </p>
            </div>
          </Rise>

          <Rise delay={1} className="mt-14">
            <ControlCenter />
          </Rise>

          <Rise delay={2}>
            <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              {(["activo", "atendiendo", "atencion", "pausado"] as const).map((k) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="mt-[7px] size-2.5 shrink-0 rounded-full" style={{ background: STATES[k].dot }} />
                  <span>
                    <span className="block text-[15px] font-semibold">{STATES[k].label}</span>
                    <span className="mono mt-1 block text-[var(--on-void-60)]">
                      {{ activo: "Atendido solo", atendiendo: "Hay conversación viva", atencion: "Te toca a ti", pausado: "Apagado a propósito" }[k]}
                    </span>
                  </span>
                </div>
              ))}
            </dl>
          </Rise>
        </div>
      </section>

      {/* ── Cómo funciona ───────────────────────────────────────────────── */}
      <section id="como" className="mx-auto max-w-[1240px] px-5 py-[clamp(72px,10vw,140px)] sm:px-10">
        <Rise>
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
            <h2 className="statement max-w-[13ch]">Tres pasos y queda andando.</h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
              No instalas nada ni programas nada. Nos explicas tu negocio como a un
              empleado nuevo y nosotros hacemos el resto.
            </p>
          </div>
        </Rise>

        <ol className="mt-14 grid gap-px overflow-hidden rounded-[26px] bg-[var(--line)] md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Rise key={s.n} delay={(i as 0 | 1 | 2)} className="grid bg-white">
              <li className="grid content-start p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="mono tabular-nums text-[var(--ok-ink)]">{s.n}</span>
                  <StepGlyph step={(i + 1) as 1 | 2 | 3} className="-mt-1 h-14 w-auto" />
                </div>
                <h3 className="display-sm mt-4 text-[clamp(1.25rem,1.8vw,1.55rem)]">{s.title}</h3>
                <p className="mt-3 text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{s.body}</p>
                <p className="mono mt-6 text-[var(--ink-60)]">{s.aside}</p>
              </li>
            </Rise>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href={connect} className="allok-btn bg-[var(--ink)] font-semibold text-[var(--cloud)]">
            Quiero mi agente
          </a>
          <p className="text-[14.5px] text-[var(--ink-60)]">
            Antes, si quieres, pruébalo como cliente. No pide tarjeta.
          </p>
        </div>
      </section>

      {/* ── Para quién ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <Rise>
          <h2 className="statement max-w-[17ch]">
            Si tu negocio vive de una pregunta que se repite, ya está hecho.
          </h2>
        </Rise>
        <dl className="mt-12">
          {SECTORS.map(([sector, question]) => (
            <div
              key={sector}
              className="allok-hair allok-close-row grid items-baseline gap-x-10 gap-y-1 py-5 last:border-b last:border-[var(--line)] sm:grid-cols-[minmax(0,.4fr)_minmax(0,.6fr)]"
            >
              <dt className="display-sm text-[17px]">
                <CloseMark className="mr-3 inline-block size-[18px] align-[-3px] text-[var(--ink-40)]" />
                {sector}
              </dt>
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
        <Rise>
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)]">
            <h2 className="statement max-w-[14ch]">Precio fijo. Mensajes al costo.</h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
              La cuenta de WhatsApp queda a nombre de tu empresa y Meta te factura
              el consumo directo, a su tarifa. Cobramos el software, no tus
              conversaciones.
            </p>
          </div>
        </Rise>

        {/* Columnas iguales; la elegida cambia de polaridad, no de tamaño. */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] bg-[var(--line)] md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`grid content-start p-8 ${
                plan.featured ? "allok-on-ink bg-[var(--ink)] text-[var(--cloud)]" : "bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display-sm text-[19px]">{plan.name}</h3>
                {plan.featured ? <span className="mono text-[var(--ok)]">Más elegido</span> : null}
              </div>
              <p className="mono mt-1.5 opacity-65">{plan.kicker}</p>

              <p className="display mt-6 text-[56px] leading-none tabular-nums">
                {plan.from ? <span className="mono mr-2 align-middle opacity-65">desde</span> : null}
                <span className="align-super text-[22px]">$</span>
                {plan.price}
              </p>
              <p className="mono mt-2.5 opacity-65">{priceLabel(plan).unit}</p>
              <p className="mt-4 mb-7 text-[15px] leading-snug opacity-70">{plan.line}</p>

              <a
                href={planCta(plan).href}
                className={`allok-btn w-full !py-3.5 !text-[15px] font-semibold ${
                  plan.featured
                    ? "bg-[var(--ok)] text-[var(--ink)]"
                    : "border border-[rgba(11,13,14,.2)] font-medium text-[var(--ink)]"
                }`}
              >
                {planCta(plan).label}
              </a>
              {plan.trialDays ? (
                <p className="mono mt-3 text-center opacity-65">{plan.trialDays} días de prueba</p>
              ) : null}

              <ul className={`allok-hair mt-7 grid gap-3 pt-6 ${plan.featured ? "border-white/12" : ""}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14.5px] leading-snug">
                    <span
                      className="mt-[7px] size-[5px] shrink-0 rounded-full"
                      style={{ background: STATES.activo.dot }}
                      aria-hidden="true"
                    />
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
            className="allok-btn border border-[rgba(11,13,14,.2)] text-[var(--ink)] md:justify-self-end"
          >
            Que lo dejen andando
          </a>
        </div>
      </section>

      {/* ── Cierre: la marca cerrando la frase ──────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 pb-[clamp(72px,10vw,140px)] sm:px-10">
        <Rise>
          <div className="allok-on-ink allok-dawn-host relative isolate grid items-center gap-10 overflow-hidden rounded-[30px] bg-[var(--ink)] px-7 py-16 text-[var(--cloud)] sm:px-14 sm:py-20 md:grid-cols-[minmax(0,1fr)_auto]">
            <NightSky />
            {/* Sobre las estrellas el texto va en gris opaco (el white/55 de
                antes, ya mezclado sobre --ink, 6,3:1): uno translúcido deja
                ver la estrella a través de la letra. Por lo mismo el botón
                de borde lleva fondo. */}
            <div className="relative">
              <h2 className="hero !text-[clamp(2rem,4.4vw,3.6rem)]">{BRAND.promise}</h2>
              <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15.5px] text-[#919292]">
                {BRAND.voice.map((line) => (
                  <span key={line} className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full" style={{ background: STATES.activo.dot }} aria-hidden="true" />
                    {line}
                  </span>
                ))}
              </p>
              <p className="lede mt-6 max-w-[44ch] text-[#919292]">
                Desde US${FROM_PRICE} al mes. Pruébalo primero escribiéndole tú, como
                si fueras un cliente tuyo.
              </p>
            </div>
            <div className="relative grid gap-3 md:justify-self-end">
              <a href={connect} className="allok-btn bg-[var(--ok)] font-semibold text-[var(--ink)]">
                Quiero mi agente
              </a>
              <a href={fallback} className="allok-btn border border-white/25 bg-[var(--ink)] text-[var(--cloud)]">
                Probarlo como cliente
              </a>
            </div>
          </div>
        </Rise>
      </section>

      <SiteFooter />
    </div>
  );
}
