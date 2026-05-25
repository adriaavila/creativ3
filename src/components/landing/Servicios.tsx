import { Code2, Sparkles, Boxes, ArrowUpRight } from "lucide-react";

const SERVICIOS = [
  {
    icon: Code2,
    name: "Webs que convierten",
    desc: "Sitios premium, landings de oferta y funnels que explican valor rapido, capturan demanda y preparan al prospecto para conversar.",
    tags: ["Landing", "SEO", "Conversion"],
  },
  {
    icon: Sparkles,
    name: "Automatizaciones IA",
    desc: "Agentes, workflows y asistentes conectados a WhatsApp, formularios, CRM, email, hojas de calculo y herramientas internas.",
    tags: ["WhatsApp", "Workflows", "LLMs"],
  },
  {
    icon: Boxes,
    name: "Productos digitales",
    desc: "MVPs, dashboards y sistemas operativos con UX clara, arquitectura moderna y experiencia visual que justifica precio premium.",
    tags: ["UX", "Next.js", "Sistemas"],
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="relative w-full bg-[#f5f3ec] text-[#1f2a1d] scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-24">
          <div>
            <div className="text-xs font-medium tracking-widest uppercase text-[#85AB8B] mb-4">
              Servicios
            </div>
            <h2
              className="text-[#336443] font-normal leading-[0.95] text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-2xl"
            >
              Capacidades para{" "}
              <span className="text-[#85AB8B]">crear demanda y operacion.</span>
            </h2>
          </div>
          <p className="text-[#4b5b47] text-base md:text-lg max-w-sm leading-relaxed">
            Cada servicio se vende con alcance, tiempo y resultado esperado. Menos misterio, mas decision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {SERVICIOS.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.name}
                href="#contacto"
                className="group relative flex flex-col bg-white/70 backdrop-blur-sm border border-[#1f2a1d]/8 rounded-lg p-7 md:p-8 hover:bg-white hover:border-[#1f2a1d]/15 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-11 h-11 rounded-lg bg-[#1f2a1d] text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-[#4b5b47] group-hover:text-[#1f2a1d] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-[#1f2a1d] mb-3 tracking-tight">
                  {s.name}
                </h3>
                <p className="text-[#4b5b47] text-sm leading-relaxed mb-8 flex-1">
                  {s.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs font-medium text-[#3d5638] bg-[#85AB8B]/15 px-3 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
