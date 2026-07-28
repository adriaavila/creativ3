import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Mail, MessageCircle, Plus } from "lucide-react";
import CreativvLogo from "@/components/landing/CreativvLogo";
import ProjectImageCarousel from "@/components/projects/ProjectImageCarousel";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";
import HeroHands from "./HeroHands";
import ManifiestoMotionType from "./ManifiestoMotionType";

const CONTACT_URL = whatsappUrl(
  "Hola creativv, vi su sitio y quiero hablar de un proyecto. Lo que necesito construir es:",
);

const CURATED_PRODUCTS = [
  {
    id: "rei-fm",
    name: "REI",
    subtitle: "Una nueva infraestructura para el mercado inmobiliario.",
    description:
      "Marketplace, CRM, administración de propiedades, portal de residentes y procesamiento de documentos con IA supervisada.",
    highlight:
      "REI conecta las distintas partes de una operación inmobiliaria que normalmente viven separadas.",
    cta: "Explorar REI →",
    link: "https://reiprop.tech",
    isExternal: true,
  },
  {
    id: "shopea",
    name: "Shopea",
    subtitle: "Una forma más simple de vender por WhatsApp.",
    description:
      "Catálogo, checkout y pagos en distintas monedas dentro de una experiencia construida alrededor de cómo realmente compran las personas.",
    highlight:
      "Shopea conecta el descubrimiento de un producto con la conversación donde ocurre la venta.",
    cta: "Explorar Shopea →",
    link: "https://shopea.vercel.app",
    isExternal: true,
  },
  {
    id: "frontai-landing",
    name: "Frontia",
    subtitle: "Conversaciones que se convierten en acciones.",
    description:
      "Un agente de voz con IA que atiende, entiende, califica y organiza cada interacción.",
    highlight:
      "Frontia conecta una llamada con el siguiente paso del proceso comercial.",
    cta: "Explorar Frontia →",
    link: "https://frontai-landing.vercel.app",
    isExternal: true,
  },
  {
    id: "mistica",
    name: "Mística",
    subtitle: "La operación detrás de una experiencia de bienestar.",
    description:
      "Alumnos, horarios, asistencia, productos y pagos dentro de un sistema creado para una escuela de natación.",
    highlight:
      "Mística conecta la experiencia de cada alumno con la operación que la hace posible.",
    cta: "Explorar Mística →",
    link: "/projects/mistica",
    isExternal: false,
  },
  {
    id: "soapy",
    name: "Soapy",
    subtitle: "Cada orden conectada de principio a fin.",
    description:
      "Recepción, estados, rutas, notificaciones y entregas dentro de una sola experiencia operativa.",
    highlight:
      "Soapy conecta cada parte del servicio para que nada se pierda en el camino.",
    cta: "Explorar Soapy →",
    link: "https://soapy-sooty.vercel.app",
    isExternal: true,
  },
] as const;

const PROCESS_STEPS = [
  {
    num: "01",
    title: "Entendemos tu objetivo",
    desc: "Identificamos el problema de negocio, el usuario final y la acción clave que necesitamos conseguir.",
  },
  {
    num: "02",
    title: "Elegimos el plan correcto",
    desc: "Definimos el alcance óptimo y el primer entregable funcional sin inflar costos ni tiempo.",
  },
  {
    num: "03",
    title: "Diseñamos y desarrollamos",
    desc: "Creamos la interfaz visual UX/UI y construimos el software con tecnologías modernas.",
  },
  {
    num: "04",
    title: "Lanzamos",
    desc: "Publicamos la versión funcional y medimos la interacción y recepción real de los usuarios.",
  },
  {
    num: "05",
    title: "Mejoramos o automatizamos",
    desc: "Escalamos con evidencia conectando automatizaciones, CRM, IA o agregando nuevas funciones.",
  },
] as const;

