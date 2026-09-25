import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";

const TITLE = "Vocero — el agente de WhatsApp de tu operación, a medida";
const DESCRIPTION =
  "Vocero es un agente de WhatsApp construido alrededor de las reglas reales de tu negocio: tu inventario, tus turnos, tus cobros, tu ERP. Para operaciones que no caben en un plan.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/vocero" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/vocero", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const QUOTE_MESSAGE =
  "Hola, vengo de allok.fun. Quiero cotizar un Vocero a medida.";

const NAV = [
  { href: "#cuando", label: "¿Es para ti?" },
  { href: "#como-trabajamos", label: "Cómo trabajamos" },
  { href: "#precios", label: "El precio" },
  { href: "/", label: "Los planes" },
];

/** Un hilo de ejemplo. Ilustra el producto — no es la conversación de nadie. */
const THREAD = [
  { from: "them", text: "Hola, ¿tienen el modelo X en talla 42? Lo vi en Instagram" },
  { from: "us", text: "Sí, quedan 3 pares en la sucursal de Las Mercedes y 1 en Chacao. ¿Te reservo uno?" },
  { from: "them", text: "El de Chacao. ¿Hasta qué hora abren?" },
  { from: "us", text: "Hasta las 7. Reservado a tu nombre hasta mañana 12:00, con el código 4471. Te aviso si alguien más lo pide." },
] as const;

const WHEN = [
  {
    head: "Vocero, si…",
    accent: true,
    items: [
      "Hay que consultar un sistema tuyo para responder: inventario, agenda, ERP, un Google Sheet que nadie quiere tocar.",
      "El proceso tiene reglas que no son las de nadie más — turnos, rutas, cupos, comisiones.",
      "Necesitas que el agente escriba de vuelta en ese sistema, no sólo que lea.",
      "Varios números, varias sucursales o varias marcas en una misma operación.",
    ],
  },
  {
    head: "allok, si…",
    accent: false,
    items: [
      "Tu negocio vive de una pregunta que se repite: cupo, precio, hora, disponibilidad.",
      "Quieres empezar esta semana, con un plan y una tarjeta.",
      "El equipo necesita un tablero con etapas, no una integración.",
      "Prefieres pagar una mensualidad fija y que Meta te cobre los mensajes directo.",
    ],
  },
] as const;

const PROCESS = [
  ["Escuchamos la operación", "Una llamada de una hora y acceso de lectura a lo que ya usas. Salimos con el mapa de qué contesta el agente y qué sigue siendo humano."],
  ["Construimos el primer tramo", "El camino que más te duele, funcionando de punta a punta y conectado a tus sistemas reales. No una demo: tu número, tus datos."],
  ["Lo soltamos contigo mirando", "Arranca atendiendo una parte del tráfico, con todo trazado. Ajustamos sobre conversaciones de verdad hasta que responde como responderías tú."],
  ["Queda tuyo", "La cuenta de WhatsApp es de tu empresa y el panel también. Nos quedamos por mantenimiento sólo si lo quieres."],
] as const;

const PRICE_DRIVERS = [
  ["Cuántos sistemas hay que tocar", "Uno con API decente no es lo mismo que tres, uno de ellos sin documentar."],
  ["Si el agente escribe o sólo lee", "Reservar, cobrar o agendar exige reglas, permisos y una vuelta atrás cuando algo sale mal."],
  ["Cuántos caminos distintos atiende", "Un agente que sólo cotiza es un proyecto; uno que cotiza, cobra y posventa son tres."],
  ["Qué pasa cuando no sabe", "Derivar a un humano bien hecho — con contexto y sin repetir— es trabajo, y es lo que decide si la gente vuelve."],
] as const;

