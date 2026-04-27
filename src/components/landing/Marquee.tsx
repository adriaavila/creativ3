"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Marquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (!marqueeRef.current) return;

    gsap.to(marqueeRef.current, {
      xPercent: -50,
      ease: "none",
      duration: 60,
      repeat: -1,
    });
  }, []);

  const items = [
    <span key="1" className="text-outline">software</span>,
    <span key="2">a medida</span>,
    <span key="3" className="italic text-cobalto">automatización</span>,
    <span key="4" className="text-outline">ia</span>,
    <span key="5">agentes</span>,
    <span key="6" className="italic text-cobalto">workflows</span>,
    <span key="7" className="text-outline">integración</span>,
    <span key="8">escalabilidad</span>,
    <span key="9" className="italic text-cobalto">latam</span>,
    <span key="10">custom dev</span>,
  ];

  return (
    <section className="w-full py-24 sm:py-32 overflow-hidden bg-noche flex items-center border-y border-papiro/5">
      <div className="flex whitespace-nowrap">
        <div ref={marqueeRef} className="flex gap-12 sm:gap-24 font-display text-5xl sm:text-[9rem] tracking-tighter uppercase px-6 sm:px-12">
          {[...items, ...items].map((item, index) => (
            <div key={index} className="flex items-center gap-12 sm:gap-24">
              {item}
              <span className="text-papiro/20 text-2xl sm:text-4xl">✦</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}