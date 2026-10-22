"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PREGUNTAS, RESPUESTA_LIBRE, focoDe, type Foco } from "@/lib/agente-vitrina";

type Estado = "quieto" | "pensando" | "escribiendo" | "listo";

/**
 * «Pregúntale a tu WhatsApp»: la barra del dueño en la portada. Contesta con
 * el negocio de ejemplo del muro y le dice al muro qué iluminar. En la cuenta
 * de verdad, la misma pregunta va a «Pregúntale a allok» con los datos del
 * negocio; aquí no hay modelo ni red: nada de lo que se escribe sale de la
 * página.
 */
export default function Pregunta({
  onFoco,
  onAbrir,
  cta,
}: {
  onFoco: (f: Foco | null) => void;
  /** Avisa cuando hay una respuesta abierta, para que la portada le haga lugar. */
  onAbrir: (abierta: boolean) => void;
  cta: { href: string; label: string };
}) {
  const reduce = useReducedMotion();
  const input = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);
  const [valor, setValor] = useState("");
  const [ph, setPh] = useState(0);
  const [estado, setEstado] = useState<Estado>("quieto");
  const [respuesta, setRespuesta] = useState("");
  const [visible, setVisible] = useState(0);

  // El ejemplo de pregunta cambia solo mientras la barra espera.
  useEffect(() => {
    if (reduce || valor || estado !== "quieto") return;
    const id = window.setInterval(() => setPh((i) => (i + 1) % PREGUNTAS.length), 3200);
    return () => window.clearInterval(id);
  }, [reduce, valor, estado]);

  // «/» lleva a la barra; Escape la suelta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const escribiendo = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !escribiendo) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  function limpiarTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }

  function preguntar(texto: string) {
    const t = texto.trim();
    if (!t) return;
    limpiarTimers();
    const foco = focoDe(t);
    const p = PREGUNTAS.find((x) => x.texto === t) ?? (foco ? PREGUNTAS.find((x) => x.foco === foco) : undefined);
    const r = p?.respuesta ?? RESPUESTA_LIBRE;
    // La pregunta se queda escrita en la barra mientras se contesta.
    setValor(t);
    setRespuesta(r);
    onFoco(p?.foco ?? null);
    if (reduce) {
      setVisible(r.length);
      setEstado("listo");
      return;
    }
    setVisible(0);
    setEstado("pensando");
    // Revisa, y después escribe: unas 120 letras por segundo.
    const escribir = (n: number) => {
      setVisible(n);
      if (n >= r.length) {
        setEstado("listo");
        return;
      }
      timers.current.push(window.setTimeout(() => escribir(Math.min(r.length, n + 2)), 16));
    };
    timers.current.push(
      window.setTimeout(() => {
        setEstado("escribiendo");
        escribir(1);
      }, 950),
    );
  }

  function cerrar() {
    limpiarTimers();
    setEstado("quieto");
    setValor("");
    onFoco(null);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    preguntar(valor || PREGUNTAS[ph]!.texto);
  }

  const abierta = estado !== "quieto";

  useEffect(() => {
    onAbrir(abierta);
  }, [abierta, onAbrir]);

  return (
    <div className="relative mx-auto mt-10 w-full max-w-[620px] text-left">
      <form onSubmit={submit} className="v-ask flex items-center gap-2 p-1.5 pl-4 sm:p-2 sm:pl-5" role="search" aria-label="Pregúntale a tu WhatsApp">
        <span className="v-live-dot shrink-0" aria-hidden="true" />
        <div className="relative min-w-0 flex-1">
          <label htmlFor="pregunta-whatsapp" className="sr-only">
            Pregúntale a tu WhatsApp
          </label>
          <input
            ref={input}
            id="pregunta-whatsapp"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                cerrar();
                input.current?.blur();
              }
            }}
            maxLength={140}
            autoComplete="off"
            enterKeyHint="send"
            className="w-full bg-transparent py-3 pl-1 text-[16px] text-[var(--cream)] outline-none"
          />
          {!valor ? (
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1 right-0 flex items-center overflow-hidden text-[16px] text-[var(--cream-35)]">
              <span className="mr-1.5 shrink-0">Pregúntale:</span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={ph}
                  className="truncate text-[var(--cream-60)]"
                  initial={reduce ? false : { y: "70%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={reduce ? undefined : { y: "-70%", opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  {PREGUNTAS[ph]!.texto}
                </motion.span>
              </AnimatePresence>
            </span>
          ) : null}
        </div>
        <kbd className="v-mono hidden shrink-0 rounded-md border border-white/15 px-1.5 py-0.5 text-[10px] text-[var(--cream-35)] lg:inline">/</kbd>
        <button
          type="submit"
          data-cursor="Preguntar"
          className="min-h-11 shrink-0 rounded-[14px] bg-[var(--cream)] px-4 text-[15px] font-semibold text-[var(--ink)] transition-transform hover:-translate-y-px active:translate-y-0 sm:px-5"
        >
          Preguntar
        </button>
      </form>

      <div className="relative">
        <motion.div
          className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible"
          animate={{ opacity: abierta ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          aria-hidden={abierta}
        >
          {PREGUNTAS.map((p) => (
            <button
              key={p.foco}
              type="button"
              tabIndex={abierta ? -1 : 0}
              onClick={() => preguntar(p.texto)}
              data-cursor="Preguntar"
              className="shrink-0 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-[13.5px] text-[var(--cream-60)] backdrop-blur-md transition-colors hover:border-white/30 hover:text-[var(--cream)]"
            >
              {p.texto}
            </button>
          ))}
        </motion.div>

        <AnimatePresence>
          {abierta ? (
            <motion.div
              key="respuesta"
              className="v-answer absolute inset-x-0 top-3 z-20 p-4 sm:p-5"
              initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--live)]/15" aria-hidden="true">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--live)]" />
                </span>
                <span className="text-[14px] font-semibold">allok</span>
                <span className="v-mono rounded-full border border-white/12 px-2 py-0.5 text-[9px] text-[var(--cream-60)]">Ejemplo</span>
                <button
                  type="button"
                  onClick={cerrar}
                  className="ml-auto grid h-8 w-8 place-items-center rounded-full text-[var(--cream-60)] transition-colors hover:bg-white/10 hover:text-[var(--cream)]"
                  aria-label="Cerrar respuesta"
                >
                  ✕
                </button>
              </div>
              <p className="mt-3 min-h-[3lh] text-[clamp(15px,1.6vw,17px)] leading-relaxed text-[var(--cream)]">
                {estado === "pensando" ? (
                  <span className="v-shimmer">Revisando tus conversaciones…</span>
                ) : (
                  <span className={estado === "escribiendo" ? "v-caret" : undefined}>{respuesta.slice(0, visible)}</span>
                )}
              </p>
              <motion.div
                className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"
                animate={{ opacity: estado === "listo" ? 1 : 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="v-mono text-[9.5px] leading-relaxed text-[var(--cream-35)]">Negocio de ejemplo · en tu cuenta, con tus datos</span>
                <a href={cta.href} data-cursor="Crear" className="text-[14px] font-semibold text-[var(--live)] hover:underline">
                  {cta.label} →
                </a>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
