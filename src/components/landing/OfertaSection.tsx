import { ArrowUpRight, CheckCircle2, Gauge, Rocket, SearchCheck } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

const OFFERS = [
  {
    icon: SearchCheck,
    name: "Diagnostico express",
    price: "USD 150",
    timeline: "48 horas",
    desc: "Revision de web, oferta, funnel y procesos. Sales con mapa de quick wins, alcance sugerido y siguiente sprint priorizado.",
    outcomes: ["10 mejoras accionables", "1 roadmap de conversion", "Credito si avanzas a proyecto"],
    cta: "Pedir diagnostico",
    message:
      "Hola, quiero comprar el diagnostico express de creativv. Mi web/proyecto es:",
  },
  {
    icon: Rocket,
    name: "Piloto IA 14 dias",
    price: "Desde USD 900",
    timeline: "10-14 dias",
    desc: "Un workflow vivo para capturar, calificar o responder leads. Ideal para WhatsApp, cotizaciones, soporte, operaciones y reporting.",
    outcomes: ["1 automatizacion funcionando", "Dashboard basico de seguimiento", "Manual + handoff tecnico"],
    cta: "Cotizar piloto",
    message:
      "Hola, quiero cotizar un piloto IA de 14 dias con creativv. Proceso que quiero automatizar:",
  },
  {
    icon: Gauge,
    name: "Sprint web/producto",
    price: "Desde USD 1.500",
    timeline: "10-21 dias",
    desc: "Landing premium, sitio comercial, MVP, dashboard o sistema interno con diseno, codigo e integraciones bajo un solo equipo.",
    outcomes: ["UX/UI premium", "Next.js + integraciones", "Entrega lista para vender"],
    cta: "Cotizar sprint",
    message:
      "Hola, quiero cotizar un sprint web/producto con creativv. Necesito construir:",
  },
];

const QUALIFIERS = [
  "Tienes una oferta valiosa, pero tu web no genera suficientes conversaciones.",
  "Tu equipo responde leads o tareas repetitivas a mano todos los dias.",
  "Necesitas lanzar algo premium rapido sin contratar diseno, dev y AI por separado.",
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
