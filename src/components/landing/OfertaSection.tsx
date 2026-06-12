import { ArrowUpRight, CheckCircle2, Gauge, Rocket, SearchCheck } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

const OFFERS = [
  {
    icon: SearchCheck,
    name: "Landing page",
    price: "USD 199",
    timeline: "3 dias",
    desc: "Diseño y desarrollo de landing page premium a medida en Next.js. Rápida, optimizada para SEO, responsive y conectada con tus herramientas de marketing.",
    outcomes: ["Diseño UX/UI premium a medida", "Código limpio en Next.js (React)", "Optimización SEO y velocidad (100% CWV)"],
    cta: "Pedir landing page",
    message:
      "Hola, quiero cotizar la landing page de USD 199 con creativv. Mi negocio es:",
  },
  {
    icon: Rocket,
    name: "Automatizacion simple",
    price: "Desde USD 499",
    timeline: "5-10 dias",
    desc: "Conectamos tus formularios, CRM, bases de datos o APIs. Resolvemos problemas de código y automatizamos flujos manuales repetitivos.",
    outcomes: ["1 flujo de automatización activo", "Integración con CRM o base de datos", "Pruebas de estrés y handoff técnico"],
    cta: "Cotizar automatizacion",
    message:
      "Hola, quiero cotizar una automatizacion simple con creativv. El proceso que quiero automatizar es:",
  },
  {
    icon: Gauge,
    name: "WEB/ PRODUCTO",
    price: "Desde USD 699",
    timeline: "10-21 dias",
    desc: "Sitio corporativo completo, plataforma SaaS, MVP de producto o sistema interno. Diseño de interfaz exclusivo y desarrollo fullstack robusto.",
    outcomes: ["Diseño visual + UX completo", "Next.js + Base de datos + Auth", "Panel de control / dashboard interno"],
    cta: "Cotizar web/producto",
    message:
      "Hola, quiero cotizar una web o producto completo con creativv. Lo que necesito construir es:",
  },
];

const QUALIFIERS = [
  "Necesitas una web premium, rápida y optimizada que de verdad convierta visitas en clientes.",
  "Tienes problemas con código, bugs o integraciones rotas en tu plataforma actual.",
  "Quieres automatizar flujos repetitivos y conectar tus sistemas con código limpio y sin fricción.",
];

export default function OfertaSection() {
  return (
    <section id="oferta" className="relative w-full bg-[#f5f3ec] text-[#1f2a1d] scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end mb-12 md:mb-16">
          <div>
            <div className="text-xs font-medium tracking-widest uppercase text-[#336443] mb-4">
              Oferta de entrada
            </div>
            <h2 className="text-[#1f2a1d] font-normal leading-[1] text-4xl sm:text-5xl md:text-6xl max-w-2xl">
              Compra claridad primero. Luego construimos lo que vende.
            </h2>
          </div>
          <div className="bg-white border border-[#1f2a1d]/10 rounded-lg p-5 md:p-6">
            <p className="text-sm md:text-base text-[#4b5b47] leading-relaxed">
              creativv no vende horas sueltas. Vendemos outcomes: mas conversaciones calificadas,
              menos operacion manual, productos digitales con percepcion premium y sistemas que se pueden medir.
            </p>
            <div className="mt-5 grid gap-3">
              {QUALIFIERS.map((item) => (
                <div key={item} className="flex gap-3 text-sm text-[#2d3a2a]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#336443]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {OFFERS.map((offer) => {
            const Icon = offer.icon;
            return (
              <article
                key={offer.name}
                className="flex h-full flex-col rounded-lg border border-[#1f2a1d]/10 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#336443]/30 hover:shadow-xl"
              >
                <div className="mb-8 flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1f2a1d] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[#85AB8B]/15 px-3 py-1 text-xs font-semibold text-[#336443]">
                    {offer.timeline}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-[#1f2a1d]">{offer.name}</h3>
                <div className="mt-2 text-lg font-semibold text-[#336443]">{offer.price}</div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#4b5b47]">{offer.desc}</p>
                <div className="mt-6 grid gap-2">
                  {offer.outcomes.map((outcome) => (
                    <div key={outcome} className="flex gap-2 text-xs text-[#4b5b47]">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#336443]" />
                      <span>{outcome}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={whatsappUrl(offer.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#1f2a1d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#336443]"
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
