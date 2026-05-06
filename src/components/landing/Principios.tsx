"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

const PRINCIPIOS = [
  { num: "01", text: "Tu software debe crecer con tu negocio, no limitarlo." },
  { num: "02", text: "La automatización existe para liberar, no para complicar." },
  { num: "03", text: "No entregamos código. Entregamos soluciones que funcionan." },
  { num: "04", text: "Entendemos LATAM: infraestructura, conectividad, realidades." },
  { num: "05", text: "El mejor código es el que no notas que existe." },
];

export default function Principios() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Title
    if (titleRef.current) {
      gsap.fromTo(titleRef.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1, x: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: titleRef.current, start: "top 85%" },
        }
      );
    }

    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll(".principio-card");

    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power2.out",
          scrollTrigger: { trigger: card, start: "top 88%" },
        }
      );
    });
  }, []);

  return (
    <section className="w-full bg-noche py-32 px-6 sm:px-12 relative overflow-hidden">
      {/* Ambient right glow */}
      <div
        aria-hidden="true"
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(42,110,160,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 md:gap-32 relative">
        {/* Sticky title */}
        <div className="md:w-1/3">
          <h2
            ref={titleRef}
            className="font-display italic text-cobalto text-4xl sm:text-6xl tracking-tight md:sticky md:top-32 opacity-0"
          >
            Principios
          </h2>
        </div>

        {/* Cards */}
        <div ref={containerRef} className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {PRINCIPIOS.map((p, i) => (
            <div
              key={i}
              className={`principio-card group relative p-8 sm:p-10 border border-papiro/8 bg-noche-rise/20 rounded-xl
                hover:border-cobalto/30 hover:bg-noche-rise/50 transition-all duration-500 cursor-default
                ${i === PRINCIPIOS.length - 1 ? "sm:col-span-2" : ""}
                ${i === PRINCIPIOS.length - 1 ? "aspect-auto sm:py-12 sm:flex sm:items-center sm:justify-center" : "aspect-square flex flex-col justify-between"}`}
            >
              {/* Hover glow */}
              <div
                aria-hidden="true"
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: "0 0 40px rgba(42,110,160,0.08), inset 0 0 30px rgba(42,110,160,0.04)" }}
              />

              {/* Shine sweep */}
              <div aria-hidden="true" className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                  style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.03) 50%, transparent 70%)" }}
                />
              </div>

              {/* Number */}
              {i !== PRINCIPIOS.length - 1 && (
                <div className="font-mono text-xs text-cobalto/40 tracking-widest mb-auto">
                  {p.num}
                </div>
              )}

              {/* Text */}
              <p className={`font-display tracking-tight text-papiro-soft group-hover:text-papiro transition-colors duration-400 relative ${
                i === PRINCIPIOS.length - 1
                  ? "text-2xl sm:text-4xl text-center"
                  : "text-2xl sm:text-3xl leading-tight"
              }`}>
                {p.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
