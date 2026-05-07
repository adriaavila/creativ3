"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (!titleRef.current) return;
    const letters = titleRef.current.querySelectorAll(".letter");

    const tl = gsap.timeline({ delay: 1.4 });

    // Grid fade in
    tl.fromTo(gridRef.current, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" }, 0);

    // Meta line
    tl.fromTo(metaRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0.1
    );

    // Title letters
    tl.fromTo(letters,
      { yPercent: 120, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 1.1, ease: "power3.out", stagger: 0.03 }, 0.2
    );

    // Footer area
    tl.fromTo(footerRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 0.9
    );

    // Scroll indicator bob
    gsap.to(indicatorRef.current, {
      y: 10,
      duration: 1.4,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      delay: 2.5,
    });

    // Fade out on scroll
    gsap.to([titleRef.current, footerRef.current, metaRef.current], {
      opacity: 0,
      y: -40,
      ease: "power2.in",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "+=300",
        scrub: 0.5,
      },
    });
  }, []);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 pt-24 sm:pt-32 overflow-hidden">

      {/* Ambient grid */}
      <div
        ref={gridRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(42,110,160,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(42,110,160,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Scan line */}
      <div
        ref={scanRef}
        aria-hidden="true"
        className="scan-line"
        style={{ zIndex: 2 }}
      />

      {/* Hero corner metadata */}
      <div
        ref={metaRef}
        className="relative z-10 w-full flex justify-between items-start text-xs sm:text-sm font-mono tracking-wide text-papiro/40"
      >
        <span>VOL. I &middot; NÚMERO II</span>
        <span>LATAM &middot; 2026</span>
      </div>

      {/* Title */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <h1
          ref={titleRef}
          className="text-center font-display leading-[0.92] tracking-tight max-w-[95vw]"
          style={{ fontSize: "clamp(36px, 7vw, 140px)" }}
        >
          <span className="block overflow-hidden pb-2 sm:pb-3">
            {"Construimos".split("").map((char, i) => (
              <span key={i} className="letter inline-block opacity-0">
                {char === " " ? " " : char}
              </span>
            ))}
          </span>
          <span className="block overflow-hidden pb-2 sm:pb-3">
            <span className="italic">
              {"lo que necesitas.".split("").map((char, i) => (
                <span key={i} className="letter inline-block opacity-0">
                  {char === " " ? " " : char}
                </span>
              ))}
            </span>
          </span>
          <span className="block overflow-hidden">
            {"Automatizamos con ".split("").map((char, i) => (
              <span key={i} className="letter inline-block opacity-0">
                {char === " " ? " " : char}
              </span>
            ))}
            <span className="italic text-cobalto">
              {"IA.".split("").map((char, i) => (
                <span key={i} className="letter inline-block opacity-0">
                  {char === " " ? " " : char}
                </span>
              ))}
            </span>
          </span>
        </h1>
      </div>

      {/* Footer */}
      <div
        ref={footerRef}
        className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pb-4"
      >
        {/* Scroll indicator */}
        <div
          ref={indicatorRef}
          className="hidden sm:flex flex-col items-center gap-2 text-papiro/30"
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-cobalto/60" />
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="text-center sm:text-left text-sm sm:text-base text-papiro-soft/70 font-mono max-w-md mx-auto sm:mx-0">
          Desarrollo de software a medida + automatización inteligente con IA para empresas en LATAM.
        </div>

        <div className="flex justify-center sm:justify-end gap-4">
          <a
            href="#servicios"
            className="group relative border border-papiro/20 px-8 py-3 rounded-full text-sm font-mono hover:bg-papiro hover:text-noche transition-all duration-500 hover-target overflow-hidden"
          >
            {/* Shimmer sweep on hover */}
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            />
            <span className="relative">Adelante →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
