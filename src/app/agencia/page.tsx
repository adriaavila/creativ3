import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/contact";
import SiteHeader from "@/components/allok/SiteHeader";
import SiteFooter from "@/components/allok/SiteFooter";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";

const TITLE = "Agencia — más clientes, menos trabajo manual";
const DESCRIPTION =
  "Landings, automatizaciones y software a medida, listos para mover tu negocio. Primer entregable en 3 días, con precio cerrado antes de escribir la primera línea de código.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/agencia" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/agencia", type: "website", locale: "es" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const NAV = [
  { href: "#servicios", label: "Servicios" },
  { href: "#como-trabajamos", label: "Cómo trabajamos" },
  { href: "#precios", label: "Precios" },
];

const QUOTE_MESSAGE =
  "Hola, vengo de allok.fun. Quiero cotizar un proyecto. Mi negocio es:";

/**
 * Los tres servicios, rescatados del sitio de agencia de 2026-08. El WhatsApp
 * salió de aquí a propósito: eso hoy es REI o Vocero, y mandar a la gente al
 * lugar correcto vale más que sumar una cuarta tarjeta.
 */
const SERVICES = [
  {
    kicker: "Aumentar ingresos",
    name: "Web que vende",
    body: "Landing pages, sitios y ecommerce diseñados para convertir la atención en una acción: escribir, comprar o agendar.",
    items: [
      "Landing de campaña lista en 3 días",
      "Ecommerce y catálogo con checkout",
      "Captura de leads directa a WhatsApp",
      "SEO técnico y velocidad real",
    ],
    message: "Hola, quiero una web que venda. Mi negocio necesita:",
    action: "Quiero una web que venda",
  },
  {
    kicker: "Reducir costos",
    name: "Automatización con IA",
    body: "Si tu equipo copia datos, persigue leads o repite respuestas, convertimos ese trabajo manual en un flujo que se ejecuta y se puede supervisar.",
    items: [
      "Agentes de voz y flujos n8n",
      "Integraciones por API con lo que ya usas",
      "Leads clasificados y enrutados",
      "Reportes automáticos al equipo",
    ],
    message: "Hola, quiero automatizar un proceso. Hoy mi equipo hace esto manualmente:",
    action: "Automatizar un proceso",
  },
  {
    kicker: "Construir",
    name: "Producto a medida",
    body: "Cuando la hoja de cálculo ya no alcanza, construimos el sistema que ordena tu operación y abre la puerta a crecer.",
    items: [
      "MVP funcional, no maqueta",
      "Next.js + base de datos + autenticación",
      "Panel de administración",
      "Listo para producción",
    ],
    message: "Hola, quiero construir un producto digital. La idea que necesito validar es:",
    action: "Construir mi producto",
  },
] as const;

const PROCESS = [
  ["Entendemos el objetivo", "El problema de negocio, el usuario final y la acción que necesitamos conseguir."],
  ["Cerramos alcance y precio", "Definimos la pieza que desbloquea el siguiente paso. Alcance y precio cerrados antes de empezar."],
  ["Diseñamos y construimos", "Interfaz a medida y software real con tecnologías modernas, no plantillas."],
  ["Lanzamos y medimos", "Publicamos la versión funcional y observamos cómo la usan de verdad."],
  ["Escalamos con evidencia", "Conectamos automatizaciones, CRM o IA cuando los datos dicen que toca."],
] as const;

const PLANS = [
  {
    badge: "Primer paso rápido",
    name: "Landing Page",
    price: "199",
    note: "pago único",
    eta: "Entrega en 3 días",
    line: "Página clara para campañas, Instagram, WhatsApp o validar una oferta.",
    items: [
      "Diseño UX/UI a medida",
      "Desarrollo Next.js ultra rápido",
      "SEO y responsive design",
      "Captura de leads directa por WhatsApp",
    ],
    action: "Pedir landing page",
    message: "Hola, quiero una landing page. La campaña o la oferta es:",
    featured: false,
  },
  {
    badge: "Más elegido",
    name: "Automatización",
    price: "499",
    note: "desde",
    eta: "5 – 10 días",
    line: "Para equipos que reciben clientes pero pierden horas en seguimiento manual.",
    items: [
      "Flujo de automatización n8n / API",
      "Integración con CRM, formularios y tus sistemas",
      "Gestión automática de leads",
      "Documentación y pruebas",
    ],
    action: "Cotizar automatización",
    message: "Hola, quiero cotizar una automatización. El proceso manual que quiero cortar es:",
    featured: true,
  },
  {
    badge: "Proyecto completo",
    name: "Web / Producto",
    price: "699",
    note: "desde",
    eta: "10 – 21 días",
    line: "Aplicación web completa, MVP, SaaS, dashboard o plataforma a medida.",
    items: [
      "Diseño de interfaz completo",
      "Next.js + base de datos + autenticación",
      "Panel de administración",
      "Lanzamiento listo para producción",
    ],
    action: "Cotizar web o producto",
    message: "Hola, quiero cotizar una web o producto. La idea es:",
    featured: false,
  },
] as const;

