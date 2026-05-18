"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import MeshGradient from "./MeshGradient";

type Band = {
  items: string[];
  variant: "giant" | "outline" | "pill" | "pill-outline" | "dark";
  speed: number;
  direction: "left" | "right";
};

const BANDS: Band[] = [
  {
    items: ["Automatizamos", "Construimos", "Escalamos", "Integramos", "Diseñamos"],
    variant: "giant",
    speed: 1,
    direction: "left",
  },
  {
    items: ["Software a medida", "Agentes IA", "Workflows", "Dashboards", "APIs"],
    variant: "outline",
    speed: 0.7,
    direction: "right",
  },
  {
    items: [
      "Next.js",
      "TypeScript",
      "Supabase",
      "Vercel",
      "GSAP",
      "Tailwind",
      "Postgres",
      "Stripe",
      "Resend",
    ],
    variant: "pill",
    speed: 0.5,
    direction: "left",
  },
  {
    items: [
      "WhatsApp",
      "Instagram",
      "Google Sheets",
      "Notion",
      "Airtable",
      "HubSpot",
      "Slack",
    ],
    variant: "pill-outline",
    speed: 0.4,
    direction: "right",
  },
  {
    items: ["WEB", "APPS", "DASHBOARDS", "PLATAFORMAS", "AGENTES"],
    variant: "dark",
    speed: 0.8,
    direction: "left",
  },
];

export default function Marquee() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const rows = sectionRef.current?.querySelectorAll<HTMLDivElement>("[data-marquee-row]");
    if (!rows) return;

    let scrollVelocity = 0;
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        scrollVelocity = Math.abs(self.getVelocity());
      },
    });

    const animators: number[] = [];
    const baseSpeed = 80;

    rows.forEach((row) => {
      const content = row.querySelector<HTMLDivElement>("[data-marquee-content]");
      if (!content) return;
      const dir = row.dataset.direction === "right" ? 1 : -1;
      const speedMult = parseFloat(row.dataset.speed || "1");
      let contentWidth = content.offsetWidth;
      let x = dir === -1 ? 0 : -contentWidth;

      const tick = () => {
        const speed = (baseSpeed + scrollVelocity * 0.15) * speedMult;
        x += dir * -1 * speed / 60;
        if (dir === -1 && x <= -contentWidth) x += contentWidth;
        if (dir === 1 && x >= 0) x -= contentWidth;
        row.style.transform = `translate3d(${x}px,0,0)`;
        animators.push(requestAnimationFrame(tick));
      };

      const ro = new ResizeObserver(() => {
        contentWidth = content.offsetWidth;
      });
      ro.observe(content);

      animators.push(requestAnimationFrame(tick));
    });

    return () => {
      animators.forEach((id) => cancelAnimationFrame(id));
      st.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="theme-kinetic relative w-full overflow-hidden py-20 sm:py-28"
    >
      <div className="absolute inset-0 z-0">
        <MeshGradient />
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        {BANDS.map((band, bandIdx) => (
          <MarqueeRow key={bandIdx} band={band} />
        ))}
      </div>
    </section>
  );
}

function MarqueeRow({ band }: { band: Band }) {
  const variantClass = {
    giant: "marquee-giant",
    outline: "marquee-outline",
    pill: "marquee-pill",
    "pill-outline": "marquee-pill-outline",
    dark: "marquee-dark",
  }[band.variant];

  const wrapperClass =
    band.variant === "dark"
      ? "bg-noche text-papiro py-5 my-3"
      : "py-3";

  return (
    <div className={`relative overflow-hidden ${wrapperClass}`}>
      <div
        data-marquee-row
        data-speed={band.speed}
        data-direction={band.direction}
        className={`flex whitespace-nowrap will-change-transform ${variantClass}`}
      >
        <div data-marquee-content className="flex shrink-0">
          {band.items.map((item, i) => (
            <MarqueeItem key={i} text={item} variant={band.variant} />
          ))}
        </div>
        <div data-marquee-content-clone className="flex shrink-0" aria-hidden="true">
          {band.items.map((item, i) => (
            <MarqueeItem key={`c-${i}`} text={item} variant={band.variant} />
          ))}
        </div>
      </div>
      <style>{`
        .marquee-giant > div > span {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-fraunces);
          font-weight: 700;
          font-size: clamp(48px, 10vw, 140px);
          letter-spacing: -0.04em;
          line-height: 1;
          color: #1a1a1f;
          padding: 0 40px;
        }
        .marquee-giant .dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #ff8a4c;
          margin: 0 28px;
        }
        .marquee-outline > div > span {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-fraunces);
          font-style: italic;
          font-weight: 600;
          font-size: clamp(40px, 9vw, 120px);
          letter-spacing: -0.03em;
          line-height: 1;
          color: transparent;
          -webkit-text-stroke: 2px #1a1a1f;
          padding: 0 36px;
        }
        .marquee-outline .dot {
          width: 14px; height: 14px;
          border-radius: 50%;
          border: 2px solid #1a1a1f;
          margin: 0 24px;
        }
        .marquee-pill > div > span {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-jetbrains);
          font-weight: 500;
          font-size: 14px;
          background: #1a1a1f;
          color: #f7f1e3;
          padding: 10px 22px;
          border-radius: 999px;
          margin: 0 6px;
        }
        .marquee-pill-outline > div > span {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-jetbrains);
          font-weight: 500;
          font-size: 14px;
          background: transparent;
          color: #1a1a1f;
          border: 1px solid rgba(26,26,31,0.25);
          padding: 10px 22px;
          border-radius: 999px;
          margin: 0 6px;
        }
        .marquee-dark > div > span {
          display: inline-flex;
          align-items: center;
          font-family: var(--font-fraunces);
          font-weight: 700;
          font-size: clamp(24px, 5vw, 52px);
          letter-spacing: -0.02em;
          color: #f7f1e3;
          padding: 0 28px;
        }
        .marquee-dark .sep {
          width: 8px; height: 8px;
          background: rgba(247,241,227,0.35);
          transform: rotate(45deg);
          margin: 0 22px;
        }
      `}</style>
    </div>
  );
}

function MarqueeItem({ text, variant }: { text: string; variant: Band["variant"] }) {
  const showDot = variant === "giant" || variant === "outline";
  const showSep = variant === "dark";
  return (
    <span>
      {text}
      {showDot && <span className="dot" />}
      {showSep && <span className="sep" />}
    </span>
  );
}
