"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HISTORIAS } from "@/lib/historias";
import { ESTADO, PIEZAS, claseEstado, type Pieza } from "@/lib/vitrina";
import Escribeme from "./Escribeme";
import { Ventana } from "./Marcos";

// Lo que abre el enlace, dicho con el mismo estado que muestra la ficha.
const ABRIR: Record<Pieza["status"], string> = {
  launched: "Abrir la web",
  improving: "Abrir la web",
  demo: "Abrir la demo",
  prototype: "Abrir el prototipo",
};

type Captura = { src: string; alt: string; label?: string; celular: boolean; ratio: number };
type Enlace = { tipo: "web" | "caso"; texto: string; href: string };

/**
 * Lo que cuenta la ficha de una pieza. Las cuatro de la portada traen su
 * escena, su cuerpo y sus enlaces de `HISTORIAS`, y abren con las mismas
 * capturas que se tocaron; las demás, con su historia de `PIEZAS`.
 */
function contenido(p: Pieza): { escena?: string; cuerpo: string; capturas: Captura[]; enlaces: Enlace[] } {
  const todas: Captura[] = p.images.map((i) => ({ src: i.src, alt: i.alt, label: i.label, celular: i.mobile, ratio: i.ratio }));
  const h = HISTORIAS.find((x) => x.id === p.id);
  if (!h) {
    const enlaces: Enlace[] = [];
    if (p.liveUrl) enlaces.push({ tipo: "web", texto: ABRIR[p.status], href: p.liveUrl });
    if (p.casoHref) enlaces.push({ tipo: "caso", texto: "Leer el caso", href: p.casoHref });
    return { cuerpo: p.historia, capturas: todas, enlaces };
  }
  const primeras: Captura[] = h.capturas.map((c) => ({ ...c, label: todas.find((t) => t.src === c.src)?.label }));
  const vistas = new Set(primeras.map((c) => c.src));
  return {
    escena: h.escena,
    cuerpo: h.cuerpo,
    capturas: [...primeras, ...todas.filter((c) => !vistas.has(c.src))],
    // «Ver más pantallas» es esta misma ficha: aquí sobra.
    enlaces: h.acciones.filter((a): a is Enlace => a.tipo !== "ficha"),
  };
}

/** entrando: un cuadro en su punto de partida · abierta · saliendo: el mismo camino al revés, y se desmonta. */
type Fase = "entrando" | "abierta" | "saliendo";

const sinMovimiento = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/** Lo que dura la salida, leído del CSS (los tokens): con «reducir movimiento» es 0 y se va en el acto. */
function duracion(el: Element): number {
  const s = getComputedStyle(el);
  const ms = (v: string) => v.split(",").map((x) => (x.trim().endsWith("ms") ? parseFloat(x) : parseFloat(x) * 1000) || 0);
  const d = ms(s.transitionDuration);
  const r = ms(s.transitionDelay);
  return Math.max(0, ...d.map((x, k) => x + (r[k % r.length] ?? 0)));
}

const SIN_CAJA = new Set(["SCRIPT", "STYLE", "LINK", "TEMPLATE", "NOSCRIPT"]);

/**
 * Mientras la ficha está abierta, lo demás de la página no recibe el foco ni
 * los toques (es un diálogo modal): cada hermano de la ficha, y de cada uno de
 * sus contenedores hasta la raíz `.ak`, queda inerte. Devuelve lo que tocó,
 * para soltarlo al cerrar.
 */
function aislar(ficha: HTMLElement): HTMLElement[] {
  const tope = ficha.closest(".ak")?.parentElement ?? document.body;
  const tocados: HTMLElement[] = [];
  for (let nodo: HTMLElement | null = ficha; nodo && nodo.parentElement && nodo.parentElement !== tope; nodo = nodo.parentElement) {
    for (const h of Array.from(nodo.parentElement.children)) {
      if (h === nodo || !(h instanceof HTMLElement) || h.inert || SIN_CAJA.has(h.tagName)) continue;
      h.inert = true;
      tocados.push(h);
    }
  }
  return tocados;
}

/**
 * La ficha de una pieza, sobre la portada o /trabajo: abre con sus capturas,
 * después la escena y lo que se construyó, los enlaces, la siguiente pieza y,
 * pegado abajo, el único botón azul: escribir por WhatsApp nombrando la pieza.
 * Entra y sale con transiciones de CSS (10-motor.src.css); `id` en null la
 * cierra, y se desmonta cuando termina de irse.
 */
