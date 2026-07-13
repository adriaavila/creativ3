"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  Menu,
  MessageCircle,
  Play,
  TrendingUp,
  Workflow,
  X,
} from "lucide-react";
import type { LandingIntent } from "@/lib/landing-intent";
import { whatsappUrl } from "@/lib/contact";
import BoomerangVideoBg from "./BoomerangVideoBg";
import CreativvLogo from "./CreativvLogo";

const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_131941_d136af49-e243-493a-be14-6ff3f24e09e6.mp4";

const PROCESS_VIDEO = "/videos/como-trabajamos.mp4";

const NAV_LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#trabajo", label: "Proyectos" },
  { href: "#empezar", label: "Empezar" },
];

const AUTOMATION_WHATSAPP_URL = whatsappUrl(
  "Hola, quiero automatizar un proceso que hoy me consume horas. El proceso es:"
);

const REVENUE_WHATSAPP_URL = whatsappUrl(
  "Hola, quiero aumentar los ingresos de mi negocio con una landing, sitio web o ecommerce. Mi negocio es:"
);

const HERO_CONTENT = {
  efficiency: {
    eyebrow: "Sistemas operativos · 5–10 días",
    title: "Convierte horas manuales en capacidad para crecer.",
    body: "Diseñamos automatizaciones, dashboards y apps que eliminan tareas repetitivas sin quitarte el control. Menos costo de operar; más tiempo para decidir.",
    primaryLabel: "Calcular cuánto pierdo hoy",
    primaryHref: "/cotizar",
    secondaryLabel: "Contar mi proceso",
    secondaryHref: AUTOMATION_WHATSAPP_URL,
    steps: [
      ["01", "Medimos", "El costo real del proceso, sus pasos y excepciones."],
      ["02", "Simplificamos", "El flujo mínimo que libera más capacidad."],
      ["03", "Automatizamos", "Con visibilidad, responsables y control humano."],
    ],
    visualLabel: "Eficiencia operativa",
    visualTitle: "Menos pasos. Más capacidad.",
    visualImage: "/projects/rei-fm/01-desktop.jpg",
    visualAlt: "Dashboard operativo de rei para reducir trabajo manual",
    visualMetric: "−42 h",
    visualMetricLabel: "trabajo manual / mes",
    visualTags: ["Automatización", "Dashboard", "App"],
  },
  revenue: {
    eyebrow: "Growth design · listo para convertir",
    title: "Diseñamos la experiencia que convierte atención en ingresos.",
    body: "Landing pages, sitios web y ecommerce con estrategia, UX y dirección visual de clase mundial. Tu oferta se entiende, se desea y se vuelve fácil de comprar.",
    primaryLabel: "Quiero aumentar ingresos",
    primaryHref: REVENUE_WHATSAPP_URL,
    secondaryLabel: "Ver proyectos que venden",
    secondaryHref: "#trabajo",
    steps: [
      ["01", "Aterrizamos", "Oferta, audiencia y ventaja en una narrativa clara."],
      ["02", "Diseñamos", "UX y dirección visual para generar confianza y deseo."],
      ["03", "Convertimos", "Una ruta simple desde la visita hasta la compra."],
    ],
    visualLabel: "Experiencia comercial",
    visualTitle: "De visita a cliente.",
    visualImage: "/projects/shopea/01-desktop.jpg",
    visualAlt: "Ecommerce Shopea diseñado para convertir conversaciones en compras",
    visualMetric: "+1",
    visualMetricLabel: "camino claro a comprar",
    visualTags: ["Landing", "Diseño web", "Ecommerce"],
  },
} as const;

type HeroProps = {
  intent: LandingIntent;
  onIntentChange: (intent: LandingIntent) => void;
};

