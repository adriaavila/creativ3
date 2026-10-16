"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { PIEZAS, PIEZAS_DESTACADAS, type Pieza } from "@/lib/vitrina";
import { Navegador } from "./Marcos";

/**
 * El trabajo grande, una pieza por pantalla. Cada lámina se queda pegada y la
 * siguiente le pasa por encima; la de abajo se aleja y se apaga.
 */
export default function Laminas({ onOpen }: { onOpen: (id: string) => void }) {
  const total = PIEZAS_DESTACADAS.length;
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });

  return (
    <section id="trabajo" aria-labelledby="trabajo-titulo" className="relative">
      <div className="mx-auto flex max-w-[1500px] items-end justify-between gap-6 px-4 pb-10 pt-28 sm:px-10 sm:pt-40">
        <h2 id="trabajo-titulo" className="v-display text-[clamp(2.6rem,7vw,6.5rem)]">
          Trabajo
          <br />
          <span className="v-serif text-[var(--cream-60)]">seleccionado</span>
        </h2>
        <p className="v-mono hidden max-w-[16rem] text-right text-[11px] leading-relaxed text-[var(--cream-60)] sm:block">
          {total} de {PIEZAS.length} piezas · toca cualquiera para abrirla
        </p>
      </div>

      <div ref={wrap} className="relative">
        {PIEZAS_DESTACADAS.map((p, i) => (
          <Lamina key={p.id} pieza={p} i={i} total={total} progress={scrollYProgress} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function Lamina({
  pieza,
  i,
  total,
  progress,
  onOpen,
}: {
  pieza: Pieza;
  i: number;
  total: number;
  progress: MotionValue<number>;
  onOpen: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: enter } = useScroll({ target: ref, offset: ["start end", "start start"] });

  // Mientras la siguiente sube, ésta se encoge y se apaga.
  const start = i / total;
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - i) * 0.035]);
  const dim = useTransform(progress, [start, start + 1 / total], [0, i === total - 1 ? 0 : 0.55]);
  const shotScale = useTransform(enter, [0, 1], [0.82, 1]);
  const shotRotate = useTransform(enter, [0, 1], [6, 0]);
  const shotY = useTransform(enter, [0, 1], ["18%", "0%"]);

  const desktop = pieza.images.filter((img) => !img.mobile);
  const phone = pieza.images.find((img) => img.mobile);

  return (
    <div ref={ref} className="sticky top-0 flex h-[100svh] items-center justify-center px-3 py-3 sm:px-6 sm:py-6">
      <motion.article
        style={reduce ? undefined : { scale }}
        className="relative h-full w-full max-w-[1600px] origin-top overflow-hidden rounded-[22px] sm:rounded-[32px]"
      >
        <button
          type="button"
          onClick={() => onOpen(pieza.id)}
          data-cursor="Abrir"
          aria-label={`Abrir ${pieza.name}`}
          className="group absolute inset-0 grid h-full w-full grid-rows-[auto_1fr] text-left lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:grid-rows-1"
          style={{ background: `radial-gradient(120% 90% at 85% 15%, ${pieza.tint} 0%, #0c0d10 65%)` }}
        >
          <div className="v-grain pointer-events-none absolute inset-0" aria-hidden="true" />

          <div className="relative z-10 flex flex-col justify-between gap-6 p-6 sm:p-10 lg:p-14">
            <div className="v-mono flex items-center justify-between text-[11px] text-[var(--cream-60)]">
              <span>
                {String(i + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
              <span className="flex items-center gap-2">
                {pieza.liveUrl ? <span className="v-live-dot" aria-hidden="true" /> : null}
                {pieza.liveUrl ? "En vivo" : pieza.year}
              </span>
            </div>

            <div>
              <p className="v-mono mb-4 text-[11px] text-[var(--cream-60)]">{pieza.tipo}</p>
              <h3 className="v-display text-[clamp(2.6rem,5.4vw,6rem)] [overflow-wrap:anywhere] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-2">
                {pieza.name}
              </h3>
              <p className="v-serif mt-5 max-w-[24ch] text-[clamp(1.35rem,2.4vw,2.3rem)] leading-[1.1] text-[var(--cream)]">
                {pieza.linea}
              </p>
            </div>

            <div className="hidden flex-wrap gap-2 lg:flex">
              {pieza.stack.slice(0, 4).map((s) => (
                <span key={s} className="v-mono rounded-full border border-[var(--cream-12)] px-3 py-1.5 text-[10px] text-[var(--cream-60)]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 min-h-0 overflow-hidden lg:overflow-visible">
            <motion.div
              className="absolute inset-x-4 bottom-[-6%] top-0 sm:inset-x-10 lg:inset-x-auto lg:bottom-auto lg:left-0 lg:right-[-8%] lg:top-1/2 lg:-translate-y-1/2"
              style={reduce ? undefined : { scale: shotScale, rotate: shotRotate, y: shotY }}
            >
              <Navegador
                src={desktop[0]?.src ?? pieza.cover}
                alt={desktop[0]?.alt ?? pieza.name}
                url={pieza.liveUrl}
                className="transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-2"
                sizes="(max-width: 1024px) 92vw, 62vw"
              />
              {phone ? (
                <div className="absolute -bottom-6 left-[-4%] hidden w-[19%] overflow-hidden rounded-[22px] border-[5px] border-[#111] shadow-[0_40px_80px_-20px_rgba(0,0,0,.9)] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-5 lg:block">
                  <div className="relative aspect-[390/844]">
                    <Image src={phone.src} alt={phone.alt} fill sizes="12vw" className="object-cover object-top" />
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>

          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-black" style={reduce ? { opacity: 0 } : { opacity: dim }} />
        </button>
      </motion.article>
    </div>
  );
}
