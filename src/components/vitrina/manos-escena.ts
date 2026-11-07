import { AIM, FOV, GIRO_HUMANA, GIRO_MAQUINA, LAZO, encuadre, type Encuadre } from "./manos-encuadre";
import type { Lines, Manos } from "./manos-geometria";
import { componer, crearMotor, cuaternion, identidad, mirada, multiplicar, perspectiva, type Uniformes } from "./manos-gl";
import { RESPUESTA, type Avisos, type Destino, type Lazo, type Punto } from "./manos-trazo";
import { crearLatidos, latido, respuesta, type Munecas } from "./manos-vida";

// The hero's piece, «Te toca», in two parts with a still wait between them.
// The entrance: a human hand of fibers and a machine hand of circuit traces
// draw themselves in from the elbows and travel toward each other, stopping
// apart. Then nothing moves until the visitor taps (or 2.4 s pass): a signal
// runs down the human hand to the fingertip while the hands close the gap;
// allok's mark closes in it (the arc draws, the dot lands); the signal runs on
// up the machine's arm; and everything holds still. A visitor who stays with
// the closed piece sees it once more: after a long still, a faint beat of the
// same signal runs the circuit, once per look (manos-vida.ts). The scene only
// asks for frames while something changes: none while it waits, none in the
// stills around the beat. It draws with manos-gl.ts, a small WebGL2 renderer
// that does what three.js did for it, to the pixel.

