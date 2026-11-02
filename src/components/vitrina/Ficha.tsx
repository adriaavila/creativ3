"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { PIEZAS } from "@/lib/vitrina";
import { Navegador, Telefono } from "./Marcos";

const ESTADO: Record<string, string> = {
  launched: "En producción",
  improving: "En evolución",
  demo: "Demo",
  prototype: "Prototipo",
};

/**
 * La ficha de una pieza, a pantalla completa sobre la portada: la historia,
 * sus capturas y, cuando existe, el enlace para abrirla viva.
 */
export default function Ficha({ id, onClose, onGo }: { id: string | null; onClose: () => void; onGo: (id: string) => void }) {
  const i = PIEZAS.findIndex((p) => p.id === id);
  const pieza = i >= 0 ? PIEZAS[i] : undefined;
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pieza) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onGo(PIEZAS[(i + 1) % PIEZAS.length]!.id);
      if (e.key === "ArrowLeft") onGo(PIEZAS[(i - 1 + PIEZAS.length) % PIEZAS.length]!.id);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [pieza, i, onClose, onGo]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [id]);

  const siguiente = pieza ? PIEZAS[(i + 1) % PIEZAS.length]! : undefined;

  return (
    <AnimatePresence>
      {pieza ? (
        <motion.div
          key="ficha"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ficha-titulo"
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} tabIndex={-1} />
          <motion.div
            ref={scroller}
            className="absolute inset-x-0 bottom-0 top-3 overflow-y-auto overscroll-contain rounded-t-[26px] bg-[#0b0c0f] sm:inset-x-3 sm:top-6 sm:rounded-t-[34px]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="relative overflow-hidden px-5 pb-16 pt-6 sm:px-12 sm:pt-8"
              style={{ background: `radial-gradient(110% 80% at 80% 0%, ${pieza.tint} 0%, transparent 70%)` }}
            >
              <div className="v-grain pointer-events-none absolute inset-0" aria-hidden="true" />
              <div className="relative flex items-center justify-between">
                <span className="v-mono text-[11px] text-[var(--cream-60)]">
                  {String(i + 1).padStart(2, "0")} / {String(PIEZAS.length).padStart(2, "0")} · {pieza.tipo}
                </span>
                <button
                  ref={closeBtn}
                  type="button"
                  onClick={onClose}
                  className="v-mono flex min-h-11 items-center gap-2 rounded-full border border-[var(--cream-12)] px-4 text-[11px] transition-colors hover:bg-white/10"
                >
                  Cerrar <span aria-hidden="true">✕</span>
                </button>
              </div>

              <motion.div
                key={pieza.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="relative mx-auto mt-14 max-w-[1300px] sm:mt-20"
              >
                <h2 id="ficha-titulo" className="v-display text-[clamp(3.2rem,10vw,9.5rem)]">
                  {pieza.name}
                </h2>
                <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
                  <div>
                    <p className="v-serif text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.1]">{pieza.linea}</p>
                    <p className="mt-6 max-w-[60ch] text-[17px] leading-relaxed text-[var(--cream-60)]">{pieza.historia}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      {pieza.liveUrl ? (
                        <a
                          href={pieza.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--cream)] px-6 font-semibold text-[var(--ink)] transition-transform hover:-translate-y-0.5"
                        >
                          <span className="v-live-dot" aria-hidden="true" />
                          Abrirla en vivo <span aria-hidden="true">↗</span>
                        </a>
                      ) : null}
                      {pieza.casoHref ? (
                        <Link
                          href={pieza.casoHref}
                          className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--cream-35)] px-6 font-semibold transition-colors hover:bg-white/10"
                        >
                          Leer el caso completo <span aria-hidden="true">→</span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 content-start gap-x-6 gap-y-6 border-t border-[var(--cream-12)] pt-6 text-sm">
                    <div>
                      <dt className="v-mono text-[10px] text-[var(--cream-60)]">Año</dt>
                      <dd className="mt-1">{pieza.year}</dd>
                    </div>
                    <div>
                      <dt className="v-mono text-[10px] text-[var(--cream-60)]">Estado</dt>
                      <dd className="mt-1">{ESTADO[pieza.status] ?? pieza.status}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="v-mono text-[10px] text-[var(--cream-60)]">Hecho con</dt>
                      <dd className="mt-2 flex flex-wrap gap-2">
                        {pieza.stack.map((s) => (
                          <span key={s} className="rounded-full border border-[var(--cream-12)] px-3 py-1">
                            {s}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              </motion.div>
            </div>

            <div className="mx-auto max-w-[1300px] space-y-10 px-5 pb-20 sm:px-12">
              <Galeria key={pieza.id} images={pieza.images} url={pieza.liveUrl} />
            </div>

            {siguiente ? (
              <button
                type="button"
                onClick={() => onGo(siguiente.id)}
                className="group block w-full border-t border-[var(--cream-12)] px-5 py-14 text-left sm:px-12 sm:py-20"
              >
                <span className="v-mono text-[11px] text-[var(--cream-60)]">Siguiente</span>
                <span className="mt-3 flex items-center justify-between gap-6">
                  <span className="v-display text-[clamp(2.6rem,8vw,7rem)] transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-3">
                    {siguiente.name}
                  </span>
                  <span aria-hidden="true" className="text-[clamp(2rem,6vw,5rem)] transition-transform duration-700 group-hover:translate-x-2">
                    →
                  </span>
                </span>
              </button>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Galeria({ images, url }: { images: { src: string; alt: string; label: string; mobile: boolean; ratio: number }[]; url?: string }) {
  const desktop = images.filter((i) => !i.mobile);
  const phones = images.filter((i) => i.mobile);
  return (
    <>
      {desktop.map((img, k) => (
        <motion.figure
          key={img.src}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, delay: k === 0 ? 0.3 : 0, ease: [0.16, 1, 0.3, 1] }}
        >
          <Navegador src={img.src} alt={img.alt} url={url} sizes="(max-width: 1300px) 92vw, 1300px" eager={k === 0} />
          <figcaption className="v-mono mt-3 text-[10px] text-[var(--cream-60)]">{img.label}</figcaption>
        </motion.figure>
      ))}
      {phones.length ? (
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
          {phones.map((img) => (
            <motion.figure
              key={img.src}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="w-[min(70vw,290px)]"
            >
              <Telefono src={img.src} alt={img.alt} ratio={img.ratio} sizes="290px" />
              <figcaption className="v-mono mt-3 text-center text-[10px] text-[var(--cream-60)]">{img.label}</figcaption>
            </motion.figure>
          ))}
        </div>
      ) : null}
    </>
  );
}
