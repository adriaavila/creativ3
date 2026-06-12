import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MessageCircle } from "lucide-react";
import Colofon from "@/components/landing/Colofon";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";

const OPTIONS = [
  {
    name: "Landing page",
    price: "USD 199",
    bestFor: "Quieres una presencia online premium, rápida y optimizada para convertir.",
    delivery: "3 dias",
    points: ["Diseño UX/UI premium a medida", "Código limpio en Next.js (React)", "Optimización SEO y velocidad de carga"],
    message:
      "Hola, quiero cotizar la landing page de USD 199 con creativv. Mi negocio es:",
  },
  {
    name: "Automatizacion simple",
    price: "Desde USD 499",
    bestFor: "Quieres ahorrar tiempo conectando tus formularios, CRM, bases de datos o APIs.",
    delivery: "5-10 dias",
    points: ["1 flujo de automatización activo", "Integración con CRM o base de datos", "Pruebas de estrés y handoff técnico"],
    message:
      "Hola, quiero cotizar una automatizacion simple con creativv. El proceso que quiero automatizar es:",
  },
  {
    name: "WEB/ PRODUCTO",
    price: "Desde USD 699",
    bestFor: "Necesitas una plataforma web custom, SaaS o MVP completo con código escalable.",
    delivery: "10-21 dias",
    points: ["Diseño de interfaz UX/UI completo", "Desarrollo frontend/backend en Next.js", "Dashboard o panel de control"],
    message:
      "Hola, quiero cotizar una web o producto completo con creativv. Necesito construir:",
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
