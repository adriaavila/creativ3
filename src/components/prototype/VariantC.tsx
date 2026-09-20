import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import { FROM_PRICE, PLANS, SETUP_SERVICE, registerUrl } from "@/lib/plans";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";

/**
 * PROTOTIPO · Variante C — «El hilo».
 *
 * La página *es* la conversación. En vez de describir cuatro capacidades en una
 * lista, se lee un hilo real y cada capacidad aparece anotada al margen, pegada
 * al mensaje exacto donde ocurre. Los precios dejan de ser tres tarjetas y pasan
 * a una tabla comparativa.
 */

const NAV = [
  { href: "#hilo", label: "Cómo se ve" },
  { href: "#rubros", label: "Para quién" },
  { href: "#precios", label: "Precios" },
  { href: "/vocero", label: "A medida" },
];

const DEMO = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

type Turn = { from: "them" | "us"; text: string; at: string; note?: { n: string; title: string; body: string } };

const THREAD: Turn[] = [
  {
    from: "them",
    text: "Hola, ¿tienen cupo para el curso de los sábados?",
    at: "3:14",
    note: { n: "01", title: "A las 3:14", body: "Nadie de tu equipo está despierto. La conversación no espera a mañana." },
  },
  {
    from: "us",
    text: "Sí — quedan 4 cupos en el de 9:00 y 2 en el de 11:30. Son 8 clases, empiezan el 4 de octubre.",
    at: "3:14",
    note: { n: "02", title: "Contesta", body: "Con el dato real de tu negocio. Si no lo sabe, lo dice y te pasa la conversación: no inventa." },
  },
  { from: "them", text: "El de 9. ¿Es presencial?", at: "3:15" },
  { from: "us", text: "Presencial, en la sede Norte. ¿Te queda cómodo por ahí?", at: "3:15" },
  {
    from: "them",
    text: "Sí, vivo cerca. ¿Cómo hago para reservar?",
    at: "3:15",
    note: { n: "03", title: "Califica", body: "Servicio, sede, zona y urgencia quedan anotados antes de que nadie de tu equipo lea nada." },
  },
  {
    from: "us",
    text: "Te reservé el cupo a tu nombre hasta mañana a las 18:00. Para confirmarlo va el 50%: te paso el link.",
    at: "3:16",
    note: { n: "04", title: "Agenda", body: "Ofrece el bloque libre, lo reserva, lo confirma y lo recuerda. Sin tres mensajes de ida y vuelta." },
  },
  { from: "them", text: "Perfecto, lo pago ahora.", at: "3:16" },
  {
    from: "us",
    text: "Listo. Te llega el recordatorio el viernes. Cualquier cosa, escribe por aquí.",
    at: "3:17",
    note: { n: "05", title: "Deja registro", body: "La ficha, la etapa y el próximo paso quedan en el CRM. No en el teléfono de una persona." },
  },
];

const SECTORS = [
  "¿Cuánto sale, cuánto dura y cuándo hay hora?",
  "¿Queda cupo, cuándo empieza y cómo reservo?",
  "¿Atienden mi caso y qué necesito llevar?",
  "¿Lo reparan, cuánto tarda y cuánto cuesta?",
  "¿Hay disponibilidad para esas fechas?",
  "¿Tienen esta talla y cuánto es el envío?",
] as const;

/** Las filas salen de lo que la app realmente cierra por plan: pipeline,
 *  agenda y equipo son de Completo; servidor propio y marca, de A tu medida. */
const MATRIX: [string, boolean, boolean, boolean][] = [
  ["Tu número de siempre, sin cambiar nada", true, true, true],
  ["Contesta a cualquier hora con lo que vendes", true, true, true],
  ["Una bandeja con toda la conversación", true, true, true],
  ["Ficha del cliente y su historial", true, true, true],
  ["Tus ventas en etapas, de la consulta al cliente", false, true, true],
  ["Agenda citas y las confirma sola", false, true, true],
  ["Tu equipo entero en la misma bandeja", false, true, true],
  ["allok en el servidor de tu empresa", false, false, true],
  ["Tu dominio y tu marca de punta a punta", false, false, true],
  ["Integraciones y flujos para tu operación", false, false, true],
];