export default function Ficha({ id, onClose, onGo }: { id: string | null; onClose: () => void; onGo: (id: string) => void }) {
  const pedida = id && PIEZAS.some((p) => p.id === id) ? id : null;
  const [mostrada, setMostrada] = useState<string | null>(pedida);
  const [fase, setFase] = useState<Fase>(() => (sinMovimiento() ? "abierta" : "entrando"));
  const [previa, setPrevia] = useState<string | null>(pedida);

  // La pieza pedida cambió: se ajusta aquí mismo, en el render, sin pasar por un efecto.
  if (pedida !== previa) {
    setPrevia(pedida);
    if (pedida) {
      setMostrada(pedida);
      if (!mostrada) setFase(sinMovimiento() ? "abierta" : "entrando");
      else if (fase === "saliendo") setFase("abierta"); // la vuelven a abrir mientras se iba: deshace el camino
    } else if (mostrada) {
      setFase("saliendo");
    }
  }

  const raiz = useRef<HTMLDivElement>(null);
  const hoja = useRef<HTMLDivElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const i = PIEZAS.findIndex((p) => p.id === mostrada);
  const pieza = i >= 0 ? PIEZAS[i] : undefined;
  const viva = Boolean(pieza) && fase !== "saliendo";

  // Un cuadro en el punto de partida y después a su sitio: así la transición tiene de dónde salir.
  useEffect(() => {
    if (fase !== "entrando") return;
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setFase("abierta"));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, [fase]);

  // Se va: cuando termina el camino de vuelta, se desmonta.
  useEffect(() => {
    if (fase !== "saliendo") return;
    const t = window.setTimeout(() => setMostrada(null), hoja.current ? duracion(hoja.current) : 0);
    return () => window.clearTimeout(t);
  }, [fase]);

  // Abierta, la página de atrás queda inerte y quieta, y al cerrar el foco vuelve a lo que la abrió. Va
  // antes del efecto que enfoca «Cerrar», para recordar el origen, y depende de si está abierta, no de
  // cuál: «Siguiente» no la reinicia.
  useEffect(() => {
    if (!viva || !raiz.current) return;
    const origen = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const tocados = aislar(raiz.current);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      for (const e of tocados) e.inert = false;
      document.body.style.overflow = antes;
      origen?.focus({ preventScroll: true });
    };
  }, [viva]);

  useEffect(() => {
    if (!viva) return;
    cerrar.current?.focus({ preventScroll: true });
    hoja.current?.scrollTo({ top: 0 });
  }, [viva, mostrada]);

  useEffect(() => {
    if (!viva || i < 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onGo(PIEZAS[(i + 1) % PIEZAS.length]!.id);
      else if (e.key === "ArrowLeft") onGo(PIEZAS[(i - 1 + PIEZAS.length) % PIEZAS.length]!.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viva, i, onClose, onGo]);

  if (!pieza) return null;
  const c = contenido(pieza);
  const siguiente = PIEZAS[(i + 1) % PIEZAS.length]!;

  return (
    <div
      ref={raiz}
      className="ficha"
      data-fase={fase}
      role="dialog"
      aria-modal={viva ? "true" : undefined}
      aria-labelledby="ficha-titulo"
      inert={!viva}
    >
      <button type="button" aria-label="Cerrar" className="ficha-scrim" onClick={onClose} tabIndex={-1} />
      <div ref={hoja} className="ficha-sheet" data-theme="cloud">
        <div className="ficha-top">
          <h2 id="ficha-titulo" className="heading">
            {pieza.name}
          </h2>
          <button ref={cerrar} type="button" onClick={onClose} className="btn btn-link">
            Cerrar <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="ficha-galeria">
          <Galeria key={pieza.id} capturas={c.capturas} url={pieza.liveUrl} />
        </div>

        <div className="ficha-texto">
          <p className="label ficha-datos">
            {pieza.tipo} · <span className="tnum">{pieza.year}</span> · <span className={claseEstado(pieza.status)}>{ESTADO[pieza.status]}</span>
          </p>
          {c.escena ? <p className="subhead ficha-escena">{c.escena}</p> : null}
          <p className="body ficha-historia">{c.cuerpo}</p>
          {c.enlaces.length ? (
            <div className="ficha-acciones">
              {c.enlaces.map((e) =>
                e.tipo === "web" ? (
                  <a key={e.href} href={e.href} target="_blank" rel="noopener noreferrer" className="btn btn-link">
                    {e.texto} <span className="arw arw-ne" aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <Link key={e.href} href={e.href} prefetch={false} className="btn btn-link">
                    {e.texto} <span className="arw arw-r" aria-hidden="true">→</span>
                  </Link>
                ),
              )}
            </div>
          ) : null}
        </div>

        <button type="button" onClick={() => onGo(siguiente.id)} className="ficha-siguiente" data-theme="ink">
          <span className="label">Siguiente</span>
          <span className="ficha-siguiente-nombre">
            <span className="headline">{siguiente.name}</span>
            <span className="arw arw-r ficha-flecha" aria-hidden="true">→</span>
          </span>
        </button>

        <div className="ficha-escribeme">
          <Escribeme origen="pieza" pieza={{ nombre: pieza.name }} />
        </div>
      </div>
    </div>
  );
}

function Galeria({ capturas, url }: { capturas: Captura[]; url?: string }) {
  return (
    <>
      {capturas.map((img, k) => (
        <figure key={img.src} className={img.celular ? "ficha-fig is-phone" : "ficha-fig"}>
          <Ventana
            src={img.src}
            alt={img.alt}
            url={img.celular ? undefined : url}
            ratio={img.celular ? img.ratio || 390 / 844 : 16 / 10}
            sizes={img.celular ? "290px" : "(max-width: 1300px) 92vw, 1300px"}
            eager={k === 0}
            reveal={false}
          />
          {img.label ? <figcaption className="caption">{img.label}</figcaption> : null}
        </figure>
      ))}
    </>
  );
}
