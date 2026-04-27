"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (!titleRef.current) return;

    const letters = titleRef.current.querySelectorAll('.letter');

    gsap.set(letters, { yPercent: 100 });

    gsap.to(letters, {
      yPercent: 0,
      duration: 1.2,
      ease: "power3.out",
      stagger: 0.04,
      delay: 0.6,
    });
  }, []);

return (
    <section className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 pt-24 sm:pt-32 overflow-hidden">
      {/* Obertura metadata — sits below fixed SiteHeader */}
      <div className="w-full flex justify-between items-start text-xs sm:text-sm font-mono tracking-wide opacity-80 text-papiro-soft">
        <span>VOL. I &middot; NÚMERO II</span>
        <span>LATAM &middot; 2026</span>
      </div>

      {/* Main declaration */}
      <div className="flex-1 flex items-center justify-center">
        <h1
          ref={titleRef}
          className="text-center font-display leading-[0.92] tracking-tight max-w-[95vw]"
          style={{ fontSize: "clamp(36px, 7vw, 140px)" }}
        >
          <span className="block overflow-hidden pb-2 sm:pb-3">
            {"Construimos".split('').map((char, i) => (
              <span key={i} className="letter inline-block">{char === ' ' ? '\u00A0' : char}</span>
            ))}
          </span>
          <span className="block overflow-hidden pb-2 sm:pb-3">
            <span className="italic">
              {"lo que necesitas.".split('').map((char, i) => (
                <span key={i} className="letter inline-block">{char === ' ' ? '\u00A0' : char}</span>
              ))}
            </span>
          </span>
          <span className="block overflow-hidden">
            {"Automatizamos con ".split('').map((char, i) => (
              <span key={i} className="letter inline-block">{char === ' ' ? '\u00A0' : char}</span>
            ))}
            <span className="italic text-cobalto">
              {"IA.".split('').map((char, i) => (
                <span key={i} className="letter inline-block">{char === ' ' ? '\u00A0' : char}</span>
              ))}
            </span>
          </span>
        </h1>
      </div>

      {/* Footer lead & links */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pb-4">
        <div className="hidden sm:block text-papiro-soft font-mono text-sm">
          <span className="inline-block" style={{ animation: "spin 20s linear infinite" }}>✦</span>
        </div>
        <div className="text-center sm:text-left text-sm sm:text-base opacity-80 max-w-md mx-auto sm:mx-0 text-papiro-soft font-mono">
          <p>Desarrollo de software a medida + automatización inteligente con IA para empresas en LATAM.</p>
        </div>
        <div className="flex justify-center sm:justify-end gap-4">
          <a href="#servicios" className="border border-papiro/30 px-8 py-3 rounded-full text-sm font-mono hover:bg-papiro hover:text-noche transition-colors duration-500">
            Adelante
          </a>
        </div>
      </div>
    </section>
  );
}