function Note({ note }: { note: NonNullable<Turn["note"]> }) {
  return (
    <aside className="mt-2 max-w-[34ch] lg:mt-0 lg:pt-1">
      <p className="mono tabular-nums text-[var(--dusk)]">{note.n} · {note.title}</p>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{note.body}</p>
    </aside>
  );
}

export default function VariantC() {
  const fallback = whatsappUrl(DEMO);

  return (
    <div className="allok">
      {/* Solo la barra es oscura. El resto de la página es papel. */}
      <div className="allok-void">
        <SiteHeader nav={NAV} cta={{ href: fallback, label: "Probar el agente" }} />
      </div>

      <section className="mx-auto max-w-[1240px] px-5 pb-16 pt-16 sm:px-10 sm:pb-20 sm:pt-24">
        <p className="mono text-[var(--ink-40)]">El CRM de WhatsApp para negocios de servicios</p>
        <h1 className="hero mt-6 max-w-[15ch] !text-[clamp(2.5rem,6vw,5rem)]">
          Así se ve una venta que{" "}
          <span className="text-[var(--dusk)]">ocurrió sola</span>.
        </h1>
        <p className="lede mt-7 max-w-[56ch] text-[var(--ink-60)]">
          Esto es un hilo de WhatsApp de madrugada. A la izquierda, lo que vio el
          cliente. A la derecha, lo que hizo allok en cada mensaje.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a href={fallback} className="allok-btn bg-[var(--ink)] text-[var(--paper)]">
            Probar el agente en WhatsApp
          </a>
          <Link href="#precios" className="allok-btn border border-[rgba(16,17,18,.22)] text-[var(--ink)]">
            Ver planes · desde US${FROM_PRICE}
          </Link>
        </div>
      </section>

      {/* ── El hilo, a tamaño de lectura, con el margen anotado ──────────── */}
      <section id="hilo" className="px-5 sm:px-10">
        <div className="mx-auto w-fit max-w-full">
          <p className="mono mb-6 text-center text-[var(--ink-40)]">Academia Norte · hoy</p>
          <div className="grid gap-y-4">
            {THREAD.map((turn) => {
              const ours = turn.from === "us";
              return (
                <div
                  key={turn.text}
                  className="grid items-start gap-x-10 lg:grid-cols-[minmax(0,560px)_260px]"
                >
                  <div className={`flex ${ours ? "justify-end" : "justify-start"}`}>
                    <p
                      className={`relative max-w-[88%] rounded-[16px] px-4 pb-6 pt-3 text-[15px] leading-[1.45] ${
                        ours
                          ? "bg-[#d9fdd3] text-[#111b21]"
                          : "border border-[var(--line)] bg-white text-[#111b21]"
                      }`}
                    >
                      {turn.text}
                      <span className="absolute bottom-1.5 right-3.5 text-[10.5px] tabular-nums text-[rgba(17,27,33,.42)]">
                        {turn.at}
                      </span>
                    </p>
                  </div>
                  {turn.note ? <Note note={turn.note} /> : <div aria-hidden="true" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Del otro lado ───────────────────────────────────────────────── */}
      <section className="mx-auto mt-24 max-w-[1240px] px-5 sm:mt-32 sm:px-10">
        <div className="rounded-[30px] bg-[var(--void)] px-7 py-14 text-[var(--on-void)] sm:px-14 sm:py-20">
          <p className="mono text-[var(--on-void-40)]">Del otro lado</p>
          <h2 className="statement mt-5 max-w-[19ch] !text-[clamp(1.8rem,3.6vw,3rem)]">
            Tú no ves un chat. Ves quién compra y qué falta.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[18px] bg-[var(--hair-void)]">
            {[
              ["Carla M.", "Agendado", "Jue 09:00 · recordar el miércoles"],
              ["Taller Sur", "Cotizado", "Llamar hoy · presupuesto enviado"],
              ["J. Pérez", "Nuevo", "Falta la zona"],
            ].map(([who, stage, next]) => (
              <div key={who} className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-[var(--void-2)] px-5 py-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-[12px] font-semibold">
                  {who.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{who}</span>
                <span className="mono rounded-full border border-[var(--hair-void)] px-2.5 py-1 text-[var(--on-void-60)]">
                  {stage}
                </span>
                <span className="w-full text-[13.5px] text-[var(--on-void-40)] sm:w-auto">{next}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quién: la pregunta, en su burbuja ───────────────────────── */}
      <section id="rubros" className="mx-auto max-w-[1240px] px-5 pt-[clamp(72px,10vw,140px)] sm:px-10">
        <h2 className="statement max-w-[17ch]">
          Si tu negocio vive de una pregunta que se repite, ya está hecho.
        </h2>
        <div className="mt-12 flex flex-wrap gap-3">
          {SECTORS.map((q) => (
            <p
              key={q}
              className="rounded-[16px] rounded-bl-[4px] border border-[var(--line)] bg-white px-4 py-3 text-[15px] leading-snug text-[var(--ink-60)]"
            >
              «{q}»
            </p>
          ))}
        </div>
      </section>

      {/* ── Precios: una tabla, no tres tarjetas ─────────────────────────── */}
      <section id="precios" className="mx-auto max-w-[1240px] px-5 pt-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)]">
          <h2 className="statement max-w-[14ch]">Precio fijo. Mensajes al costo.</h2>
          <p className="text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
            La cuenta de WhatsApp queda a nombre de tu empresa y Meta te factura el
            consumo directo, a su tarifa. Cobramos el software, no tus conversaciones.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr>
                <th className="w-[44%] pb-6 align-bottom">
                  <span className="mono text-[var(--ink-40)]">Qué incluye</span>
                </th>
                {PLANS.map((plan) => (
                  <th key={plan.key} className="pb-6 pl-6 align-bottom">
                    <span className="display-sm block text-[17px]">{plan.name}</span>
                    <span className="display mt-1.5 block text-[34px] leading-none tabular-nums">
                      {plan.from ? <span className="mono mr-1 align-middle text-[var(--ink-40)]">desde</span> : null}
                      <span className="align-super text-[15px]">$</span>
                      {plan.price}
                    </span>
                    <span className="mono mt-1 block text-[var(--ink-40)]">
                      {plan.period ? "al mes" : "una vez"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(([label, ...has]) => (
                <tr key={label} className="border-t border-[var(--line)]">
                  <td className="py-3.5 pr-6 text-[15px] leading-snug text-[var(--ink-60)]">{label}</td>
                  {has.map((yes, i) => (
                    <td key={PLANS[i].key} className="py-3.5 pl-6">
                      {yes ? (
                        <span className="text-[16px] font-semibold text-[var(--ink)]" aria-label="incluido">✓</span>
                      ) : (
                        <span className="text-[var(--ink-40)]" aria-label="no incluido">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-[var(--line)]">
                <td className="pt-7" />
                {PLANS.map((plan) => (
                  <td key={plan.key} className="pl-6 pt-7 align-top">
                    <a
                      href={plan.appPlan ? registerUrl(plan.appPlan) : whatsappUrl(plan.talkTo ?? DEMO)}
                      className={`allok-btn w-full !py-3 !text-[14.5px] ${
                        plan.featured
                          ? "bg-[var(--ink)] text-[var(--paper)]"
                          : "border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
                      }`}
                    >
                      {plan.appPlan ? "Empezar" : "Hablemos"}
                    </a>
                    {plan.trialDays ? (
                      <p className="mono mt-2.5 text-center text-[var(--ink-40)]">{plan.trialDays} días de prueba</p>
                    ) : null}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="allok-hair mt-12 grid items-baseline gap-x-10 gap-y-3 pt-8 md:grid-cols-[minmax(0,1fr)_auto]">
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

      {/* ── Cierre en papel: una línea y un botón ────────────────────────── */}
      <section className="mx-auto max-w-[1240px] px-5 pt-[clamp(72px,10vw,140px)] sm:px-10">
        <div className="allok-hair grid items-center gap-6 pt-12 md:grid-cols-[minmax(0,1fr)_auto]">
          <h2 className="statement max-w-[16ch] !text-[clamp(1.8rem,3.6vw,3rem)]">
            Pruébalo con tu propia pregunta.
          </h2>
          <a href={fallback} className="allok-btn bg-[var(--ink)] text-[var(--paper)] md:justify-self-end">
            Abrir WhatsApp
          </a>
        </div>
      </section>

      <div className="pt-[clamp(72px,10vw,140px)]" />
      <SiteFooter />
    </div>
  );
}
