import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Mail, MessageCircle, Plus } from "lucide-react";
import AllokLogo from "@/components/brand/AllokLogo";
import Waveform from "@/components/brand/Waveform";
import TrackedWhatsappLink from "@/components/analytics/TrackedWhatsappLink";
import Reveal from "@/components/landing/Reveal";
import CinematicHero from "@/components/home/CinematicHero";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";

const CONTACT_URL = whatsappUrl(
  "Hola Allok, vi su sitio y quiero cotizar un proyecto. Mi negocio es:",
);

const NAV = [
  ["Servicios", "#servicios"],
  ["Trabajo", "#trabajo"],
  ["Proceso", "#proceso"],
  ["Precios", "#precios"],
  ["FAQ", "#preguntas"],
  ["WhatsApp", "/whatsapp"],
] as const;

const TRUST = [
  "Primer entregable en 3 días",
  "Precio cerrado, sin sorpresas",
  "El código queda tuyo",
] as const;

const STATS = [
  { label: "Productos en producción", value: "+15" },
  { label: "Primer entregable", value: "3 días" },
  { label: "Precio", value: "Cerrado" },
  { label: "Respuesta", value: "Mismo día" },
] as const;

const SERVICES = [
  {
    id: "vender",
    num: "01",
    kicker: "Aumentar ingresos",
    title: "Web que vende",
    description:
      "Landing pages, sitios y ecommerce diseñados para convertir la atención en una acción: escribir, comprar o agendar.",
    bullets: [
      "Landing de campaña lista en 3 días",
      "Ecommerce y catálogo con checkout",
      "Captura de leads directa a WhatsApp",
      "SEO técnico y velocidad real",
    ],
    stack: ["Next.js", "SEO", "Checkout"],
    cta: "Quiero una web que venda",
    message: "Hola, quiero una web que venda. Mi negocio necesita:",
  },
  {
    id: "operar",
    num: "02",
    kicker: "Reducir costos",
    title: "Automatización con IA",
    description:
      "Si tu equipo copia datos, persigue leads o repite respuestas, convertimos ese trabajo manual en un flujo que se ejecuta y se puede supervisar.",
    bullets: [
      "Agentes de WhatsApp y voz",
      "Flujos n8n + integraciones API",
      "Leads clasificados y enrutados",
      "Reportes automáticos al equipo",
    ],
    stack: ["n8n", "WhatsApp", "Agentes"],
    cta: "Automatizar un proceso",
    message: "Hola, quiero automatizar un proceso. Hoy mi equipo hace esto manualmente:",
  },
  {
    id: "producto",
    num: "03",
    kicker: "Construir",
    title: "Producto a medida",
    description:
      "Cuando la hoja de cálculo ya no alcanza, construimos el sistema que ordena tu operación y abre la puerta a crecer.",
    bullets: [
      "MVP funcional, no maqueta",
      "Next.js + base de datos + auth",
      "Panel de administración",
      "Listo para producción",
    ],
    stack: ["Next.js", "Postgres", "Auth"],
    cta: "Construir mi producto",
    message: "Hola, quiero construir un producto digital. La idea que necesito validar es:",
  },
] as const;

