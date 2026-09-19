import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { FROM_PRICE, PLANS, SETUP_SERVICE, priceLabel, registerUrl } from "@/lib/plans";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";

/**
 * PROTOTIPO · Variante D — «Consola».
 *
 * Invierte el punto de vista: el héroe deja de ser el chat que ve el cliente y
 * pasa a ser el tablero que ve el dueño. Página entera en negro, el producto
 * ocupando el ancho completo, y las capacidades como una tabla de
 * especificación en vez de prosa. Vende control, no magia.
 */

const NAV = [
  { href: "#tablero", label: "El tablero" },
  { href: "#capacidades", label: "Qué hace" },
  { href: "#precios", label: "Precios" },
  { href: "/vocero", label: "A medida" },
];

const DEMO = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

const FACTS = [
  ["Tu número", "El de siempre"],
  ["La cuenta", "A nombre de tu empresa"],
  ["Los mensajes", "Meta te los cobra al costo"],
  ["El contrato", "Cancelas cuando quieras"],
] as const;

/** Una fila por capacidad: qué hace, y el detalle que la hace creíble. */
const SPEC = [
  ["Contesta", "Con precios, horarios, stock y requisitos reales. Si no lo sabe, lo dice y te pasa la conversación."],
  ["Califica", "Hace las preguntas de tu rubro antes de que llegue a tu equipo y marca a quién llamar hoy."],
  ["Agenda", "Ofrece los bloques libres de la persona correcta, confirma la cita y la recuerda."],
  ["Deja registro", "Ficha, etapa y próximo paso por conversación. Bandeja compartida e historial."],
  ["Se prueba antes", "Puedes ver cómo responde antes de soltarlo con clientes reales."],
  ["Escala con el equipo", "Todo el mundo en la misma bandeja, sin pelearse el teléfono."],
] as const;

const SECTORS = [
  ["Clínicas y estética", "¿Cuánto sale, cuánto dura y cuándo hay hora?"],
  ["Academias y cursos", "¿Queda cupo, cuándo empieza y cómo reservo?"],
  ["Servicios legales", "¿Atienden mi caso y qué necesito llevar?"],
  ["Talleres y servicio técnico", "¿Lo reparan, cuánto tarda y cuánto cuesta?"],
  ["Turismo y hospedaje", "¿Hay disponibilidad para esas fechas?"],
  ["Ecommerce y tiendas", "¿Tienen esta talla y cuánto es el envío?"],
] as const;

/* ── El objeto: el tablero ───────────────────────────────────────────────── */

const INBOX = [
  ["Carla M.", "Te reservé el cupo hasta mañana…", "3:16", true],
  ["Taller Sur", "¿Me pasas el presupuesto?", "2:41", false],
  ["J. Pérez", "Buenas, ¿atienden los sábados?", "ayer", false],
  ["Marina R.", "Confirmado, gracias", "ayer", false],
] as const;

