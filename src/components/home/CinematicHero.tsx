"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import TrackedWhatsappLink from "@/components/analytics/TrackedWhatsappLink";
import { stageProgress } from "@/lib/scroll-stage";

/**
 * Scroll-driven hero. The section is a local timeline: `--p` goes 0→1 as the
 * sticky stage travels, and CSS (`globals.css`, `.studio-cine`) turns that
 * into layer transforms. The frame loop only writes three custom properties
 * on the section — it never reads layout and never touches the children.
 *
 * Progress is derived from this section's own rect, not page scroll, so the
 * timeline is unaffected by anything above or below it.
 */
export default function CinematicHero({
  contactUrl,
  trust,
}: {
  contactUrl: string;
  trust: readonly string[];
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let current = 0;
    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let frame = 0;
    let visible = false;
    let settle = false;

    // The loop runs only while the stage is on screen, so it costs nothing
    // for the rest of the page. Ticking every frame (rather than waking on
    // `scroll`) keeps it correct under momentum scrolling and smooth-scroll
    // wrappers, which fire scroll events at their own irregular cadence.
    const tick = () => {
      const rect = el.getBoundingClientRect();
      const target = stageProgress(rect.top, rect.height, window.innerHeight);

      // First frame lands on the real value — no slide in from 0 when the
      // browser restores the page mid-scroll.
      current = settle ? current + (target - current) * 0.14 : target;
      smoothX += (pointerX - smoothX) * 0.08;
      smoothY += (pointerY - smoothY) * 0.08;
      settle = true;

      el.style.setProperty("--p", current.toFixed(4));
      el.style.setProperty("--mx", smoothX.toFixed(3));
      el.style.setProperty("--my", smoothY.toFixed(3));
      // Past the last beat the statement is the live layer, so it takes
      // pointer events back from the (now invisible) hero copy.
      el.dataset.settled = current > 0.6 ? "true" : "false";

      frame = visible ? requestAnimationFrame(tick) : 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) frame = requestAnimationFrame(tick);
    });
    observer.observe(el);

    const onPointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <section ref={ref} id="inicio" className="studio-cine relative">
      <div className="studio-stage flex min-h-svh flex-col justify-center">
        <div
          aria-hidden
          className="studio-glow pointer-events-none absolute inset-x-0 top-[-25%] h-[80%]"
          style={{
            background:
              "radial-gradient(50% 55% at 32% 60%, rgba(197,240,74,0.16) 0%, rgba(197,240,74,0) 70%)",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-5 pb-24 pt-28 sm:px-8 lg:grid-cols-12 lg:items-center lg:gap-10 lg:pb-28 lg:pt-32">
          <div className="studio-copy lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--studio-hairline)] bg-[var(--studio-surface)] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--studio-muted-text)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--studio-accent)]" aria-hidden />
              Estudio de producto digital
            </span>

            <h1 className="mt-7 text-[clamp(2.6rem,6.2vw,4.6rem)] font-semibold text-[var(--studio-text)]">
              Producto digital
              <br />
              para negocios que
              <br />
              <span className="text-[var(--studio-dim-text)]">no improvisan.</span>
            </h1>

            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-[var(--studio-muted-text)] sm:text-[19px]">
              Diseñamos y construimos webs, productos a medida y automatizaciones con IA.
              Primer entregable en 3 días, precio cerrado y el código queda tuyo.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <TrackedWhatsappLink
                href={contactUrl}
                location="studio_hero"
                offer="studio"
                className="studio-btn studio-btn-accent"
              >
                Empezar un proyecto
                <ArrowRight className="h-4 w-4" aria-hidden />
              </TrackedWhatsappLink>
              <a href="#trabajo" className="studio-btn studio-btn-ghost">
                Ver casos
              </a>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5">
              {trust.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[14px] font-medium text-[var(--studio-muted-text)]"
                >
                  <Check className="h-4 w-4 shrink-0 text-[var(--studio-accent)]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div aria-hidden className="relative lg:col-span-5">
            <div className="studio-plate relative mx-auto max-w-lg lg:max-w-none">
              <div className="overflow-hidden rounded-[18px] border border-[var(--studio-hairline)] bg-[var(--studio-surface)] shadow-[var(--studio-shadow)]">
                <div className="flex items-center gap-2 border-b border-[var(--studio-hairline)] bg-[var(--studio-raised)] px-4 py-2.5">
                  <span className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                  </span>
                  <span className="mx-auto rounded-full bg-[var(--studio-bg)] px-3 py-0.5 font-mono text-[11px] text-[var(--studio-dim-text)]">
                    reiprop.tech
                  </span>
                </div>
                <div className="relative aspect-[16/10] bg-[var(--studio-raised)]">
                  <Image
                    src="/projects/rei-fm/01-desktop.jpg"
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 620px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>

            <div className="studio-card absolute -bottom-12 -left-4 hidden w-[26%] overflow-hidden rounded-[22px] border border-[var(--studio-hairline)] bg-[var(--studio-raised)] p-1.5 shadow-[var(--studio-shadow)] sm:block lg:-left-12">
              <div className="relative aspect-[9/16] overflow-hidden rounded-[16px] bg-[var(--studio-surface)]">
                <Image
                  src="/projects/shopea/03-mobile.jpg"
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="studio-veil pointer-events-none absolute inset-0 bg-[var(--studio-bg)]"
        />

        {/* Second beat: the statement lands over the pushed-in, dimmed world. */}
        <div className="studio-statement absolute inset-0 flex items-center justify-center px-5 sm:px-8">
          <div className="max-w-3xl text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--studio-accent)]">
              Cómo trabajamos
            </p>
            <p className="mt-6 text-[clamp(1.8rem,4.2vw,3.1rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--studio-text)]">
              No entregamos demos. Entregamos software que ya está cobrando, atendiendo
              clientes y ordenando la operación.
            </p>
            <a href="#servicios" className="studio-btn studio-btn-ghost mt-9">
              Qué construimos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>

        <div
          aria-hidden
          className="studio-cue pointer-events-none absolute inset-x-0 bottom-6 flex justify-center font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--studio-dim-text)]"
        >
          Scroll
        </div>
      </div>
    </section>
  );
}