const WORK = [
  {
    name: "REI",
    kind: "Infraestructura inmobiliaria",
    outcome:
      "Marketplace, CRM, administración de propiedades y procesamiento de documentos con IA en un solo sistema.",
    image: "/projects/rei-fm/01-desktop.jpg",
    link: "https://reiprop.tech",
    tags: ["Next.js", "Neon", "IA"],
  },
  {
    name: "Shopea",
    kind: "Comercio por WhatsApp",
    outcome:
      "Catálogo, checkout y pagos en varias monedas conectados a la conversación donde realmente ocurre la venta.",
    image: "/projects/shopea/01-desktop.jpg",
    link: "https://shopea.vercel.app",
    tags: ["Ecommerce", "WhatsApp", "Pagos"],
  },
  {
    name: "Frontia",
    kind: "Agente de voz con IA",
    outcome:
      "Atiende llamadas, califica al interesado y deja el siguiente paso comercial listo para el equipo.",
    image: "/projects/frontai-landing/01-desktop.jpg",
    link: "https://frontai-landing.vercel.app",
    tags: ["Voz", "IA", "CRM"],
  },
  {
    name: "Mística",
    kind: "Operación de escuela",
    outcome:
      "Alumnos, horarios, asistencia, productos y pagos de una escuela de natación dentro de un solo panel.",
    image: "/projects/mistica/01-desktop.jpg",
    link: "/projects/mistica",
    tags: ["Dashboard", "Pagos"],
  },
  {
    name: "Soapy",
    kind: "Logística de servicio",
    outcome:
      "Recepción, estados, rutas, notificaciones y entregas conectadas de principio a fin, sin órdenes perdidas.",
    image: "/projects/soapy/01-desktop.jpg",
    link: "https://soapy-sooty.vercel.app",
    tags: ["Operaciones", "Rutas"],
  },
  {
    name: "Almacén VC",
    kind: "Control de inventario",
    outcome:
      "Movimientos y alertas de stock que evitan compras tardías e inventario invisible.",
    image: "/projects/almacen-vc/01-desktop.jpg",
    link: "https://almacen-vc.vercel.app",
    tags: ["Inventario", "Alertas"],
  },
] as const;

const MARQUEE = [
  "REI",
  "Shopea",
  "Frontia",
  "Mística",
  "Soapy",
  "Almacén VC",
  "Taller Samer",
  "Pace Running",
  "Artistheway",
] as const;

const PROCESS_STEPS = [
  {
    num: "01",
    span: "1–3 días",
    title: "Entendemos el objetivo",
    desc: "El problema de negocio, el usuario final y la acción que necesitamos conseguir.",
  },
  {
    num: "02",
    span: "1–2 días",
    title: "Cerramos alcance y precio",
    desc: "Definimos la pieza que desbloquea el siguiente paso. Alcance y precio cerrados antes de empezar.",
  },
  {
    num: "03",
    span: "1–3 semanas",
    title: "Diseñamos y construimos",
    desc: "Interfaz a medida y software real con tecnologías modernas, no plantillas.",
  },
  {
    num: "04",
    span: "Día de lanzamiento",
    title: "Lanzamos y medimos",
    desc: "Publicamos la versión funcional y observamos cómo la usan de verdad.",
  },
  {
    num: "05",
    span: "Continuo",
    title: "Escalamos con evidencia",
    desc: "Conectamos automatizaciones, CRM o IA cuando los datos dicen que toca.",
  },
] as const;

const PRICING_PLANS = [
  {
    name: "Landing Page",
    price: "USD 199",
    priceNote: "pago único",
    timeline: "Entrega en 3 días",
    badge: "Primer paso rápido",
    description: "Página clara para campañas, Instagram, WhatsApp o validar una oferta.",
    features: [
      "Diseño UX/UI a medida",
      "Desarrollo Next.js ultra rápido",
      "SEO y responsive design",
      "Captura de leads directa por WhatsApp",
    ],
    cta: "Pedir landing page",
    msg: "Hola, quiero pedir la landing page de USD 199 en 3 días con Allok.",
    featured: false,
  },
  {
    name: "Automatización",
    price: "USD 499",
    priceNote: "desde",
    timeline: "5 – 10 días",
    badge: "Más elegido",
    description: "Para equipos que reciben clientes pero pierden horas en seguimiento manual.",
    features: [
      "Flujo de automatización n8n / API",
      "Integración WhatsApp + CRM + formulario",
      "Gestión automática de leads",
      "Documentación y pruebas",
    ],
    cta: "Cotizar automatización",
    msg: "Hola, quiero cotizar una automatización simple desde USD 499 con Allok.",
    featured: true,
  },
  {
    name: "Web / Producto",
    price: "USD 699",
    priceNote: "desde",
    timeline: "10 – 21 días",
    badge: "Proyecto completo",
    description: "Aplicación web completa, MVP, SaaS, dashboard o plataforma a medida.",
    features: [
      "Diseño de interfaz completo",
      "Next.js + base de datos + autenticación",
      "Panel de administración",
      "Lanzamiento listo para producción",
    ],
    cta: "Cotizar web o producto",
    msg: "Hola, quiero cotizar un producto digital completo desde USD 699 con Allok.",
    featured: false,
  },
] as const;