const PRICING_PLANS = [
  {
    name: "Landing Page",
    price: "USD 199",
    timeline: "Entregable en 3 días",
    badge: "Primer paso rápido",
    description: "Página clara y moderna para campañas, Instagram, WhatsApp o validar tu oferta.",
    features: [
      "Diseño UX/UI a medida",
      "Desarrollo Next.js ultra rápido",
      "SEO y responsive design",
      "Captura de leads directa por WhatsApp",
    ],
    cta: "Pedir landing page",
    msg: "Hola, quiero pedir la landing page de USD 199 en 3 días con creativv.",
    featured: false,
  },
  {
    name: "Automatización Simple",
    price: "Desde USD 499",
    timeline: "5 – 10 días",
    badge: "Eficiencia operativa",
    description: "Para equipos que reciben clientes pero pierden tiempo en seguimiento manual.",
    features: [
      "Flujo de automatización n8n / API",
      "Integración WhatsApp + CRM + Formulario",
      "Gestión automática de leads",
      "Documentación y pruebas",
    ],
    cta: "Cotizar automatización",
    msg: "Hola, quiero cotizar una automatización simple desde USD 499 con creativv.",
    featured: true,
  },
  {
    name: "Web / Producto",
    price: "Desde USD 699",
    timeline: "10 – 21 días",
    badge: "Proyecto completo",
    description: "Aplicación web completa, MVP, SaaS, dashboard o plataforma a medida.",
    features: [
      "Diseño de interfaz completo",
      "Next.js + Base de datos + Autenticación",
      "Panel de administración / Dashboard",
      "Lanzamiento listo para producción",
    ],
    cta: "Cotizar web o producto",
    msg: "Hola, quiero cotizar un producto digital completo desde USD 699 con creativv.",
    featured: false,
  },
] as const;

const STUDIO_FAQS = [
  {
    question: "¿Qué tipo de proyectos construyen en Creativv?",
    answer:
      "Construimos productos digitales completos, aplicaciones web, prototipos de alta fidelidad, sistemas de gestión, agentes de atención con IA e integraciones operativas con WhatsApp.",
  },
  {
    question: "¿Cuánto tarda el desarrollo de un proyecto?",
    answer:
      "Una landing page o prototipo esencial puede estar listo en 1 a 2 semanas. Sistemas más complejos o SaaS se organizan en ciclos continuos de sprint.",
  },
  {
    question: "¿Necesito tener todos los requerimientos técnicos definidos?",
    answer:
      "No. Empezamos analizando el problema de negocio, el flujo actual y el objetivo. A partir de allí definimos la arquitectura y el alcance óptimo.",
  },
  {
    question: "¿Cómo se integra la Inteligencia Artificial?",
    answer:
      "La usamos de forma útil y supervisada: clasificación automática de leads, agentes de atención por voz o chat, procesamiento inteligente de documentos y flujos n8n.",
  },
] as const;

export default function StudioHome() {
  return (
    <div className="studio min-h-screen bg-white text-black antialiased selection:bg-neutral-900 selection:text-white">
      <StudioHeader />

      <main>
        <HeroHands contactUrl={CONTACT_URL} />

        <ObservarSection />
        <ProductosSection />
        <ExperimentosSection />
        <StudioProcessSection />
        <StudioPreciosSection />
        <StudioFaqSection />
        <PensarSection />
      </main>

      <StudioFooter />
    </div>
  );
}

function StudioHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b bg-white/85 backdrop-blur-xl backdrop-saturate-150"
      style={{ borderColor: "var(--studio-hairline)" }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" aria-label="creativv" className="flex items-center text-black">
          <CreativvLogo variant="lockup-bare" className="h-7 sm:h-8 w-auto text-black" />
        </Link>

        <div
          className="hidden items-center gap-1 rounded-full px-2 py-1 md:flex"
          style={{ background: "var(--studio-surface)" }}
        >
          {[
            ["Manifiesto", "#observar"],
            ["Productos", "#productos"],
            ["Experimentos", "#experimentos"],
            ["Proceso", "#proceso"],
            ["Precios", "#precios"],
            ["FAQ", "#preguntas"],
            ["Archivo", "/projects"],
          ].map(([label, href]) =>
            href.startsWith("/") ? (
              <Link
                key={href}
                href={href}
                className="rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors hover:bg-white text-neutral-600 hover:text-black"
              >
                {label}
              </Link>
            ) : (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors hover:bg-white text-neutral-600 hover:text-black"
              >
                {label}
              </a>
            )
          )}
        </div>

        <a
          href={CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-black py-1.5 pl-1.5 pr-4 text-[14px] font-medium text-white transition-transform duration-200 active:scale-[0.97]"
        >
          <Image src="/hero/arrow-circle.svg" alt="" width={24} height={24} className="invert" />
          Hablemos
        </a>
      </nav>
    </header>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.2em]"
      style={{ color: "var(--studio-muted)" }}
    >
      {children}
    </p>
  );
}

function ObservarSection() {
  return (
    <section
      id="observar"
      className="scroll-mt-20 border-y py-24 sm:py-32"
      style={{ borderColor: "var(--studio-hairline)", background: "var(--studio-surface)" }}
    >
      <ManifiestoMotionType />
    </section>
  );
}

