"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import Link from "next/link";

const PUERTAS = [
  { num: "I", label: "¿Tienes un proyecto en mente?", link: "/proyecto", isExternal: false },
  { num: "II", label: "¿Quieres automatizar procesos?", link: "/automatizar", isExternal: false },
  { num: "III", label: "¿Necesitas cotizar?", link: "/cotizar", isExternal: false },
];

export default function Puertas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    if (!containerRef.current) return;

    const cards = containerRef.current.querySelectorAll('.puerta-card');

    gsap.fromTo(cards,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
        }
      }
    );
  }, []);

  return (
    <section id="contacto" className="w-full bg-noche-deep py-32 px-6 sm:px-12 border-t border-papiro/10 scroll-mt-24">
      <div ref={containerRef} className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {PUERTAS.map((puerta, i) => {
          const content = (
            <>
              <div className="font-editorial text-6xl text-papiro/30 group-hover:text-cobalto transition-colors duration-500">
                {puerta.num}
              </div>

              <div className="flex items-end justify-between">
                <h3 className="font-display text-4xl sm:text-5xl tracking-tight leading-none group-hover:italic transition-all duration-500 pr-4">
                  {puerta.label}
                </h3>
                <span className="text-3xl text-papiro/0 group-hover:text-papiro/100 transform -translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-500">
                  ↗
                </span>
              </div>
            </>
          );

          const className = "puerta-card group flex flex-col justify-between aspect-[3/4] p-10 border border-papiro/20 hover:border-papiro/50 hover:bg-noche-rise/30 transition-all duration-500 hover-target";

          if (puerta.isExternal) {
            return (
              <a
                key={i}
                href={puerta.link}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {content}
              </a>
            );
          }

          return (
            <Link
              key={i}
              href={puerta.link}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}