const PLAN_INCLUDES = [
  "Precio cerrado antes de empezar",
  "Comunicación directa por WhatsApp",
  "Código y accesos tuyos",
  "Una ronda de ajustes incluida",
] as const;

export const STUDIO_FAQS = [
  {
    question: "¿Cuánto tarda realmente un proyecto?",
    answer:
      "Una landing page sale en 3 días. Una automatización entre 5 y 10. Un producto completo entre 10 y 21 días, con entregas parciales que puedes ver funcionando desde la primera semana.",
  },
  {
    question: "¿Necesito tener los requerimientos técnicos definidos?",
    answer:
      "No. Empezamos por el problema de negocio, el flujo actual y el objetivo. De ahí sale la arquitectura y el alcance. Si ya traes especificaciones, mejor: acortamos la primera etapa.",
  },
  {
    question: "¿Cómo se usa la inteligencia artificial?",
    answer:
      "De forma útil y supervisada: clasificación automática de leads, agentes de atención por voz o chat, procesamiento de documentos y flujos n8n. Siempre queda claro cuándo debe intervenir una persona.",
  },
  {
    question: "¿Qué pasa después del lanzamiento?",
    answer:
      "El código y los accesos son tuyos. Puedes seguir solo o mantener un acuerdo mensual de mejoras. No hay dependencia obligatoria ni licencias escondidas.",
  },
  {
    question: "¿Cómo se paga?",
    answer:
      "50% para arrancar y 50% contra entrega. Transferencia, USD o pago con tarjeta. El precio se cierra antes de escribir la primera línea de código.",
  },
] as const;

export default function StudioHome() {
  return (
    <div className="studio min-h-screen bg-[var(--studio-bg)] text-[var(--studio-text)] antialiased selection:bg-[#c5f04a] selection:text-black">
      <StudioHeader />

      <main>
        <CinematicHero contactUrl={CONTACT_URL} trust={TRUST} />
        <StatsBar />
        <LogoMarquee />
        <ServicesSection />
        <WorkSection />
        <ProcessSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>

      <StudioFooter />
    </div>
  );
}

/* ── Chrome ──────────────────────────────────────────────────────────── */

function StudioHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--studio-hairline)] bg-[var(--studio-bg)]/75 backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link
          href="/"
          aria-label="Allok"
          className="flex shrink-0 items-center text-[var(--studio-text)]"
        >
          <AllokLogo variant="lockup-bare" className="h-7 w-auto sm:h-[30px]" />
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {NAV.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full px-3.5 py-2 text-[14px] font-medium text-[var(--studio-muted-text)] transition-colors hover:bg-[var(--studio-surface)] hover:text-[var(--studio-text)]"
            >
              {label}
            </a>
          ))}
        </div>

        <TrackedWhatsappLink
          href={CONTACT_URL}
          location="studio_nav"
          offer="studio"
          className="studio-btn studio-btn-accent shrink-0 px-5 py-2.5 text-[14px]"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Hablemos
        </TrackedWhatsappLink>
      </nav>
    </header>
  );
}

/* ── Proof ───────────────────────────────────────────────────────────── */

