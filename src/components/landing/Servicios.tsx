"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const SERVICIOS = [
  {
    id: "I",
    name: "Software a Medida",
    desc: "Desarrollamos soluciones personalizadas que se ajustan exactamente a tus procesos de negocio. Sin limitaciones de plataformas genéricas.",
    features: ["Arquitectura scalable", "Integración con sistemas existentes", "Desarrollo frontend y backend", "APIs y microservicios"],
    active: true,
  },
  {
    id: "II",
    name: "Automatización IA",
    desc: "Implementamos agentes inteligentes y workflows automatizados que liberan a tu equipo del trabajo repetitivo.",
    features: ["Agentes conversacionales", "Automatización de procesos", "Integración con herramientas", "Machine learning"],
    active: true,
  },
];

export default function Servicios() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (!sectionRef.current) return;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        let newIndex = Math.floor(progress * SERVICIOS.length);
        if (newIndex >= SERVICIOS.length) newIndex = SERVICIOS.length - 1;
        setActiveIndex(newIndex);
      }
    });

  }, []);

  const servicio = SERVICIOS[activeIndex];

  return (
    <section ref={sectionRef} id="servicios" className="relative h-[300vh] w-full bg-noche scroll-mt-24">
      <div ref={containerRef} className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-6">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">

          <div className="font-editorial text-[10rem] md:text-[25rem] leading-none text-noche-rise select-none transition-all duration-700 ease-in-out">
            {servicio.id}
          </div>

          <div className="relative z-10 flex flex-col items-start md:-ml-32 mt-[-2rem] md:mt-0">
            <h2 className="font-display text-5xl md:text-8xl mb-4 tracking-tight flex overflow-hidden">
              {servicio.name.split("").map((char, i) => (
                <span
                  key={`${activeIndex}-${i}`}
                  className="inline-block animate-reveal-char"
                  style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h2>
            <p className="font-mono text-papiro-soft text-sm md:text-base mb-8 max-w-sm min-h-[3rem]">
              {servicio.desc}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-12">
              {servicio.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-papiro-soft/70 text-sm font-mono">
                  <span className="text-cobalto">✓</span>
                  {feature}
                </div>
              ))}
            </div>

            {servicio.active ? (
              <a
                href="#contacto"
                className="group relative flex items-center gap-4 text-cobalto hover:text-papiro transition-colors duration-500 hover-target px-8 py-4 border border-cobalto/30 hover:border-papiro/50 rounded-full"
              >
                <span className="font-display italic text-2xl">Cotizar proyecto</span>
                <span className="transform transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">↗</span>
              </a>
            ) : (
              <div className="flex items-center gap-4 text-papiro/30 px-8 py-4 border border-papiro/10 rounded-full">
                <span className="font-display italic text-2xl">Pronto</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}