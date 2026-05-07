"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const ROTATING_PHRASES = [
  "lo que necesitas.",
  "mientras duermes.",
  "sin plantillas.",
  "más rápido.",
  "para que crezcas.",
];

const ROTATING_COPIES = [
  "Te ahorramos horas de trabajo manual.",
  "Tu equipo merece hacer trabajo que importa.",
  "Procesos lentos = dinero que se pierde.",
  "De idea a producto: semanas, no meses.",
  "Tu competencia sigue en Excel. Tú, no.",
];

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!titleRef.current || !phraseRef.current || !copyRef.current) return;

    const letters = titleRef.current.querySelectorAll(".letter");
    const phraseEl = phraseRef.current;
    const copyEl = copyRef.current;

    if (!prefersReducedMotion) {
      gsap.set(letters, { yPercent: 100 });
      gsap.set(phraseEl, { yPercent: 50, opacity: 0 });
      gsap.set(copyEl, { opacity: 0 });

      gsap.timeline({ delay: 0.6 })
        .to(letters, { yPercent: 0, duration: 1.2, ease: "power3.out", stagger: 0.04 })
        .to(phraseEl, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=1.0")
        .to(copyEl, { opacity: 1, duration: 0.7, ease: "power2.out" }, "-=0.4");
    }

    const cycle = () => {
      indexRef.current = (indexRef.current + 1) % ROTATING_PHRASES.length;
      const nextPhrase = ROTATING_PHRASES[indexRef.current];
      const nextCopy = ROTATING_COPIES[indexRef.current];

      gsap.timeline()
        .to(phraseEl, { yPercent: -110, opacity: 0, duration: 0.4, ease: "power2.in" })
        .to(copyEl, { opacity: 0, duration: 0.25, ease: "power2.in" }, "<")
        .call(() => {
          phraseEl.textContent = nextPhrase;
          copyEl.textContent = nextCopy;
        })
        .set(phraseEl, { yPercent: 110, opacity: 1 })
        .to(phraseEl, { yPercent: 0, duration: 0.55, ease: "power3.out" })
        .to(copyEl, { opacity: 1, duration: 0.4, ease: "power2.out" }, "<0.15");
    };

    let intervalId: ReturnType<typeof setInterval>;
    const timeoutId = setTimeout(() => {
      cycle();
      intervalId = setInterval(cycle, 3500);
    }, 4000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 pt-24 sm:pt-32 overflow-hidden">
      <div className="w-full flex justify-between items-start text-xs sm:text-sm font-mono tracking-wide opacity-80 text-papiro-soft">
        <span>VOL. I &middot; NÚMERO II</span>
        <span>LATAM &middot; 2026</span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <h1
          ref={titleRef}
          className="text-center font-display leading-[0.92] tracking-tight max-w-[95vw]"
          style={{ fontSize: "clamp(36px, 7vw, 140px)" }}
        >
          <span className="block overflow-hidden pb-2 sm:pb-3">
            {"Construimos".split("").map((char, i) => (
              <span key={i} className="letter inline-block">
                {char === " " ? " " : char}
              </span>
            ))}
          </span>

          <span className="block overflow-hidden pb-2 sm:pb-3">
            <span
              ref={phraseRef}
              className="italic inline-block"
              style={{ willChange: "transform, opacity" }}
            >
              {ROTATING_PHRASES[0]}
            </span>
          </span>
        </h1>
      </div>

      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pb-4">
        <div className="hidden sm:block text-papiro-soft font-mono text-sm">
          <span className="inline-block" style={{ animation: "spin 20s linear infinite" }}>
            ✦
          </span>
        </div>
        <div className="text-center sm:text-left text-sm sm:text-base opacity-80 max-w-md mx-auto sm:mx-0 text-papiro-soft font-mono">
          <p ref={copyRef}>{ROTATING_COPIES[0]}</p>
        </div>
        <div className="flex justify-center sm:justify-end gap-4">
          <a
            href="#servicios"
            className="border border-papiro/30 px-8 py-3 rounded-full text-sm font-mono hover:bg-papiro hover:text-noche transition-colors duration-500"
          >
            Adelante
          </a>
        </div>
      </div>
    </section>
  );
}
