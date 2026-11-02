"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useMemo, useState } from "react";
import { DISCIPLINAS, PIEZAS, type Disciplina } from "@/lib/vitrina";

/**
 * Todo el trabajo, en una lista. Al pasar el mouse por una fila, su captura
 * flota junto al cursor; al tocarla, se abre su ficha.
 */
export default function Indice({ onOpen }: { onOpen: (id: string) => void }) {
  const [filtro, setFiltro] = useState<Disciplina | "todo">("todo");
  const [hover, setHover] = useState<string | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 26, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 26, mass: 0.6 });

  const lista = useMemo(
    () => (filtro === "todo" ? PIEZAS : PIEZAS.filter((p) => p.disciplinas.includes(filtro))),
    [filtro],
  );
  const activa = PIEZAS.find((p) => p.id === hover);

  return (
    <section
      id="indice"
      aria-labelledby="indice-titulo"
      className="relative rounded-t-[28px] bg-[var(--paper)] px-4 pb-28 pt-24 text-[var(--ink)] sm:rounded-t-[40px] sm:px-10 sm:pt-32"
      onPointerMove={(e) => {
        x.set(e.clientX);
        y.set(e.clientY);
      }}
    >
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col justify-between gap-8 border-b border-[var(--ink-15)] pb-10 lg:flex-row lg:items-end">
          <h2 id="indice-titulo" className="v-display text-[clamp(2.8rem,8vw,8rem)]">
            Índice <span className="v-serif text-[var(--ink-60)]">completo</span>
          </h2>
          <div role="tablist" aria-label="Filtrar por disciplina" className="flex flex-wrap gap-2">
            {DISCIPLINAS.map((d) => {
              const n = d.id === "todo" ? PIEZAS.length : PIEZAS.filter((p) => p.disciplinas.includes(d.id as Disciplina)).length;
              const on = filtro === d.id;
              return (
                <button
                  key={d.id}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFiltro(d.id)}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                    on ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]" : "border-[var(--ink-15)] hover:border-[var(--ink)]"
                  }`}
                >
                  {d.label} <sup className="v-mono text-[9px] opacity-60">{n}</sup>
                </button>
              );
            })}
          </div>
        </div>

        <ol onPointerLeave={() => setHover(null)}>
          <AnimatePresence initial={false} mode="popLayout">
            {lista.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="border-b border-[var(--ink-15)]"
              >
                <button
                  type="button"
                  onClick={() => onOpen(p.id)}
                  onPointerEnter={() => setHover(p.id)}
                  onFocus={() => setHover(p.id)}
                  onBlur={() => setHover(null)}
                  data-cursor="Abrir"
                  className="group grid w-full grid-cols-[2.2rem_1fr_auto] items-center gap-3 py-5 text-left transition-[padding] duration-500 ease-[cubic-bezier(.16,1,.3,1)] hover:pl-3 sm:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1fr)_7rem_6rem] sm:gap-6 sm:py-7"
                >
                  <span className="v-mono text-[11px] text-[var(--ink-60)]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[clamp(1.5rem,3.4vw,3rem)] font-semibold leading-none tracking-[-0.04em] transition-colors group-hover:text-[rgb(180_16_101)]">
                      {p.name}
                    </span>
                    <span className="mt-2 block truncate text-sm text-[var(--ink-60)] sm:hidden">{p.tipo}</span>
                  </span>
                  <span className="hidden min-w-0 text-[15px] leading-snug text-[var(--ink-60)] sm:block">
                    <span className="block text-[var(--ink)]">{p.tipo}</span>
                    <span className="line-clamp-1">{p.linea}</span>
                  </span>
                  <span className="v-mono hidden items-center gap-2 text-[10px] text-[var(--ink-60)] sm:flex">
                    {p.liveUrl ? (
                      <>
                        <span className="v-live-dot" aria-hidden="true" /> En vivo
                      </>
                    ) : (
                      "Privado"
                    )}
                  </span>
                  <span className="v-mono text-right text-[11px] text-[var(--ink-60)]">
                    <span className="hidden sm:inline">{p.year}</span>
                    <span aria-hidden="true" className="ml-2 inline-block transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
                      ↗
                    </span>
                  </span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </div>

      <motion.div
        aria-hidden="true"
        className="v-preview pointer-events-none fixed left-0 top-0 z-40 hidden lg:block"
        style={{ x: sx, y: sy }}
      >
        <AnimatePresence>
          {activa ? (
            <motion.div
              key={activa.id}
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: -2 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-8 top-[-110px] w-[340px] overflow-hidden rounded-[14px] shadow-[0_40px_80px_-20px_rgba(0,0,0,.55)]"
              style={{ background: activa.tint }}
            >
              <div className="relative aspect-[16/10]">
                <Image src={activa.cover} alt="" fill sizes="340px" className="object-cover object-top" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
