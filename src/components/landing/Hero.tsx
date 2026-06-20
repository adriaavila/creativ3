"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  Menu,
  MessageCircle,
  Play,
  X,
} from "lucide-react";
import { whatsappUrl } from "@/lib/contact";
import BoomerangVideoBg from "./BoomerangVideoBg";
import CreativvLogo from "./CreativvLogo";

const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4";

const PROCESS_VIDEO = "/videos/como-trabajamos.mp4";

const NAV_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proyectos", label: "Proyectos" },
  { href: "#oferta", label: "Planes" },
  { href: "#contacto", label: "Contacto" },
];

const LANDING_WHATSAPP_URL = whatsappUrl(
  "Hola, quiero pedir la landing page de USD 199 en 3 dias con creativv. Mi negocio es:"
);

const CONSULT_WHATSAPP_URL = whatsappUrl(
  "Hola, quiero mejorar mi presencia digital para captar mas leads. No se si empezar con landing, automatizacion o web/producto. Mi caso es:"
);

const HERO_STEPS = [
  ["1", "Lanza una landing clara para campañas, referidos, Instagram o WhatsApp."],
  ["2", "Captura solicitudes y ordena conversaciones antes de que se enfríen."],
  ["3", "Escala con automatizaciones, web completa, MVP o sistema interno."],
];

export default function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen || videoOpen ? "hidden" : "";
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
    <section className="relative min-h-[86svh] w-full overflow-hidden bg-[#dfe2d5] text-[#152115]">
      <BoomerangVideoBg src={BG_VIDEO} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,243,236,0.96)_0%,rgba(245,243,236,0.9)_42%,rgba(245,243,236,0.44)_76%,rgba(245,243,236,0.25)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f5f3ec] to-transparent" />

      <nav className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 md:px-10">
        <Link href="/" className="flex items-center text-[#1f2a1d]" aria-label="creativv">
          <CreativvLogo variant="lockup-bare" className="h-7 w-auto sm:h-8 md:h-9" />
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/80 py-1 pl-6 pr-1 shadow-sm backdrop-blur-md lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-[#4b5b47] transition-colors hover:text-[#1f2a1d]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={LANDING_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 rounded-full bg-[#1f2a1d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#336443]"
          >
            Pedir landing
          </a>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href="#oferta"
            className="hidden items-center gap-2 text-sm font-semibold text-[#2d3a2a] transition-opacity hover:opacity-75 sm:flex"
          >
            <CalendarCheck className="h-4 w-4" />
            Ver planes
          </a>
          <a
            href={CONSULT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 text-sm font-semibold text-[#2d3a2a] transition-opacity hover:opacity-75 sm:flex"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[#1f2a1d] backdrop-blur-md transition-colors hover:bg-white lg:hidden"
            aria-label={menuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            <Menu
              className={`absolute h-5 w-5 transition-all duration-300 ${
                menuOpen ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
              }`}
            />
            <X
              className={`absolute h-5 w-5 transition-all duration-300 ${
                menuOpen ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"
              }`}
            />
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-20 transition-opacity duration-300 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-[#1f2a1d]/40 backdrop-blur-sm" />
      </div>

      <div
        className={`fixed bottom-0 right-0 top-0 z-20 w-[86%] max-w-sm bg-white/95 shadow-2xl backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-8 pb-8 pt-24">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`border-b border-[#1f2a1d]/10 py-4 text-2xl font-semibold text-[#1f2a1d] transition-all duration-500 ${
                  menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                }`}
                style={{ transitionDelay: menuOpen ? `${120 + i * 60}ms` : "0ms" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div
            className={`mt-8 grid gap-3 transition-all duration-500 ${
              menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            }`}
            style={{ transitionDelay: menuOpen ? "420ms" : "0ms" }}
          >
            <a
              href={LANDING_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1f2a1d] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#336443]"
            >
              Pedir landing page
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={CONSULT_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1f2a1d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#1f2a1d] transition-colors hover:bg-[#f5f3ec]"
            >
              Escribir por WhatsApp
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[86svh] max-w-6xl flex-col justify-center px-6 pb-24 pt-28 sm:px-8 md:px-10 md:pb-20 md:pt-32">
        <div className="max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#336443]/15 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#336443] backdrop-blur">
            <Clock3 className="h-3.5 w-3.5" />
            Landing en 3 días desde USD 199
          </div>
          <h1 className="max-w-5xl text-[2.85rem] font-normal leading-[0.93] text-[#1f2a1d] sm:text-6xl md:text-7xl lg:text-[5.55rem]">
            Convierte tu presencia digital en más clientes.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#3d4f38] sm:text-lg md:text-xl">
            Estudio creativo que diseña landing pages, productos digitales y automatizaciones
            con foco en una cosa: que tu negocio se vea mejor y venda más.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={LANDING_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1f2a1d] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(31,42,29,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#336443]"
            >
              Pedir landing page
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#proyectos"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#1f2a1d]/15 bg-white/80 px-6 py-3 text-sm font-semibold text-[#1f2a1d] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Ver proyectos
            </a>
          </div>
        </div>

        <div className="mt-12 grid max-w-4xl grid-cols-1 gap-3 border-t border-[#1f2a1d]/10 pt-6 sm:grid-cols-3">
          {HERO_STEPS.map(([number, text]) => (
            <div key={number} className="flex gap-3 text-sm leading-relaxed text-[#3d4f38]">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f2a1d] text-xs font-semibold text-white">
                {number}
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setVideoOpen(true)}
        className="absolute bottom-8 right-6 z-10 hidden items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/30 md:right-10 lg:flex"
        aria-label="Ver video: Como trabajamos"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />
        </span>
        Cómo trabajamos
      </button>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
          videoOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setVideoOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Cómo trabajamos"
      >
        <div className="absolute inset-0 bg-[#1f2a1d]/80 backdrop-blur-md" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setVideoOpen(false);
          }}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
        <div
          className="relative aspect-video w-[92vw] max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <video
            ref={videoRef}
            src={PROCESS_VIDEO}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full"
          />
        </div>
      </div>
    </section>
  );
}
