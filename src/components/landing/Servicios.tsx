import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  Globe2,
  LayoutTemplate,
  Workflow,
} from "lucide-react";
import Reveal from "./Reveal";

const SERVICES = [
  {
    icon: LayoutTemplate,
    name: "Landing pages",
    desc: "Páginas claras para convertir campañas, referidos y visitas en clientes.",
    examples: ["Oferta clara", "SEO base", "Lead capture"],
  },
  {
    icon: Globe2,
    name: "Sitios web",
    desc: "Tu negocio explicado con una presencia seria y bien diseñada.",
    examples: ["Corporativo", "Por servicio", "Comercial"],
  },
  {
    icon: Boxes,
    name: "Productos & MVPs",
    desc: "Apps, SaaS y herramientas internas listas para validar y escalar.",
    examples: ["MVP", "SaaS", "Portal privado"],
  },
  {
    icon: Workflow,
    name: "Automatizaciones",
    desc: "Flujos que ordenan leads, responden rápido y quitan trabajo manual.",
    examples: ["Formularios", "CRM", "APIs"],
  },
  {
    icon: BarChart3,
    name: "Dashboards",
    desc: "Paneles para ver leads, operación y métricas con claridad.",
    examples: ["Leads", "Operaciones", "Reportes"],
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="relative w-full bg-[#f5f3ec] text-[#1f2a1d] scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <Reveal className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#336443]">
              Servicios
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[0.98] text-[#336443] sm:text-5xl md:text-6xl">
              Lo que construimos, explicado por el resultado de negocio.
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-[#4b5b47] md:text-lg">
            La tecnología importa, pero el cliente compra claridad, velocidad y menos fricción para vender.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <Reveal key={service.name} delay={index * 0.07} className="h-full">
              <a
                href="#contacto"
                className="group flex h-full flex-col rounded-lg border border-[#1f2a1d]/10 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#336443]/30 hover:shadow-lg"
              >
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f2a1d] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[#4b5b47] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#1f2a1d]" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-[#1f2a1d]">
                  {service.name}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[#4b5b47]">
                  {service.desc}
                </p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {service.examples.map((example) => (
                    <span
                      key={example}
                      className="rounded-full bg-[#85AB8B]/15 px-3 py-1 text-xs font-medium text-[#336443]"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
