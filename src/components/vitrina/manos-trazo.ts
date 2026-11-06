// The answer without WebGL. The hero's scene (manos-escena.ts) and this
// file play the same timeline: here CSS moves the pencil sketch
// (ManosTrazo.tsx) and the visitor's dot flies with WAAPI. It is the hero's
// twin when there is no WebGL (or before it loads), and the close's whole
// piece. Nothing here needs WebGL, so it can sit in the first bundle.

/**
 * The answer, in seconds, shared with the scene. Every move is one of the
 * system's durations (tokens.json): the hands travel and the arc draws in
 * 700 ms, the dot flies in 500 and lands in 400, the only overshoot.
 */
export const RESPUESTA = {
  travel: [0, 0.7],
  signalIn: [0, 0.7],
  arc: [0.6, 1.3],
  dotFly: [0.8, 1.3],
  dot: [1.3, 1.7],
  signalOut: [1.4, 2.1],
  end: 2.1,
} as const;

/** What a scene tells whoever holds it. */
export type Avisos = {
  /** The answer starts: the hint can leave. */
  alResponder?: () => void;
  /** The dot lands: the loop is closed. */
  alCerrar?: () => void;
  /** Everything holds still. */
  alTerminar?: () => void;
};

/** The same three verbs for the WebGL scene and the sketch. */
export type Lazo = {
  /** The visitor's tap, in client pixels: their dot flies to the mark. */
  tocar(x: number, y: number): void;
  /** Nobody tapped: the loop closes on its own, the dot landing from the fingertip. */
  cerrarSolo(): void;
  destruir(): void;
};

/** Where the mark's dot sits, in client pixels, and its radius. */
export type Destino = { x: number; y: number; r: number };

/** A curve or a duration from the tokens: WAAPI can't read var(), so it reads the computed value. */
function token(el: Element, nombre: string, respaldo: string) {
  return getComputedStyle(el).getPropertyValue(nombre).trim() || respaldo;
}

// While it flies the dot shrinks a little, leaving the glass for the scene,
// and the settle lands it at the mark's size.
const VUELO = 0.6;

/** The visitor's dot: an HTML overlay, so it answers the finger in the next frame whatever the GL is doing. */
export type Punto = {
  /** Shows the dot under the finger at once. */
  aparecer(x: number, y: number, r: number): void;
  /** From now: holds under the finger, flies to the mark and lands, as RESPUESTA says. Resolves once landed. */
  volar(hacia: Destino): Promise<void>;
  /** Hides it: the mark shows its own dot in the same frame. */
  ocultar(): void;
};

export function crearPunto(el: HTMLElement): Punto {
  let anim: Animation | null = null;
  let desde = { x: 0, y: 0 };
  let r = 4;
  // The dot lives in the strip: its coordinates are the strip's, so a scroll mid-flight moves both together.
  const caja = () => (el.parentElement ?? el).getBoundingClientRect();
  const en = (x: number, y: number, s = 1) => `translate(${x - r}px, ${y - r}px) scale(${s})`;
  return {
    aparecer(x, y, radio) {
      anim?.cancel();
      const c = caja();
      r = radio;
      desde = { x: x - c.left, y: y - c.top };
      el.style.width = el.style.height = `${2 * r}px`;
      el.style.transform = en(desde.x, desde.y);
      el.dataset.visible = "";
    },
    volar(hacia) {
      const c = caja();
      const a = en(desde.x, desde.y);
      const b = (s: number) => en(hacia.x - c.left, hacia.y - c.top, s);
      const total = RESPUESTA.dot[1] * 1000;
      if (typeof el.animate !== "function") {
        el.style.transform = b(1);
        return new Promise((ok) => window.setTimeout(ok, total));
      }
      anim?.cancel();
      anim = el.animate(
        [
          { offset: 0, transform: a },
          { offset: RESPUESTA.dotFly[0] / RESPUESTA.dot[1], transform: a, easing: token(el, "--ease-in-out", "cubic-bezier(0.65, 0, 0.35, 1)") },
          { offset: RESPUESTA.dot[0] / RESPUESTA.dot[1], transform: b(VUELO), easing: token(el, "--ease-settle", "cubic-bezier(0.34, 1.56, 0.64, 1)") },
          { offset: 1, transform: b(1) },
        ],
        { duration: total, fill: "forwards" },
      );
      return anim.finished.then(
        () => undefined,
        () => undefined,
      );
    },
    ocultar() {
      anim?.cancel();
      anim = null;
      delete el.dataset.visible;
    },
  };
}

/**
 * Taps only: a finger that lifts within 250 ms and 8 px of where it landed,
 * away from the screen's side edges (Android's back gesture lives there).
 * Vertical swipes scroll the page (touch-action: pan-y cancels them). A click
 * with no pointer before it is Enter, Space or assistive tech: a tap at the
 * centre.
 */
