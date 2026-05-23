"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogIn, UserPlus, Play, Menu, X } from "lucide-react";
import BoomerangVideoBg from "./BoomerangVideoBg";
import CreativvLogo from "./CreativvLogo";

const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4";

const PROCESS_VIDEO = "/videos/como-trabajamos.mp4";

const NAV_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#contacto", label: "Contacto" },
];

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (menuOpen || videoOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, videoOpen]);

  useEffect(() => {
    if (!videoOpen) {
      const el = videoRef.current;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const el = videoRef.current;
    if (el) {
      el.currentTime = 0;
      void el.play().catch(() => {});
    }
    return () => window.removeEventListener("keydown", onKey);
  }, [videoOpen]);

  return (
    <section className="relative w-full min-h-screen sm:h-screen overflow-hidden bg-[#e8e7df]">
      <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 w-full h-full" />

      <nav className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 sm:py-6">
        <Link href="/" className="flex items-center text-[#1f2a1d]" aria-label="creativv">
          <CreativvLogo variant="lockup-bare" className="h-7 sm:h-8 md:h-9 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-1 bg-white/70 backdrop-blur-md rounded-full pl-6 pr-1 py-1 shadow-sm border border-white/60">
          {NAV_LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm px-3 py-2 transition-colors ${
                i === 0
                  ? "font-semibold text-[#1f2a1d]"
                  : "font-medium text-[#4b5b47] hover:text-[#1f2a1d]"
              }`}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contacto"
            className="ml-2 bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            Cotizar proyecto
          </a>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 text-[#2d3a2a]">
          <a
            href="#contacto"
            className="hidden sm:flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            Crear cuenta
          </a>
          <a
            href="#contacto"
            className="hidden sm:flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <LogIn className="w-4 h-4" />
            Entrar
          </a>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden relative flex items-center justify-center w-10 h-10 rounded-full bg-white/70 backdrop-blur-md border border-white/60 text-[#1f2a1d] transition-all duration-300 hover:bg-white/90"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <Menu
              className={`w-5 h-5 absolute transition-all duration-300 ${
                menuOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
              }`}
            />
            <X
              className={`w-5 h-5 absolute transition-all duration-300 ${
                menuOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-20 transition-opacity duration-300 ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-[#1f2a1d]/40 backdrop-blur-sm" />
      </div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 right-0 bottom-0 z-20 w-[85%] max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full pt-24 px-8 pb-8">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`text-2xl font-semibold text-[#1f2a1d] py-4 border-b border-[#1f2a1d]/10 transition-all duration-500 ${
                  menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
                style={{ transitionDelay: menuOpen ? `${150 + i * 70}ms` : "0ms" }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div
            className={`mt-8 flex flex-col gap-4 transition-all duration-500 ${
              menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            }`}
            style={{ transitionDelay: menuOpen ? "400ms" : "0ms" }}
          >
            <a
              href="#contacto"
              className="flex items-center gap-2 text-sm font-medium text-[#2d3a2a] sm:hidden"
            >
              <UserPlus className="w-4 h-4" />
              Crear cuenta
            </a>
            <a
              href="#contacto"
              className="flex items-center gap-2 text-sm font-medium text-[#2d3a2a] sm:hidden"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </a>
            <a
              href="#contacto"
              onClick={() => setMenuOpen(false)}
              className="mt-2 inline-block text-center bg-[#1f2a1d] hover:bg-[#2a3827] text-white text-sm font-semibold px-5 py-3 rounded-full transition-colors"
            >
              Cotizar proyecto
            </a>
          </div>
        </div>
      </div>

      {/* Hero copy */}
      <div className="relative z-10 flex flex-col items-center text-center pt-24 sm:pt-28 md:pt-32 px-4 sm:px-6">
        <h1
          className="font-normal leading-[0.95] text-[#336443] text-[2rem] sm:text-4xl md:text-5xl lg:text-[4.75rem] xl:text-[5.25rem] max-w-5xl"
          style={{ letterSpacing: "-0.035em" }}
        >
          Cerramos la brecha{" "}
          <span className="text-[#85AB8B]">
            entre la idea
            <br className="hidden sm:block" /> y el producto vivo
          </span>
        </h1>
        <p className="mt-6 sm:mt-8 text-[#4b5b47] text-sm sm:text-base md:text-lg leading-relaxed max-w-xl px-2">
          Convertimos ideas borrosas en producto medible. Diseño, ingeniería e IA bajo un mismo techo —
          para empresas que no se conforman.
        </p>
      </div>

      {/* Bottom-left CTA block */}
      <div className="absolute left-4 right-4 sm:right-auto sm:left-6 md:left-10 bottom-6 sm:bottom-8 md:bottom-10 z-10 max-w-sm">
        <div className="flex items-center gap-2 text-white/95 mb-3">
          <CreativvLogo variant="mark-bare" className="h-5 w-5" />
          <span className="text-xs font-semibold tracking-widest uppercase">
            Estudio · Caracas / Remoto
          </span>
        </div>
        <p className="text-white/85 text-xs leading-relaxed mb-6 max-w-xs font-medium sm:font-normal">
          Trabajamos junto a empresas y equipos que necesitan ir rápido sin sacrificar profundidad.
        </p>
        <div className="flex items-center gap-4 flex-wrap">
          <a
            href="#contacto"
            className="bg-[#3d5638] sm:bg-white hover:bg-[#2d4228] sm:hover:bg-white/90 text-white sm:text-[#1f2a1d] text-sm font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors shadow-sm"
          >
            Cotizar proyecto
          </a>
          <a
            href="#servicios"
            className="text-[#3d5638] sm:text-white text-sm font-semibold sm:font-medium hover:opacity-80 transition-opacity"
          >
            Conoce más.
          </a>
        </div>
      </div>

      {/* Bottom-right link */}
      <button
        type="button"
        onClick={() => setVideoOpen(true)}
        className="hidden sm:flex absolute right-6 md:right-10 bottom-8 md:bottom-10 z-10 items-center gap-2 text-white/90 text-sm hover:opacity-90 transition-opacity"
        aria-label="Ver video: ¿Cómo trabajamos?"
      >
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors">
          <Play className="w-3 h-3 fill-white text-white ml-0.5" />
        </span>
        <span className="font-medium">¿Cómo trabajamos?</span>
        <span className="text-white/60">1:33</span>
      </button>

      {/* Video modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          videoOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setVideoOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Cómo trabajamos"
      >
        <div className="absolute inset-0 bg-[#1f2a1d]/85 backdrop-blur-md" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setVideoOpen(false);
          }}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        <div
          className="relative w-[92vw] max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          <video
            ref={videoRef}
            src={PROCESS_VIDEO}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