function StatsBar() {
  return (
    <section
      aria-label="Datos del estudio"
      className="border-y border-[var(--studio-hairline)] bg-[var(--studio-surface)]"
    >
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-[var(--studio-hairline)] sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-[var(--studio-surface)] px-5 py-8 sm:px-8">
            <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--studio-dim-text)]">
              {stat.label}
            </dt>
            <dd className="mt-3 text-[clamp(1.6rem,3vw,2.3rem)] font-semibold tracking-[-0.03em] text-[var(--studio-text)]">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LogoMarquee() {
  return (
    <section
      aria-label="Productos en producción"
      className="border-b border-[var(--studio-hairline)] py-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--studio-dim-text)]">
          — Construidos y en producción
        </p>
        {/* Marquee: duplicated list translated -50%, so the seam never shows. */}
        <div className="studio-marquee-mask overflow-hidden">
          <ul className="flex w-max animate-[project-marquee_38s_linear_infinite] items-center gap-10 pr-10">
            {[...MARQUEE, ...MARQUEE].map((name, i) => (
              <li
                key={`${name}-${i}`}
                aria-hidden={i >= MARQUEE.length}
                className="whitespace-nowrap text-[20px] font-semibold tracking-tight text-[var(--studio-dim-text)] sm:text-[24px]"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Sections ────────────────────────────────────────────────────────── */

function SectionHead({
  label,
  title,
  lead,
  align = "left",
}: {
  label: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--studio-dim-text)]">
        — {label}
      </p>
      <h2 className="mt-5 text-[clamp(2rem,4vw,3.2rem)] font-semibold text-[var(--studio-text)]">
        {title}
      </h2>
      {lead ? (
        <p className="mt-5 text-[17px] leading-relaxed text-[var(--studio-muted-text)] sm:text-[19px]">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

function ServicesSection() {
  return (
    <section
      id="servicios"
      className="scroll-mt-20 border-b border-[var(--studio-hairline)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            label="Servicios"
            title="Elige qué desbloquear primero."
            lead="Más clientes, menos trabajo manual o un producto que ya pueda salir a producción."
          />
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-[20px] border border-[var(--studio-hairline)] bg-[var(--studio-hairline)]">
          {SERVICES.map((service, index) => (
            <Reveal key={service.id} delay={index * 0.06} y={16}>
              <article className="group grid h-full gap-6 bg-[var(--studio-bg)] p-7 transition-colors duration-200 hover:bg-[var(--studio-surface)] md:grid-cols-12 md:gap-10 md:p-10">
                <div className="md:col-span-5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] font-medium text-[var(--studio-accent)]">
                      {service.num}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--studio-dim-text)]">
                      {service.kicker}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold leading-tight text-[var(--studio-text)]">
                    {service.title}
                  </h3>
                  <div className="mt-6 flex flex-wrap gap-1.5">
                    {service.stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-[var(--studio-hairline)] px-2.5 py-1 font-mono text-[11px] text-[var(--studio-muted-text)]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-7">
                  <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--studio-muted-text)]">
                    {service.description}
                  </p>
                  <ul className="mt-7 grid gap-x-8 gap-y-2.5 border-t border-[var(--studio-hairline)] pt-6 sm:grid-cols-2">
                    {service.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-2.5 text-[14px] font-medium text-[var(--studio-muted-text)]"
                      >
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-accent)]"
                          aria-hidden
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <TrackedWhatsappLink
                    href={whatsappUrl(service.message)}
                    location={`studio_service_${service.id}`}
                    offer={service.id}
                    className="mt-8 inline-flex w-fit items-center gap-2 text-[14px] font-semibold text-[var(--studio-text)] transition-transform duration-200 group-hover:translate-x-1"
                  >
                    {service.cta}
                    <ArrowRight className="h-4 w-4 text-[var(--studio-accent)]" aria-hidden />
                  </TrackedWhatsappLink>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkSection() {
  return (
    <section
      id="trabajo"
      className="scroll-mt-20 border-b border-[var(--studio-hairline)] bg-[var(--studio-surface)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHead
              label="Trabajo"
              title="Lo que construimos ya está trabajando."
              lead="Casos reales: productos que reciben clientes, cobran y ordenan operaciones."
            />
            <Link href="/projects" className="studio-btn studio-btn-ghost px-5 py-2.5 text-[14px]">
              Ver todo el archivo
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WORK.map((project, index) => {
            const external = project.link.startsWith("http");
            const Card = (
              <>
                <div className="relative aspect-[16/11] overflow-hidden bg-[var(--studio-bg)]">
                  <Image
                    src={project.image}
                    alt={`${project.name} — ${project.kind}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[21px] font-semibold text-[var(--studio-text)]">
                      {project.name}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--studio-dim-text)]">
                      {project.kind}
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[var(--studio-muted-text)]">
                    {project.outcome}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-1.5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[var(--studio-bg)] px-2.5 py-1 font-mono text-[11px] text-[var(--studio-muted-text)]"
                      >
                        {tag}
                      </span>
                    ))}
                    <ArrowUpRight
                      className="ml-auto h-4 w-4 text-[var(--studio-dim-text)] transition-colors group-hover:text-[var(--studio-accent)]"
                      aria-hidden
                    />
                  </div>
                </div>
              </>
            );

            const className =
              "group flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--studio-hairline)] bg-[var(--studio-raised)] transition-colors duration-200 hover:border-[var(--studio-hairline-strong)]";

            return (
              <Reveal key={project.name} delay={index * 0.06} y={16} className="h-full">
                {external ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {Card}
                  </a>
                ) : (
                  <Link href={project.link} className={className}>
                    {Card}
                  </Link>
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section
      id="proceso"
      className="scroll-mt-20 border-b border-[var(--studio-hairline)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            label="Cómo trabajamos"
            title="Predecible. Auditable. Sin sorpresas."
            lead="Cerramos una primera versión, la ponemos frente a usuarios y usamos lo que ocurre para decidir qué sigue."
          />
        </Reveal>

        <ol className="mt-14 border-t border-[var(--studio-hairline)]">
          {PROCESS_STEPS.map((step, index) => (
            <Reveal key={step.num} delay={index * 0.05} y={12}>
              <li className="grid gap-4 border-b border-[var(--studio-hairline)] py-8 md:grid-cols-12 md:items-baseline md:gap-8">
                <span className="font-mono text-[13px] font-medium text-[var(--studio-accent)] md:col-span-1">
                  {step.num}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--studio-dim-text)] md:col-span-2">
                  {step.span}
                </span>
                <h3 className="text-[20px] font-semibold leading-snug text-[var(--studio-text)] md:col-span-4">
                  {step.title}
                </h3>
                <p className="text-[15px] leading-relaxed text-[var(--studio-muted-text)] md:col-span-5">
                  {step.desc}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      id="precios"
      className="scroll-mt-20 border-b border-[var(--studio-hairline)] bg-[var(--studio-surface)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <SectionHead
            label="Precios"
            title="Un primer entregable claro. Un precio cerrado."
            lead="Empieza con la pieza que desbloquea el siguiente paso, sin alcance difuso ni sorpresas."
            align="center"
          />
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {PRICING_PLANS.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.06} y={16} className="h-full">
              <article
                className={`relative flex h-full flex-col rounded-[20px] border p-8 ${
                  plan.featured
                    ? "border-[var(--studio-accent)]/45 bg-[var(--studio-raised)] shadow-[var(--studio-shadow)]"
                    : "border-[var(--studio-hairline)] bg-[var(--studio-bg)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      plan.featured
                        ? "bg-[var(--studio-accent)] text-black"
                        : "bg-[var(--studio-surface)] text-[var(--studio-muted-text)]"
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--studio-dim-text)]">
                    {plan.timeline}
                  </span>
                </div>

                <h3 className="mt-7 text-[22px] font-semibold tracking-tight text-[var(--studio-text)]">
                  {plan.name}
                </h3>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[38px] font-semibold tracking-tight text-[var(--studio-text)]">
                    {plan.price}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--studio-dim-text)]">
                    {plan.priceNote}
                  </span>
                </div>

                <p className="mt-4 text-[14px] leading-relaxed text-[var(--studio-muted-text)]">
                  {plan.description}
                </p>

                <ul className="mt-7 flex-1 space-y-3 border-t border-[var(--studio-hairline)] pt-7">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2.5 text-[14px] font-medium text-[var(--studio-muted-text)]"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[var(--studio-accent)]"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <TrackedWhatsappLink
                  href={whatsappUrl(plan.msg)}
                  location={`studio_pricing_${plan.name.toLowerCase().replaceAll(" ", "_")}`}
                  offer={plan.name}
                  className={`studio-btn mt-8 w-full ${
                    plan.featured ? "studio-btn-accent" : "studio-btn-solid"
                  }`}
                >
                  {plan.cta}
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </TrackedWhatsappLink>
              </article>
            </Reveal>
          ))}
        </div>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {PLAN_INCLUDES.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[14px] font-medium text-[var(--studio-muted-text)]"
            >
              <Check className="h-4 w-4 shrink-0 text-[var(--studio-accent)]" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section
      id="preguntas"
      className="scroll-mt-20 border-b border-[var(--studio-hairline)] py-20 sm:py-28"
    >
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal>
          <SectionHead label="Preguntas frecuentes" title="Antes de escribirnos." />
        </Reveal>

        <div className="mt-12 divide-y divide-[var(--studio-hairline)] border-y border-[var(--studio-hairline)]">
          {STUDIO_FAQS.map((faq) => (
            <details key={faq.question} className="group py-6">
              <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-4 text-[18px] font-semibold leading-snug text-[var(--studio-text)] sm:text-[20px]">
                <span>{faq.question}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--studio-hairline-strong)] transition-transform duration-200 group-open:rotate-45">
                  <Plus className="h-4 w-4 text-[var(--studio-accent)]" aria-hidden />
                </span>
              </summary>
              <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-[var(--studio-muted-text)]">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-40%] h-[80%]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(197,240,74,0.14) 0%, rgba(197,240,74,0) 70%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--studio-dim-text)]">
          — Contacto
        </p>
        <h2 className="mt-5 text-[clamp(2.1rem,4.6vw,3.6rem)] font-semibold text-[var(--studio-text)]">
          Dinos qué está frenando el crecimiento.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-[var(--studio-muted-text)] sm:text-[19px]">
          Te respondemos el mismo día con la primera pieza que construiríamos, el alcance
          y el precio. Sin formularios largos ni llamadas de descubrimiento eternas.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <TrackedWhatsappLink
            href={CONTACT_URL}
            location="studio_final"
            offer="studio"
            className="studio-btn studio-btn-accent w-full sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Escribir por WhatsApp
          </TrackedWhatsappLink>
          <a href={`mailto:${CONTACT_EMAIL}`} className="studio-btn studio-btn-ghost w-full sm:w-auto">
            <Mail className="h-5 w-5" aria-hidden />
            Enviar un correo
          </a>
        </div>
      </div>
    </section>
  );
}

function StudioFooter() {
  return (
    <footer className="border-t border-[var(--studio-hairline)] bg-[var(--studio-surface)]">
      {/* The mark, full width — the page signs off with the same signal it opens with. */}
      <Waveform className="h-24 w-full text-white/[0.07] sm:h-32" cycles={26} weight={2.2} />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 pb-12 sm:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <AllokLogo variant="lockup-bare" className="h-8 w-auto text-[var(--studio-text)]" />
            <p className="mt-3 max-w-sm text-[15px] text-[var(--studio-muted-text)]">
              Estudio de producto digital. Diseño, software y automatización con IA para
              convertir oportunidades en negocio y trabajo manual en sistema.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-medium text-[var(--studio-muted-text)]">
            {NAV.map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="transition-colors hover:text-[var(--studio-text)]"
              >
                {label}
              </a>
            ))}
            <Link href="/projects" className="transition-colors hover:text-[var(--studio-text)]">
              Archivo
            </Link>
          </nav>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-[var(--studio-hairline)] pt-7 text-[14px] text-[var(--studio-dim-text)] sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Allok</span>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <TrackedWhatsappLink
              href={CONTACT_URL}
              location="studio_footer"
              offer="studio"
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--studio-text)]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
            </TrackedWhatsappLink>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--studio-text)]"
            >
              <Mail className="h-4 w-4" aria-hidden /> {CONTACT_EMAIL}
            </a>
            <Link href="/es/privacidad" className="transition-colors hover:text-[var(--studio-text)]">
              Privacidad
            </Link>
            <Link href="/es/terminos" className="transition-colors hover:text-[var(--studio-text)]">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
