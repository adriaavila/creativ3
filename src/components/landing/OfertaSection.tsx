import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Rocket,
  SearchCheck,
} from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

const OFFERS = [
  {
    icon: SearchCheck,
    name: "Landing Page",
    price: "USD 199",
    timeline: "3 días",
    badge: "Mejor primer paso",
    forWhom: "Negocios que necesitan una página clara para campañas, referidos, Instagram, WhatsApp o ventas.",
    outcome: "Mejora credibilidad, explica la oferta y captura leads rápido con un activo concreto.",
    includes: [
      "Diseño UX/UI premium a medida",
      "Código limpio en Next.js / React",
      "Optimización SEO y velocidad",
      "Responsive design",
      "Conexión con herramientas de marketing o contacto",
    ],
    cta: "Pedir landing page",
    message:
      "Hola, quiero pedir la landing page de USD 199 en 3 días con creativv. Mi negocio es:",
  },
  {
    icon: Rocket,
    name: "Automatización Simple",
    price: "Desde USD 499",
    timeline: "5–10 días",
    badge: "Upsell natural",
    forWhom: "Equipos que ya reciben solicitudes, pero pierden leads o repiten trabajo manual.",
    outcome: "Ordena formularios, CRM, bases de datos, APIs o flujos tipo WhatsApp para responder mejor.",
    includes: [
      "1 flujo de automatización activo",
      "Integración con CRM, base de datos, formulario o API",
      "Pruebas de estrés",
      "Handoff técnico",
    ],
    cta: "Cotizar automatización",
    message:
      "Hola, quiero cotizar una automatización simple desde USD 499 con creativv. El proceso que quiero automatizar es:",
  },
  {
    icon: Gauge,
    name: "Web / Producto",
    price: "Desde USD 699",
    timeline: "10–21 días",
    badge: "Proyecto completo",
    forWhom: "Negocios que necesitan una web completa, MVP, dashboard, sistema interno o producto digital.",
    outcome: "Lanza un activo más robusto para vender, validar una idea, operar o mejorar la experiencia del cliente.",
    includes: [
      "Diseño visual + UX completo",
      "Next.js + base de datos + auth when needed",
      "Panel de control / dashboard interno when needed",
      "Integraciones principales",
      "Responsive design",
      "Launch-ready delivery",
    ],
    cta: "Cotizar web/producto",
    message:
      "Hola, quiero cotizar una web o producto desde USD 699 con creativv. Lo que necesito construir es:",
  },
];

export default function OfertaSection() {
  return (
    <section id="oferta" className="relative w-full bg-[#eef0e7] text-[#1f2a1d] scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end md:mb-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#336443] shadow-sm">
              <ClipboardList className="h-3.5 w-3.5" />
              Planes claros
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[0.98] text-[#1f2a1d] sm:text-5xl md:text-6xl">
              Compra el primer activo que puede traerte clientes.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-[#4b5b47] md:text-lg">
            La landing page es la entrada rápida. Después conectamos automatizaciones,
            WhatsApp, CRM o un producto más grande si el negocio lo necesita. Sin esconder precios.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {OFFERS.map((offer, index) => {
            const Icon = offer.icon;
            const featured = index === 0;

            return (
              <article
                key={offer.name}
                className={`flex h-full flex-col rounded-lg border p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:p-7 ${
                  featured
                    ? "border-[#1f2a1d] bg-[#1f2a1d] text-white"
                    : "border-[#1f2a1d]/10 bg-white text-[#1f2a1d] hover:border-[#336443]/30"
                }`}
              >
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                      featured ? "bg-[#dbe9c3] text-[#1f2a1d]" : "bg-[#1f2a1d] text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      featured ? "bg-white/10 text-[#dbe9c3]" : "bg-[#85AB8B]/15 text-[#336443]"
                    }`}
                  >
                    {offer.timeline}
                  </span>
                </div>

                <div
                  className={`mb-3 text-xs font-semibold uppercase tracking-[0.14em] ${
                    featured ? "text-[#dbe9c3]" : "text-[#336443]"
                  }`}
                >
                  {offer.badge}
                </div>
                <h3 className="text-2xl font-semibold">{offer.name}</h3>
                <div className={`mt-2 text-2xl font-semibold ${featured ? "text-white" : "text-[#336443]"}`}>
                  {offer.price}
                </div>

                <div className="mt-6 grid gap-4">
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-[0.12em] ${featured ? "text-white/60" : "text-[#4b5b47]/70"}`}>
                      Para quién
                    </div>
                    <p className={`mt-2 text-sm leading-relaxed ${featured ? "text-white/80" : "text-[#4b5b47]"}`}>
                      {offer.forWhom}
                    </p>
                  </div>
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-[0.12em] ${featured ? "text-white/60" : "text-[#4b5b47]/70"}`}>
                      Resultado
                    </div>
                    <p className={`mt-2 text-sm leading-relaxed ${featured ? "text-white/80" : "text-[#4b5b47]"}`}>
                      {offer.outcome}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid flex-1 gap-2">
                  {offer.includes.map((item) => (
                    <div
                      key={item}
                      className={`flex gap-2 text-sm ${featured ? "text-white/80" : "text-[#4b5b47]"}`}
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          featured ? "text-[#dbe9c3]" : "text-[#336443]"
                        }`}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <a
                  href={whatsappUrl(offer.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    featured
                      ? "bg-[#dbe9c3] text-[#1f2a1d] hover:bg-white"
                      : "bg-[#1f2a1d] text-white hover:bg-[#336443]"
                  }`}
                >
                  {offer.cta}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
