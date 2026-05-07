"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

export default function Colofon() {
  const textRef = useRef<HTMLDivElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Wordmark reveal
    if (textRef.current) {
      gsap.fromTo(textRef.current,
        { y: 80, opacity: 0, scale: 0.97 },
        {
          y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "power3.out",
          scrollTrigger: { trigger: textRef.current, start: "top 92%" },
        }
      );
    }

    // Links
    if (linksRef.current) {
      gsap.fromTo(linksRef.current.children,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: "power2.out",
          scrollTrigger: { trigger: linksRef.current, start: "top 90%" },
        }
      );
    }

    // Light streak loop
    if (streakRef.current) {
      gsap.to(streakRef.current, {
        x: "120vw",
        duration: 3.5,
        ease: "power1.inOut",
        repeat: -1,
        repeatDelay: 7,
        delay: 2,
      });
    }
  }, []);

  return (
    <footer className="w-full bg-noche-deep pb-12 pt-32 px-6 sm:px-12 flex flex-col items-center border-t border-papiro/10 overflow-hidden relative">

      {/* Light streak */}
      <div
        ref={streakRef}
        aria-hidden="true"
        className="absolute top-16 -left-[30vw] w-[30vw] h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(42,110,160,0.7) 50%, transparent)",
          boxShadow: "0 0 8px rgba(42,110,160,0.5)",
        }}
      />

      {/* Ambient top glow */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(42,110,160,0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Editorial meta */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center text-xs font-mono text-papiro/30 mb-24 gap-6 relative">
        <span>10.4806° N, 66.9036° W</span>
        <div
          className="hidden md:block h-px flex-1 mx-8"
          style={{ background: "linear-gradient(90deg, transparent, rgba(240,234,214,0.1), transparent)" }}
        />
        <span>MMXXVI</span>
      </div>

      {/* Wordmark */}
      <div ref={textRef} className="w-full max-w-full text-center mb-20 opacity-0 relative">
        <h2
          className="font-editorial leading-[0.85] tracking-tighter w-full text-papiro"
          style={{ fontSize: "clamp(40px, 13vw, 240px)" }}
        >
          Servicios{" "}
          <span
            className="italic"
            style={{
              background: "linear-gradient(90deg, var(--cobalto), var(--lima) 60%, var(--cobalto))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 5s linear infinite",
            }}
          >
            Creativos
          </span>
        </h2>
      </div>

      {/* Links row */}
      <div ref={linksRef} className="flex flex-wrap justify-center gap-6 mb-16">
        {[
          { label: "Servicios", href: "/#servicios" },
          { label: "Método", href: "/#metodo" },
          { label: "Precios", href: "/#precios" },
          { label: "Proyectos", href: "/projects" },
          { label: "Contacto", href: "/#contacto" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="font-mono text-xs text-papiro/30 hover:text-papiro/70 transition-colors duration-300 tracking-widest uppercase hover-target"
          >
            {l.label}
          </a>
        ))}
      </div>

      {/* Enlaces Legales */}
      <div className="w-full max-w-7xl flex flex-wrap justify-center gap-6 text-xs font-mono text-papiro/40 mb-12">
        <a href="/terminos" className="hover:text-papiro transition-colors">Términos y Condiciones</a>
        <a href="/privacidad" className="hover:text-papiro transition-colors">Política de Privacidad</a>
        <a href="/eliminacion-de-datos" className="hover:text-papiro transition-colors">Eliminación de Datos</a>
        <a href="/embedded-whatsapp" className="hover:text-papiro transition-colors">Onboarding WhatsApp</a>
      </div>

      {/* Colofón line */}
      <div className="w-full text-center text-xs font-mono text-papiro/25 max-w-2xl mx-auto leading-relaxed">
        Construido en LATAM. Fraunces, Italiana, JetBrains Mono.{" "}
        <span className="text-cobalto/50">Potenciado por Inteligencia Artificial, guiado por humanos.</span>
      </div>
    </footer>
  );
}
