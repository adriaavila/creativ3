import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MessageCircle } from "lucide-react";
import Colofon from "@/components/landing/Colofon";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";

const OPTIONS = [
  {
    name: "Diagnostico express",
    price: "USD 150",
    bestFor: "Quieres claridad antes de gastar en diseño, desarrollo o IA.",
    delivery: "48 horas",
    points: ["Auditoria de oferta, web y funnel", "10 quick wins ordenados por impacto", "Se acredita si avanzas a proyecto"],
    message:
      "Hola, quiero comprar el diagnostico express de creativv. Mi web/proyecto es:",
  },
  {
    name: "Piloto IA",
    price: "Desde USD 900",
    bestFor: "Ya tienes conversaciones o tareas repetitivas que consumen equipo.",
    delivery: "10-14 dias",
    points: ["Workflow IA funcionando", "Integracion con WhatsApp, email o CRM", "Medicion diaria de leads, ahorro o respuesta"],
    message:
      "Hola, quiero cotizar un piloto IA con creativv. El proceso que quiero automatizar es:",
  },
  {
    name: "Sprint web/producto",
    price: "Desde USD 1.500",
    bestFor: "Necesitas una presencia o producto que se sienta premium y funcione.",
    delivery: "10-21 dias",
    points: ["Direccion visual + UX", "Next.js + integraciones", "Entrega lista para vender, medir u operar"],
    message:
      "Hola, quiero cotizar un sprint web/producto con creativv. Necesito construir:",
  },
];

export default function CotizarPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ec] text-[#1f2a1d] selection:bg-[#85AB8B]/30 selection:text-[#1f2a1d]">
      <main className="px-6 pb-20 pt-28 md:px-10 md:pb-28 md:pt-36">
        <section className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-[#336443]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#336443]">
              Cotizar con creativv
            </div>
            <h1 className="max-w-3xl text-5xl font-normal leading-[0.95] text-[#336443] sm:text-6xl md:text-7xl">
              Entra por el problema correcto.
            </h1>
          </div>
          <div className="rounded-lg border border-[#1f2a1d]/10 bg-white p-6 shadow-sm">
            <p className="text-base leading-relaxed text-[#4b5b47]">
              Para avanzar no necesitas una propuesta enorme. Necesitas una decision limpia:
              que duele, que vale resolver y cual es el primer entregable que puede pagarse solo.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#1f2a1d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#336443]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Cotizar%20con%20creativv`}
                className="inline-flex items-center gap-2 rounded-full border border-[#1f2a1d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#1f2a1d] transition-colors hover:bg-[#f5f3ec]"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-3">
          {OPTIONS.map((option) => (
            <article
              key={option.name}
              className="flex h-full flex-col rounded-lg border border-[#1f2a1d]/10 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold">{option.name}</h2>
                <span className="rounded-full bg-[#85AB8B]/15 px-3 py-1 text-xs font-semibold text-[#336443]">
                  {option.delivery}
                </span>
              </div>
              <div className="text-xl font-semibold text-[#336443]">{option.price}</div>
              <p className="mt-4 text-sm leading-relaxed text-[#4b5b47]">{option.bestFor}</p>
              <div className="mt-6 grid flex-1 gap-3">
                {option.points.map((point) => (
                  <div key={point} className="flex gap-2 text-sm text-[#4b5b47]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#336443]" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <a
                href={whatsappUrl(option.message)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#1f2a1d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#336443]"
              >
                Elegir opcion
                <ArrowRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </section>

        <section className="mx-auto mt-12 max-w-6xl rounded-lg border border-[#1f2a1d]/10 bg-[#1f2a1d] p-6 text-white md:p-8">
          <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#85AB8B]">
                Para cotizar sin humo
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Manda contexto. Respondemos con criterio.</h2>
            </div>
            <div className="grid gap-3 text-sm text-white/75">
              <p>1. Link de tu web, Instagram, producto o proceso actual.</p>
              <p>2. Meta de los proximos 30 dias: mas leads, mas ventas, ahorro de tiempo o lanzamiento.</p>
              <p>3. Presupuesto aproximado, urgencia y quien decide.</p>
            </div>
          </div>
        </section>

        <div className="mx-auto mt-10 max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#336443] hover:text-[#1f2a1d]"
          >
            Volver al inicio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <Colofon />
    </div>
  );
}