function Console() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[var(--hair-void)] bg-[var(--void-2)] shadow-[0_60px_120px_-40px_rgba(0,0,0,.9)]">
      <div className="flex items-center gap-2 border-b border-[var(--hair-void)] px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="size-2.5 rounded-full bg-white/15" aria-hidden="true" />
        <span className="mono ml-3 text-[var(--on-void-40)]">Academia Norte · bandeja</span>
      </div>

      <div className="grid md:grid-cols-[minmax(0,.9fr)_minmax(0,1.3fr)_minmax(0,.95fr)]">
        {/* Conversaciones */}
        <div className="border-b border-[var(--hair-void)] md:border-b-0 md:border-r">
          {INBOX.map(([who, last, at, active]) => (
            <div
              key={who as string}
              className={`flex items-start gap-3 border-b border-[var(--hair-void)] px-4 py-3.5 last:border-b-0 ${
                active ? "bg-white/[0.06]" : ""
              }`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
                {(who as string).slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13.5px] font-medium">{who}</span>
                  <span className="mono shrink-0 text-[var(--on-void-40)]">{at}</span>
                </span>
                <span className="mt-0.5 block truncate text-[12.5px] text-[var(--on-void-40)]">{last}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Hilo */}
        <div className="grid content-start gap-2 border-b border-[var(--hair-void)] px-4 py-4 md:border-b-0 md:border-r">
          <p className="mono mx-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-[var(--on-void-40)]">Hoy · 3:14</p>
          <div className="flex justify-start">
            <p className="max-w-[86%] rounded-[12px] bg-white/[0.07] px-3 py-2 text-[13px] leading-snug">
              ¿Tienen cupo para el curso de los sábados?
            </p>
          </div>
          <div className="flex justify-end">
            <p className="max-w-[90%] rounded-[12px] bg-[#1f4d3a] px-3 py-2 text-[13px] leading-snug text-[#e8fbef]">
              Quedan 4 cupos en el de 9:00 y 2 en el de 11:30. Empiezan el 4 de octubre.
            </p>
          </div>
          <div className="flex justify-end">
            <p className="max-w-[90%] rounded-[12px] bg-[#1f4d3a] px-3 py-2 text-[13px] leading-snug text-[#e8fbef]">
              Te reservé el cupo hasta mañana a las 18:00. Para confirmarlo va el 50%.
            </p>
          </div>
          <p className="mono mt-1 flex items-center gap-2 text-[var(--on-void-40)]">
            <span className="size-1.5 rounded-full bg-[var(--lit-dawn)]" aria-hidden="true" />
            Respondió allok · 4 s
          </p>
        </div>

        {/* Ficha */}
        <div className="grid content-start gap-3 px-4 py-4">
          <p className="mono text-[var(--on-void-40)]">Ficha</p>
          {[
            ["Etapa", "Agendado"],
            ["Servicio", "Curso sábados 9:00"],
            ["Sede", "Norte"],
            ["Próximo paso", "Recordar el miércoles"],
          ].map(([k, v]) => (
            <div key={k} className="grid gap-0.5 border-b border-[var(--hair-void)] pb-2.5 last:border-0 last:pb-0">
              <span className="mono text-[var(--on-void-40)]">{k}</span>
              <span className="text-[13.5px] font-medium">{v}</span>
            </div>
          ))}
          <p className="mt-1 w-fit rounded-full bg-[rgba(255,154,61,.16)] px-2.5 py-1 text-[12px] font-medium text-[var(--lit-dawn)]">
            Cerrada sin que nadie escribiera
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── La página ───────────────────────────────────────────────────────────── */

export default function VariantD() {
  const fallback = whatsappUrl(DEMO);

  return (
    <div className="allok">
      <div className="allok-void">
        <SiteHeader nav={NAV} cta={{ href: fallback, label: "Probar el agente" }} />

        {/* Portada: el titular corto, y el tablero a ancho completo */}
        <section id="tablero" className="mx-auto max-w-[1320px] px-5 pt-12 sm:px-10 sm:pt-16">
          <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
            <div>
              <p className="mono text-[var(--on-void-60)]">El CRM de WhatsApp para negocios de servicios</p>
              <h1 className="hero mt-6 !text-[clamp(2.5rem,5.6vw,4.75rem)]">
                Lo que pasa en tu WhatsApp, por fin en un tablero.
              </h1>
            </div>
            <div>
              <p className="lede text-[var(--on-void-60)]">
                allok contesta, califica y agenda en el número de siempre de tu
                negocio — y deja cada conversación con su ficha, su etapa y su
                próximo paso.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={fallback} className="allok-btn allok-btn-solid">Probar el agente</a>
                <Link href="#precios" className="allok-btn allok-btn-outline">
                  Desde US${FROM_PRICE}/mes
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-14 sm:mt-20">
            <Console />
          </div>

          <dl className="allok-hair mt-16 grid gap-x-10 gap-y-6 pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt className="mono text-[var(--on-void-40)]">{k}</dt>
                <dd className="mt-1.5 text-[15px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Capacidades como especificación */}
        <section id="capacidades" className="mx-auto max-w-[1320px] px-5 pt-28 sm:px-10 sm:pt-36">
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
            <h2 className="statement max-w-[15ch]">Qué hace, sin adjetivos.</h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--on-void-60)] text-pretty">
              Cada fila es algo que la app hace hoy. Nada de esto está por salir.
            </p>
          </div>
          <dl className="mt-12">
            {SPEC.map(([k, v]) => (
              <div
                key={k}
                className="allok-hair grid items-baseline gap-x-10 gap-y-2 py-6 last:border-b last:border-[var(--hair-void)] sm:grid-cols-[minmax(0,.28fr)_minmax(0,.72fr)]"
              >
                <dt className="display-sm text-[19px]">{k}</dt>
                <dd className="max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--on-void-60)] text-pretty">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Precios, en negro */}
        <section id="precios" className="mx-auto max-w-[1320px] px-5 pt-28 sm:px-10 sm:pt-36">
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.7fr)]">
            <h2 className="statement max-w-[14ch]">Precio fijo. Mensajes al costo.</h2>
            <p className="text-[15.5px] leading-relaxed text-[var(--on-void-60)] text-pretty">
              La cuenta de WhatsApp es de tu empresa y Meta te factura el consumo
              directo. Cobramos el software, no tus conversaciones.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[26px] bg-[var(--hair-void)] md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`grid content-start p-8 ${plan.featured ? "bg-[#15171a]" : "bg-[var(--void-2)]"}`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="display-sm text-[19px]">{plan.name}</h3>
                  {plan.featured ? <span className="mono text-[var(--lit-dawn)]">Más elegido</span> : null}
                </div>
                <p className="mono mt-1.5 text-[var(--on-void-40)]">{plan.kicker}</p>
                <p className="display mt-6 text-[56px] leading-none tabular-nums">
                  {plan.from ? <span className="mono mr-2 align-middle text-[var(--on-void-40)]">desde</span> : null}
                  <span className="align-super text-[22px]">$</span>
                  {plan.price}
                </p>
                <p className="mono mt-2.5 text-[var(--on-void-40)]">{priceLabel(plan).unit}</p>
                <p className="mt-4 mb-7 text-[15px] leading-snug text-[var(--on-void-60)]">{plan.line}</p>
                <a
                  href={plan.appPlan ? registerUrl(plan.appPlan) : whatsappUrl(plan.talkTo ?? DEMO)}
                  className={`allok-btn w-full !py-3.5 !text-[15px] ${
                    plan.featured ? "allok-btn-solid" : "allok-btn-outline"
                  }`}
                >
                  {plan.appPlan ? `Empezar con ${plan.name}` : "Hablemos"}
                </a>
                {plan.trialDays ? (
                  <p className="mono mt-3 text-center text-[var(--on-void-40)]">{plan.trialDays} días de prueba</p>
                ) : null}
                <ul className="allok-hair mt-7 grid gap-3 pt-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[14.5px] leading-snug">
                      <span aria-hidden="true" className="mt-[7px] size-[5px] shrink-0 rounded-[2px] bg-[var(--lit-dawn)]" />
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
              <p className="mt-2 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--on-void-60)] text-pretty">
                {SETUP_SERVICE.line} Cargamos tu agente, armamos tus etapas y conectamos
                WhatsApp con Meta de punta a punta.
              </p>
            </div>
            <a href={whatsappUrl(SETUP_SERVICE.talkTo)} className="allok-btn allok-btn-outline md:justify-self-end">
              Que lo dejen andando
            </a>
          </div>
        </section>

        <div className="pb-28 sm:pb-36" />
      </div>

      {/* ── La única banda de papel: el relevo de contraste ──────────────── */}
      <section className="mx-auto max-w-[1320px] px-5 py-24 sm:px-10 sm:py-32">
        <h2 className="statement max-w-[17ch]">
          Si tu negocio vive de una pregunta que se repite, ya está hecho.
        </h2>
        <dl className="mt-12 grid gap-x-12 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map(([sector, question]) => (
            <div key={sector} className="allok-hair pt-5">
              <dt className="display-sm text-[16px]">{sector}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-[var(--ink-60)] text-pretty">«{question}»</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 max-w-[62ch] text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
          ¿Inmobiliaria? El mismo producto con el vocabulario de una corredora se
          llama{" "}
          <Link href="/rei" className="text-[var(--ink)] underline underline-offset-4">REI</Link>. ¿Reglas
          propias o tu propio servidor? Eso es{" "}
          <Link href="/vocero" className="text-[var(--ink)] underline underline-offset-4">allok a tu medida</Link>.
        </p>

        <div className="allok-sky mt-20 grid items-center gap-8 rounded-[30px] px-7 py-16 sm:px-14 sm:py-20 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h2 className="hero !text-[clamp(2rem,4.4vw,3.6rem)]">Pruébalo con tu propia pregunta.</h2>
            <p className="lede mt-5 max-w-[46ch] opacity-85">
              Escríbele al número de allok como si fueras un cliente tuyo.
            </p>
          </div>
          <a href={fallback} className="allok-btn allok-btn-solid md:justify-self-end">Abrir WhatsApp</a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
