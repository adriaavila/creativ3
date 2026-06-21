const SERVICES = [
  {
    index: "01",
    name: "Landing pages",
    goal: "Vender más",
    result: "Una oferta, una audiencia y un siguiente paso sin ruido.",
    examples: "Campañas · referidos · Instagram · WhatsApp",
  },
  {
    index: "02",
    name: "Sitios web",
    goal: "Vender más",
    result: "Una presencia comercial que construye confianza antes de la conversación.",
    examples: "Corporativo · servicios · SEO base",
  },
  {
    index: "03",
    name: "Productos & MVPs",
    goal: "Ambos",
    result: "Una experiencia funcional para validar, vender u operar una idea.",
    examples: "SaaS · portal · herramienta interna",
  },
  {
    index: "04",
    name: "Automatizaciones",
    goal: "Reducir costos",
    result: "Trabajo repetitivo convertido en un flujo visible y supervisable.",
    examples: "CRM · formularios · WhatsApp · APIs",
  },
  {
    index: "05",
    name: "Dashboards",
    goal: "Reducir costos",
    result: "Leads, operación y métricas en una sola superficie de decisión.",
    examples: "Ventas · inventario · cobros · reportes",
  },
];

export default function OutcomeServices() {
  return (
    <section id="servicios" className="bg-[#e9eee2] px-5 py-24 text-[#172016] sm:px-8 lg:px-12 lg:py-32">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-8 border-b border-[#172016]/12 pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#456241]">Sistemas</div>
            <h2 className="mt-4 max-w-4xl font-display text-[clamp(3.2rem,6.5vw,7rem)] leading-[0.88] tracking-[-0.04em]">
              Elige por resultado,
              <span className="block italic text-[#31583a]">no por tecnología.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[#53624f] sm:text-lg lg:justify-self-end">
            Conservamos todas las capacidades de Creativv. La diferencia es que ahora cada una empieza
            con el problema de negocio y puede sumar agentes cuando de verdad mejoran el flujo.
          </p>
        </div>

        <div>
          {SERVICES.map((service) => (
            <a
              key={service.name}
              href="#empezar"
              className="group grid gap-4 border-b border-[#172016]/12 py-7 transition-colors hover:bg-white/35 sm:grid-cols-[70px_1fr_160px] sm:items-center lg:grid-cols-[90px_0.85fr_1.2fr_180px] lg:py-8"
            >
              <span className="font-mono text-[10px] tracking-[0.18em] text-[#71806d]">{service.index}</span>
              <h3 className="font-display text-3xl leading-none sm:text-4xl">{service.name}</h3>
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-sm leading-6 text-[#465544] sm:text-base">{service.result}</p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#7b8778]">
                  {service.examples}
                </p>
              </div>
              <span className="justify-self-start rounded-full border border-[#31583a]/15 bg-[#f7f8f2]/70 px-3 py-1.5 text-xs font-semibold text-[#31583a] sm:justify-self-end">
                {service.goal}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

