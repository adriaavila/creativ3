import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { PLANS } from "@/lib/plans";
import { isConfigured } from "@/lib/billing/catalog";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import PlanCheckout from "@/components/allok/PlanCheckout";
import Conversation from "@/components/allok/Conversation";
import MetaCostCalculator from "@/components/rei/MetaCostCalculator";

const TITLE = "allok — el CRM de WhatsApp para negocios de servicios";
const DESCRIPTION =
  "allok contesta, califica y agenda en el WhatsApp de siempre de tu negocio. Mensualidad fija desde US$29: la cuenta es de tu empresa y Meta te cobra los mensajes directo, al costo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const DEMO = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

const NAV = [
  { href: "#producto", label: "Producto" },
  { href: "#precios", label: "Precios" },
  { href: "#rubros", label: "Rubros" },
  { href: "/agencia", label: "Agencia" },
];

/** Lo que hace, en el orden en que ocurre dentro de una conversación. */
const CAPABILITIES = [
  {
    n: "01",
    title: "Contesta",
    body: "Con la información real de tu negocio: precios, horarios, stock, requisitos. No inventa — si no lo sabe, lo dice y te pasa la conversación.",
    spec: "Primera respuesta en segundos, a cualquier hora",
  },
  {
    n: "02",
    title: "Califica",
    body: "Hace las preguntas de tu rubro antes de que llegue a tu equipo, y marca quién merece una llamada hoy y quién puede esperar.",
    spec: "Presupuesto · plazo · zona · urgencia",
  },
  {
    n: "03",
    title: "Agenda",
    body: "Ofrece los bloques libres de la persona correcta, confirma la cita y la recuerda. Sin ir y venir por tres mensajes.",
    spec: "Reserva, confirmación y recordatorio",
  },
  {
    n: "04",
    title: "Deja registro",
    body: "Cada conversación queda con su ficha, su etapa y su próximo paso. Lo que pasó en WhatsApp deja de vivir en el teléfono de una persona.",
    spec: "Bandeja compartida, pipeline e historial",
  },
] as const;

