"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { AVISO_TRASPASO, MOMENTOS } from "@/lib/agente-vitrina";
import { VistaBurbuja } from "./Burbujas";

/**
 * «Le contesta a tus clientes»: una sola conversación que se escribe sola a
 * medida que bajas. Cuatro momentos, cada uno algo que el agente ya hace; el
 * último termina en el aviso que le llega al dueño.
 */
export default function Atiende() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [activo, setActivo] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const barra = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActivo(Math.min(MOMENTOS.length - 1, Math.max(0, Math.floor(v * MOMENTOS.length))));
  });

  if (reduce) {
    return (
      <section id="agente" aria-labelledby="agente-titulo" className="relative px-4 py-28 sm:px-10">
        <div className="mx-auto grid max-w-[1240px] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <Encabezado />
            <ol className="mt-12 grid gap-8">
              {MOMENTOS.map((m) => (
                <li key={m.titulo}>
                  <p className="text-[clamp(1.4rem,2.4vw,2.2rem)] font-semibold tracking-[-0.03em]">{m.titulo}</p>
                  <p className="mt-2 max-w-[34rem] text-[var(--cream-60)]">{m.cuerpo}</p>
                </li>
              ))}
            </ol>
          </div>
          <Telefono hasta={MOMENTOS.length - 1} quieto />
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="agente" aria-labelledby="agente-titulo" className="relative h-[420svh]">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1240px] items-center gap-6 px-4 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
          <div className="min-w-0">
            <Encabezado />

            {/* En el celular se lee un momento a la vez, arriba del teléfono. */}
            <div className="relative mt-5 h-[4.2rem] lg:hidden" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activo}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-[1.25rem] font-semibold leading-tight tracking-[-0.03em]">{MOMENTOS[activo]!.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-[var(--cream-60)]">{MOMENTOS[activo]!.cuerpo}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative mt-14 hidden pl-7 lg:block">
              <span className="absolute bottom-1 left-0 top-1 w-px bg-[var(--cream-12)]" aria-hidden="true">
                <motion.span className="absolute inset-x-0 top-0 block bg-[var(--live)]" style={{ height: barra }} />
              </span>
              <ol className="grid gap-7">
                {MOMENTOS.map((m, i) => (
                  <li key={m.titulo}>
                    <motion.p
                      className="text-[clamp(1.5rem,2.5vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.035em]"
                      animate={{ opacity: i === activo ? 1 : i < activo ? 0.38 : 0.16 }}
                      transition={{ duration: 0.4 }}
                    >
                      {m.titulo}
                    </motion.p>
                    <AnimatePresence initial={false}>
                      {i === activo ? (
                        <motion.p
                          key="cuerpo"
                          className="max-w-[32rem] overflow-hidden text-[16px] leading-relaxed text-[var(--cream-60)]"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <span className="block pt-2">{m.cuerpo}</span>
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="flex justify-center">
            <Telefono hasta={activo} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Encabezado() {
  return (
    <>
      <p className="v-mono text-[11px] text-[var(--cream-60)]">01 · A tus clientes</p>
      <h2 id="agente-titulo" className="v-display mt-4 text-[clamp(2.3rem,6vw,6rem)] sm:mt-6">
        Le contesta
        <br />
        <span className="v-serif text-[var(--cream-60)]">a tus clientes.</span>
      </h2>
    </>
  );
}

/** El WhatsApp del negocio, en el celular del dueño, mientras el agente atiende. */
function Telefono({ hasta, quieto = false }: { hasta: number; quieto?: boolean }) {
  const visibles = MOMENTOS.slice(0, hasta + 1);
  const avisa = hasta >= MOMENTOS.length - 1;

  return (
    <div className="relative isolate w-[min(340px,72vw,calc((100svh_-_280px)*0.47))] shrink-0 lg:w-[min(360px,calc((100svh_-_130px)*0.47))]">
      {/* La luz de la pantalla en la oscuridad. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[45%] -z-10 h-[110%] w-[190%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(61,220,132,0.16),rgba(27,63,150,0.16)_55%,transparent)] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[46px] border-[7px] border-[#121316] bg-[#121316] shadow-[0_0_0_1px_rgba(255,255,255,.08),0_60px_120px_-40px_rgba(0,0,0,.95)]">
        <div className="v-wa relative flex aspect-[9/19] flex-col overflow-hidden rounded-[39px]">
          {/* La isla y la barra de estado. */}
          <div className="relative z-10 flex items-center justify-between px-7 pt-3 text-[11px] font-semibold text-white/85">
            <span>23:14</span>
            <span className="h-[22px] w-[84px] rounded-full bg-black" aria-hidden="true" />
            <span className="v-mono text-[9px]">5G</span>
          </div>
          <div className="relative z-10 flex items-center gap-2.5 border-b border-white/5 bg-[#1f2c34] px-4 pb-2.5 pt-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f3c9a8] text-[11px] font-semibold text-[#0b0c0e]" aria-hidden="true">
              VR
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-[14px] font-semibold text-[#e9edef]">Valeria R.</span>
              <span className="block text-[11px] text-[#8696a0]">la atiende tu agente</span>
            </span>
          </div>

          <div className="relative flex flex-1 flex-col justify-end gap-1.5 overflow-hidden px-3 pb-3 text-[13px] leading-[1.35]">
            <motion.p layout={!quieto} className="mx-auto mb-1 rounded-md bg-[#182229] px-2.5 py-1 text-[10.5px] font-medium text-[#8696a0]">
              Hoy
            </motion.p>
            <AnimatePresence initial={false}>
              {visibles.flatMap((m, mi) => [
                ...m.burbujas.map((b, bi) => (
                  <motion.div
                    key={`${mi}-${bi}`}
                    layout={!quieto}
                    className={`flex flex-col ${b.de === "agente" ? "items-end" : "items-start"}`}
                    initial={quieto ? false : { opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.4, delay: quieto ? 0 : bi * 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <VistaBurbuja b={b} />
                  </motion.div>
                )),
                ...(m.cita
                  ? [
                      <motion.p
                        key={`${mi}-cita`}
                        layout={!quieto}
                        className="v-mono mx-auto my-1 rounded-full bg-[var(--live)]/15 px-3 py-1 text-[9.5px] text-[#74f0ad]"
                        initial={quieto ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: quieto ? 0 : 1.1 }}
                      >
                        {m.cita}
                      </motion.p>,
                    ]
                  : []),
              ])}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 px-3 pb-5">
            <span className="flex-1 rounded-full bg-[#1f2c34] px-4 py-2 text-[12px] text-[#8696a0]">Mensaje</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#00a884] text-[12px] text-[#0b141a]" aria-hidden="true">
              ➤
            </span>
          </div>

          {/* El aviso que le llega al dueño cuando el agente no sabe. */}
          <AnimatePresence>
            {avisa ? (
              <motion.div
                key="aviso"
                className="v-notif absolute inset-x-2.5 top-11 z-20 p-3 text-left"
                initial={quieto ? false : { opacity: 0, y: -40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.6, delay: quieto ? 0 : 1.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-[6px] bg-[#0b0c0e]" aria-hidden="true">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
                  </span>
                  <span className="text-[11px] font-semibold text-white/80">allok</span>
                  <span className="ml-auto text-[10px] text-white/45">ahora</span>
                </div>
                <p className="mt-1.5 text-[12.5px] font-semibold leading-snug text-white">{AVISO_TRASPASO.titulo}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-white/70">{AVISO_TRASPASO.cuerpo}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      <p className="v-mono mt-4 text-center text-[9.5px] text-[var(--cream-35)]">Conversación de ejemplo</p>
    </div>
  );
}
