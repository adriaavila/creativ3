import { ArrowUpRight } from "lucide-react";
import type { LandingIntent } from "@/lib/landing-intent";
import { whatsappUrl } from "@/lib/contact";

const REVENUE_CONTACT = whatsappUrl(
  "Hola, quiero aumentar ingresos con una nueva experiencia digital. Estoy pensando en:"
);

const SERVICES = {
  efficiency: [
    {
      index: "01",
      name: "Automatizaciones",
      goal: "Eliminar repetición",
      result: "El trabajo repetitivo deja de consumir horas: corre solo, con estados y revisión humana donde importa.",
      examples: "CRM · formularios · WhatsApp · APIs",
      detail: "Flujo completo",
      time: "5–10 días",
      href: "/automatizar",
    },
    {
      index: "02",
      name: "Dashboards",
      goal: "Decidir con datos",
      result: "Ventas, inventario, cobros y operación viven en una superficie clara, sin reportes armados a mano.",
      examples: "Operaciones · finanzas · ventas · reportes",
      detail: "Datos + interfaz",
      time: "5–10 días",
      href: "/cotizar",
    },
    {
      index: "03",
      name: "Apps",
      goal: "Centralizar la operación",
      result: "Una herramienta diseñada alrededor de tu proceso reemplaza hojas, chats y software que nunca encajó.",
      examples: "Portal · app interna · SaaS · agentes",
      detail: "Producto a medida",
      time: "10–21 días",
      href: "/cotizar",
    },
  ],
  revenue: [
    {
      index: "01",
      name: "Landing pages",
      goal: "Capturar demanda",
      result: "Una oferta, una audiencia y un siguiente paso irresistiblemente claros para convertir campañas y referidos.",
      examples: "Lanzamientos · campañas · servicios · captación",
      detail: "Estrategia + copy + UI",
      time: "3–5 días",
      href: REVENUE_CONTACT,
    },
    {
      index: "02",
      name: "Diseño web",
      goal: "Construir confianza",
      result: "Una presencia digital que explica tu valor, eleva la percepción de marca y prepara cada conversación comercial.",
      examples: "Web corporativa · servicios · SEO · CMS",
      detail: "Arquitectura + UX/UI",
      time: "10–21 días",
      href: REVENUE_CONTACT,
    },
    {
      index: "03",
      name: "Ecommerce",
      goal: "Vender sin fricción",
      result: "Catálogo, producto, checkout y pago diseñados como un solo recorrido para que comprar se sienta natural.",
      examples: "Catálogo · checkout · pagos · WhatsApp",
      detail: "Tienda completa",
      time: "14–28 días",
      href: "/ecommerce",
    },
  ],
} as const;

const COPY = {
  efficiency: {
    eyebrow: "Servicios para reducir costos",
    title: "Tres formas de operar",
    accent: "con menos fricción.",
    body: "Empezamos por el costo del proceso, no por la tecnología. Diseñamos la intervención más pequeña que pueda recuperar capacidad de forma medible.",
  },
  revenue: {
    eyebrow: "Servicios para aumentar ingresos",
    title: "Tres formas de convertir",
    accent: "mejor atención.",
    body: "Estrategia, UX y dirección visual trabajando juntas. Cada decisión existe para que tu marca se entienda más rápido y comprar cueste menos esfuerzo.",
  },
} as const;

type OutcomeServicesProps = {
  intent?: LandingIntent;
};

export default function OutcomeServices({ intent = "efficiency" }: OutcomeServicesProps) {
  const isRevenue = intent === "revenue";
  const copy = COPY[intent];

  return (
    <section
      id="servicios"
      className={`scroll-mt-6 px-5 py-24 text-[#172016] transition-colors duration-700 sm:px-8 lg:px-12 lg:py-32 ${
        isRevenue ? "bg-[#f3d8ca]" : "bg-[#e9eee2]"
      }`}
    >
      <div key={intent} className="landing-intent-enter mx-auto max-w-[1440px]">
        <div className="grid gap-8 border-b border-[#172016]/12 pb-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div
              className={`font-mono text-[10px] uppercase tracking-[0.2em] ${
                isRevenue ? "text-[#a83e28]" : "text-[#456241]"
              }`}
            >
              {copy.eyebrow}
            </div>
            <h2 className="mt-4 max-w-4xl font-display text-[clamp(3.2rem,6.5vw,7rem)] leading-[0.88] tracking-[-0.04em]">
              {copy.title}
              <span className={`block italic ${isRevenue ? "text-[#b9472d]" : "text-[#31583a]"}`}>
                {copy.accent}
              </span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[#555d51] sm:text-lg lg:justify-self-end">
            {copy.body}
          </p>
        </div>

        <div>
          {SERVICES[intent].map((service) => {
            const isExternal = service.href.startsWith("http");

            return (
              <a
                key={service.name}
                href={service.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className={`group grid gap-5 border-b border-[#172016]/12 py-8 transition-all duration-300 sm:grid-cols-[70px_1fr_auto] sm:items-center lg:grid-cols-[90px_0.8fr_1.25fr_180px] lg:py-9 ${
                  isRevenue ? "hover:bg-[#fff8f1]/45" : "hover:bg-white/35"
                }`}
              >
                <span
                  className={`font-mono text-[10px] tracking-[0.18em] ${
                    isRevenue ? "text-[#ad543e]" : "text-[#71806d]"
                  }`}
                >
                  {service.index}
                </span>
                <div>
                  <h3 className="font-display text-4xl leading-none sm:text-5xl">{service.name}</h3>
                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1 font-mono text-[8px] uppercase tracking-[0.13em] ${
                      isRevenue
                        ? "border-[#b9472d]/15 bg-[#fff8f1]/55 text-[#9f3b27]"
                        : "border-[#31583a]/15 bg-[#f7f8f2]/70 text-[#31583a]"
                    }`}
                  >
                    {service.goal}
                  </span>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <p className="text-sm leading-6 text-[#465044] sm:text-base">{service.result}</p>
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#737a70]">
                    {service.examples}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-6 sm:justify-end lg:block lg:text-right">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#7b8178]">
                      {service.detail}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#303c2f]">{service.time}</div>
                  </div>
                  <span
                    className={`flex size-10 items-center justify-center rounded-full border transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${
                      isRevenue
                        ? "border-[#b9472d]/20 text-[#a53f29] group-hover:bg-[#b9472d] group-hover:text-white"
                        : "border-[#31583a]/20 text-[#31583a] group-hover:bg-[#31583a] group-hover:text-white"
                    } lg:ml-auto lg:mt-4`}
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