/** Un negocio por rubro, con la pregunta que más repite. */
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

  return (
    <div className="allok">
      {/* ── Portada. Negro, y el producto encendido dentro ──────────────── */}
      <div className="allok-void">
        <SiteHeader nav={NAV} cta={{ href: fallback, label: "Probar el agente" }} />

        <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-14 text-center sm:px-10 sm:pb-36 sm:pt-24">
          <p className="mono text-[var(--on-void-60)]">El CRM de WhatsApp para negocios de servicios</p>
          <h1 className="hero mt-7">
            Tu negocio contesta.
            <br />
            Aunque no estés.
          </h1>
          <p className="lede mx-auto mt-7 max-w-[620px] text-[var(--on-void-60)]">
            allok atiende el WhatsApp de siempre de tu negocio: responde con lo
            que de verdad vendes, califica al que pregunta y agenda la cita.
            Tú pagas una mensualidad fija — los mensajes te los cobra Meta,
            directo y al costo.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href={fallback} className="allok-btn allok-btn-solid">
              Probar el agente en WhatsApp
            </a>
            <Link
              href="#precios"
              className="allok-btn border border-[var(--hair-void)] text-[var(--on-void)]"
            >
              Ver planes · desde US$29
            </Link>
          </div>

          <div className="allok-bloom mt-20 sm:mt-28">
            <Conversation />
          </div>
        </div>
      </div>

      {/* ── Una sola frase, del tamaño de la idea ───────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-5 py-24 sm:px-10 sm:py-36">
        <p className="statement allok-reveal">
          A las 3:14 de la mañana alguien preguntó por tu servicio. La
          respuesta salió cuatro segundos después, con el cupo, la fecha y el
          precio correctos. Nadie de tu equipo estaba despierto.
        </p>
      </section>

      {/* ── Lo que hace ─────────────────────────────────────────────────── */}
      <section id="producto" className="mx-auto max-w-[1100px] px-5 sm:px-10">
        <div className="grid">
          {CAPABILITIES.map((c) => (
            <div
              key={c.n}
              className="allok-hair grid gap-x-10 gap-y-3 py-10 sm:py-14 md:grid-cols-[88px_minmax(0,1fr)_minmax(0,0.62fr)]"
            >
              <p className="mono pt-1.5 text-[var(--dusk)]">{c.n}</p>
              <div>
                <h2 className="display-sm text-[clamp(1.5rem,2.4vw,2rem)]">{c.title}</h2>
                <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-[var(--ink-60)] text-pretty">
                  {c.body}
                </p>
              </div>
              <p className="mono self-start pt-2 text-[var(--ink-40)] md:text-right">{c.spec}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Para quién ──────────────────────────────────────────────────── */}
      <section id="rubros" className="mx-auto max-w-[1100px] px-5 pt-24 sm:px-10 sm:pt-36">
        <h2 className="statement max-w-[18ch]">
          Si tu negocio vive de una pregunta que se repite, ya está hecho.
        </h2>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map(([sector, question]) => (
            <div key={sector} className="grid content-start gap-2 bg-white p-7">
              <h3 className="display-sm text-[17px]">{sector}</h3>
              <p className="text-[15px] leading-relaxed text-[var(--ink-60)] text-pretty">
                «{question}»
              </p>
            </div>
          ))}
        </div>
        <p className="mt-7 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
          ¿Inmobiliaria? El mismo producto, con el pipeline y el vocabulario de
          una corredora, se llama{" "}
          <Link href="/rei" className="text-[var(--ink)] underline underline-offset-4">
            REI
          </Link>
          . ¿Tu operación tiene reglas propias y hay que hablar con tus
          sistemas? Eso es{" "}
          <Link href="/vocero" className="text-[var(--ink)] underline underline-offset-4">
            Vocero
          </Link>
          .
        </p>
      </section>

      {/* ── Precios ─────────────────────────────────────────────────────── */}
      <section id="precios" className="mx-auto max-w-[1100px] px-5 pt-24 sm:px-10 sm:pt-36">
        <div className="max-w-[640px]">
          <h2 className="statement">Precio fijo. Mensajes al costo.</h2>
          <p className="lede mt-6 text-[var(--ink-60)]">
            La cuenta de WhatsApp queda a nombre de tu empresa y Meta te factura
            el consumo directo, a su tarifa. Nosotros cobramos el software, no
            tus conversaciones. Cancelas cuando quieras.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`grid content-start rounded-[26px] p-8 ${
                plan.featured
                  ? "bg-[var(--void)] text-[var(--on-void)]"
                  : "border border-[var(--line)] bg-white"
              }`}
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="display-sm text-[19px]">{plan.name}</h3>
                {plan.featured ? (
                  <span className="mono text-[var(--lit-dawn)]">Más elegido</span>
                ) : null}
              </div>

              <p className="display mt-5 text-[52px] leading-none">
                <span className="align-super text-[22px]">$</span>
                {plan.price}
              </p>
              <p className="mono mt-2.5 opacity-55">USD por mes</p>
              <p className="mt-4 mb-7 text-[15px] leading-snug opacity-70">{plan.line}</p>

              <PlanCheckout
                billingKey={plan.billingKey}
                label={`Empezar con ${plan.name}`}
                checkoutReady={isConfigured(plan.billingKey)}
                fallbackUrl={whatsappUrl(
                  `Hola, vengo de allok.fun. Quiero el plan ${plan.name} (US$${plan.price}/mes).`,
                )}
                className={`allok-btn w-full !py-3.5 !text-[15px] ${
                  plan.featured
                    ? "allok-btn-sky"
                    : "border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
                }`}
              />

              <ul
                className={`allok-hair mt-7 grid gap-3 pt-6 ${plan.featured ? "border-[var(--hair-void)]" : ""}`}
              >
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 text-[14.5px] leading-snug">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] size-[5px] shrink-0 rounded-[2px] bg-[var(--dusk)]"
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 pt-20 sm:px-10 sm:pt-28">
        <MetaCostCalculator />
      </section>

      {/* ── Cierre. El cielo vuelve, una vez ────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-5 pt-24 sm:px-10 sm:pt-36">
        <div className="allok-sky rounded-[30px] px-7 py-20 text-center sm:px-16 sm:py-28">
          <h2 className="hero !text-[clamp(2.25rem,5.2vw,4.25rem)]">
            Pruébalo con tu propia pregunta.
          </h2>
          <p className="lede mx-auto mt-6 max-w-[540px] opacity-85">
            Escríbele al número de allok como si fueras un cliente tuyo. Vas a
            ver en treinta segundos lo que tu negocio podría contestar solo.
          </p>
          <a href={fallback} className="allok-btn allok-btn-solid mt-9">
            Abrir WhatsApp
          </a>
        </div>
      </section>

      <div className="pt-24 sm:pt-32" />
      <SiteFooter />
    </div>
  );
}
