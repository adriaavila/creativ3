"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const CHECK = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 6.5L5 9.5L11 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLANES = [
  {
    id: "discover",
    num: "I",
    name: "Discover",
    price: "$100",
    billing: "/ mes",
    tag: null,
    desc: "Para explorar el potencial de la IA en tu negocio y arrancar con automatizaciones concretas.",
    features: [
      "Discovery call mensual (2h)",
      "Diagnóstico de procesos",
      "1 automatización al mes",
      "Integración básica con IA",
      "Soporte por WhatsApp",
      "Reporte mensual de avances",
    ],
    cta: "Empezar ahora",
    accent: false,
    custom: false,
  },
  {
    id: "partner",
    num: "II",
    name: "Partner",
    price: "$500",
    billing: "/ mes",
    tag: "más elegido",
    desc: "Para empresas que quieren operar a otra velocidad. Desarrollo continuo y automatización avanzada.",
    features: [
      "Todo lo del plan Discover",
      "20h de desarrollo mensual",
      "Agentes IA personalizados",
      "Automatizaciones complejas",
      "Integración de sistemas",
      "Revisiones semanales",
      "Soporte prioritario 24/7",
    ],
    cta: "Ser Partner",
    accent: true,
    custom: false,
  },
  {
    id: "enterprise",
    num: "III",
    name: "Empresa",
    price: "Custom",
    billing: "",
    tag: null,
    desc: "Para proyectos grandes con requerimientos específicos. Equipo dedicado, arquitectura a escala.",
    features: [
      "Software a medida completo",
      "Equipo de desarrollo dedicado",
      "Arquitectura enterprise",
      "Múltiples integraciones",
      "SLA garantizado",
      "Capacitación del equipo",
      "Soporte dedicado",
    ],
    cta: "Cotizar proyecto",
    accent: false,
    custom: true,
  },
];

async function startCheckout(plan: string) {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("Error al iniciar el pago. Intenta de nuevo.");
  }
}