export default function Hero({ intent, onIntentChange }: HeroProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isRevenue = intent === "revenue";
  const content = HERO_CONTENT[intent];

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

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVideoOpen(false);
    };

    window.addEventListener("keydown", onKey);
    const el = videoRef.current;
    if (el) {
      el.currentTime = 0;
      void el.play().catch(() => {});
    }

    return () => window.removeEventListener("keydown", onKey);
  }, [videoOpen]);

  const primaryIsExternal = content.primaryHref.startsWith("http");
  const secondaryIsExternal = content.secondaryHref.startsWith("http");

  return (
    <section
      className={`relative min-h-[100svh] w-full overflow-hidden transition-colors duration-700 ${
        isRevenue ? "bg-[#e9b6a3] text-[#251b17]" : "bg-[#dfe2d5] text-[#152115]"
      }`}
    >
      <BoomerangVideoBg
        src={BG_VIDEO}
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          isRevenue ? "opacity-35 saturate-[0.7]" : "opacity-55"
        }`}
      />
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isRevenue
            ? "bg-[linear-gradient(90deg,rgba(255,247,239,0.98)_0%,rgba(255,239,226,0.93)_48%,rgba(215,105,70,0.45)_100%)]"
            : "bg-[linear-gradient(90deg,rgba(245,243,236,0.98)_0%,rgba(245,243,236,0.92)_48%,rgba(51,100,67,0.38)_100%)]"
        }`}
      />
      <div
        className={`absolute -right-24 top-20 h-80 w-80 rounded-full blur-3xl transition-colors duration-700 ${
          isRevenue ? "bg-[#e65f3c]/20" : "bg-[#b8d397]/25"
        }`}
      />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fffdf7] to-transparent" />

      <nav className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-6 md:px-10">
        <Link
          href="/"
          className={`flex items-center transition-colors duration-500 ${
            isRevenue ? "text-[#3b2119]" : "text-[#1f2a1d]"
          }`}
          aria-label="creativv"
        >
          <CreativvLogo variant="lockup-bare" className="h-7 w-auto sm:h-8 md:h-9" />
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/78 py-1 pl-6 pr-1 shadow-sm backdrop-blur-xl lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-[#4f5148] transition-colors hover:text-[#171b16]"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={content.primaryHref}
            target={primaryIsExternal ? "_blank" : undefined}
            rel={primaryIsExternal ? "noopener noreferrer" : undefined}
            className={`ml-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 ${
              isRevenue ? "bg-[#b9472d] hover:bg-[#913520]" : "bg-[#1f2a1d] hover:bg-[#336443]"
            }`}
          >
            {isRevenue ? "Cotizar proyecto" : "Calcular ahorro"}
          </a>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <a
            href={content.primaryHref}
            target={primaryIsExternal ? "_blank" : undefined}
            rel={primaryIsExternal ? "noopener noreferrer" : undefined}
            className="hidden items-center gap-2 text-sm font-semibold text-[#2d332b] transition-opacity hover:opacity-70 sm:flex"
          >
            <CalendarCheck className="h-4 w-4" />
            Empezar
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/80 text-[#1f2a1d] backdrop-blur-md transition-colors hover:bg-white lg:hidden"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
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

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20 bg-[#1f2a1d]/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} />
          <div
            className="fixed bottom-0 right-0 top-0 z-20 w-[86%] max-w-sm bg-[#fffdf7]/97 shadow-2xl backdrop-blur-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navegación principal"
          >
            <div className="flex h-full flex-col px-8 pb-8 pt-24">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link, index) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="translate-x-0 border-b border-[#1f2a1d]/10 py-4 font-display text-3xl text-[#1f2a1d] opacity-100 transition-all duration-500"
                    style={{ transitionDelay: `${120 + index * 60}ms` }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-8 grid translate-x-0 gap-3 opacity-100 transition-all duration-500 delay-300">
                <a
                  href={content.primaryHref}
                  target={primaryIsExternal ? "_blank" : undefined}
                  rel={primaryIsExternal ? "noopener noreferrer" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white ${
                    isRevenue ? "bg-[#b9472d]" : "bg-[#1f2a1d]"
                  }`}
                >
                  {content.primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#1f2a1d]/15 bg-white px-5 py-3 text-sm font-semibold text-[#1f2a1d]"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1440px] flex-col px-5 pb-20 pt-24 sm:px-8 sm:pt-28 lg:px-12 lg:pb-24">
        <div className="flex w-full flex-col gap-2 rounded-[1.4rem] border border-white/75 bg-white/70 p-2 shadow-[0_16px_60px_rgba(31,42,29,0.08)] backdrop-blur-xl sm:w-fit sm:flex-row sm:items-center sm:rounded-full">
          <span className="px-3 py-1 text-center font-mono text-[9px] font-medium uppercase tracking-[0.17em] text-[#62665d] sm:text-left">
            ¿Qué buscas?
          </span>
          <div
            className="grid grid-cols-2 gap-1 rounded-2xl bg-[#edece5]/85 p-1 sm:rounded-full"
            role="group"
            aria-label="Selecciona el objetivo principal de tu negocio"
          >
            <button
              type="button"
              onClick={() => onIntentChange("revenue")}
              aria-pressed={isRevenue}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-all duration-300 sm:rounded-full sm:px-5 sm:text-sm ${
                isRevenue
                  ? "bg-[#b9472d] text-white shadow-[0_8px_24px_rgba(185,71,45,0.24)]"
                  : "text-[#5b6057] hover:bg-white/75 hover:text-[#20251f]"
              }`}
            >
              <TrendingUp className="size-4" />
              Aumentar ingresos
            </button>
            <button
              type="button"
              onClick={() => onIntentChange("efficiency")}
              aria-pressed={!isRevenue}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-semibold transition-all duration-300 sm:rounded-full sm:px-5 sm:text-sm ${
                !isRevenue
                  ? "bg-[#1f2a1d] text-white shadow-[0_8px_24px_rgba(31,42,29,0.2)]"
                  : "text-[#5b6057] hover:bg-white/75 hover:text-[#20251f]"
              }`}
            >
              <Workflow className="size-4" />
              Reducir costos
            </button>
          </div>
        </div>

        <div
          key={intent}
          className="landing-intent-enter mt-10 grid flex-1 items-center gap-10 lg:mt-12 lg:grid-cols-[1.08fr_0.62fr] lg:gap-16"
          aria-live="polite"
        >
          <div className="max-w-4xl">
            <div
              className={`mb-5 inline-flex items-center gap-2 rounded-full border bg-white/72 px-4 py-2 font-mono text-[9px] font-medium uppercase tracking-[0.16em] backdrop-blur ${
                isRevenue
                  ? "border-[#b9472d]/15 text-[#9c3924]"
                  : "border-[#336443]/15 text-[#336443]"
              }`}
            >
              {isRevenue ? <TrendingUp className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
              {content.eyebrow}
            </div>
            <h1
              className={`max-w-5xl font-display text-[clamp(3.15rem,6.8vw,7.1rem)] font-normal leading-[0.86] tracking-[-0.045em] ${
                isRevenue ? "text-[#321d16]" : "text-[#1f2a1d]"
              }`}
            >
              {content.title}
            </h1>
            <p
              className={`mt-6 max-w-2xl text-base leading-relaxed sm:text-lg md:text-xl ${
                isRevenue ? "text-[#654137]" : "text-[#3d4f38]"
              }`}
            >
              {content.body}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={content.primaryHref}
                target={primaryIsExternal ? "_blank" : undefined}
                rel={primaryIsExternal ? "noopener noreferrer" : undefined}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(31,42,29,0.18)] transition-all duration-300 hover:-translate-y-0.5 ${
                  isRevenue ? "bg-[#b9472d] hover:bg-[#913520]" : "bg-[#1f2a1d] hover:bg-[#336443]"
                }`}
              >
                {content.primaryLabel}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href={content.secondaryHref}
                target={secondaryIsExternal ? "_blank" : undefined}
                rel={secondaryIsExternal ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#1f2a1d]/15 bg-white/75 px-6 py-3 text-sm font-semibold text-[#1f2a1d] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
              >
                {content.secondaryLabel}
              </a>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rotate-[1.5deg] overflow-hidden rounded-[1.7rem] border border-white/55 bg-[#fffdf7]/88 p-3 shadow-[0_38px_110px_rgba(31,42,29,0.2)] backdrop-blur-xl transition-transform duration-500 hover:rotate-0 hover:scale-[1.01]">
              <div className="flex items-center justify-between px-2 pb-3 pt-1">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#697064]">
                  {content.visualLabel}
                </div>
                <ArrowRight className={`size-4 -rotate-45 ${isRevenue ? "text-[#b9472d]" : "text-[#31583a]"}`} />
              </div>
              <div className="relative aspect-[16/11] overflow-hidden rounded-[1.1rem] bg-[#e8eadf]">
                <Image
                  src={content.visualImage}
                  alt={content.visualAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 36vw, 0px"
                  className="object-cover object-top"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#172016]/45 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
                  {content.visualTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/25 bg-[#172016]/78 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white backdrop-blur"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_auto] items-end gap-6 px-2 pb-2 pt-5">
                <h2 className="max-w-[13ch] font-display text-3xl leading-[0.92] text-[#172016]">
                  {content.visualTitle}
                </h2>
                <div className="text-right">
                  <div className={`font-display text-4xl leading-none ${isRevenue ? "text-[#b9472d]" : "text-[#31583a]"}`}>
                    {content.visualMetric}
                  </div>
                  <div className="mt-1 max-w-28 font-mono text-[8px] uppercase leading-4 tracking-[0.12em] text-[#6f776b]">
                    {content.visualMetricLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-px overflow-hidden rounded-2xl border border-[#1f2a1d]/10 bg-[#1f2a1d]/10 sm:grid-cols-3 lg:col-span-2">
            {content.steps.map(([number, title, description]) => (
              <div key={number} className="grid grid-cols-[auto_1fr] gap-4 bg-white/62 p-5 backdrop-blur-md sm:block">
                <span className={`font-mono text-[9px] tracking-[0.18em] ${isRevenue ? "text-[#a3412b]" : "text-[#456b48]"}`}>
                  {number}
                </span>
                <div>
                  <h3 className="font-display text-xl text-[#1f2a1d] sm:mt-5 sm:text-2xl">{title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#596255] sm:mt-2 sm:text-sm">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setVideoOpen(true)}
        className="absolute bottom-5 right-6 z-10 hidden items-center gap-2 rounded-full bg-[#172016]/72 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-[#172016] md:right-10 xl:flex"
        aria-label="Ver video: cómo trabajamos"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />
        </span>
        Cómo trabajamos
      </button>

      {videoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setVideoOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Cómo trabajamos"
        >
          <div className="absolute inset-0 bg-[#1f2a1d]/80 backdrop-blur-md" />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setVideoOpen(false);
            }}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:right-6 sm:top-6"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative aspect-video w-[92vw] max-w-5xl overflow-hidden rounded-xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
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
      )}
    </section>
  );
}