const INCLUDES = [
  "Precio cerrado antes de empezar",
  "Comunicación directa por WhatsApp",
  "Código y accesos tuyos",
  "Una ronda de ajustes incluida",
] as const;

const FAQS = [
  [
    "¿Cuánto tarda realmente un proyecto?",
    "Una landing page sale en 3 días. Una automatización entre 5 y 10. Un producto completo entre 10 y 21 días, con entregas parciales que puedes ver funcionando desde la primera semana.",
  ],
  [
    "¿Necesito tener los requerimientos técnicos definidos?",
    "No. Empezamos por el problema de negocio, el flujo actual y el objetivo. De ahí sale la arquitectura y el alcance. Si ya traes especificaciones, mejor: acortamos la primera etapa.",
  ],
  [
    "¿Cómo se usa la inteligencia artificial?",
    "De forma útil y supervisada: clasificación automática de leads, agentes de atención por voz o chat, procesamiento de documentos y flujos n8n. Siempre queda claro cuándo debe intervenir una persona.",
  ],
  [
    "¿Qué pasa después del lanzamiento?",
    "El código y los accesos son tuyos. Puedes seguir solo o mantener un acuerdo mensual de mejoras. No hay dependencia obligatoria ni licencias escondidas.",
  ],
  [
    "¿Cómo se paga?",
    "50% para arrancar y 50% contra entrega. Transferencia, USD o pago con tarjeta. El precio se cierra antes de escribir la primera línea de código.",
  ],
  [
    "¿Y si lo que necesito es atender WhatsApp?",
    "Eso es un producto, no un proyecto de agencia. Si vendes propiedades, REI ya lo hace por una mensualidad fija. Si tu operación tiene reglas propias, es un Vocero a medida.",
  ],
] as const;

