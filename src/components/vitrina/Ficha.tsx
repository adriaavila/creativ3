"use client";

import Link from "next/link";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ESTADO, PIEZAS, type Pieza } from "@/lib/vitrina";
import { Ventana } from "./Marcos";

// Lo que abre el botón, dicho con el mismo estado que muestra la ficha al lado.
const ABRIR: Record<Pieza["status"], string> = {
  launched: "Abrir la web",
  improving: "Abrir la web",
  demo: "Abrir la demo",
  prototype: "Abrir el prototipo",
};

/**
 * La ficha de una pieza, a pantalla completa sobre la portada o /trabajo: la
 * historia, sus capturas y, cuando existe, el enlace para abrirla.
 */
export default function Ficha({ id, onClose, onGo }: { id: string | null; onClose: () => void; onGo: (id: string) => void }) {
  const i = PIEZAS.findIndex((p) => p.id === id);
  const pieza = i >= 0 ? PIEZAS[i] : undefined;
  const abierta = Boolean(pieza);
  const scroller = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  // Con «reducir movimiento», la hoja aparece sin subir: solo el fundido, como pide el sistema. MotionConfig
  // apaga la subida, y sin el desplazamiento de partida la hoja tampoco nace corrida sus primeros cuadros.
  const subir = !useReducedMotion();

  // Mientras está abierta, la página de atrás no recibe el foco (es un diálogo modal); al cerrarla, el
  // foco vuelve a lo que la abrió. Va antes del efecto que enfoca «Cerrar», para recordar el origen, y
  // depende de si está abierta, no de cuál: «Siguiente» no la reinicia.
  useEffect(() => {
    if (!abierta) return;
    const origen = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fondo = Array.from(document.querySelectorAll<HTMLElement>(".ak > header, .ak > main, .ak > footer"));
    for (const e of fondo) e.inert = true;
    return () => {
      for (const e of fondo) e.inert = false;
      origen?.focus({ preventScroll: true });
    };
  }, [abierta]);

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

  // Los tiempos y curvas del sistema: llega en duration-slow con ease-out, se va en duration-quick.
  const EASE_OUT = [0.2, 0.75, 0.25, 1] as const;

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {pieza ? (
          <motion.div
            key="ficha"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ficha-titulo"
            className="ficha"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
          >
            <button type="button" aria-label="Cerrar" className="ficha-scrim" onClick={onClose} tabIndex={-1} />
            <motion.div
              ref={scroller}
              className="ficha-sheet"
              data-theme="cloud"
              initial={{ y: subir ? 48 : 0, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: subir ? 24 : 0, opacity: 0, transition: { duration: 0.2, ease: [0.55, 0, 1, 0.45] } }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
            >
              <div className="ficha-top">
                <span className="label">{pieza.tipo}</span>
                <button ref={closeBtn} type="button" onClick={onClose} className="btn btn-link">
                  Cerrar <span aria-hidden="true">✕</span>
                </button>
              </div>

              <div className="ficha-head">
                <h2 id="ficha-titulo" className="display">
                  {pieza.name}
                </h2>
                <div className="ficha-grid">
                  <div>
                    <p className="subhead">{pieza.linea}</p>
                    <p className="body ficha-historia">{pieza.historia}</p>
                    <div className="ficha-acciones">
                      {pieza.liveUrl ? (
                        <a href={pieza.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                          {ABRIR[pieza.status]} <span className="arw arw-ne" aria-hidden="true">↗</span>
                        </a>
                      ) : null}
                      {pieza.casoHref ? (
                        <Link href={pieza.casoHref} className="btn btn-link">
                          Leer el caso completo <span className="arw arw-r" aria-hidden="true">→</span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <dl className="ficha-datos">
                    <div>
                      <dt className="label">Año</dt>
                      <dd className="tnum">{pieza.year}</dd>
                    </div>
                    <div>
                      <dt className="label">Estado</dt>
                      <dd>{ESTADO[pieza.status]}</dd>
                    </div>
                    <div className="ficha-stack">
                      <dt className="label">Hecho con</dt>
                      <dd className="chips">
                        {pieza.stack.map((s) => (
                          <span key={s} className="chip">
                            {s}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="ficha-galeria">
                <Galeria key={pieza.id} images={pieza.images} url={pieza.liveUrl} />
              </div>

              {siguiente ? (
                <button type="button" onClick={() => onGo(siguiente.id)} className="ficha-siguiente" data-theme="ink">
                  <span className="label">Siguiente</span>
                  <span className="ficha-siguiente-nombre">
                    <span className="headline">{siguiente.name}</span>
                    <span className="arw arw-r ficha-flecha" aria-hidden="true">→</span>
                  </span>
                </button>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}

function Galeria({ images, url }: { images: { src: string; alt: string; label: string; mobile: boolean; ratio: number }[]; url?: string }) {
  return (
    <>
      {images.map((img, k) => (
        <figure key={img.src} className={img.mobile ? "ficha-fig is-phone" : "ficha-fig"}>
          <Ventana
            src={img.src}
            alt={img.alt}
            url={img.mobile ? undefined : url}
            ratio={img.mobile ? img.ratio || 390 / 844 : 16 / 10}
            sizes={img.mobile ? "290px" : "(max-width: 1300px) 92vw, 1300px"}
            eager={k === 0}
            reveal={false}
          />
          <figcaption className="caption">{img.label}</figcaption>
        </figure>
      ))}
    </>
  );
}
