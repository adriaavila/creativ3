"use client";

import { useEffect, useRef, useState } from "react";
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

const PROMPTS = [
  "Automatiza mis cobros con WhatsApp...",
  "Crea un dashboard de inventario en tiempo real...",
  "Sincroniza mis leads de Instagram con Google Sheets...",
  "Genera reportes de ventas automáticos cada lunes...",
];

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [promptText, setPromptText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);

  // Intro animation + phrase rotation — run once
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!titleRef.current || !phraseRef.current || !copyRef.current || !promptRef.current) return;

    const letters = titleRef.current.querySelectorAll(".letter");
    const phraseEl = phraseRef.current;
    const copyEl = copyRef.current;
    const promptEl = promptRef.current;

    if (!prefersReducedMotion) {
      gsap.set(letters, { yPercent: 100 });
      gsap.set(phraseEl, { yPercent: 50, opacity: 0 });
      gsap.set(copyEl, { opacity: 0 });
      gsap.set(promptEl, { y: 30, opacity: 0 });

      gsap.timeline({ delay: 0.6 })
        .to(letters, { yPercent: 0, duration: 1.2, ease: "power3.out", stagger: 0.04 })
        .to(phraseEl, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=1.0")
        .to(promptEl, { y: 0, opacity: 1, duration: 1, ease: "power2.out" }, "-=0.6")
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

  // Typing effect — restarts only when prompt index advances
  useEffect(() => {
    let currentText = "";
    let isDeleting = false;
    let typingSpeed = 100;
    let timeoutHandle: ReturnType<typeof setTimeout>;

    const type = () => {
      const fullText = PROMPTS[promptIndex % PROMPTS.length];

      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
        typingSpeed = 50;
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
        typingSpeed = 100;
      }

      setPromptText(currentText);

      if (!isDeleting && currentText === fullText) {
        setTimeout(() => (isDeleting = true), 2000);
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        setPromptIndex((prev) => prev + 1);
        typingSpeed = 500;
      }

      timeoutHandle = setTimeout(type, typingSpeed);
    };

    const startTimeout = setTimeout(type, promptIndex === 0 ? 2000 : 0);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(timeoutHandle);
    };
  }, [promptIndex]);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between p-6 sm:p-12 pt-24 sm:pt-32 overflow-hidden">
      {/* Background Image Wrapper */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Caribbean_Sea%2C_Avila_Mt%2C_Caracas_Panorama.jpg/1920px-Caribbean_Sea%2C_Avila_Mt%2C_Caracas_Panorama.jpg')",
            backgroundPosition: "center top",
            filter: "contrast(1.1) saturate(1.2)",
            animation: "slowZoom 40s ease-in-out infinite alternate",
            willChange: "transform",
          }}
        />
        {/* Cinematic gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-noche/40 via-noche/70 to-noche" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--noche)_100%)] opacity-80" />
      </div>

      <div className="relative z-10 w-full flex justify-between items-start text-xs sm:text-sm font-mono tracking-wide opacity-80 text-papiro-soft">
        <span>VOL. I &middot; NÚMERO II</span>
        <span>LATAM &middot; 2026</span>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-12">
        <h1
          ref={titleRef}
          className="text-center font-display leading-[0.92] tracking-tight max-w-[95vw] flex flex-wrap justify-center items-center"
          style={{ fontSize: "clamp(48px, 9vw, 140px)" }}
        >
          <span className="inline-block overflow-hidden pb-2 sm:pb-3 drop-shadow-2xl">
            {"Construimos".split("").map((char, i) => (
              <span key={i} className="letter inline-block">
                {char === " " ? " " : char}
              </span>
            ))}
          </span>

          <span className="mx-4 sm:mx-6 overflow-visible drop-shadow-2xl h-[1.1em] flex items-center">
            <span
              ref={phraseRef}
              className="italic inline-block"
              style={{ willChange: "transform, opacity" }}
            >
              {ROTATING_PHRASES[0]}
            </span>
          </span>
        </h1>

        {/* Anything-style Command Prompt */}
        <div
          ref={promptRef}
          className="w-full max-w-2xl px-6 py-4 bg-noche-rise/20 backdrop-blur-xl border border-papiro/10 rounded-2xl shadow-2xl relative group overflow-hidden"
        >
          {/* Internal shine sweep */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-papiro/5 to-transparent" />
          </div>

          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-cobalto animate-pulse" />
            <div className="flex-1 font-mono text-sm sm:text-base text-papiro/60">
              <span className="text-papiro">{promptText}</span>
              <span className="w-1.5 h-4 inline-block bg-cobalto ml-1 align-middle animate-blink" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 items-end pb-4">
        <div className="hidden sm:block text-papiro-soft font-mono text-sm">
          <span className="inline-block" style={{ animation: "spin 20s linear infinite" }}>
            ✦
          </span>
        </div>
        <div className="text-center sm:text-left text-sm sm:text-base opacity-80 max-w-md mx-auto sm:mx-0 text-papiro-soft font-mono drop-shadow-lg">
          <p ref={copyRef}>{ROTATING_COPIES[0]}</p>
        </div>
        <div className="flex justify-center sm:justify-end gap-4">
          <a
            href="#servicios"
            className="border border-papiro/30 px-8 py-3 rounded-full text-sm font-mono hover:bg-papiro hover:text-noche transition-colors duration-500 backdrop-blur-sm bg-noche/30"
          >
            Adelante
          </a>
        </div>
      </div>
      
      <style>{`
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.15); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </section>
  );
}
