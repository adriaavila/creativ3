"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function Tesis() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (textRef.current && containerRef.current) {
      gsap.fromTo(containerRef.current,
        { clipPath: "inset(15% 5% 15% 5%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top bottom",
            end: "center center",
            scrub: true,
          }
        }
      );

      gsap.fromTo(textRef.current.children,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 70%",
          }
        }
      );
    }
  }, []);

  return (
    <section
      id="tesis"
      ref={containerRef}
      className="relative w-full min-h-screen bg-papiro text-noche flex items-center justify-center py-32 px-6 sm:px-12"
    >
      <div
        ref={textRef}
        className="max-w-4xl mx-auto space-y-16 font-display text-2xl md:text-5xl leading-[1.1] tracking-tight"
      >
        <p className="tesis-dropcap">
          Somos una agencia de desarrollo de software a medida e implementación de automatización con IA. Construimos sistemas inteligentes para empresas en Latinoamérica que quieren operar a otra velocidad.
        </p>
        <p>
          No vendemos soluciones genéricas. Escuchamos tu negocio, entendemos tus procesos y construimos exactamente lo que necesitas. Software que se adapta a ti, no al revés.
        </p>
      </div>
    </section>
  );
}