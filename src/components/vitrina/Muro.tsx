"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { CUENTAS, MURO } from "@/lib/vitrina";

const COLS = 6;

/** Reparte las capturas en columnas sin que dos vecinas repitan la misma. */
function columnas(srcs: string[]): string[][] {
  const cols: string[][] = Array.from({ length: COLS }, () => []);
  srcs.forEach((src, i) => cols[i % COLS]!.push(src));
  // Cada columna necesita al menos cinco para cubrir la pantalla en bucle.
  return cols.map((col, c) => {
    const out = [...col];
    let k = c * 3;
    while (out.length < 5) out.push(srcs[k++ % srcs.length]!);
    return out;
  });
}

const COLUMNAS = columnas(MURO);

const LINEA_1 = ["Cosas", "reales,"];
const LINEA_2 = ["hechas", "con", "obsesión."];

export default function Muro() {
  const stage = useRef<HTMLDivElement>(null);
  const wall = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: stage, offset: ["start start", "end start"] });
  const wallOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.15]);
  const wallScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // El muro sigue al mouse, con inercia, sin pasar por React en cada cuadro.
  useEffect(() => {
    if (reduce) return;
    const el = wall.current;
    if (!el) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      x += (tx - x) * 0.05;
      y += (ty - y) * 0.05;
      el.style.setProperty("--ry", `${(x * 6).toFixed(3)}deg`);
      el.style.setProperty("--rx", `${(-y * 4).toFixed(3)}deg`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  let palabra = 0;
  const word = (w: string, serif = false) => {
    const i = palabra++;
    return (
      <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
        <motion.span
          className={`inline-block ${serif ? "v-serif" : ""}`}
          initial={reduce ? false : { y: "110%", rotate: 4 }}
          animate={{ y: "0%", rotate: 0 }}
          transition={{ duration: 1.1, delay: 0.25 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {w}
        </motion.span>
      </span>
    );
  };

  return (
    <section ref={stage} id="inicio" className="relative h-[100svh] min-h-[640px] overflow-hidden" aria-label="Portada">
      <motion.div
        aria-hidden="true"
        className="v-wall-stage absolute inset-0"
        style={reduce ? undefined : { opacity: wallOpacity, scale: wallScale }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      >
        <div ref={wall} className="v-wall absolute left-[-30%] right-[-30%] top-[-40%] flex h-[180%] gap-4 sm:gap-6">
          {COLUMNAS.map((col, c) => (
            <div key={c} className="relative min-w-0 flex-1 overflow-visible">
              <div
                className="v-wall-col flex flex-col gap-4 sm:gap-6"
                data-dir={c % 2 ? "down" : "up"}
                style={{ ["--dur" as string]: `${70 + (c % 3) * 18}s` }}
              >
                {[...col, ...col].map((src, i) => (
                  <div key={`${src}-${i}`} className="v-tile relative aspect-[16/10] w-full">
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 40vw, 22vw"
                      className="object-cover object-top"
                      loading={i < 3 ? "eager" : "lazy"}
                      fetchPriority={i < 2 && c > 0 && c < 5 ? "high" : "low"}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div aria-hidden="true" className="v-wall-shade pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="v-aura pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2" />

      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
        style={reduce ? undefined : { y: titleY, opacity: titleOpacity }}
      >
        <motion.p
          className="v-mono mb-7 text-[11px] text-[var(--cream-60)] sm:text-xs"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          allok · estudio de Adrián Avila
        </motion.p>
        <h1 className="v-display text-[clamp(3.2rem,11.5vw,11rem)]">
          <span className="block">
            {word(LINEA_1[0]!)} {word(LINEA_1[1]!)}
          </span>
          <span className="block">
            {word(LINEA_2[0]!, true)} {word(LINEA_2[1]!, true)} {word(LINEA_2[2]!, true)}
          </span>
        </h1>
        <motion.p
          className="mt-8 max-w-[34rem] text-balance text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-[var(--cream-60)]"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.05 }}
        >
          Webs, productos y agentes de IA para negocios de verdad. {CUENTAS.enVivo === CUENTAS.piezas
            ? `${CUENTAS.piezas} piezas, todas vivas: puedes abrirlas.`
            : `${CUENTAS.piezas} piezas, ${CUENTAS.enVivo} vivas para abrir ahora mismo.`}
        </motion.p>
      </motion.div>

      <motion.a
        href="#trabajo"
        className="v-mono absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-[10px] text-[var(--cream-60)] transition-colors hover:text-[var(--cream)]"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
      >
        Baja
        <span className="relative block h-10 w-px overflow-hidden bg-[var(--cream-12)]">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-[var(--cream)]"
            animate={reduce ? undefined : { y: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.a>
    </section>
  );
}