export function escucharToques(el: HTMLElement, alTocar: (x: number, y: number) => void): () => void {
  let inicio: { id: number; x: number; y: number; t: number } | null = null;
  let puntero = -Infinity;
  const abajo = (e: PointerEvent) => {
    puntero = e.timeStamp;
    inicio = null;
    if (!e.isPrimary || e.button > 0) return;
    if (e.clientX < 24 || e.clientX > window.innerWidth - 24) return;
    inicio = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp };
  };
  const arriba = (e: PointerEvent) => {
    puntero = e.timeStamp;
    const i = inicio;
    inicio = null;
    if (!i || i.id !== e.pointerId) return;
    if (e.timeStamp - i.t > 250 || Math.hypot(e.clientX - i.x, e.clientY - i.y) > 8) return;
    alTocar(e.clientX, e.clientY);
  };
  const cancelar = () => {
    inicio = null;
  };
  const clic = (e: MouseEvent) => {
    if (e.timeStamp - puntero < 1000) return;
    const r = el.getBoundingClientRect();
    alTocar(r.left + r.width / 2, r.top + r.height / 2);
  };
  el.addEventListener("pointerdown", abajo);
  el.addEventListener("pointerup", arriba);
  el.addEventListener("pointercancel", cancelar);
  el.addEventListener("click", clic);
  return () => {
    el.removeEventListener("pointerdown", abajo);
    el.removeEventListener("pointerup", arriba);
    el.removeEventListener("pointercancel", cancelar);
    el.removeEventListener("click", clic);
  };
}

/**
 * Closed, a strip is a picture with nothing left to press, so it leaves the
 * tab order (inert). If it holds the focus (Enter closed it) it waits, marked
 * disabled, until the focus moves on, so nobody loses their place. Returns
 * the undo.
 */
export function apagar(el: HTMLElement): () => void {
  const ya = () => {
    el.removeAttribute("aria-disabled");
    el.inert = true;
  };
  if (document.activeElement === el) {
    el.setAttribute("aria-disabled", "true");
    el.addEventListener("blur", ya, { once: true });
  } else ya();
  return () => {
    el.removeEventListener("blur", ya);
    el.removeAttribute("aria-disabled");
    el.inert = false;
  };
}

/** The sketch, in charge of the answer. */
export type Trazo = Lazo & {
  /** Jumps to a state with no motion: reduced motion, or taking over from the scene. */
  fijar(estado: "abierto" | "cerrado"): void;
  /** Where its mark's dot sits on screen. */
  destino(): Destino | null;
};

/**
 * Plays the answer on the sketch inside `caja` (its `.manos-trazo`): the two
 * hands translate together, the arc draws, and the dot lands, from the
 * visitor's finger (`tocar`) or from the fingertip (`cerrarSolo`). CSS does
 * the moving (site/20-manos.src.css, keyed on data-lazo and data-modo);
 * this keeps the time.
 */
export function montarTrazo(caja: HTMLElement, punto: Punto | null, avisos: Avisos = {}): Trazo {
  const svg = caja.querySelector<SVGSVGElement>(".manos-trazo");
  let fase: "abierto" | "cerrando" | "cerrado" = svg?.dataset.lazo === "cerrado" ? "cerrado" : "abierto";
  const relojes: number[] = [];
  let vivo = true;
  const luego = (s: number, f: () => void) => relojes.push(window.setTimeout(f, s * 1000));

  const destino = (): Destino | null => {
    if (!svg) return null;
    // The bucket on screen (a container query picks it by the strip's width).
    for (const g of svg.querySelectorAll<SVGGElement>(".trazo-lazo")) {
      const dot = g.querySelector<SVGCircleElement>(".trazo-punto");
      const m = g.getScreenCTM();
      if (!dot || !m || !g.getClientRects().length) continue;
      const p = new DOMPoint(dot.cx.baseVal.value, dot.cy.baseVal.value).matrixTransform(m);
      return { x: p.x, y: p.y, r: dot.r.baseVal.value * Math.hypot(m.a, m.b) };
    }
    return null;
  };

  const poner = (estado: typeof fase, modo?: "toque" | "solo") => {
    fase = estado;
    if (!svg) return;
    svg.dataset.lazo = estado;
    if (modo) svg.dataset.modo = modo;
  };

  const terminar = () => {
    if (!vivo || fase !== "cerrando") return;
    poner("cerrado");
    punto?.ocultar();
    avisos.alTerminar?.();
  };

  const responder = (modo: "toque" | "solo", x?: number, y?: number) => {
    if (fase !== "abierto") return;
    const d = destino();
    if (modo === "toque" && punto && d && x !== undefined && y !== undefined) punto.aparecer(x, y, d.r);
    poner("cerrando", modo);
    avisos.alResponder?.();
    luego(RESPUESTA.dot[0], () => avisos.alCerrar?.());
    // The visitor's dot and the sketch's swap in the same frame, once it has landed.
    if (modo === "toque" && punto && d) punto.volar(d).then(terminar);
    else luego(RESPUESTA.dot[1], terminar);
  };

  return {
    tocar: (x, y) => responder("toque", x, y),
    cerrarSolo: () => responder("solo"),
    fijar(estado) {
      relojes.forEach((r) => window.clearTimeout(r));
      relojes.length = 0;
      punto?.ocultar();
      poner(estado);
    },
    destino,
    destruir() {
      vivo = false;
      relojes.forEach((r) => window.clearTimeout(r));
      punto?.ocultar();
    },
  };
}
