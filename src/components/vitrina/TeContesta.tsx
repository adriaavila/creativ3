"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CONVERSACION_DUENO, RESUMEN_19 } from "@/lib/agente-vitrina";

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * «Y te contesta a ti»: lo que separa a allok de un bot que solo responde.
 * El dueño le pregunta por su WhatsApp, recibe el aviso de las 19:00 y le
 * enseña con un toque lo que el agente no sabía. Las tres cosas existen en la
 * app: Inicio → «Pregúntale a allok», el resumen diario y «Enséñaselo a tu
 * agente» en la bandeja.
 */
export default function TeContesta() {
  return (
    <section id="pregunta" aria-labelledby="pregunta-titulo" className="relative px-4 py-28 sm:px-10 sm:py-44">
      <div className="mx-auto max-w-[1500px]">
        <p className="v-mono text-[11px] text-[var(--cream-60)]">02 · A ti</p>
        <div className="mt-6 grid items-end gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
          <h2 id="pregunta-titulo" className="v-display text-[clamp(2.8rem,8.5vw,8.5rem)]">
            Y te contesta
            <br />
            <span className="v-serif">a ti.</span>
          </h2>
          <p className="max-w-[30rem] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-relaxed text-[var(--cream-60)] lg:pb-4">
            Pregúntale lo que quieras de tu WhatsApp. Te avisa cuando una conversación te necesita, y cada noche te cuenta
            cuánto te trajo el día.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:mt-24 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto]">
          <Panel etiqueta="Inicio · Pregúntale a allok" className="lg:row-span-2">
            <Charla />
          </Panel>
          <Panel etiqueta="Cada noche, a las 19:00">
            <Bloqueo />
          </Panel>
          <Panel etiqueta="Desde la bandeja, un toque">
            <Ensenar />
          </Panel>
        </div>
        <p className="v-mono mt-5 text-[9.5px] text-[var(--cream-35)]">Negocio de ejemplo: nombres y cifras inventados</p>
      </div>
    </section>
  );
}

function Panel({ etiqueta, className = "", children }: { etiqueta: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`relative flex flex-col overflow-hidden rounded-[24px] bg-[#0e1013] p-5 shadow-[0_0_0_1px_rgba(255,255,255,.07)] sm:rounded-[32px] sm:p-8 ${className}`}>
      <div className="v-grain pointer-events-none absolute inset-0" aria-hidden="true" />
      <p className="v-mono relative text-[10px] text-[var(--cream-60)]">{etiqueta}</p>
      <div className="relative mt-6 flex-1">{children}</div>
    </div>
  );
}

/** El dueño pregunta, allok contesta: tres veces, una tras otra, al entrar en pantalla. */
function Charla() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visto = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const mostrar = reduce || visto;

  return (
    <div ref={ref} className="flex h-full min-h-[420px] flex-col">
      <div className="flex flex-1 flex-col justify-end gap-5">
        {CONVERSACION_DUENO.map((c, i) => (
          <div key={c.pregunta} className="grid gap-2.5">
            <motion.p
              className="max-w-[80%] self-end justify-self-end rounded-[16px] rounded-br-[5px] bg-[var(--cream)] px-4 py-2.5 text-[15px] font-medium text-[var(--ink)]"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={mostrar ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.5, delay: reduce ? 0 : 0.3 + i * 1.5, ease }}
            >
              {c.pregunta}
            </motion.p>
            <motion.div
              className="flex max-w-[92%] gap-3"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={mostrar ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.6, delay: reduce ? 0 : 0.9 + i * 1.5, ease }}
            >
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--live)]/15" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--live)]" />
              </span>
              <p className="text-[clamp(15px,1.25vw,17px)] leading-relaxed text-[var(--cream)]">{c.respuesta}</p>
            </motion.div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[15px] text-[var(--cream-35)]">
        <span className="v-live-dot shrink-0" aria-hidden="true" />
        Pregúntale lo que quieras…
      </div>
    </div>
  );
}