function ProductosSection() {
  return (
    <section id="productos" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
      <SectionLabel>Portfolio</SectionLabel>
      <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold tracking-tight text-black">
        Productos
      </h2>

      <div className="mt-14 space-y-16">
        {CURATED_PRODUCTS.map((prod, index) => {
          const portfolioItem = PORTFOLIO_PROJECTS.find((p) => p.id === prod.id);
          const images = portfolioItem?.images || [];
          const stack = portfolioItem?.stack || [];

          return (
            <article
              key={prod.id}
              className="group overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-xl bg-white"
              style={{ borderColor: "var(--studio-hairline)" }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {images.length > 0 && (
                  <div className="p-3 bg-[#f8f8f8] border-b lg:border-b-0 lg:border-r border-[#ebebeb] lg:col-span-6 flex items-center justify-center">
                    <ProjectImageCarousel
                      images={images}
                      projectName={prod.name}
                      stack={stack}
                      tone="light"
                    />
                  </div>
                )}

                <div className={`flex flex-col justify-between p-8 sm:p-10 ${images.length > 0 ? "lg:col-span-6" : "lg:col-span-12"}`}>
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[12px] font-semibold uppercase tracking-widest text-neutral-400">
                        Producto 0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-3 text-[32px] sm:text-[38px] font-bold tracking-tight text-black">
                      {prod.name}
                    </h3>
                    <p className="mt-2 text-[18px] font-semibold leading-snug text-neutral-900">
                      {prod.subtitle}
                    </p>

                    <p className="mt-4 text-[15px] sm:text-[16px] leading-relaxed text-neutral-600">
                      {prod.description}
                    </p>

                    <div className="mt-6 rounded-2xl bg-[#f8f8f8] p-4 text-[14px] font-medium leading-relaxed text-neutral-800 border border-[#eee]">
                      {prod.highlight}
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                    <div className="flex flex-wrap gap-1.5">
                      {stack.map((item) => (
                        <span
                          key={item}
                          className="rounded-full px-3 py-1 text-[12px] font-medium"
                          style={{ background: "var(--studio-surface)", color: "var(--studio-muted-text)" }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    {prod.isExternal ? (
                      <a
                        href={prod.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[15px] font-bold text-black underline underline-offset-4 transition-colors hover:text-neutral-600 shrink-0"
                      >
                        {prod.cta}
                      </a>
                    ) : (
                      <Link
                        href={prod.link}
                        className="inline-flex items-center gap-1.5 text-[15px] font-bold text-black underline underline-offset-4 transition-colors hover:text-neutral-600 shrink-0"
                      >
                        {prod.cta}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ExperimentosSection() {
  return (
    <section
      id="experimentos"
      className="scroll-mt-20 border-t py-24 sm:py-32"
      style={{ borderColor: "var(--studio-hairline)", background: "var(--studio-surface)" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel>Exploraciones</SectionLabel>
        <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold tracking-tight text-black">
          Experimentos
        </h2>
        <p className="mt-3 text-[20px] sm:text-[24px] font-semibold text-neutral-900 leading-snug max-w-3xl">
          Algunas conexiones necesitan construirse para poder entenderse.
        </p>

        <div className="mt-8 max-w-3xl space-y-4 text-[16px] sm:text-[18px] leading-relaxed text-neutral-700">
          <p>
            También desarrollo ideas pequeñas, prototipos e interfaces para explorar nuevas formas de usar software e inteligencia artificial.
          </p>
          <p>
            No todos los experimentos necesitan convertirse en empresas.
          </p>
          <p>
            Algunos existen para descubrir una interacción, aprender una tecnología o encontrar la siguiente pregunta.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3.5 text-[15px] font-semibold text-white transition-all hover:scale-105 active:scale-[0.97]"
          >
            Ver experimentos →
          </Link>
        </div>
      </div>
    </section>
  );
}

function StudioProcessSection() {
  return (
    <section
      id="proceso"
      className="scroll-mt-20 border-t py-24 sm:py-32 bg-white"
      style={{ borderColor: "var(--studio-hairline)" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel>Proceso</SectionLabel>
        <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold tracking-tight text-black">
          Rápido, práctico y con el primer entregable claro.
        </h2>
        <p className="mt-3 text-[18px] sm:text-[20px] text-neutral-600 max-w-2xl">
          Un flujo directo en 5 etapas para pasar de la idea a una solución en producción.
        </p>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-5 gap-4">
          {PROCESS_STEPS.map((step) => (
            <article
              key={step.num}
              className="flex flex-col justify-between rounded-3xl border p-6 bg-white transition-all duration-200 hover:shadow-md"
              style={{ borderColor: "var(--studio-hairline)" }}
            >
              <div>
                <span className="font-mono text-[13px] font-semibold uppercase tracking-widest text-neutral-400">
                  {step.num}
                </span>
                <h3 className="mt-4 text-[20px] font-bold text-black leading-snug">
                  {step.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-neutral-600">
                  {step.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudioPreciosSection() {
  return (
    <section
      id="precios"
      className="scroll-mt-20 border-t py-24 sm:py-32"
      style={{ borderColor: "var(--studio-hairline)", background: "var(--studio-surface)" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionLabel>Propuesta & Precios</SectionLabel>
        <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold tracking-tight text-black">
          Planes claros, precios a la vista.
        </h2>
        <p className="mt-3 text-[18px] sm:text-[20px] text-neutral-600 max-w-2xl">
          Transparencia desde la primera conversación. Comenzamos por la versión que produce el mayor resultado.
        </p>

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
                plan.featured ? "bg-black text-white shadow-xl" : "bg-white text-black shadow-sm"
              }`}
              style={{ borderColor: plan.featured ? "#000000" : "var(--studio-hairline)" }}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                      plan.featured ? "bg-neutral-800 text-neutral-200" : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {plan.badge}
                  </span>
                  <span className={`text-[13px] font-medium ${plan.featured ? "text-neutral-400" : "text-neutral-500"}`}>
                    {plan.timeline}
                  </span>
                </div>

                <h3 className="mt-6 text-[28px] font-bold tracking-tight">{plan.name}</h3>
                <div className={`mt-2 text-[26px] font-bold ${plan.featured ? "text-white" : "text-black"}`}>
                  {plan.price}
                </div>

                <p className={`mt-4 text-[14px] leading-relaxed ${plan.featured ? "text-neutral-300" : "text-neutral-600"}`}>
                  {plan.description}
                </p>

                <div className="mt-8 space-y-3">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2.5 text-[14px] font-medium">
                      <Check className={`h-4 w-4 shrink-0 ${plan.featured ? "text-white" : "text-black"}`} />
                      <span className={plan.featured ? "text-neutral-200" : "text-neutral-700"}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-neutral-200/20">
                <a
                  href={whatsappUrl(plan.msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold transition-transform active:scale-[0.98] ${
                    plan.featured
                      ? "bg-white text-black hover:bg-neutral-100"
                      : "bg-black text-white hover:bg-neutral-800"
                  }`}
                >
                  {plan.cta}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function StudioFaqSection() {
  return (
    <section
      id="preguntas"
      className="scroll-mt-20 border-t py-24 sm:py-32 bg-white"
      style={{ borderColor: "var(--studio-hairline)" }}
    >
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <SectionLabel>Preguntas frecuentes</SectionLabel>
        <h2 className="mt-4 text-[clamp(2.2rem,4.5vw,3.8rem)] font-bold tracking-tight text-black">
          Despejando dudas antes de construir
        </h2>
        <p className="mt-4 text-[18px] text-neutral-600">
          Respuestas a las preguntas comunes sobre nuestro proceso de trabajo y desarrollo.
        </p>

        <div className="mt-12 space-y-4">
          {STUDIO_FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border p-6 text-black transition-colors [&[open]]:bg-neutral-50"
              style={{ borderColor: "var(--studio-hairline)" }}
            >
              <summary className="flex cursor-pointer items-center justify-between text-[18px] sm:text-[20px] font-semibold leading-snug list-none select-none">
                <span>{faq.question}</span>
                <span className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-300 transition-transform duration-200 group-open:rotate-45">
                  <Plus className="h-4 w-4 text-black" />
                </span>
              </summary>
              <p className="mt-4 text-[16px] leading-relaxed text-neutral-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function PensarSection() {
  return (
    <section
      id="archivo"
      className="scroll-mt-20 border-t py-24 sm:py-32"
      style={{ borderColor: "var(--studio-hairline)", background: "var(--studio-surface)" }}
    >
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <h2 className="text-[clamp(2.1rem,4.5vw,3.6rem)] font-bold tracking-tight text-black">
          Construir también es una forma de pensar.
        </h2>
        <p className="mt-6 text-[18px] sm:text-[20px] text-neutral-700 max-w-2xl mx-auto font-medium">
          Cada producto es una respuesta provisional a algo que observé.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {[
            "Una necesidad.",
            "Una fricción.",
            "Un cambio en el mercado.",
            "Una posibilidad que antes no existía.",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full bg-white border border-[#e0e0e0] px-5 py-2.5 text-[15px] font-semibold text-neutral-800 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-12">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-4 text-[16px] font-semibold text-white transition-all hover:scale-105 active:scale-[0.97]"
          >
            Explorar el archivo
          </Link>
        </div>
      </div>
    </section>
  );
}

function StudioFooter() {
  return (
    <footer className="border-t bg-white" style={{ borderColor: "var(--studio-hairline)" }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
          <div>
            <CreativvLogo variant="lockup-bare" className="h-8 w-auto text-black" />
            <p className="mt-3 text-[16px] text-neutral-700 font-medium">
              Productos y experimentos de Adri Ávila.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            {["Producto", "UX", "Software", "Inteligencia artificial"].map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3.5 py-1.5 text-neutral-700 font-semibold border border-neutral-200 bg-neutral-50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 border-t border-[#ebebeb] pt-8 text-[14px] text-neutral-500 sm:flex-row sm:items-center">
          <span className="font-medium text-neutral-700">© 2026 Creativv</span>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#observar" className="hover:text-black transition-colors">Manifiesto</a>
            <a href="#productos" className="hover:text-black transition-colors">Productos</a>
            <a href="#experimentos" className="hover:text-black transition-colors">Experimentos</a>
            <a href="#proceso" className="hover:text-black transition-colors">Proceso</a>
            <a href="#precios" className="hover:text-black transition-colors">Precios</a>
            <a href="#preguntas" className="hover:text-black transition-colors">FAQ</a>
            <Link href="/projects" className="hover:text-black transition-colors">Archivo</Link>
            <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-black transition-colors flex items-center gap-1">
              <Mail className="h-4 w-4" /> Email
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
