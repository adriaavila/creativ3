"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

import Link from "next/link";

const PRODUCTS = [
  { id: "I", name: "Agentes IA", desc: "Asistentes virtuales 24/7 de atención y ventas.", active: true, link: "#" },
  { id: "II", name: "Workflows", desc: "Automatización de tareas operativas y repetitivas.", active: true, link: "#" },
  { id: "III", name: "Consultoría", desc: "Auditoría e implementación de IA para escalar.", active: true, link: "#" },
];

export default function Productos() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    if (!sectionRef.current) return;

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        let newIndex = Math.floor(progress * PRODUCTS.length);
        if (newIndex >= PRODUCTS.length) newIndex = PRODUCTS.length - 1;
        setActiveIndex(newIndex);
      }
    });

  }, []);

  return (
    <section ref={sectionRef} id="productos" className="relative h-[300vh] w-full bg-noche">
      <div ref={containerRef} className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-6">
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center">
          
          <div className="font-editorial text-[10rem] md:text-[25rem] leading-none text-noche-rise select-none transition-all duration-700 ease-in-out">
            {PRODUCTS[activeIndex].id}
          </div>

          <div className="relative z-10 flex flex-col items-start md:-ml-32 mt-[-2rem] md:mt-0">
            <h2 className="font-display text-5xl md:text-8xl mb-4 tracking-tight flex overflow-hidden">
              {PRODUCTS[activeIndex].name.split("").map((char, i) => (
                <span 
                  key={`${activeIndex}-${i}`} 
                  className="inline-block animate-reveal-char"
                  style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "both" }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h2>
            <p className="font-mono text-papiro-soft text-sm md:text-base mb-12 max-w-sm min-h-[3rem]">
              {PRODUCTS[activeIndex].desc}
            </p>
            
            {PRODUCTS[activeIndex].active ? (
              <Link 
                href={PRODUCTS[activeIndex].link}
                className="group relative flex items-center gap-4 text-cobalto hover:text-papiro transition-colors duration-500 hover-target px-8 py-4 border border-cobalto/30 hover:border-papiro/50 rounded-full"
              >
                <span className="font-display italic text-2xl">Más información</span>
                <span className="transform transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">↗</span>
              </Link>
            ) : (
              <div className="flex items-center gap-4 text-papiro/30 px-8 py-4 border border-papiro/10 rounded-full">
                <span className="font-display italic text-2xl">Pronto</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
