"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const PRINCIPIOS = [
  "Tu software debe crecer con tu negocio, no limitarlo.",
  "La automatización existe para liberar, no para complicar.",
  "No entregamos código. Entregamos soluciones que funcionan.",
  "Entendemos LATAM: infraestructura, conectividad, realidades.",
  "El mejor código es el que no notas que existe.",
];

export default function Principios() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.principio-card');

    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          }
        }
      );
    });
  }, []);

  return (
    <section className="w-full bg-noche py-32 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32">
        <div className="md:w-1/3">
          <h2 className="font-display italic text-cobalto text-4xl sm:text-6xl tracking-tight sticky top-32">
            Principios
          </h2>
        </div>

        <div ref={containerRef} className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">
          {PRINCIPIOS.map((text, i) => (
            <div
              key={i}
              className={`principio-card p-8 sm:p-12 border border-papiro/10 bg-noche-rise/30 hover:bg-noche-rise/60 transition-colors duration-500 rounded flex items-center justify-center text-center ${
                i === PRINCIPIOS.length - 1 ? "sm:col-span-2 aspect-auto sm:aspect-[3/1]" : "aspect-square"
              }`}
            >
              <p className="font-display text-2xl sm:text-4xl leading-tight tracking-tight text-papiro-soft">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}