// The system's curves (tokens.json → easing).
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const settle = (t: number) => {
  const c1 = 1.56;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** Where t is between a and b, from 0 to 1. */
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// The entrance, in seconds: the hands draw on ease-out (1.5 s, the scripted
// exception), travel in from 1.4 times the waiting gap on ease-in-out (1.2 s,
// duration-story) while the camera dollies in 6 %. The answer's timeline is
// RESPUESTA (manos-trazo.ts), shared with the sketch.
const ENTRADA = {
  human: [0, 1.5],
  machine: [0.12, 1.62],
  travel: [0.35, 1.55],
  dolly: [0, 1.7],
  end: 1.7,
} as const;

// How long the debut waits for the browser to say the programs are ready.
// Past that it asks how each link went, which waits for the link and is always
// right: a driver that never says so costs one wait, never a 100 Hz timer for
// the rest of the visit.
const LISTOS_MS = 2000;

// The shaders are GLSL ES 3.00. Each draw gets three.js's two matrices under
// its names (projectionMatrix, modelViewMatrix), and a piece's uniforms are the
// keys of its `u` in armar: a new uniform is a line here and a key there.

// Each line shows once the drawing passes its place on the hand (aS: 0 at
// the elbow, 1 at the fingertip). The signal is a band that runs along every
// line, each a little out of step with the next.
const LINE_VERT = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uDraw;
  uniform float uWave;
  uniform float uWaveAmp;
  uniform float uWrist;
  in vec3 position;
  in float aS;
  in float aRnd;
  in float aKind;
  out float vAlpha;
  out float vGlow;
  out float vDepth;
  out float vKind;
  out float vS;
  void main() {
    float head = uDraw * 1.3 - aRnd * 0.25;
    vAlpha = 1.0 - smoothstep(head - 0.05, head, aS);
    vKind = aKind;
    vS = aS;
    float front = uWave + (aRnd - 0.5) * 0.1;
    vGlow = (1.0 - smoothstep(0.0, 0.07, abs(aS - front))) * uWaveAmp * (0.35 + 0.65 * fract(aRnd * 13.7));
    // Lines farther back are fainter, and the forearm fades out toward the edge.
    vDepth = (0.25 + 0.75 * smoothstep(-0.16, 0.08, position.z)) * (0.1 + 0.9 * smoothstep(uWrist - 0.16, uWrist + 0.05, aS));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// vKind is 1 on the chips: they glint in the signal's color.
const LINE_FRAG = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uOpacity;
  uniform float uLift;
  uniform float uTip;
  in float vAlpha;
  in float vGlow;
  in float vDepth;
  in float vKind;
  in float vS;
  out vec4 fragColor;
  void main() {
    float kind = vKind;
    // Fibers bunch up at the fingertips; soften them there so the mark stays the brightest thing.
    float a = max(vAlpha * uOpacity * vDepth * (1.0 - uTip * smoothstep(0.88, 1.0, vS)), kind * vAlpha * 0.7);
    vec3 c = mix(uColor, uGlow, max(vGlow, kind * 0.8));
    fragColor = vec4(c, clamp(a + vGlow * vAlpha * vDepth * uLift, 0.0, 1.0));
  }
`;

const PAD_VERT = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uDraw;
  uniform float uSize;
  uniform float uWave;
  uniform float uWaveAmp;
  in vec3 position;
  in float aS;
  in float aRnd;
  out float vAlpha;
  out float vGlow;
  void main() {
    float head = uDraw * 1.3 - aRnd * 0.25;
    vAlpha = 1.0 - smoothstep(head - 0.05, head, aS);
    float front = uWave + (aRnd - 0.5) * 0.1;
    vGlow = (1.0 - smoothstep(0.0, 0.07, abs(aS - front))) * uWaveAmp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize;
  }
`;

const PAD_FRAG = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uOpacity;
  in float vAlpha;
  in float vGlow;
  out vec4 fragColor;
  void main() {
    fragColor = vec4(mix(uColor, uGlow, vGlow), vAlpha * uOpacity);
  }
`;

// allok's mark, as Brand draws it, on a quad that faces the camera: on an
// 80 grid, a circle of radius 24 and stroke 12, round caps, open from 5° to
// 85° in the lower right, and a dot of radius 6 at 45°. The quad spans 64
// units, so the ring sits at 0.75 and the stroke and dot at 0.1875. The arc
// draws the way the master's path runs, from 5° around the top to 85°; the
// dot then lands. Never rotated, mirrored or tinted.
const MARK_VERT = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  in vec3 position;
  in vec2 uv;
  out vec2 vP;
  void main() {
    vP = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MARK_FRAG = /* glsl */ `#version 300 es
  precision highp float;
  precision highp int;
  uniform vec3 uColor;
  uniform float uArc;
  uniform float uArcA;
  uniform float uDot;
  in vec2 vP;
  out vec4 fragColor;
  const float R = 0.75;
  const float W = 0.1875;
  const float A0 = -0.08726646;
  const float SWEEP = 4.88692191;
  void main() {
    vec2 p = vP;
    float aa = fwidth(length(p)) * 0.85;
    float sweep = SWEEP * uArc;
    float phi = mod(atan(p.y, p.x) - A0, 6.28318531);
    vec2 p0 = R * vec2(cos(A0), sin(A0));
    vec2 p1 = R * vec2(cos(A0 + sweep), sin(A0 + sweep));
    float dArc = phi <= sweep ? abs(length(p) - R) - W : min(length(p - p0), length(p - p1)) - W;
    float arc = (1.0 - smoothstep(-aa, aa, dArc)) * uArcA;
    float dDot = length(p - R * vec2(0.70710678, -0.70710678)) - W * uDot;
    float landed = uDot > 0.0 ? 1.0 - smoothstep(-aa, aa, dDot) : 0.0;
    float a = max(arc, landed);
    if (a <= 0.0) discard;
    fragColor = vec4(uColor, a);
  }
`;

// The mark's quad: three's PlaneGeometry(1, 1), its corners, uvs and two triangles in its order.
const QUAD = {
  position: new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]),
  uv: new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
  indices: new Uint16Array([0, 2, 1, 2, 3, 1]),
};

/**
 * A color's sRGB channels, from 0 to 1, or null for what isn't a color. The
 * theme's tokens are hex, read here exactly as three's Color read them. Any
 * other color the browser knows (rgb(), a name, oklch()…) is painted on one
 * pixel and read back in sRGB, its alpha left out as three left it out.
 */
function canales(valor: string): number[] | null {
  const hex = /^#([\da-f]{6}|[\da-f]{3})$/i.exec(valor)?.[1];
  if (hex) return hex.length === 3 ? [...hex].map((c) => parseInt(c, 16) / 15) : [16, 8, 0].map((k) => ((parseInt(hex, 16) >> k) & 255) / 255);
  if (!CSS.supports("color", valor)) return null;
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 1;
  const c = lienzo.getContext("2d", { willReadFrequently: true });
  if (!c) return null;
  c.fillStyle = valor;
  c.fillRect(0, 0, 1, 1);
  return [...c.getImageData(0, 0, 1, 1).data.subarray(0, 3)].map((b) => b / 255);
}

/**
 * A theme color as three's Color left it for the shaders: read as sRGB, made
 * linear, then back (convertLinearToSRGB), so the very same floats. A value
 * that isn't a color takes the fallback, and says so while developing.
 */
function tono(valor: string, respaldo: string): [number, number, number] {
  let rgb = canales(valor);
  if (!rgb) {
    if (process.env.NODE_ENV !== "production") console.warn(`manos-escena: «${valor}» no es un color; va ${respaldo}`);
    rgb = canales(respaldo)!;
  }
  const [r, g, b] = rgb.map((c) => {
    const lineal = c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
    return lineal < 0.0031308 ? lineal * 12.92 : 1.055 * Math.pow(lineal, 0.41666) - 0.055;
  });
  return [r!, g!, b!];
}

/** The canvas and WebGL2 context Manos.tsx asked for before loading this module. */
export type Contexto = { canvas: HTMLCanvasElement; gl: WebGL2RenderingContext };

export type Estado = "entrando" | "espera" | "respondiendo" | "cerrado";

/** What the scene tells the strip, besides the answer's moments. */
export type AvisosEscena = Avisos & {
  /** The first frame of the entrance is on screen. */
  alEntrar?: () => void;
  /**
   * The drawing has reached the hands (70 %; on a phone the first half is
   * forearm, faded and masked, so half would leave a blank): the sketch under
   * it can leave.
   */
  alTrazar?: () => void;
  /** The entrance is over: the hands wait, still. */
  alEsperar?: () => void;
  /** The context was lost (the canvas is blank until it comes back), or came back. */
  alPerder?: () => void;
  alRecuperar?: () => void;
  /** The hands could not be built, or their programs would not link. */
  alFallar?: () => void;
};

export type Escena = Lazo & {
  /** Jumps to a state with no motion and draws it once: taking over from the sketch, or a context come back. */
  fijar(estado: "espera" | "cerrado"): void;
  estado(): Estado;
};

/**
 * Mounts the scene in `el` once the hands are built (`manos`, from a worker)
 * and returns its controls, or null when the renderer can't start on the
 * context it was given (which is then freed). `cerrado` mounts it straight
 * in its closed frame (reduced motion, or a tap the sketch already answered),
 * drawn once with no animation frames. The visitor's dot (`punto`) is an HTML
 * overlay the scene flies to its mark and hides in the frame the mark's own
 * dot appears.
 */
export function montar(
  el: HTMLElement,
  manos: Promise<Manos>,
  { canvas, gl }: Contexto,
  { cerrado = false, punto = null, avisos = {} }: { cerrado?: boolean; punto?: Punto | null; avisos?: AvisosEscena } = {},
): Escena | null {
  // The programs start compiling here, on the GPU's side, while the worker is still building the hands.
  const creado = crearMotor(canvas, gl, { linea: [LINE_VERT, LINE_FRAG], pad: [PAD_VERT, PAD_FRAG], marca: [MARK_VERT, MARK_FRAG] });
  if (!creado) {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  const motor = creado;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  // The state lives out here, so the strip can steer the scene before the hands arrive.
  let estado: Estado = cerrado ? "cerrado" : "entrando";
  let t = 0;
  let modo: "toque" | "solo" = "solo";
  let pendiente: "toque" | "solo" | null = null;
  let avisoCierre = cerrado;
  let posado = true;
  let destruido = false;
  let perdido = false;
  let escena: ReturnType<typeof armar> | null = null;

  // Each step of the mount is its own task (the scene, then each part of its
  // debut), so none of them holds the page up for long.
  manos.then(
    (m) =>
      window.setTimeout(() => {
        if (!destruido) escena = armar(m);
      }, 0),
    () => {
      if (!destruido) avisos.alFallar?.();
    },
  );

  // A pending answer starts the moment the entrance ends: a tap during it never waits twice.
  const empezar = (m: "toque" | "solo") => {
    pendiente = null;
    modo = m;
    estado = "respondiendo";
    t = 0;
    avisoCierre = false;
    posado = m !== "toque";
    avisos.alResponder?.();
    const d = escena?.destino();
    if (m === "toque" && punto && d) void punto.volar(d);
    escena?.play();
  };

  const responder = (m: "toque" | "solo", x?: number, y?: number) => {
    if (estado === "respondiendo" || estado === "cerrado" || pendiente) return;
    const d = escena?.destino();
    if (m === "toque" && punto && d && x !== undefined && y !== undefined) punto.aparecer(x, y, d.r);
    if (estado === "entrando") {
      pendiente = m;
      avisos.alResponder?.();
    } else empezar(m);
  };

  function armar(manos: Manos) {
    // Reduced motion: the closed frame, drawn once (the strip asks for it too).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && estado !== "cerrado") {
      estado = "cerrado";
      pendiente = null;
      avisoCierre = true;
    }

    // Colors come from the theme the hero sits on, so Ink and Cloud both work.
    const css = getComputedStyle(el);
    const tone = (name: string, fallback: string) => tono(css.getPropertyValue(name).trim() || fallback, fallback);
    const text = tone("--text", "#0b0d0e");
    const blue = tone("--blue", "#315cff");
    const ground = tone("--ground", "#f7f8f8");
    const dark = ground[0] * 0.2126 + ground[1] * 0.7152 + ground[2] * 0.0722 < 0.4;

    // Lines and points, transparent and never writing depth; on a dark ground they add up.
    const lineas = <U extends Uniformes>(l: Lines, programa: "linea" | "pad", u: U) =>
      motor.pieza({
        programa,
        modo: programa === "linea" ? "lineas" : "puntos",
        atributos: { position: [l.pos, 3], aS: [l.s, 1], aRnd: [l.rnd, 1], aKind: [l.kind, 1] },
        u,
        suma: dark,
        profundidad: true,
        orden: 0,
        // Worked out in the worker (manos-geometria.ts): the first frame doesn't walk every vertex to sort.
        centro: l.centro,
      });
    const lineMaterial = (l: Lines, color: readonly number[], lift: number, tip: number) => ({
      uDraw: 0,
      uWave: -1,
      uWaveAmp: 0,
      uWrist: l.wrist,
      uColor: color,
      uGlow: text,
      uOpacity: 0,
      uLift: lift,
      uTip: tip,
    });

    // Left: the human hand, of fibers. Right: the machine, of traces (mirrored).
    // The signal lights both in the text color, never blue (Motion, Never).
    const fibers = lineas(manos.human, "linea", lineMaterial(manos.human, text, 0.5, 0.45));
    const traces = lineas(manos.machine, "linea", lineMaterial(manos.machine, blue, 0.35, 0));
    const pads = lineas(manos.pads, "pad", { uDraw: 0, uSize: 2, uWave: -1, uWaveAmp: 0, uColor: blue, uGlow: text, uOpacity: 0.9 });

    // The mark, in the text color: Cloud on Ink, Ink on Cloud (Brand, Colors).
    // Drawn last and over everything (renderOrder 10, no depth test), always blended as normal.
    const mark = motor.pieza({
      programa: "marca",
      modo: "triangulos",
      atributos: { position: [QUAD.position, 3], uv: [QUAD.uv, 2] },
      indices: QUAD.indices,
      u: { uColor: text, uArc: 0, uArcA: 0, uDot: 0 },
      suma: false,
      profundidad: false,
      orden: 10,
      centro: [0, 0, 0],
    });
    const piezas = [fibers, traces, pads, mark];

    // Where everything sits: the pair turns about the camera's axis on a phone
    // (encuadre's giro) and the mark stays upright. Each hand's turn is fixed;
    // its place changes every frame.
    const giroHumana = cuaternion(...GIRO_HUMANA);
    const giroMaquina = cuaternion(...GIRO_MAQUINA);
    const quieta = cuaternion(0, 0, 0);
    const pareja = identidad();
    const local = identidad();
    const proyeccion = identidad();
    const vista = identidad();

    // Layout, from the strip's size (encuadre, shared with the sketch): the
    // fingertips sit a little apart in height, like two people reaching, and
    // the mark fits between them with a little more than its clear space.
    let width = 0;
    let height = 0;
    let dpr = 1;
    let enc: Encuadre = encuadre(1, 1);
    const layout = () => {
      enc = encuadre(width, height);
      componer(mark.mundo, quieta, 0, 0, 0, enc.mark);
      componer(pareja, cuaternion(0, 0, enc.giro), 0, 0, 0);
      // A phone draws at 1.5x at most: the lines stay crisp and the fill stays cheap.
      dpr = Math.min(window.devicePixelRatio || 1, enc.compact ? 1.5 : 2);
      const boost = dpr >= 1.5 ? 1.35 : 1;
      // On a phone the human hand is a few dozen pixels wide: brighter and
      // less softened at the tips, it reads as a hand and not a brush.
      fibers.u.uOpacity = Math.min(1, (dark && !enc.compact ? 0.14 : 0.22) * boost);
      fibers.u.uTip = enc.compact ? 0.3 : 0.45;
      traces.u.uOpacity = Math.min(1, (dark ? 0.5 : 0.55) * boost);
      pads.u.uSize = (enc.compact ? 1.8 : 2.6) * dpr;
    };

    // Where the signal starts and ends on each hand (manos-vida.ts).
    const munecas: Munecas = { humana: manos.human.wrist, maquina: manos.machine.wrist };

    // The canvas is on the page (the debut is over), and everything is on the GPU.
    let enPagina = false;
    let subido = false;
    let trazado = false;
    const frame = () => {
      // The entrance's clock, and the answer's: each holds at its end once past it.
      const te = estado === "entrando" ? t : ENTRADA.end;
      const ta = estado === "respondiendo" ? t : estado === "cerrado" ? RESPUESTA.end : 0;
      const R = RESPUESTA;

      const hd = easeOut(seg(te, ENTRADA.human[0], ENTRADA.human[1]));
      const md = easeOut(seg(te, ENTRADA.machine[0], ENTRADA.machine[1]));
      fibers.u.uDraw = hd;
      traces.u.uDraw = md;
      pads.u.uDraw = md;

      // The signal: down the human hand to the fingertip, then, once the mark
      // has closed, on up the machine's arm. Once closed it rests at 0, unless
      // the beat runs it once more, fainter (manos-vida.ts).
      const tl = estado === "cerrado" ? latidos.tiempo() : null;
      const v = tl === null ? respuesta(seg(ta, R.signalIn[0], R.signalIn[1]), seg(ta, R.signalOut[0], R.signalOut[1]), munecas) : latido(tl, munecas, enc.compact);
      fibers.u.uWave = v.humana.s;
      fibers.u.uWaveAmp = v.humana.amp;
      for (const p of [traces, pads]) {
        p.u.uWave = v.maquina.s;
        p.u.uWaveAmp = v.maquina.amp;
      }

      // The gap: in from 1.4 times the waiting gap to it, then (the answer) to shut.
      const g =
        estado === "entrando" || estado === "espera"
          ? lerp(enc.espera * 1.4, enc.espera, easeInOut(seg(te, ENTRADA.travel[0], ENTRADA.travel[1])))
          : lerp(enc.espera, enc.shut, easeInOut(seg(ta, R.travel[0], R.travel[1])));
      multiplicar(pareja, componer(local, giroHumana, -g / 2, enc.lift, 0), fibers.mundo);
      multiplicar(pareja, componer(local, giroMaquina, g / 2, -enc.lift, 0), traces.mundo);
      pads.mundo.set(traces.mundo);

      mark.u.uArc = easeInOut(seg(ta, R.arc[0], R.arc[1]));
      mark.u.uArcA = seg(ta, R.arc[0], R.arc[0] + 0.1);
      // From the fingertip the dot lands with the settle; from the visitor's
      // finger the overlay did the landing, and the mark takes it over whole.
      const d = seg(ta, R.dot[0], R.dot[1]);
      mark.u.uDot = modo === "toque" && estado === "respondiendo" ? (ta >= R.dot[1] ? 1 : 0) : d > 0 ? settle(d) : 0;

      // A small dolly-in while the hands arrive, as captures grow from 96 %.
      mirada(vista, AIM, enc.z * (1 + 0.06 * (1 - easeOut(seg(te, ENTRADA.dolly[0], ENTRADA.dolly[1])))));
      motor.dibujar(piezas, proyeccion, vista);
      // Only a frame on the page counts: one drawn before the canvas goes in shows nobody anything.
      if (!trazado && hd > 0.7 && enPagina) {
        trazado = true;
        avisos.alTrazar?.();
      }
    };

    const draw = () => {
      if (width && height && !perdido && subido) frame();
    };

    /** Where the mark's dot sits on screen: on the plane of the fingertips, which faces the camera. */
    const destino = (): Destino | null => {
      if (!width || !height) return null;
      const r = el.getBoundingClientRect();
      const k = LAZO.anillo * enc.size * Math.SQRT1_2;
      return { x: r.left + width / 2 + k * enc.px, y: r.top + height / 2 + (k + AIM) * enc.px, r: LAZO.punto * enc.size * enc.px };
    };

    let medida = "";
    const resize = (dibujar = true) => {
      // The observer's first report repeats the size the canvas already has: nothing to do.
      const m = `${el.clientWidth}x${el.clientHeight}@${window.devicePixelRatio}`;
      if (m === medida) return;
      medida = m;
      width = el.clientWidth;
      height = el.clientHeight;
      if (!width || !height) return;
      layout();
      motor.medir(width, height, dpr);
      perspectiva(proyeccion, FOV, width / height, 0.1, 50);
      // Resizing the canvas clears it: draw the current frame again at once.
      if (dibujar) draw();
    };

    const ro = new ResizeObserver(() => resize());
    // Moving to a screen with another pixel density doesn't resize anything.
    let density: MediaQueryList | null = null;
    const vigilarDensidad = () => {
      density?.removeEventListener("change", onDensity);
      density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      density.addEventListener("change", onDensity);
    };
    const onDensity = () => {
      vigilarDensidad();
      resize();
    };

    // Frames only while something moves, only while the strip is on screen
    // and the tab is open. A project's sheet (Ficha) covers the hero without
    // moving it off screen: the moves wait under it, looking every 300 ms; a
    // beat settles at once, and the look's beat waits for the sheet to go and
    // then for a whole still.
    let visible = false;
    // The beat asks for more than a sliver: the strip at least 60 % on screen, as the self-close does (Manos.tsx).
    let presente = false;
    let raf = 0;
    let last = 0;
    let wait = 0;
    let held = false;
    let entro = estado !== "entrando";
    const bajoFicha = () => !!document.querySelector('[aria-modal="true"]');
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");

    // The beat (manos-vida.ts) comes from a timer after a real still, so no
    // frames at all meanwhile, and only once closed, with the strip on screen,
    // the tab open and motion welcome (reduced motion keeps the closed frame,
    // still). A look (the strip on screen with the tab shown) has one beat;
    // coming back on screen or to the tab starts another look.
    const latidos = crearLatidos({
      puede: () => estado === "cerrado" && presente && !document.hidden && !held && !perdido && !destruido && !quieto.matches,
      tapado: bajoFicha,
      compacta: () => enc.compact,
      empezar: () => play(),
    });
    const mueve = () => estado === "entrando" || estado === "respondiendo" || latidos.tiempo() !== null;
    /** The look is over: a beat playing stops here, and the hands are drawn at rest at once. */
    const callar = () => {
      if (latidos.callar()) draw();
    };

    // What happens as the clocks pass their marks. A pending answer starts
    // the moment the entrance ends, so the hands never stop between the two.
    const avanzar = () => {
      if (estado === "entrando" && t >= ENTRADA.end) {
        if (pendiente) empezar(pendiente);
        else {
          estado = "espera";
          t = 0;
          avisos.alEsperar?.();
        }
      }
      if (estado === "respondiendo") {
        if (!avisoCierre && t >= RESPUESTA.dot[0]) {
          avisoCierre = true;
          avisos.alCerrar?.();
        }
        // The mark's dot appears in this frame (uDot 1): the overlay leaves in the same one.
        if (!posado && t >= RESPUESTA.dot[1]) {
          posado = true;
          punto?.ocultar();
        }
        if (t >= RESPUESTA.end) {
          estado = "cerrado";
          avisos.alTerminar?.();
        }
      }
    };

    // At most 50 ms a frame: a stall holds where it was instead of jumping,
    // and the time it held back is made up over the next frames (one frame's
    // worth each at most), so the piece keeps its schedule. A device that
    // never draws faster than that gets a frame and a half of its own pace
    // (150 ms at most). Each part of the piece starts with nothing owed.
    const pasos: number[] = [];
    let deuda = 0;
    let deudaDe: Estado | null = null;
    const paso = (dt: number) => {
      pasos.push(dt);
      if (pasos.length > 8) pasos.shift();
      const orden = [...pasos].sort((a, b) => a - b);
      const ritmo = pasos.length < 3 ? 0 : orden[orden.length >> 1]!;
      const vivo = Math.min(dt, Math.min(0.15, Math.max(0.05, 1.5 * ritmo)));
      if (deudaDe !== estado) {
        deudaDe = estado;
        deuda = 0;
      }
      deuda += dt - vivo;
      const pago = Math.min(deuda, vivo);
      deuda -= pago;
      return vivo + pago;
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden || perdido || held) return;
      if (bajoFicha()) {
        // A beat settles in this one frame and waits for another still; the moves wait under the sheet.
        if (latidos.cortar()) return draw();
        window.clearTimeout(wait);
        wait = window.setTimeout(play, 300);
        return;
      }
      // A beat starts with nothing owed, like each part of the piece.
      if (latidos.tiempo() === 0) deuda = 0;
      const dt = paso(Math.max(0, now - last) / 1000);
      t += dt;
      latidos.avanzar(dt);
      last = now;
      avanzar();
      draw();
      if (!entro) {
        entro = true;
        avisos.alEntrar?.();
      }
      // A pending answer that started in this frame has already asked for the next one.
      if (mueve()) {
        if (!raf) raf = requestAnimationFrame(loop);
      } else latidos.armar();
    };
    // The clock runs from the moment it is asked to, not from the frame that follows.
    function play() {
      if (held || raf || !mueve() || !visible || document.hidden || perdido || destruido || !enPagina) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }
    const pause = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Development only: hold any moment, to look at it frame by frame and to
    // render the stills and the link preview. 0 to 1.7 is the entrance, then
    // the answer as it plays on its own (to 3.8); «espera» and «cerrado» are
    // the two still frames. Once closed, a second number poses the beat at
    // that second of it (0 to LATIDO.dura: 1.8 on a phone, 2.25 on a desktop).
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __manos?: (cuando: number | "espera" | "cerrado", pose?: number) => void }).__manos = (cuando, pose) => {
        held = true;
        pause();
        latidos.callar();
        pendiente = null;
        modo = "solo";
        if (cuando === "espera" || cuando === "cerrado") {
          estado = cuando;
          t = 0;
        } else if (cuando < ENTRADA.end) {
          estado = "entrando";
          t = Math.max(0, cuando);
        } else if (cuando < ENTRADA.end + RESPUESTA.end) {
          estado = "respondiendo";
          t = cuando - ENTRADA.end;
        } else {
          estado = "cerrado";
          t = 0;
        }
        if (estado === "cerrado" && pose !== undefined) latidos.posar(pose);
        draw();
      };
    }

    // Each report says where the strip is now; several can queue up, and the newest is last.
    const io = new IntersectionObserver(
      (es) => {
        const e = es[es.length - 1];
        const antes = presente;
        visible = !!e?.isIntersecting;
        presente = visible && (e?.intersectionRatio ?? 0) >= 0.6;
        // Below 60 % on screen the look is over; back above it, a new one begins.
        if (!presente) callar();
        else if (!antes) latidos.mirar();
        play();
      },
      { threshold: [0, 0.6] },
    );
    const alVer = () => {
      if (document.hidden) {
        // Nothing plays in a hidden tab, and no frame waits for its return: it would bring the hidden time back with it, and race to make it up.
        pause();
        callar();
      } else if (presente) latidos.mirar();
      play();
    };
    // Reduced motion turned on mid-look stops a beat at once; turned off, the look gets its beat.
    const alQuieto = () => (quieto.matches ? callar() : latidos.armar());
    // A sheet seen as it opens and as the last one goes (manos-vida.ts decides
    // what follows): opening, a beat settles at once (the frame loop would in
    // its next frame) and no timer waits under it; going, a move that waited
    // under it goes on at once (the frame loop's 300 ms look stays as a net),
    // and the look's beat, if still owed, comes a whole still later.
    let tapada = false;
    const hojas = new MutationObserver(() => {
      if (bajoFicha() === tapada) return;
      tapada = !tapada;
      if (tapada) {
        if (latidos.cortar()) draw();
        return;
      }
      latidos.destapar();
      window.clearTimeout(wait);
      play();
    });

    // The debut goes one step per task, so none of them holds a 4x slower
    // phone up: the programs, compiling since the module arrived, are waited
    // for where the browser can say when they are ready
    // (KHR_parallel_shader_compile; elsewhere checking them waits for them),
    // for LISTOS_MS at most, then checked one by one; each hand's lines go up
    // to the GPU in a task of their own; the canvas takes the strip's size and
    // the whole frame is drawn once off the page; and the canvas goes in. A
    // lost context stops it, and the context come back runs the GPU's part
    // again. A newer run (`vuelta`) makes an older one stop.
    let vuelta = 0;
    const enTareas = (lista: (() => "otra" | "fin" | void)[], luego: () => void) => {
      const esta = ++vuelta;
      const siguiente = (i: number, ms = 0) =>
        window.setTimeout(() => {
          if (destruido || perdido || esta !== vuelta) return;
          if (i === lista.length) return luego();
          const r = lista[i]!();
          if (r === "fin") return;
          if (r === "otra") siguiente(i, 10);
          else siguiente(i + 1);
        }, ms);
      siguiente(0);
    };
    const enlazar = (programa: "linea" | "pad" | "marca") => () => {
      const ok = motor.enlazado(programa);
      if (ok === null) return "fin";
      if (ok) return;
      // A program that won't link leaves the strip to its sketch, as a renderer that can't start does.
      avisos.alFallar?.();
      return "fin";
    };
    const preparar = (luego: () => void) => {
      subido = false;
      const tope = performance.now() + LISTOS_MS;
      enTareas(
        [
          () => (motor.listos() || performance.now() > tope ? undefined : "otra"),
          enlazar("linea"),
          enlazar("pad"),
          enlazar("marca"),
          () => motor.subir(fibers),
          () => {
            for (const p of [traces, pads, mark]) motor.subir(p);
            subido = true;
          },
        ],
        luego,
      );
    };

    let estrenado = false;
    const estrenar = () => {
      if (destruido || estrenado) return;
      estrenado = true;
      vigilarDensidad();
      resize(false);
      // The strip asked for the scene because it was on screen: the first frame needn't wait for the observer.
      const r = el.getBoundingClientRect();
      visible = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
      draw();
      window.setTimeout(() => {
        if (destruido) return;
        enPagina = true;
        el.appendChild(canvas);
        ro.observe(el);
        io.observe(el);
        document.addEventListener("visibilitychange", alVer);
        quieto.addEventListener("change", alQuieto);
        tapada = bajoFicha();
        hojas.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-modal"] });
        // A still scene (mounted closed) draws its frame again, now on the page; a moving one draws in the next frame.
        // The observer's first report starts the look (and, once closed, the wait for its beat).
        if (!mueve()) draw();
        play();
      }, 0);
    };
    preparar(estrenar);

    return {
      destino,
      draw,
      play,
      pause,
      /** The context came back: everything goes up to the GPU again, then the frame is drawn as it was. */
      recuperar() {
        preparar(() => {
          if (!estrenado) {
            avisos.alRecuperar?.();
            return estrenar();
          }
          draw();
          avisos.alRecuperar?.();
          play();
        });
      },
      /** The context is gone: no frames, and a beat playing stops (asentar arms the look's beat again once it is back). */
      perder() {
        pause();
        latidos.callar();
      },
      /** A jump to a still state, drawn once: a beat playing stops, and the look's beat, if it is still owed, comes after its still. */
      asentar() {
        latidos.callar();
        draw();
        latidos.armar();
      },
      dispose() {
        pause();
        latidos.callar();
        window.clearTimeout(wait);
        io.disconnect();
        ro.disconnect();
        hojas.disconnect();
        density?.removeEventListener("change", onDensity);
        document.removeEventListener("visibilitychange", alVer);
        quieto.removeEventListener("change", alQuieto);
      },
    };
  }

  // A lost context draws nothing until it is restored: the strip shows its
  // sketch meanwhile. Everything the GPU held went with it, so on its return
  // the programs compile again and the scene puts its lines back.
  const lost = (e: Event) => {
    // Without this the browser never gives the context back.
    e.preventDefault();
    if (destruido) return;
    perdido = true;
    motor.olvidar();
    escena?.perder();
    avisos.alPerder?.();
  };
  const restored = () => {
    if (destruido) return;
    perdido = false;
    if (!motor.compilar()) return;
    if (escena) escena.recuperar();
    else avisos.alRecuperar?.();
  };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);

  return {
    tocar: (x, y) => responder("toque", x, y),
    cerrarSolo: () => responder("solo"),
    fijar(e) {
      escena?.pause();
      pendiente = null;
      estado = e;
      t = 0;
      modo = "solo";
      avisoCierre = e === "cerrado";
      posado = true;
      escena?.asentar();
    },
    estado: () => estado,
    destruir() {
      destruido = true;
      escena?.dispose();
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      motor.borrar();
      canvas.remove();
    },
  };
}
