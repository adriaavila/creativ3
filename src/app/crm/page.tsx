import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { PLANS, registerUrl } from "@/lib/plans";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import Reveal from "@/components/allok/Reveal";

const TITLE = "El CRM de WhatsApp de allok — suscripción o llave en mano";
const DESCRIPTION =
  "Un agente que contesta en el WhatsApp de siempre y una bandeja donde queda todo. Desde US$49 al mes, o US$499 una vez y te lo dejamos andando. La cuenta de WhatsApp es de tu empresa.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/crm" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/crm", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/** Una sola frase de CTA, repetida. */
const CTA = "Probar el agente en WhatsApp";
const DEMO = "Hola, vengo de allok.fun. Quiero probar el agente del CRM en mi WhatsApp.";

const NAV = [
  { href: "#bandeja", label: "La bandeja" },
  { href: "#agente", label: "El agente" },
  { href: "#precios", label: "Precios" },
  { href: "/vocero", label: "A medida" },
];

/**
 * La bandeja de ejemplo. Ilustra el producto — no es la conversación de nadie.
 * El punto de estado va SIEMPRE junto a su palabra.
 */
const INBOX = [
  { name: "Marcela Ríos", preview: "¿Queda cupo para el de las 9:00?", at: "03:14", unread: true, channel: "WhatsApp" },
  { name: "Taller Andrade", preview: "Perfecto, nos vemos el jueves 👍", at: "12:40", unread: false, channel: "WhatsApp" },
  { name: "dani.arq", preview: "Vi su publicación, ¿cuánto sale?", at: "12:07", unread: false, channel: "Instagram" },
  { name: "Rosa T.", preview: "¿Hacen envíos al interior?", at: "11:52", unread: false, channel: "WhatsApp" },
] as const;

/** Las etapas son las del rubro de cada negocio; éstas son de ejemplo. */
type Column = {
  stage: string;
  count: number;
  cards: readonly (readonly [string, string])[];
  won?: boolean;
};

const BOARD: readonly Column[] = [
  { stage: "Nuevo", count: 24, cards: [["Marcela Ríos", "Anuncio · hoy"], ["dani.arq", "Instagram · hoy"]] },
  { stage: "En conversación", count: 11, cards: [["Rosa T.", "WhatsApp · ayer"], ["Luis Peña", "Anuncio · ayer"]] },
  { stage: "Agendado", count: 6, cards: [["Taller Andrade", "Jueves 15:00"]] },
  { stage: "Cliente", count: 4, cards: [["Clínica Sur", "Cerrado · 12 sep"]], won: true },
] as const;

/**
 * Los cinco estados del asistente, con los `status-*` del sistema. La palabra
 * es obligatoria: el punto solo nunca dice nada.
 */
const STATES = [
  ["Sugerencia", "#c5f04a"],
  ["Revisar antes de enviar", "#f0c04a"],
  ["Programado", "#6cc7e8"],
  ["Enviado", "#7ee0a8"],
  ["Requiere atención", "#f08a5a"],
] as const;

const SERVICE = [
  ["Cargamos tu agente", "Precios, servicios, horarios, políticas y las diez preguntas que más te repiten. Sale de lo que ya tienes escrito, no de un formulario en blanco."],
  ["Armamos tu pipeline", "Las etapas de tu rubro, no las de un ejemplo. Una clínica va Consulta → Cita → Tratamiento; un taller no."],
  ["Conectamos WhatsApp", "La autorización con Meta de punta a punta, con el número a nombre de tu empresa. Tú apruebas; nosotros hacemos el resto."],
  ["Ajustamos una semana", "Sobre conversaciones reales, no sobre pruebas. Hasta que conteste como contestarías tú."],
] as const;

