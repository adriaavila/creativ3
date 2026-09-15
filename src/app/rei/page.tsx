import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { PLANS } from "@/lib/rei-pricing";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import MetaCostCalculator from "@/components/rei/MetaCostCalculator";

const TITLE = "REI — el CRM de WhatsApp que no te cobra por conversación";
const DESCRIPTION =
  "REI responde, califica y agenda las consultas de WhatsApp de una corredora. Mensualidad fija: la cuenta de WhatsApp es de tu empresa y Meta te cobra los mensajes directo, a su tarifa.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/rei" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/rei", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const DEMO_MESSAGE =
  "Hola, vengo de allok.fun. Quiero probar REI para mi inmobiliaria.";

const STEPS = [
  ["Responde", "Contesta en segundos con la ficha real de la propiedad, a cualquier hora y en tu número de siempre."],
  ["Califica", "Pregunta presupuesto, zona, plazo y crédito. Marca quién merece una llamada hoy y quién no."],
  ["Agenda", "Ofrece los bloques libres del asesor a cargo de esa propiedad y confirma la visita."],
] as const;

// Un tablero de ejemplo, con las etapas de una corredora. Es una ilustración
// del producto — no son datos de ningún cliente.
const BOARD = [
  { stage: "Nuevo", count: 12, cards: [["Lucía Paredes", "Depto 3D · Providencia"], ["Rodrigo Sáez", "Depto 2D · Ñuñoa"]] },
  { stage: "Calificado", count: 7, cards: [["Carlos Martínez", "Crédito ok · 60 días"], ["María Tapia", "Casa 4D · La Reina"]] },
  { stage: "Visita agendada", count: 5, cards: [["Javier Fuentes", "Viernes 12:00 · confirmada"]] },
  { stage: "Propuesta", count: 2, cards: [["Valentina Soto", "Enviada el martes"]] },
  { stage: "Cerrado", count: 3, cards: [["Familia Muñoz", "Firmado"]], won: true },
] as const;

const NAV = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "/vocero", label: "A medida" },
];

export default function ReiPage() {
  return (
    <div className="allok">
      {/* ── El cielo: la portada es el degradado, y la cabecera flota encima ── */}
      <div className="allok-sky pb-[150px]">
        <SiteHeader
          product="rei"
          nav={NAV}
          cta={{ href: whatsappUrl(DEMO_MESSAGE), label: "Probar el agente" }}
        />

        <div className="mx-auto max-w-[980px] px-5 pt-10 text-center sm:px-10 sm:pt-20">
          <p className="mono opacity-85">El CRM de WhatsApp para inmobiliarias</p>
          <h1 className="display mt-6 text-[clamp(44px,7vw,92px)]">
            Cada consulta,
            <br />
            atendida y contada.
          </h1>
          <p className="mx-auto mt-6 max-w-[560px] text-[clamp(17px,1.4vw,20px)] leading-relaxed opacity-85 text-pretty">
            REI responde, califica y agenda visitas en el número de siempre de
            tu corredora. Tú pagas una mensualidad fija; Meta le cobra los
            mensajes a tu empresa, al costo, sin que nosotros pongamos un peso
            encima.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl(DEMO_MESSAGE)} className="allok-btn allok-btn-solid">
              Probar el agente en WhatsApp
            </a>
            <Link href="#precios" className="allok-btn allok-btn-outline">
              Ver precios
            </Link>
          </div>
        </div>
      </div>

      {/* ── El producto rompe el borde del cielo ── */}
      <div className="relative z-[3] -mt-[130px] px-5 sm:px-10">
        <Board />
      </div>

      <section id="como-funciona" className="mx-auto max-w-[1200px] px-5 pt-16 sm:px-10 sm:pt-24">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([title, body], i) => (
            <div key={title}>
              <p className="mono text-[var(--dusk)]">{`0${i + 1}`}</p>
              <h2 className="display-sm mt-3 mb-2 text-[26px]">{title}</h2>
              <p className="text-[15px] leading-relaxed text-[var(--ink-60)] text-pretty">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="precios" className="mx-auto max-w-[1200px] px-5 pt-16 sm:px-10 sm:pt-24">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="display text-[clamp(32px,4vw,52px)]">Precio fijo. Mensajes al costo.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-60)] text-pretty">
            La cuenta de WhatsApp queda a nombre de tu empresa y Meta te factura
            el consumo directo. Nosotros cobramos el software, no tus
            conversaciones.
          </p>
        </div>

        <div className="mt-11 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-[22px] border border-[var(--line)] p-7 ${
                plan.featured ? "bg-[#101112] text-[#f5f4f0]" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="display-sm text-xl">{plan.name}</h3>
                {plan.featured ? <span className="mono text-[var(--lit-dawn)]">Más elegido</span> : null}
              </div>
              <p className="display mt-4 text-[48px]">
                ${plan.price}
                <span className="align-baseline text-[15px] font-normal tracking-normal opacity-55"> /mes</span>
              </p>
              <p className="mt-2.5 mb-5 text-[14.5px] opacity-70">{plan.line}</p>

              <a
                href={whatsappUrl(
                  `Hola, vengo de allok.fun. Quiero empezar con el plan ${plan.name} de REI (US$${plan.price}/mes).`,
                )}
                className={`allok-btn w-full !py-3.5 !text-[15px] ${
                  plan.featured
                    ? "allok-btn-sky"
                    : "border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
                }`}
              >
                Empezar con {plan.name}
              </a>

              <ul
                className={`mt-5 grid gap-2.5 border-t pt-4.5 ${
                  plan.featured ? "border-[rgba(245,244,240,.14)]" : "border-[var(--line)]"
                }`}
              >
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm leading-snug">
                    <span aria-hidden="true" className="mt-[7px] size-[5px] shrink-0 rounded-[2px] bg-[var(--dusk)]" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-[620px] text-center text-[14.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
          ¿Tu operación no entra en ninguna de estas tres cajas?{" "}
          <Link href="/vocero" className="underline underline-offset-4">
            Vocero es la versión a medida
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-14 sm:px-10 sm:py-20">
        <MetaCostCalculator />
      </section>

      <SiteFooter />
    </div>
  );
}

function Board() {
  return (
    <div className="rounded-[20px] border border-[rgba(16,17,18,.08)] bg-white p-4 shadow-[0_30px_80px_-34px_rgba(0,0,0,.45)]">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {BOARD.map((col) => (
          <div key={col.stage} className={`rounded-xl p-2.5 ${"won" in col && col.won ? "bg-[#E3EFE7]" : "bg-[var(--paper-2)]"}`}>
            <div className="flex items-center justify-between px-1 pb-2.5 pt-0.5 text-[12.5px] font-semibold">
              {col.stage}
              <span
                className={`rounded-md px-1.5 py-0.5 font-[family-name:var(--font-jetbrains)] text-[10.5px] font-medium ${
                  "won" in col && col.won ? "bg-[#14663A] text-white" : "bg-[rgba(16,17,18,.08)]"
                }`}
              >
                {col.count}
              </span>
            </div>
            <div className="grid gap-2">
              {col.cards.map(([name, meta]) => (
                <div key={name} className="rounded-[10px] border border-[rgba(16,17,18,.07)] bg-white p-2.5">
                  <p className="text-[13px] font-medium">{name}</p>
                  <p className="mt-1 text-[11.5px] text-[var(--ink-60)]">{meta}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
