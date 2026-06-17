import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  Globe2,
  LayoutTemplate,
  Workflow,
} from "lucide-react";

const SERVICES = [
  {
    icon: LayoutTemplate,
    name: "Landing pages",
    desc: "Para convertir campañas, referencias o visitas en conversaciones reales.",
    examples: ["Oferta clara", "SEO base", "Lead capture"],
  },
  {
    icon: Globe2,
    name: "Websites",
    desc: "Para explicar mejor tu negocio, construir confianza y darle a ventas una presencia seria.",
    examples: ["Sitio corporativo", "Páginas por servicio", "Contenido comercial"],
  },
  {
    icon: Workflow,
    name: "Automatizaciones",
    desc: "Para ordenar leads, responder más rápido y reducir tareas manuales repetitivas.",
    examples: ["Formularios", "CRM", "APIs"],
  },
  {
    icon: Boxes,
    name: "Apps / MVPs",
    desc: "Para validar ideas, crear herramientas internas o lanzar productos digitales.",
    examples: ["MVP", "SaaS milestone", "Portal privado"],
  },
  {
    icon: BarChart3,
    name: "Dashboards",
    desc: "Para visualizar información, hacer seguimiento de leads y operar con más claridad.",
    examples: ["Leads", "Operaciones", "Reportes"],
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="relative w-full bg-[#f5f3ec] text-[#1f2a1d] scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
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
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <a
                key={service.name}
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