/** La pantalla de bloqueo del dueño a las 19:00: el cielo de la casa de fondo. */
function Bloqueo() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visto = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const mostrar = reduce || visto;

  return (
    <div ref={ref} className="v-lock relative overflow-hidden rounded-[22px] px-4 pb-5 pt-7 text-center text-white sm:px-6">
      <p className="text-[12px] font-medium text-white/75">martes</p>
      <p className="v-display text-[clamp(3.6rem,7vw,5.2rem)] font-semibold tracking-[-0.04em]">19:00</p>
      <div className="mt-5 grid gap-2 text-left">
        <motion.div
          className="v-notif p-3"
          initial={reduce ? false : { opacity: 0, y: -16, scale: 0.97 }}
          animate={mostrar ? { opacity: 1, y: 0, scale: 1 } : undefined}
          transition={{ duration: 0.7, delay: reduce ? 0 : 0.4, ease }}
        >
          <Cabeza />
          <p className="mt-1.5 text-[13.5px] font-semibold leading-snug">{RESUMEN_19.titulo}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-white/75">{RESUMEN_19.cuerpo}</p>
        </motion.div>
        <motion.div
          className="v-notif p-3 opacity-90"
          initial={reduce ? false : { opacity: 0, y: -16, scale: 0.97 }}
          animate={mostrar ? { opacity: 0.85, y: 0, scale: 0.98 } : undefined}
          transition={{ duration: 0.7, delay: reduce ? 0 : 0.9, ease }}
        >
          <Cabeza cuando="hace 2 h" />
          <p className="mt-1.5 text-[13px] font-semibold leading-snug">Nueva cita: Valeria</p>
          <p className="mt-0.5 text-[12px] leading-snug text-white/75">Agendada para el sábado 9:00.</p>
        </motion.div>
      </div>
    </div>
  );
}

function Cabeza({ cuando = "ahora" }: { cuando?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-[#0b0c0e]" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
      </span>
      <span className="text-[11px] font-semibold text-white/80">allok</span>
      <span className="ml-auto text-[10px] text-white/50">{cuando}</span>
    </div>
  );
}

/** Lo que contestó una persona, guardado como respuesta del agente con un toque. */
function Ensenar() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const visto = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [aprendido, setAprendido] = useState(false);

  // Se enseña solo una vez al verlo; después se puede repetir con el botón.
  useEffect(() => {
    if (!visto || reduce) return;
    const id = window.setTimeout(() => setAprendido(true), 1800);
    return () => window.clearTimeout(id);
  }, [visto, reduce]);

  const listo = aprendido || Boolean(reduce);

  return (
    <div ref={ref} className="grid gap-2.5 text-[14px] leading-snug">
      <p className="max-w-[85%] justify-self-start rounded-[14px] rounded-tl-[4px] bg-[#202329] px-3.5 py-2.5">¿Aceptan seguro dental?</p>
      <div className="grid justify-items-end gap-1.5">
        <span className="v-mono text-[9px] text-[var(--cream-35)]">Tú respondiste</span>
        <p className="max-w-[85%] rounded-[14px] rounded-tr-[4px] bg-[var(--live)]/15 px-3.5 py-2.5 text-[#e7fbef]">Sí, trabajamos con MetLife y GNP.</p>
      </div>
      <button
        type="button"
        onClick={() => setAprendido((a) => !a)}
        data-cursor={listo ? "Otra vez" : "Enseñar"}
        className={`mt-2 flex items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-[14px] font-semibold transition-colors duration-500 ${
          listo ? "bg-[var(--live)] text-[#06240f]" : "border border-white/15 bg-white/[0.04] text-[var(--cream)]"
        }`}
        aria-pressed={listo}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={listo ? "si" : "no"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            {listo ? "✓ Aprendido" : "Enséñaselo a tu agente"}
          </motion.span>
        </AnimatePresence>
      </button>
      <motion.p
        className="text-center text-[13px] text-[var(--cream-60)]"
        animate={{ opacity: listo ? 1 : 0 }}
        transition={{ duration: 0.4, delay: listo ? 0.2 : 0 }}
      >
        La próxima vez, contesta solo.
      </motion.p>
    </div>
  );
}