export default function Precios() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Heading word reveal
    if (headingRef.current) {
      const words = headingRef.current.querySelectorAll(".price-word");
      gsap.fromTo(words,
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0, opacity: 1, stagger: 0.1, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: headingRef.current, start: "top 85%" },
        }
      );
    }

    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".precio-card");
    gsap.fromTo(cards,
      { y: 80, opacity: 0, rotateX: 8 },
      {
        y: 0, opacity: 1, rotateX: 0, stagger: 0.15, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 80%" },
      }
    );
  }, []);

  const handleCta = async (plan: typeof PLANES[number]) => {
    if (plan.custom) {
      window.location.href = "mailto:proyectos@servicioscreativos.online?subject=Cotización%20Proyecto%20Empresa";
      return;
    }
    setLoading(plan.id);
    await startCheckout(plan.id);
    setLoading(null);
  };

  return (
    <section
      id="precios"
      className="w-full bg-noche py-32 px-6 sm:px-12 scroll-mt-24 border-t border-papiro/5 relative overflow-hidden"
    >
      {/* Section ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(42,110,160,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="font-mono text-xs tracking-widest text-cobalto uppercase mb-6 flex items-center gap-3">
              <span
                className="inline-block h-px w-8"
                style={{ background: "linear-gradient(90deg, var(--cobalto), transparent)" }}
              />
              Inversión
            </div>
            <h2
              ref={headingRef}
              className="font-display text-5xl sm:text-7xl md:text-8xl tracking-tight leading-none overflow-hidden"
            >
              <span className="block overflow-hidden"><span className="price-word inline-block opacity-0">Elige tu</span></span>
              <span className="block overflow-hidden">
                <em className="price-word inline-block italic text-cobalto opacity-0">nivel</em>
                <span className="price-word inline-block opacity-0"> de</span>
              </span>
              <span className="block overflow-hidden"><span className="price-word inline-block opacity-0">compromiso.</span></span>
            </h2>
          </div>
          <p className="font-mono text-sm text-papiro-soft max-w-xs leading-relaxed">
            Sin contratos anuales forzados. Cancela cuando quieras. Sube o baja de plan en cualquier momento.
          </p>
        </div>

        {/* Cards */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          style={{ perspective: "1200px" }}
        >
          {PLANES.map((plan) => (
            <div
              key={plan.id}
              className={`precio-card group relative flex flex-col rounded-2xl p-10 opacity-0 transition-all duration-500 hover:-translate-y-3 ${
                plan.accent
                  ? "gradient-border-spin"
                  : "border border-papiro/10 hover:border-cobalto/30 bg-noche-rise/20"
              }`}
              style={plan.accent ? { background: "rgba(10,31,46,0.9)" } : {}}
            >
              {/* Glow on hover */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${
                  plan.accent ? "opacity-100" : ""
                }`}
                style={{
                  boxShadow: plan.accent
                    ? "0 0 60px rgba(42,110,160,0.2), inset 0 0 40px rgba(42,110,160,0.06)"
                    : "0 0 40px rgba(42,110,160,0.12)",
                }}
              />

              {/* Shine sweep on hover */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
              >
                <div
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                  style={{
                    background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)",
                  }}
                />
              </div>

              {plan.tag && (
                <div
                  className="absolute -top-3 left-8 px-3 py-1 rounded-full font-mono text-xs text-noche font-medium"
                  style={{ background: "linear-gradient(90deg, var(--cobalto), var(--lima))" }}
                >
                  {plan.tag}
                </div>
              )}

              {/* Plan number */}
              <div className="font-editorial text-5xl text-papiro/10 mb-5 leading-none select-none">
                {plan.num}
              </div>

              {/* Name label */}
              <div className="font-mono text-xs tracking-widest uppercase text-papiro/40 mb-2">
                Plan
              </div>
              <h3 className="font-display text-4xl sm:text-5xl tracking-tight mb-5">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="flex items-end gap-2 mb-4">
                <span
                  className={`font-display text-6xl sm:text-7xl tracking-tighter leading-none ${
                    plan.accent ? "text-shimmer" : "text-papiro"
                  }`}
                >
                  {plan.price}
                </span>
                {plan.billing && (
                  <span className="font-mono text-sm text-papiro/35 mb-2">{plan.billing}</span>
                )}
              </div>

              {/* Desc */}
              <p className="font-mono text-sm text-papiro-soft leading-relaxed mb-7 min-h-[56px]">
                {plan.desc}
              </p>

              {/* Divider */}
              <div
                className="h-px w-full mb-6"
                style={{
                  background: plan.accent
                    ? "linear-gradient(90deg, var(--cobalto), transparent)"
                    : "rgba(240,234,214,0.08)",
                }}
              />

              {/* Features */}
              <ul className="flex flex-col gap-0 mb-10 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 py-2.5 border-b border-papiro/[0.06] font-mono text-sm"
                  >
                    <span className={plan.accent ? "text-cobalto" : "text-papiro/30"}>
                      <CHECK />
                    </span>
                    <span className="text-papiro/80">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleCta(plan)}
                disabled={loading === plan.id}
                className={`group/btn relative w-full py-4 rounded-full font-mono text-sm tracking-wide transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden hover-target ${
                  plan.accent
                    ? "bg-cobalto text-papiro hover:bg-papiro hover:text-noche"
                    : "border border-papiro/20 text-papiro hover:bg-papiro hover:text-noche hover:border-papiro"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                />
                {loading === plan.id ? (
                  <span className="animate-pulse">Iniciando...</span>
                ) : (
                  <>
                    <span className="relative">{plan.cta}</span>
                    <span className="relative transform transition-transform duration-400 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1">↗</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Trust note */}
        <div className="flex items-center justify-center gap-3 mt-12">
          <span className="h-px w-12 bg-papiro/10" />
          <p className="font-mono text-xs text-papiro/25">
            Pagos seguros con Stripe · Cancela en cualquier momento · Precios en USD
          </p>
          <span className="h-px w-12 bg-papiro/10" />
        </div>
      </div>
    </section>
  );
}