export default function AgenciaPage() {
  const live = PORTFOLIO_PROJECTS.filter((p) => p.status === "launched").length;

  return (
    <div className="allok">
      <div className="allok-void pb-[150px]">
        <SiteHeader
          nav={NAV}
          cta={{ href: whatsappUrl(QUOTE_MESSAGE), label: "Hablemos" }}
        />

        <div className="mx-auto max-w-[1000px] px-5 pt-10 text-center sm:px-10 sm:pt-20">
          <p className="mono text-[var(--on-void-60)]">Para negocios que ya no pueden crecer a pulso</p>
          <h1 className="hero mt-7">
            Más clientes.
            <br />
            Menos trabajo manual.
          </h1>
          <p className="lede mx-auto mt-7 max-w-[620px] text-[var(--on-void-60)]">
            Landings, automatizaciones y software a medida, listos para mover tu
            negocio. El primer entregable sale entre 3 y 21 días según la pieza, siempre con precio cerrado.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <a href={whatsappUrl(QUOTE_MESSAGE)} className="allok-btn allok-btn-solid">
              Empezar mi proyecto
            </a>
            <Link href="/portfolio" className="allok-btn border border-[var(--hair-void)] text-[var(--on-void)]">
              Ver lo que ya funciona
            </Link>
          </div>
          <p className="mono mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[var(--on-void-60)]">
            <span>Primer entregable desde 3 días</span>
            <span aria-hidden="true">·</span>
            <span>Precio cerrado, sin sorpresas</span>
            <span aria-hidden="true">·</span>
            <span>{live} productos en producción</span>
          </p>
        </div>
      </div>

      {/* ── Los servicios rompen el borde del cielo ── */}
      <section id="servicios" className="relative z-[3] -mt-[110px] px-5 sm:px-10">
        <div className="mx-auto grid max-w-[1200px] gap-4 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <div
              key={service.name}
              className="grid content-start rounded-[22px] border border-[rgba(16,17,18,.08)] bg-white p-7 shadow-[0_30px_80px_-38px_rgba(0,0,0,.45)]"
            >
              <p className="mono text-[var(--dusk)]">{service.kicker}</p>
              <h2 className="display-sm mt-4 text-[24px]">{service.name}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-60)] text-pretty">
                {service.body}
              </p>
              <ul className="mt-5 grid gap-2.5 border-t border-[var(--line)] pt-5">
                {service.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-snug">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] size-[5px] shrink-0 rounded-[2px] bg-[var(--dusk)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={whatsappUrl(service.message)}
                className="mono mt-3 inline-flex min-h-11 items-center text-[var(--dusk)] underline underline-offset-4"
              >
                {service.action} ↗
              </a>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-7 max-w-[720px] text-center text-[14.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
          ¿Lo que necesitas es atender WhatsApp? Eso ya es un producto:{" "}
          <Link href="/rei" className="underline underline-offset-4">REI</Link> si vendes
          propiedades, y el CRM genérico está en la{" "}
          <Link href="/vocero" className="underline underline-offset-4">Vocero</Link> si tu
          operación tiene reglas propias.
        </p>
      </section>

      {/* ── La prueba vive en el portafolio, no aquí ── */}
      <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="grid gap-10 border-t border-[var(--line)] pt-10 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="mono text-[var(--dusk)]">El trabajo</p>
            <h2 className="statement mt-4">Lo que construimos ya está trabajando.</h2>
          </div>
          <div>
            <p className="text-[16px] leading-relaxed text-[var(--ink-60)] text-pretty">
              Casos reales: productos que reciben clientes, cobran y ordenan
              operaciones. Cada captura del portafolio es el sistema corriendo,
              con el stack y el enlace vivo cuando existe.
            </p>
            <Link
              href="/portfolio"
              className="allok-btn mt-6 border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
            >
              Ver el portafolio
            </Link>
          </div>
        </div>
      </section>

      <section id="como-trabajamos" className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="statement">Lanzamos algo útil. Escalamos con evidencia.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-60)] text-pretty">
            Cerramos una primera versión, la ponemos frente a usuarios y usamos
            lo que ocurre para decidir qué sigue.
          </p>
        </div>
        <div className="mt-11 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {PROCESS.map(([title, body], i) => (
            <div key={title} className="border-t border-[var(--line)] pt-5">
              <p className="mono text-[var(--dusk)]">{`0${i + 1}`}</p>
              <h3 className="display-sm mt-3 mb-2 text-[19px]">{title}</h3>
              <p className="text-[14.5px] leading-relaxed text-[var(--ink-60)] text-pretty">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="precios" className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="mx-auto max-w-[640px] text-center">
          <h2 className="statement">Un primer entregable claro. Un precio cerrado.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--ink-60)] text-pretty">
            Empieza con la pieza que desbloquea el siguiente paso, sin alcance
            difuso ni sorpresas.
          </p>
        </div>

        <div className="mt-11 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`grid content-start rounded-[22px] border p-7 ${
                plan.featured
                  ? "border-transparent bg-[#101112] text-[#f5f4f0]"
                  : "border-[var(--line)] bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="display-sm text-xl">{plan.name}</h3>
                <span
                  className={`mono ${
                    plan.featured ? "text-[var(--lit-dawn)]" : "text-[var(--ink-40)]"
                  }`}
                >
                  {plan.badge}
                </span>
              </div>
              <p className="display mt-4 text-[48px]">
                ${plan.price}
                <span className="align-baseline text-[15px] font-normal tracking-normal opacity-55">
                  {" "}
                  USD · {plan.note}
                </span>
              </p>
              <p className="mono mt-2 text-[var(--dusk)]">{plan.eta}</p>
              <p className="mt-3 mb-5 text-[14.5px] leading-relaxed opacity-70">{plan.line}</p>

              <a
                href={whatsappUrl(plan.message)}
                className={`allok-btn w-full !py-3.5 !text-[15px] ${
                  plan.featured
                    ? "allok-btn-sky"
                    : "border border-[rgba(16,17,18,.22)] text-[var(--ink)]"
                }`}
              >
                {plan.action}
              </a>

              <ul
                className={`mt-5 grid gap-2.5 border-t pt-4.5 ${
                  plan.featured
                    ? "border-[rgba(245,244,240,.14)]"
                    : "border-[var(--line)]"
                }`}
              >
                {plan.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-snug">
                    <span
                      aria-hidden="true"
                      className="mt-[7px] size-[5px] shrink-0 rounded-[2px] bg-[var(--dusk)]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <ul className="mono mt-8 flex flex-wrap justify-center gap-x-7 gap-y-2.5 text-[var(--ink-60)]">
          {INCLUDES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="preguntas" className="mx-auto max-w-[840px] px-5 pt-20 sm:px-10 sm:pt-28">
        <h2 className="statement">Antes de empezar, esto es lo importante.</h2>
        <div className="mt-9 border-t border-[var(--line)]">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group border-b border-[var(--line)]">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[17px] font-medium leading-snug marker:hidden">
                {q}
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-[var(--dusk)] transition-transform duration-200 ease-[cubic-bezier(.23,1,.32,1)] group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[68ch] pb-6 text-[15.5px] leading-relaxed text-[var(--ink-60)] text-pretty">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pt-20 sm:px-10 sm:pt-28">
        <div className="allok-sky rounded-[26px] px-7 py-14 text-center sm:px-14 sm:py-20">
          <h2 className="hero !text-[clamp(2rem,4.6vw,3.75rem)]">Dinos qué está frenando el crecimiento.</h2>
          <p className="mx-auto mt-5 max-w-[620px] text-[17px] leading-relaxed opacity-85 text-pretty">
            Te respondemos el mismo día con la primera pieza que
            construiríamos, el alcance y el precio. Sin formularios largos ni
            llamadas de descubrimiento eternas.
          </p>
          <a href={whatsappUrl(QUOTE_MESSAGE)} className="allok-btn allok-btn-solid mt-8">
            Escribir por WhatsApp
          </a>
        </div>
      </section>

      <div className="pt-20 sm:pt-28" />
      <SiteFooter />
    </div>
  );
}
