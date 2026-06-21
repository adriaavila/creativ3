"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { Check, Loader2, Terminal } from "lucide-react";
import Reveal from "./Reveal";

// Scripted build. Each step, once done, reveals the next block in the preview.
const STEPS = [
  { cmd: "init proyecto", note: "creativv.site" },
  { cmd: "generar hero", note: "título + claim" },
  { cmd: "aplicar paleta", note: "verde / papiro" },
  { cmd: "maquetar secciones", note: "servicios + obra" },
  { cmd: "conectar WhatsApp", note: "CTA en vivo" },
  { cmd: "deploy", note: "online ✓" },
];

type Frame = { stage: number; running: boolean; wait: number };

// stage = number of completed steps. running = current step in progress.
const FRAMES: Frame[] = (() => {
  const f: Frame[] = [];
  STEPS.forEach((_, i) => {
    f.push({ stage: i, running: true, wait: 850 });
    f.push({ stage: i + 1, running: false, wait: 480 });
  });
  f[f.length - 1].wait = 2400; // hold the finished build
  f.push({ stage: 0, running: false, wait: 500 }); // reset
  return f;
})();

export default function LiveBuild() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });
  const reduce = Boolean(useReducedMotion());
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const visibleStage = reduce ? STEPS.length : stage;
  const visibleRunning = reduce ? false : running;

  useEffect(() => {
    if (reduce) return;
    if (!inView) return;

    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;
    const run = () => {
      const frame = FRAMES[idx];
      setStage(frame.stage);
      setRunning(frame.running);
      timer = setTimeout(() => {
        idx = (idx + 1) % FRAMES.length;
        run();
      }, frame.wait);
    };
    run();
    return () => clearTimeout(timer);
  }, [inView, reduce]);

  // Preview block visibility, driven by stage.
  const has = (n: number) => visibleStage >= n;
  const block = (visible: boolean) =>
    reduce
      ? { opacity: 1, y: 0 }
      : { opacity: visible ? 1 : 0, y: visible ? 0 : 10 };

  return (
    <section className="relative w-full bg-[#eef0e7] text-[#1f2a1d]">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <Reveal className="mb-12 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#1f2a1d] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white">
            <Terminal className="h-3.5 w-3.5" />
            El método creativv
          </div>
          <h2 className="text-4xl font-normal leading-[0.98] text-[#1f2a1d] sm:text-5xl md:text-6xl">
            Mira cómo se construye, en vivo.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-[#4b5b47] md:text-lg">
            Un agente arma la base en minutos. Nosotros le damos el diseño, el criterio y el alma.
          </p>
        </Reveal>

        <div
          ref={ref}
          className="grid gap-4 overflow-hidden rounded-2xl border border-[#1f2a1d]/10 bg-white shadow-[0_30px_80px_rgba(31,42,29,0.12)] md:grid-cols-[0.85fr_1.15fr]"
        >
          {/* Agent console */}
          <div className="flex flex-col gap-3 bg-[#101810] p-6 font-mono text-sm text-white/80">
            <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#a8c97f]">
              <span className="h-2 w-2 rounded-full bg-[#a8c97f]" />
              agente · creativv
            </div>
            {STEPS.map((step, i) => {
              const done = visibleStage > i;
              const active = visibleRunning && visibleStage === i;
              const pending = !done && !active;
              return (
                <div
                  key={step.cmd}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    pending ? "opacity-30" : "opacity-100"
                  }`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {done ? (
                      <Check className="h-4 w-4 text-[#a8c97f]" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white/70" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
                    )}
                  </span>
                  <span className={done || active ? "text-white" : "text-white/50"}>
                    {step.cmd}
                  </span>
                  <span className="ml-auto text-[11px] text-white/35">{step.note}</span>
                </div>
              );
            })}
          </div>

          {/* Live preview being assembled */}
          <div className="bg-[#f5f3ec] p-6">
            {/* browser chrome */}
            <div className="flex items-center gap-2 rounded-t-lg border border-[#1f2a1d]/10 bg-white px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e0a96d]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#dbe9c3]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#85AB8B]" />
              <div className="ml-3 flex items-center gap-2 rounded-md bg-[#f5f3ec] px-3 py-1 text-[11px] text-[#4b5b47]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${has(6) ? "bg-[#4ade80]" : "bg-[#4b5b47]/30"}`}
                />
                creativv.site
              </div>
            </div>

            {/* canvas */}
            <div className="relative min-h-[280px] rounded-b-lg border border-t-0 border-[#1f2a1d]/10 bg-white p-5">
              {/* hero */}
              <motion.div animate={block(has(2))} transition={{ duration: 0.4 }} className="space-y-2.5">
                <div className={`h-7 w-3/4 rounded ${has(3) ? "bg-[#1f2a1d]" : "bg-[#1f2a1d]/15"}`} />
                <div className="h-3 w-1/2 rounded bg-[#1f2a1d]/15" />
              </motion.div>

              {/* sections */}
              <motion.div
                animate={block(has(4))}
                transition={{ duration: 0.4 }}
                className="mt-5 grid grid-cols-3 gap-2.5"
              >
                {[0, 1, 2].map((c) => (
                  <div
                    key={c}
                    className={`h-16 rounded-md border ${
                      has(3) ? "border-[#336443]/20 bg-[#dbe9c3]/40" : "border-[#1f2a1d]/10 bg-[#1f2a1d]/5"
                    }`}
                  />
                ))}
              </motion.div>

              {/* cta */}
              <motion.div
                animate={block(has(5))}
                transition={{ duration: 0.4 }}
                className="mt-5 flex items-center gap-3"
              >
                <div className="h-9 w-32 rounded-full bg-[#1f2a1d]" />
                <div className="h-9 w-24 rounded-full border border-[#1f2a1d]/15" />
              </motion.div>

              {/* live badge */}
              <motion.div
                animate={block(has(6))}
                transition={{ duration: 0.4 }}
                className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#dbe9c3] px-2.5 py-1 text-[11px] font-semibold text-[#101810]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                en vivo
              </motion.div>

              {/* empty state before build starts */}
              {!has(2) && !reduce && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[#4b5b47]/50">
                  esperando al agente…
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