export default function VoceroPage() {
  return (
    <div className="allok">
      <div className="allok-void pb-[170px]">
        <SiteHeader
          product="vocero"
          nav={NAV}
          cta={{ href: whatsappUrl(QUOTE_MESSAGE), label: "Cotizar" }}
        />

        <div className="mx-auto max-w-[980px] px-5 pt-10 text-center sm:px-10 sm:pt-20">
          <p className="mono text-[var(--on-void-60)]">Agente de WhatsApp a medida</p>
          <h1 className="hero mt-7">
            Tu operación,
            <br />
            contestando sola.
          </h1>
          <p className="lede mx-auto mt-7 max-w-[600px] text-[var(--on-void-60)]">
            Vocero no es una plantilla con tu logo. Se construye alrededor de
            las reglas que ya tiene tu negocio y habla con los sistemas que ya
            usas — para que la respuesta que da sea la verdadera.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl(QUOTE_MESSAGE)} className="allok-btn allok-btn-solid">
              Contar mi operación
            </a>
            <Link href="#cuando" className="allok-btn border border-[var(--hair-void)] text-[var(--on-void)]">
              ¿Vocero o allok?
            </Link>
          </div>
        </div>
      </div>

      {/* ── El hilo rompe el borde del cielo. REI enseña un tablero; Vocero
             enseña la conversación, que es donde vive. ── */}
      <div className="relative z-[3] -mt-[150px] px-5 sm:px-10">
        <div className="mx-auto max-w-[620px] rounded-[20px] border border-[rgba(16,17,18,.08)] bg-white p-4 shadow-[0_30px_80px_-34px_rgba(0,0,0,.45)] sm:p-6">
          <p className="mono mb-4 text-[var(--ink-60)]">Consulta desde un anuncio · respuesta en 4 s</p>
          <div className="grid gap-2.5">
            {THREAD.map((m) => (
              <div
                key={m.text}
                className={`max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[14.5px] leading-snug ${
                  m.from === "us"
                    ? "justify-self-end bg-[#E7F3EC] text-[var(--ink)]"
                    : "justify-self-start bg-[var(--paper-2)] text-[var(--ink)]"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-[var(--line)] pt-3.5 text-[13px] leading-relaxed text-[var(--ink-60)]">
            Stock por sucursal, horario y reserva con vencimiento — tres
            consultas al sistema del cliente dentro de una sola respuesta.
          </p>
        </div>
      </div>

      <section id="cuando" className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="statement">¿Vocero o allok?</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-60)] text-pretty">
            Son el mismo motor. Cambia cuánto de tu negocio tiene que entender
            antes de abrir la boca.
          </p>
        </div>

        <div className="mt-11 grid gap-4 md:grid-cols-2">
          {WHEN.map((col) => (
            <div
              key={col.head}
              className={`rounded-[22px] border p-7 ${
                col.accent
                  ? "allok-on-ink border-transparent bg-[#101112] text-[#f5f4f0]"
                  : "border-[var(--line)] bg-white"
              }`}
            >
              <h3 className="display-sm text-[22px]">{col.head}</h3>
              <ul className="mt-5 grid gap-3">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-pretty">
                    <span
                      aria-hidden="true"
                      className="mt-[9px] size-[5px] shrink-0 rounded-[2px] bg-[var(--dusk)]"
                    />
                    <span className={col.accent ? "opacity-80" : "text-[var(--ink-60)]"}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              {col.accent ? null : (
                <Link href="/" className="mono mt-3 inline-flex min-h-11 items-center text-[var(--dusk)] underline underline-offset-4">
                  Ver allok ↗
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="como-trabajamos" className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <h2 className="statement">Cómo trabajamos</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map(([title, body], i) => (
            <div key={title} className="border-t border-[var(--line)] pt-5">
              <p className="mono text-[var(--dusk)]">{`0${i + 1}`}</p>
              <h3 className="display-sm mt-3 mb-2 text-[20px]">{title}</h3>
              <p className="text-[15px] leading-relaxed text-[var(--ink-60)] text-pretty">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="precios" className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="mono text-[var(--dusk)]">El precio</p>
            <h2 className="display mt-4 text-[clamp(28px,3.6vw,46px)] text-balance">
              Se cotiza, y la cotización dice por qué.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--ink-60)] text-pretty">
              Un Vocero es un proyecto, no una suscripción: el número lo mueve
              lo que hay que construir alrededor. Después de la llamada tienes
              alcance, plazo y precio cerrado por escrito — sin horas abiertas.
            </p>
            <p className="mt-5 text-[16px] leading-relaxed text-[var(--ink-60)] text-pretty">
              Los mensajes de WhatsApp siempre los factura Meta a tu empresa, a
              su tarifa. Eso no pasa por nosotros ni en Vocero ni en REI.
            </p>
            <a href={whatsappUrl(QUOTE_MESSAGE)} className="allok-btn allok-btn-sky mt-7">
              Pedir cotización
            </a>
          </div>

          <div className="grid content-start gap-px overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--line)]">
            {PRICE_DRIVERS.map(([title, body]) => (
              <div key={title} className="bg-white p-6">
                <h3 className="display-sm text-[17px]">{title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="pt-20 sm:pt-28" />
      <SiteFooter />
    </div>
  );
}
