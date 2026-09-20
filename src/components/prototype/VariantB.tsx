import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { FROM_PRICE, PLANS, SETUP_SERVICE, priceLabel, registerUrl } from "@/lib/plans";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import Conversation from "@/components/allok/Conversation";

/**
 * PROTOTIPO · Variante B — «Riel».
 *
 * La página deja de estar centrada. Portada asimétrica con el teléfono saliendo
 * por el borde, y las cuatro capacidades pasan de ser una lista de prosa a un
 * riel fijo a la izquierda con un objeto de producto a la derecha por cada paso:
 * lo que hace se *ve*, no se lee.
 */

const NAV = [
  { href: "#producto", label: "Qué hace" },
  { href: "#rubros", label: "Para quién" },
  { href: "#precios", label: "Precios" },
  { href: "/vocero", label: "A medida" },
];

const DEMO = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

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

/* ── Los cuatro objetos del riel ─────────────────────────────────────────── */

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-white">
      <figcaption className="mono flex items-center gap-2 border-b border-[var(--line)] px-4 py-2.5 text-[var(--ink-40)]">
        <span className="size-1.5 rounded-full bg-[var(--dusk)]" aria-hidden="true" />
        {label}
      </figcaption>
      <div className="p-4">{children}</div>
    </figure>
  );
}

function ArtContesta() {
  return (
    <Frame label="WhatsApp · 3:14">
      <div className="grid gap-1.5 rounded-[12px] bg-[#ece5dd] p-3">
        <div className="flex justify-start">
          <p className="max-w-[80%] rounded-[12px] bg-white px-2.5 py-1.5 text-[13px] leading-snug text-[#111b21]">
            ¿Tienen cupo para el curso de los sábados?
          </p>
        </div>
        <div className="flex justify-end">
          <p className="max-w-[86%] rounded-[12px] bg-[#d9fdd3] px-2.5 py-1.5 text-[13px] leading-snug text-[#111b21]">
            Quedan 4 cupos en el de 9:00 y 2 en el de 11:30. Son 8 clases, empiezan el 4 de octubre.
          </p>
        </div>
      </div>
    </Frame>
  );
}

function ArtCalifica() {
  const chips = [
    ["Servicio", "Curso sábados 9:00"],
    ["Presupuesto", "Dentro de rango"],
    ["Plazo", "Esta semana"],
    ["Zona", "Norte"],
  ] as const;
  return (
    <Frame label="Ficha · se llena sola">
      <div className="grid gap-2">
        {chips.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0">
            <span className="mono text-[var(--ink-40)]">{k}</span>
            <span className="text-[13.5px] font-medium">{v}</span>
          </div>
        ))}
        <p className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[#edf7df] px-2.5 py-1 text-[12px] font-medium text-[#4f6b14]">
          Listo para llamar hoy
        </p>
      </div>
    </Frame>
  );
}

