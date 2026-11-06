// The piece's signal as numbers, and its one beat once the loop has closed.
// Nothing here knows about three.js or WebGL, so any renderer can play it:
// each frame it writes `respuesta` or `latido` where the signal goes (on each
// hand, the band's place and strength: uWave and uWaveAmp), and it hands the
// beat's scheduling to `crearLatidos`, which only asks the scene a few
// questions and starts the beat from a timer (never from a frame: between
// beats the canvas is still and asks for none).

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** Where t is between a and b, from 0 to 1. */
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// The system's curves (tokens.json → easing): ease-in-out for things that
// travel, ease-linear for time itself (a waveform).
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lineal = (t: number) => t;
/** In over the first `entra` of a run, out over the last `sale`: a signal never pops on or off. */
const envolvente = (p: number, entra: number, sale: number) => {
  if (p <= 0 || p >= 1) return 0;
  const i = clamp01(p / entra);
  const o = clamp01((1 - p) / sale);
  return i * i * (3 - 2 * i) * o * o * (3 - 2 * o);
};

/** Where each hand's wrist is, in aS (0 at the elbow, 1 at the fingertip). */
export type Munecas = { humana: number; maquina: number };
/** The band on one hand: where it is, in aS, and how strong (1 is the answer's). */
export type Banda = { s: number; amp: number };
export type Senal = { humana: Banda; maquina: Banda };

/** A band `p` of the way through its run from `desde` to `hasta` (aS) on `curva`, with its envelope. */
export function banda(p: number, desde: number, hasta: number, curva: (t: number) => number, entra: number, sale: number): Banda {
  return { s: lerp(desde, hasta, curva(clamp01(p))), amp: envolvente(p, entra, sale) };
}

/**
 * The answer's signal, `si` and `so` of the way through its two runs
 * (RESPUESTA.signalIn and signalOut, 700 ms each): down the human hand from
 * deep in its faded forearm to past the fingertip, then up the machine's arm,
 * on ease-in-out at full strength. Before and after each run it rests at 0.
 */
export function respuesta(si: number, so: number, w: Munecas): Senal {
  return {
    humana: banda(si, w.humana - 0.3, 1.12, easeInOut, 0.12, 0.2),
    maquina: banda(so, 1.12, w.maquina - 0.3, easeInOut, 0.12, 0.2),
  };
}

/**
 * The beat: once the loop has closed, a visitor who stays with the piece sees
 * the answer's signal run the circuit once more, fainter. It runs only over
 * the hands as they show (from just before each wrist, where the forearm has
 * faded, to the fingertip), at one pace (ease-linear, a waveform) in
 * duration-story, so the eye can follow it: down the human hand, and as it
 * nears the fingertip the machine's takes it on up its own arm, so the two
 * runs read as one signal through the mark. It ends on screen: past the
 * machine's wrist on a desktop, where the strip cuts its palm on a phone. Once
 * per look: the hands then stay still until the strip comes back on screen or
 * the tab is shown again.
 */
export const LATIDO = {
  /**
   * Seconds of stillness before the beat: after the answer, or from the start
   * of a look. Long enough that it never lands while the reply line rises and
   * the WhatsApp bar is the next step; only a visitor who lingers sees it.
   */
  primero: 7,
  /**
   * The human run, then the machine's, which starts as the human band nears
   * the fingertip (s > 0.9) and keeps its pace to where it ends (`fin`). On a
   * phone that is sooner: a band running on past the strip's edge would pull
   * the eye out of the frame, then draw frames nobody sees.
   */
  baja: [0, 1.2],
  sube: { compacta: [1.05, 1.8], amplia: [1.05, 2.25] },
  /** Frames stop when both bands are back at 0. */
  dura: { compacta: 1.8, amplia: 2.25 },
  /** The human run starts this far before its wrist (aS), where the forearm has faded, and ends at the fingertip. */
  antes: 0.12,
  punta: 1,
  /** Where the machine's run ends, from its wrist (aS): on its forearm on a desktop, at the strip's edge on a phone. */
  fin: { compacta: 0.1, amplia: -0.12 },
  /** In over the first 15 % of a run, out over the last 25 %. */
  entra: 0.15,
  sale: 0.25,
  /**
   * Strength against the answer's 1. On a phone the human hand is a few dozen
   * pixels of dense fibers that a faint glow barely lifts; on a desktop the
   * same glow at the fingertip would rival the mark, which stays the brightest
   * thing. The machine's pads and traces take it the same at both sizes.
   */
  amp: { humana: { compacta: 0.62, amplia: 0.38 }, maquina: 0.45 },
  /** Beats per look. */
  tope: 1,
} as const;

