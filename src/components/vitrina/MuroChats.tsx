"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CHATS, type Chat, type Foco } from "@/lib/agente-vitrina";
import { TarjetaChat } from "./Burbujas";
import Pregunta from "./Pregunta";

const COLS = 6;
/** Conversaciones por columna antes de repetir: cubren la pantalla en bucle. */
const POR_COLUMNA = 8;

/** Reparte las conversaciones sin que dos columnas vecinas empiecen igual. */
function columnas(chats: Chat[]): Chat[][] {
  return Array.from({ length: COLS }, (_, c) =>
    Array.from({ length: POR_COLUMNA }, (_, k) => chats[(c + k * COLS + Math.floor(k / 3)) % chats.length]!),
  );
}

const COLUMNAS = columnas(CHATS);

const LINEA_1 = ["Tu", "WhatsApp,"];
const LINEA_2 = ["con", "cerebro."];

/**
 * La portada del agente: el mismo muro de la vitrina, pero hecho de
 * conversaciones que se atienden solas. Lo que el dueño pregunta en la barra
 * detiene el muro y enciende las conversaciones que responden.
 */
export default function MuroChats({ cta }: { cta: { href: string; label: string } }) {
  const stage = useRef<HTMLElement>(null);
  const wall = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [foco, setFoco] = useState<Foco | null>(null);
  const [abierta, setAbierta] = useState(false);
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
    <section
      ref={stage}
      id="inicio"
      data-foco={foco ?? undefined}
      data-abierta={abierta || undefined}
      className="v-hero relative h-[100svh] min-h-[600px] overflow-hidden sm:min-h-[720px]"
      aria-label="Portada"
    >
      <motion.div
        aria-hidden="true"
        className="v-wall-stage absolute inset-0"
        style={reduce ? undefined : { opacity: wallOpacity, scale: wallScale }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      >
        <div
          ref={wall}
          data-foco={foco ?? undefined}
          className="v-wall absolute left-[-30%] right-[-30%] top-[-40%] flex h-[180%] gap-4 sm:gap-6"
        >
          {COLUMNAS.map((col, c) => (
            <div key={c} className="relative min-w-0 flex-1 overflow-visible">
              <div
                className="v-wall-col flex flex-col gap-4 sm:gap-6"
                data-dir={c % 2 ? "down" : "up"}
                style={{ ["--dur" as string]: `${80 + (c % 3) * 20}s` }}
              >
                {[...col, ...col].map((chat, i) => (
                  <TarjetaChat key={`${chat.nombre}-${i}`} chat={chat} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <div aria-hidden="true" className="v-wall-shade pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="v-aura pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2" />

      <motion.div
        className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-16 pt-24 text-center"
        style={reduce ? undefined : { y: titleY, opacity: titleOpacity }}
      >
        {/* Con una respuesta abierta, la portada se vuelve conversación: el titular se encoge y lo demás se pliega. */}
        <div className="flex w-full flex-col items-center">
          <div className="v-plegable">
            <div>
              <motion.p
                className="v-mono flex items-center gap-2.5 pb-7 text-[11px] text-[var(--cream-60)] sm:text-xs"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <span className="v-live-dot" aria-hidden="true" />
                allok · agente de IA para WhatsApp
              </motion.p>
            </div>
          </div>
          <h1 className="v-hero-h1 v-display text-[clamp(3.4rem,min(11vw,17svh),10.5rem)]">
            <span className="block">
              {word(LINEA_1[0]!)} {word(LINEA_1[1]!)}
            </span>
            <span className="block">
              {word(LINEA_2[0]!, true)} {word(LINEA_2[1]!, true)}
            </span>
          </h1>
          <div className="v-plegable w-full">
            <div>
              <motion.p
                className="mx-auto max-w-[36rem] text-balance pt-8 text-[clamp(1rem,1.6vw,1.2rem)] leading-relaxed text-[var(--cream-60)]"
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.05 }}
              >
                Le contesta a tus clientes con tus precios y tu tono, y agenda por ti.{" "}
                <span className="text-[var(--cream)]">Y te contesta a ti:</span> pregúntale lo que sea de tu WhatsApp.
              </motion.p>
            </div>
          </div>
          <motion.div
            className="w-full"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Pregunta onFoco={setFoco} onAbrir={setAbierta} cta={cta} />
          </motion.div>
        </div>
      </motion.div>

      <motion.a
        href="#agente"
        className="v-mono absolute bottom-6 left-1/2 z-0 hidden -translate-x-1/2 flex-col items-center gap-3 text-[10px] text-[var(--cream-60)] transition-colors hover:text-[var(--cream)] sm:flex"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: abierta ? 0 : 1 }}
        transition={{ delay: abierta ? 0 : 1.8, duration: 0.6 }}
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