export default function CrmPage() {
  const demo = whatsappUrl(DEMO);

  return (
    <div className="allok">
      {/* ── Portada. Negro, y la bandeja encendida debajo ─────────────────── */}
      <div className="allok-void pb-[170px]">
        <SiteHeader nav={NAV} cta={{ href: demo, label: "Probar el agente" }} />

        <div className="mx-auto max-w-[980px] px-5 pt-10 text-center sm:px-10 sm:pt-20">
          <p className="mono text-[var(--on-void-60)]">CRM de WhatsApp · desde US$49</p>
          <h1 className="hero mt-7">
            Tu negocio contesta.
            <br />
            Aunque no estés.
          </h1>
          <p className="lede mx-auto mt-7 max-w-[620px] text-[var(--on-void-60)]">
            El cliente escribe a las 3:14 de la mañana. El agente contesta en
            cuatro segundos con el número real — el cupo libre, la fecha, el
            precio — y la conversación queda en una bandeja que tu equipo ve.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={demo} className="allok-btn allok-btn-solid">
              {CTA}
            </a>
            <Link href="#precios" className="allok-btn border border-[var(--hair-void)] text-[var(--on-void)]">
              Ver planes →
            </Link>
          </div>
        </div>
      </div>

      {/* ── El objeto rompe el borde de la portada: la bandeja, que es el
             producto corriendo. El `pb` de arriba y este `-mt` se mueven
             juntos, con 20px de respiro. ── */}
      <div className="relative z-[3] px-5 sm:px-10" id="bandeja">
        <div className="mx-auto -mt-[150px] max-w-[760px] rounded-[20px] border border-[rgba(16,17,18,.08)] bg-white p-4 shadow-[0_30px_80px_-34px_rgba(0,0,0,.45)] sm:p-6">
          <p className="mono text-[var(--ink-40)]">Bandeja · 3:14 de la madrugada</p>

          <ul className="mt-4 grid gap-1">
            {INBOX.map((c) => (
              <li
                key={c.name}
                className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 ${
                  c.unread ? "bg-[var(--paper-2)]" : ""
                }`}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--paper-2)] text-[12px] font-medium text-[var(--ink-60)]">
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className={`truncate text-[14px] ${c.unread ? "font-semibold" : "font-medium"}`}>
                      {c.name}
                    </span>
                    {c.unread ? (
                      <span className="size-2 shrink-0 rounded-full bg-[#c5f04a]" aria-hidden />
                    ) : null}
                  </span>
                  <span className="block truncate text-[12px] text-[var(--ink-60)]">{c.preview}</span>
                </span>
                <span className="mono shrink-0 tabular-nums text-[var(--ink-40)]">{c.at}</span>
              </li>
            ))}
          </ul>

          <p className="allok-hair mt-4 pt-3.5 text-[13.5px] leading-snug text-[var(--ink-60)]">
            Los mensajes son un ejemplo, no la conversación de ningún cliente.
            El punto verde marca lo que nadie ha leído todavía.
          </p>
        </div>
      </div>

      {/* ── 01 · El agente. Un objeto: lo que propone, con su estado ─────── */}
      <section id="agente" className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-center">
          <div>
            <p className="mono text-[var(--dusk)]">01 · El agente</p>
            <h2 className="statement mt-5">
              Propone la respuesta.
              <br />
              Tú decides si sale.
            </h2>
            <p className="lede mt-6 max-w-[520px] text-[var(--ink-60)]">
              Responde con la información real de tu negocio y sólo con lo que
              sabe: cuando no sabe, lo dice y te pasa la conversación. Nada se
              envía solo — cada mensaje del agente lleva escrito en qué estado
              está.
            </p>
            <p className="mt-5 max-w-[520px] text-[15px] text-[var(--ink-40)]">
              (y sí, los mensajes te los cobra Meta, no nosotros)
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={demo} className="allok-btn allok-btn-solid">
                {CTA}
              </a>
            </div>
          </div>

          {/* El asistente corre sobre void dentro de la app, y el verde `assist`
              nunca es tinta sobre papel: la tarjeta se enseña como se ve de
              verdad, no repintada. */}
          <div className="rounded-[20px] bg-[var(--void)] p-4 text-[var(--on-void)] sm:p-6">
            <div className="rounded-[12px] border border-[var(--hair-void)] bg-[var(--void-2)] p-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] leading-none text-[#c5f04a]" aria-hidden>✦</span>
                <span className="text-[12px] font-medium text-[var(--on-void-60)]">Asistente</span>
                <span className="ml-auto rounded-[8px] bg-[rgba(240,192,74,.18)] px-2 py-0.5 text-[12px] font-medium text-[#f0c04a]">
                  Revisar antes de enviar
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-[1.6]">
                Sí — quedan 4 cupos en el de 9:00 y 2 en el de 11:30. Son 8
                clases y empiezan el 4 de octubre.
              </p>
            </div>

            <ul className="mt-5 grid gap-2.5 border-t border-[var(--hair-void)] pt-5 text-[14px] text-[var(--on-void-60)]">
              {STATES.map(([label, color]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13.5px] leading-snug text-[var(--on-void-40)]">
              Los cinco estados que puede tener un mensaje del agente. Siempre
              en palabra, nunca sólo un color.
            </p>
          </div>
        </div>
      </section>

      {/* ── 02 · El tablero ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="max-w-[640px]">
          <p className="mono text-[var(--dusk)]">02 · El tablero</p>
          <h2 className="statement mt-5">Deja de vivir en el teléfono de una persona.</h2>
          <p className="lede mt-6 text-[var(--ink-60)]">
            Cada conversación entra al tablero con su ficha, su etapa y su
            próximo paso. Las etapas son las de tu rubro, no las de un ejemplo.
          </p>
        </div>

        <div className="mt-11 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BOARD.map((col) => (
            <div
              key={col.stage}
              className={`rounded-[12px] p-2.5 ${col.won ? "bg-[#e3efe7]" : "bg-[var(--paper-2)]"}`}
            >
              <div className="flex items-center justify-between px-1.5 py-1">
                <span className="text-[12.5px] font-semibold">{col.stage}</span>
                <span
                  className={`mono rounded-[6px] px-1.5 py-0.5 tabular-nums ${
                    col.won ? "text-[#14663a]" : "text-[var(--ink-60)]"
                  }`}
                >
                  {col.count}
                </span>
              </div>
              <div className="mt-1.5 grid gap-1.5">
                {col.cards.map(([name, meta]) => (
                  <div key={name} className="rounded-[10px] border border-[rgba(16,17,18,.07)] bg-white px-2.5 py-2">
                    <p className="text-[13px] font-medium">{name}</p>
                    <p className="mt-0.5 text-[11.5px] text-[var(--ink-60)]">{meta}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13.5px] text-[var(--ink-40)]">
          Tablero de ejemplo. Los conteos de un tablero vivo salen de tus datos.
        </p>
      </section>

      {/* ── 03 · Precios. Salen de PLANS, nunca escritos a mano ──────────── */}
      <section id="precios" className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="max-w-[640px]">
          <p className="mono text-[var(--dusk)]">03 · Precios</p>
          <h2 className="statement mt-5">Lo empiezas hoy, o te lo dejamos andando.</h2>
          <p className="lede mt-6 text-[var(--ink-60)]">
            allok cobra el software, no las conversaciones. La cuenta de
            WhatsApp queda a nombre de tu empresa y Meta te factura el consumo
            directo, a su tarifa.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`grid content-start rounded-[22px] p-7 ${
                plan.featured
                  ? "bg-[var(--void)] text-[var(--on-void)]"
                  : "border border-[var(--line)] bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display-sm text-[19px]">{plan.name}</h3>
                {plan.featured ? <span className="mono text-[var(--lit-dawn)]">Más elegido</span> : null}
              </div>

              <p className="display mt-5 text-[44px] leading-none tabular-nums">
                <span className="align-super text-[20px]">$</span>
                {plan.price}
              </p>
              <p className="mono mt-2.5 opacity-55">
                {plan.period ? "USD por mes" : "USD pago único"}
              </p>
              <p className="mt-4 mb-7 text-[15px] leading-snug opacity-70">{plan.line}</p>

              <a
                href={
                  plan.appPlan
                    ? registerUrl(plan.appPlan)
                    : whatsappUrl(
                        `Hola, vengo de allok.fun. Quiero la implementación de allok (US$${plan.price}).`,
                      )
                }
                className={`allok-btn w-full !py-3.5 !text-[15px] ${
                  plan.featured
                    ? "allok-btn-sky"
                    : "border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
                }`}
              >
                {plan.appPlan ? `Empezar con ${plan.name}` : "Hablemos"}
              </a>
              {plan.trialDays ? (
                <p className="mono mt-3 text-center opacity-55">
                  {plan.trialDays} días de prueba
                </p>
              ) : null}

              <ul
                className={`allok-hair mt-7 grid gap-3 pt-6 ${plan.featured ? "border-[var(--hair-void)]" : ""}`}
              >
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 text-[14.5px] leading-snug">
                    <span className={plan.featured ? "text-[var(--lit-dawn)]" : "text-[var(--dusk)]"}>→</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── 04 · El servicio. La otra mitad de la oferta ─────────────────── */}
      <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="max-w-[640px]">
          <p className="mono text-[var(--dusk)]">04 · La implementación</p>
          <h2 className="statement mt-5">Cuatro pasos, y ya está contestando.</h2>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICE.map(([title, body], i) => (
            <div key={title} className="allok-hair border-t-0 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
              <p className="mono text-[var(--dusk)] tabular-nums">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="display-sm mt-3 text-[20px]">{title}</h3>
              <p className="mt-2.5 text-[15px] leading-snug text-[var(--ink-60)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── La frase que se enciende al bajar. Una sola por página. ──────── */}
      <section className="mx-auto max-w-[900px] px-5 pt-24 sm:px-10 sm:pt-32">
        <Reveal className="statement">
          El cliente no espera a que abras. Escribe, y alguien tiene que estar.
        </Reveal>
      </section>

      {/* ── Cierre. El cielo vuelve, una vez ─────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="allok-sky rounded-[26px] px-7 py-20 text-center sm:px-16 sm:py-28">
          <h2 className="hero !text-[clamp(2.25rem,5.2vw,4.25rem)]">
            Pruébalo con tu propia pregunta.
          </h2>
          <p className="lede mx-auto mt-6 max-w-[540px] opacity-85">
            Escríbele al número de allok como si fueras un cliente tuyo. En
            treinta segundos vas a ver lo que tu negocio podría contestar solo.
          </p>
          <a href={demo} className="allok-btn allok-btn-solid mt-9">
            {CTA}
          </a>
        </div>
      </section>

      <div className="pt-24 sm:pt-32" />
      <SiteFooter />
    </div>
  );
}
