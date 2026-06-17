import { ArrowRight, MessageCircle, Rocket, Sparkles, Workflow } from "lucide-react";
import { whatsappUrl } from "@/lib/contact";

const STEPS = [
  {
    icon: Rocket,
    title: "Lanzar",
    text: "Creamos una landing clara para explicar tu oferta, mostrar confianza y tener un destino listo para campañas, referidos o WhatsApp.",
  },
  {
    icon: MessageCircle,
    title: "Captar",
    text: "Conectamos el contacto correcto: formulario, WhatsApp, calendario, CRM o email para que cada interesado tenga un siguiente paso.",
  },
  {
    icon: Workflow,
    title: "Automatizar / Escalar",
    text: "Si el negocio lo pide, automatizamos respuestas, ordenamos leads o construimos una web, MVP, dashboard o sistema interno.",
  },
];

const CTA_URL = whatsappUrl(
  "Hola, quiero empezar con la ruta landing -> leads -> automatización. Mi negocio es:"
);

export default function WhatsAppBanner() {
  return (
    <section id="funnel" className="relative w-full bg-[#1f2a1d] text-white scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#dbe9c3]">
              <Sparkles className="h-3.5 w-3.5" />
              Cómo funciona el funnel
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[0.98] sm:text-5xl md:text-6xl">
              Empieza pequeño, captura mejor, escala con intención.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              Empieza con una landing clara para captar interés. Luego conectamos formularios,
              WhatsApp, CRM o automatizaciones. Si el negocio necesita más, construimos una web
              completa, MVP, dashboard o sistema interno.
            </p>
            <a
              href={CTA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#dbe9c3] px-6 py-3 text-sm font-semibold text-[#1f2a1d] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Diseñar mi ruta
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid gap-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.title}
                  className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur md:grid-cols-[auto_1fr] md:p-6"
                >
                  <div className="flex items-center gap-4 md:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#dbe9c3] text-[#1f2a1d]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-white/50 md:mt-5">
                      Paso {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
                      {step.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
