"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function Colofon() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (!textRef.current) return;

    gsap.fromTo(textRef.current,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: textRef.current,
          start: "top 95%",
        }
      }
    );
  }, []);

  return (
    <footer className="w-full bg-noche pb-12 pt-32 px-6 sm:px-12 flex flex-col items-center border-t border-papiro/10 overflow-hidden">
      
      {/* Metadata editorial superior */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center text-xs font-mono text-papiro/50 mb-32 gap-6">
        <span>10.4806° N, 66.9036° W</span>
        <span>MMXXVI</span>
      </div>

      {/* Wordmark Gigante */}
      <div ref={textRef} className="w-full max-w-full text-center mb-32">
        <h2 className="font-editorial leading-[0.85] tracking-tighter w-full text-papiro" style={{ fontSize: "clamp(40px, 13vw, 240px)" }}>
          Servicios <span className="italic text-cobalto">Creativos</span>
        </h2>
      </div>

      {/* Colofón line */}
      <div className="w-full text-center text-xs sm:text-sm font-mono text-papiro/40 max-w-2xl mx-auto">
        Este sitio vive en LATAM. Fraunces, Italiana, JetBrains Mono. Potenciado por Inteligencia Artificial, guiado por humanos.
      </div>

    </footer>
  );
}
