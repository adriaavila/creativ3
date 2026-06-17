import { ArrowUpRight, Building2, ChartNoAxesCombined, Home, MessagesSquare, Store } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

const DEMOS = [
  {
    icon: Store,
    title: "Landing para captar leads de un negocio local",
    outcome: "Una página clara con oferta, prueba visual, formulario y CTA directo a WhatsApp.",
  },
  {
    icon: MessagesSquare,
    title: "Flujo de solicitud conectado a WhatsApp",
    outcome: "El prospecto deja datos, recibe respuesta inicial y el equipo comercial entra con contexto.",
  },
  {
    icon: Home,
    title: "Página para proyecto inmobiliario",
    outcome: "Inventario, beneficios, formulario de interés y mensajes preparados para seguimiento.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Dashboard simple para seguimiento de leads",
    outcome: "Estado de solicitudes, origen de cada lead y prioridades visibles para decidir rápido.",
  },
  {
    icon: Building2,
    title: "MVP para validar una idea de negocio",
    outcome: "Primera versión usable para enseñar, vender, medir interés y decidir el siguiente sprint.",
  },
];

const PROOF_CTA = whatsappUrl(
  "Hola, quiero ver que tipo de landing, automatización o producto aplica para mi negocio. Mi caso es:"
);

export default function ProyectosShowcase() {
  return (
    <section
      id="proyectos"
      className="relative w-full overflow-hidden bg-[#1f2a1d] text-white scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end md:mb-16">
          <div>
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#dbe9c3]">
              Demo cases
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[0.98] sm:text-5xl md:text-6xl">
              Ejemplos de sistemas que podemos crear.
            </h2>
          </div>
          <div className="max-w-xl">
            <p className="text-base leading-relaxed text-white/70 md:text-lg">
              Estos no son testimonios inventados ni promesas de revenue. Son ejemplos honestos
              del tipo de activo que ayuda a captar leads, ordenar solicitudes y vender con menos fricción.
            </p>
            <a
              href={PROOF_CTA}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1f2a1d] transition-colors hover:bg-[#dbe9c3]"
            >
              Hablar de mi caso
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {DEMOS.map((demo) => {
            const Icon = demo.icon;
            return (
              <article
                key={demo.title}
                className="flex min-h-72 flex-col rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07]"
              >
                <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-lg bg-[#dbe9c3] text-[#1f2a1d]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold leading-tight">{demo.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70">{demo.outcome}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