function ArtAgenda() {
  const slots = ["Jue 09:00", "Jue 11:30", "Vie 16:00"] as const;
  return (
    <Frame label="Agenda · bloques libres">
      <div className="grid gap-2 sm:grid-cols-3">
        {slots.map((s, i) => (
          <div
            key={s}
            className={`rounded-[12px] border px-3 py-3 text-center text-[13px] font-medium ${
              i === 1
                ? "border-transparent bg-[var(--ink)] text-white"
                : "border-[var(--line)] text-[var(--ink-60)]"
            }`}
          >
            {s}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-[var(--ink-60)]">
        Confirmada y con recordatorio. Sin tres mensajes de ida y vuelta.
      </p>
    </Frame>
  );
}

function ArtRegistro() {
  const rows = [
    ["Carla M.", "Agendado", "Recordar el miércoles"],
    ["Taller Sur", "Cotizado", "Llamar hoy"],
    ["J. Pérez", "Nuevo", "Falta la zona"],
  ] as const;
  return (
    <Frame label="Pipeline · lo que sigue">
      <div className="grid gap-px overflow-hidden rounded-[12px] bg-[var(--line)]">
        {rows.map(([who, stage, next]) => (
          <div key={who} className="flex items-center gap-3 bg-white px-3 py-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--paper-2)] text-[11px] font-semibold">
              {who.slice(0, 1)}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{who}</span>
            <span className="mono rounded-full border border-[var(--line)] px-2 py-0.5 text-[var(--ink-60)]">{stage}</span>
            <span className="hidden text-[12.5px] text-[var(--ink-40)] sm:block">{next}</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Contesta",
    body: "Con la información real de tu negocio: precios, horarios, stock, requisitos. No inventa — si no lo sabe, lo dice y te pasa la conversación.",
    art: <ArtContesta />,
  },
  {
    n: "02",
    title: "Califica",
    body: "Hace las preguntas de tu rubro antes de que llegue a tu equipo, y marca quién merece una llamada hoy y quién puede esperar.",
    art: <ArtCalifica />,
  },
  {
    n: "03",
    title: "Agenda",
    body: "Ofrece los bloques libres de la persona correcta, confirma la cita y la recuerda.",
    art: <ArtAgenda />,
  },
  {
    n: "04",
    title: "Deja registro",
    body: "Cada conversación queda con su ficha, su etapa y su próximo paso. Lo que pasó en WhatsApp deja de vivir en el teléfono de una persona.",
    art: <ArtRegistro />,
  },
] as const;

/* ── La página ───────────────────────────────────────────────────────────── */

export default function VariantB() {
  const fallback = whatsappUrl(DEMO);

  return (
    <div className="allok">
      <div className="allok-void">
        <SiteHeader nav={NAV} cta={{ href: fallback, label: "Probar el agente" }} />

        {/* Portada asimétrica: el texto manda a la izquierda y el producto
            sale por el borde derecho. Nada centrado. */}
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-10 sm:px-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] lg:gap-6 lg:pb-28 lg:pt-16">
          <div>
            <p className="mono text-[var(--on-void-60)]">El CRM de WhatsApp para negocios de servicios</p>
            <h1 className="hero mt-6 !text-[clamp(2.75rem,6.2vw,5.5rem)]">
              Tu negocio
              <br />
              contesta.
              <br />
              <span className="text-[var(--on-void-40)]">Aunque no estés.</span>
            </h1>
            <p className="lede mt-7 max-w-[46ch] text-[var(--on-void-60)]">
              allok atiende el WhatsApp de siempre de tu negocio: responde con lo
              que de verdad vendes, califica al que pregunta y agenda la cita.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href={fallback} className="allok-btn allok-btn-solid">
                Probar el agente en WhatsApp
              </a>
              <Link href="#precios" className="allok-btn allok-btn-outline">
                Ver planes · desde US${FROM_PRICE}
              </Link>
            </div>

            <ul className="allok-hair mt-12 grid gap-x-8 gap-y-2.5 pt-7 sm:grid-cols-2">
              {FACTS.map((f) => (
                <li key={f} className="flex gap-2.5 text-[13.5px] leading-snug text-[var(--on-void-60)]">
                  <span aria-hidden="true" className="mt-[7px] size-[5px] shrink-0 rounded-[2px] bg-[var(--lit-dawn)]" />
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

      {/* ── El riel. Izquierda fija, derecha en movimiento ───────────────── */}
      <section id="producto" className="mx-auto max-w-[1240px] px-5 py-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:gap-16">
          <div className="lg:sticky lg:top-16 lg:self-start">
            <p className="mono text-[var(--ink-40)]">Lo que hace</p>
            <h2 className="statement mt-5 !text-[clamp(1.9rem,3.4vw,3rem)]">
              Cuatro cosas, en el orden en que ocurren.
            </h2>
            <ol className="allok-hair mt-9 grid gap-3 pt-7">
              {STEPS.map((s) => (
                <li key={s.n} className="flex items-baseline gap-4">
                  <span className="mono tabular-nums text-[var(--dusk)]">{s.n}</span>
                  <span className="display-sm text-[17px]">{s.title}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-16 sm:gap-24">
            {STEPS.map((s) => (
              <div key={s.n}>
                <div className="flex items-baseline gap-4">
                  <span className="mono tabular-nums text-[var(--dusk)]">{s.n}</span>
                  <h3 className="display-sm text-[clamp(1.4rem,2.2vw,1.9rem)]">{s.title}</h3>
                </div>
                <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-[var(--ink-60)] text-pretty">
                  {s.body}
                </p>
                <div className="mt-7">{s.art}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quién: filas, no tarjetas ───────────────────────────────── */}
      <section id="rubros" className="mx-auto max-w-[1240px] px-5 sm:px-10">
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

      {/* ── Precios asimétricos: el elegido ocupa el doble ───────────────── */}
      <section id="precios" className="mx-auto max-w-[1240px] px-5 pt-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)]">
          <h2 className="statement max-w-[14ch]">Precio fijo. Mensajes al costo.</h2>
          <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
            La cuenta de WhatsApp queda a nombre de tu empresa y Meta te factura
            el consumo directo, a su tarifa. Cobramos el software, no tus
            conversaciones.
          </p>
        </div>

        {/* Tres columnas iguales; la elegida cambia de POLARIDAD, no de tamaño.
            Es lo que hacen e2b y Lookback en el archivo: la profundidad sale de
            invertir el papel, no de agrandar la tarjeta ni de ponerle sombra.
            Sin bordes: los pelos de la rejilla separan las columnas. */}
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
                {plan.featured ? <span className="mono text-[var(--lit-dawn)]">Más elegido</span> : null}
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
                className={`allok-btn w-full !py-3.5 !text-[15px] ${
                  plan.featured ? "allok-btn-sky" : "border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
                }`}
              >
                {plan.appPlan ? `Empezar con ${plan.name}` : "Hablemos"}
              </a>
              {plan.trialDays ? (
                <p className="mono mt-3 text-center opacity-55">{plan.trialDays} días de prueba</p>
              ) : null}

              <ul className={`allok-hair mt-7 grid gap-3 pt-6 ${plan.featured ? "border-[var(--hair-void)]" : ""}`}>
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 text-[14.5px] leading-snug">
                    <span
                      aria-hidden="true"
                      className={`mt-[7px] size-[5px] shrink-0 rounded-[2px] ${
                        plan.featured ? "bg-[var(--lit-dawn)]" : "bg-[var(--dusk)]"
                      }`}
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
              {SETUP_SERVICE.line} Cargamos tu agente, armamos tus etapas y conectamos
              WhatsApp con Meta de punta a punta.
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

      <section className="mx-auto max-w-[1240px] px-5 pt-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="allok-sky grid items-center gap-8 rounded-[30px] px-7 py-16 sm:px-14 sm:py-20 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h2 className="hero !text-[clamp(2rem,4.4vw,3.6rem)]">Pruébalo con tu propia pregunta.</h2>
            <p className="lede mt-5 max-w-[46ch] opacity-85">
              Escríbele al número de allok como si fueras un cliente tuyo.
            </p>
          </div>
          <a href={fallback} className="allok-btn allok-btn-solid md:justify-self-end">
            Abrir WhatsApp
          </a>
        </div>
      </section>

      <div className="pt-[clamp(72px,10vw,140px)]" />
      <SiteFooter />
    </div>
  );
}
