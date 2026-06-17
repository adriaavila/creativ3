import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const PAINS = [
  "Tienes visitas o seguidores, pero pocos clientes.",
  "Tu negocio se ve menos profesional de lo que realmente es.",
  "La gente pregunta por WhatsApp y luego se pierde.",
  "No tienes una página clara para enviar a prospectos.",
  "Cotizar, responder o agendar toma demasiado tiempo.",
  "Tu web actual no explica bien lo que vendes.",
  "Tu idea de producto necesita una primera versión real.",
];

const OUTCOMES = [
  {
    icon: ShieldCheck,
    title: "Claridad y credibilidad",
    text: "Una oferta entendible, una página presentable y un primer paso fácil para el prospecto.",
  },
  {
    icon: MessageSquareText,
    title: "Más conversaciones",
    text: "Formularios, WhatsApp y llamadas mejor conectadas para convertir visitas en leads reales.",
  },
  {
    icon: Workflow,
    title: "Menos trabajo manual",
    text: "Flujos simples para ordenar solicitudes, responder rápido y reducir tareas repetitivas.",
  },
  {
    icon: BarChart3,
    title: "Sistemas que ayudan",
    text: "MVPs, dashboards y herramientas internas pensadas para validar y operar con más claridad.",
  },
];

export default function PainValueSection() {
  return (
    <section className="relative w-full bg-[#f5f3ec] text-[#1f2a1d]">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1f2a1d] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white">
              <AlertCircle className="h-3.5 w-3.5" />
              Lo que arreglamos
            </div>
            <h2 className="text-4xl font-normal leading-[0.98] text-[#336443] sm:text-5xl md:text-6xl">
              No necesitas más ruido digital. Necesitas un camino para captar clientes.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-[#4b5b47] md:text-lg">
              Creativv convierte presencia, interés y procesos sueltos en activos que ayudan a vender:
              una landing clara, un flujo de leads o un producto digital listo para validar.
            </p>
          </div>

          <div className="grid gap-3">
            {PAINS.map((pain) => (
              <div
                key={pain}
                className="flex gap-3 rounded-lg border border-[#1f2a1d]/10 bg-white px-4 py-4 text-sm leading-relaxed text-[#3d4f38] shadow-sm sm:text-base"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#336443]" />
                <span>{pain}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-4">
          {OUTCOMES.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-lg border border-[#1f2a1d]/10 bg-white/80 p-5 shadow-sm"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#dbe9c3] text-[#1f2a1d]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#1f2a1d]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#4b5b47]">{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