/** The beat `t` seconds in: the band on each hand. Before and after it both rest at 0. */
export function latido(t: number, w: Munecas, compacta: boolean): Senal {
  const L = LATIDO;
  const k = compacta ? "compacta" : "amplia";
  const h = banda(seg(t, L.baja[0], L.baja[1]), w.humana - L.antes, L.punta, lineal, L.entra, L.sale);
  const m = banda(seg(t, L.sube[k][0], L.sube[k][1]), L.punta, w.maquina + L.fin[k], lineal, L.entra, L.sale);
  return {
    humana: { s: h.s, amp: h.amp * L.amp.humana[k] },
    maquina: { s: m.s, amp: m.amp * L.amp.maquina },
  };
}

/** How long the beat lasts, in seconds, on a phone's layout or a desktop's. */
export const duracion = (compacta: boolean) => LATIDO.dura[compacta ? "compacta" : "amplia"];

/** What the beat asks of the scene that plays it. The timers default to the window's. */
export type Escenario = {
  /**
   * Whether a beat may play now: the loop closed, the strip at least 60 % on
   * screen, the tab visible, motion welcome, the context alive.
   */
  puede(): boolean;
  /** A sheet ([aria-modal="true"]) over the hero: the beat waits under it. */
  tapado(): boolean;
  /** Whether the strip is laid out as on a phone (the scene's framing): the beat is shorter there. */
  compacta(): boolean;
  /** A beat starts: ask for its frames (each one then calls `avanzar`). */
  empezar(): void;
  poner?: (f: () => void, ms: number) => number;
  quitar?: (id: number) => void;
};

export type Latidos = {
  /** A new look (the strip came back on screen, the tab was shown): its beat comes after a still. */
  mirar(): void;
  /**
   * Arms this look's beat, unless one is pending or playing, the look has had
   * it, or it may not play now: after the answer, or a still frame set from
   * outside.
   */
  armar(): void;
  /**
   * The look is over (off screen, tab hidden, context lost, gone): no timer,
   * and a beat playing stops. True when one did: the hands must be drawn at
   * rest.
   */
  callar(): boolean;
  /** A sheet opened over a beat: it stops, and the look's beat comes after another still. True when one did. */
  cortar(): boolean;
  /** One frame of the beat, `dt` seconds on: past its end it is over (and counted). */
  avanzar(dt: number): void;
  /** The beat's clock in seconds, or null when none plays. */
  tiempo(): number | null;
  /** Development: holds the beat at `t` seconds (null: none), with no timer. */
  posar(t: number | null): void;
};

/** The beat's schedule: one timer at a time and no frames between beats. */
export function crearLatidos(e: Escenario): Latidos {
  const poner = e.poner ?? ((f: () => void, ms: number) => window.setTimeout(f, ms));
  const quitar = e.quitar ?? ((id: number) => window.clearTimeout(id));
  let t: number | null = null;
  let dados = 0;
  let reloj = 0;
  const parar = () => {
    if (reloj) quitar(reloj);
    reloj = 0;
  };
  const armar = () => {
    if (reloj || t !== null || dados >= LATIDO.tope || !e.puede()) return;
    reloj = poner(() => {
      reloj = 0;
      if (t !== null || !e.puede()) return;
      // Under a sheet the beat waits, without a frame, for another still.
      if (e.tapado()) return armar();
      t = 0;
      e.empezar();
    }, LATIDO.primero * 1000);
  };
  const callar = () => {
    parar();
    const habia = t !== null;
    t = null;
    return habia;
  };
  return {
    mirar() {
      dados = 0;
      armar();
    },
    armar,
    callar,
    cortar() {
      if (t === null) return false;
      callar();
      armar();
      return true;
    },
    avanzar(dt) {
      if (t === null) return;
      t += dt;
      if (t < duracion(e.compacta())) return;
      t = null;
      dados++;
      armar();
    },
    tiempo: () => t,
    posar(p) {
      parar();
      t = p;
    },
  };
}
