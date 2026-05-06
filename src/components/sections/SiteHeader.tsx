"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const NAV = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Método", href: "/#metodo" },
  { label: "Precios", href: "/#precios" },
  { label: "Proyectos", href: "/projects" },
];

const HIDE_ON = ["/projects/mistica", "/shopea"];

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Subtle glow line pulse when not scrolled
  useEffect(() => {
    if (!glowRef.current) return;
    gsap.to(glowRef.current, {
      opacity: scrolled ? 0 : 0.6,
      duration: 0.6,
      ease: "power2.out",
    });
  }, [scrolled]);

  if (pathname && HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 inset-x-0 z-[60] transition-all duration-500 ${
        scrolled
          ? "bg-noche/75 backdrop-blur-xl border-b border-papiro/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      {/* Cobalto glow line below header when at top */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(42,110,160,0.6) 50%, transparent 100%)",
          boxShadow: "0 0 12px rgba(42,110,160,0.4)",
          opacity: 0,
        }}
      />

      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-12 h-16 sm:h-[72px]">
        {/* Logo */}
        <Link
          href="/"
          className="group font-display text-xl sm:text-2xl tracking-tight text-papiro hover-target shrink-0"
        >
          Servicios
          <span className="text-cobalto italic transition-all duration-500 group-hover:text-lima">
            Creativos
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 font-mono text-sm text-papiro-soft">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative group hover:text-papiro transition-colors duration-300 hover-target"
            >
              {item.label}
              {/* Underline sweep */}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-cobalto group-hover:w-full transition-all duration-400 ease-out" />
            </Link>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/#contacto"
          className="hidden sm:inline-flex items-center gap-2 border border-papiro/25 px-5 py-2 rounded-full text-sm font-mono hover:bg-papiro hover:text-noche hover:border-papiro transition-all duration-500 hover-target group"
        >
          <span>Contacto</span>
          <span className="transform transition-transform duration-400 group-hover:translate-x-1 group-hover:-translate-y-1 text-xs">↗</span>
        </Link>

        {/* Mobile burger */}
        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 border border-papiro/25 rounded-full text-papiro hover-target transition-colors duration-300 hover:border-papiro/60"
        >
          <span className="sr-only">Menú</span>
          <span aria-hidden="true" className="text-lg leading-none">{open ? "×" : "≡"}</span>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-noche-deep/98 backdrop-blur-xl border-t border-papiro/10">
          <div className="px-6 py-6 flex flex-col gap-4 font-mono text-sm text-papiro-soft">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="hover:text-papiro transition-colors py-1"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contacto"
              onClick={() => setOpen(false)}
              className="self-start border border-papiro/30 px-5 py-2 rounded-full hover:bg-papiro hover:text-noche transition-all duration-400"
            >
              Contacto ↗
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
