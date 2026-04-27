"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function Metodo() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (!textRef.current) return;

    gsap.fromTo(textRef.current.children,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 80%",
        }
      }
    );
  }, []);

  return (
    <section id="metodo" className="w-full bg-papiro text-noche py-32 px-6 sm:px-12 scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-5xl sm:text-7xl mb-24 text-center tracking-tight">El Método</h2>

        <div ref={textRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 font-mono text-sm sm:text-base leading-relaxed opacity-80">
          <p>
            Cada proyecto comienza con diagnóstico. Escuchamos tus procesos, identificamos cuellos de botella y diseñamos una solución que realmente encaje con cómo operas. Sin plantillas, sin soluciones genéricas.
          </p>
          <p>
            Para software a medida: arquitectura modular, código limpio, documentación clara. Para automatización IA: flujos que aprenden, agentes que mejoran, integraciones que funcionan en el mundo real.
          </p>
          <p className="md:col-span-2 max-w-2xl mx-auto text-center font-display text-2xl sm:text-4xl italic text-cobalto mt-12 opacity-100">
            Desarrollamos con precisión, implementamos con cuidado, acompañamos después.
          </p>
        </div>
      </div>
    </section>
  );
}