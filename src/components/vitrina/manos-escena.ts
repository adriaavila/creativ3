import { WebGLRenderer } from "three/src/renderers/WebGLRenderer.js";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineSegments,
  Mesh,
  NormalBlending,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Sphere,
  Vector3,
} from "./manos-tres-nucleo";
import { AIM, FOV, GIRO_HUMANA, GIRO_MAQUINA, LAZO, TINTA_MAQUINA, encuadre, type Encuadre, type Lines, type Manos } from "./manos-geometria";
import { RESPUESTA, type Avisos, type Destino, type Lazo, type Punto } from "./manos-trazo";

// The hero's piece, «Te toca», in two parts with a still wait between them.
// The entrance: a human hand of fibers and a machine hand of circuit traces
// draw themselves in from the elbows and travel toward each other, stopping
// apart. Then nothing moves until the visitor taps (or 2.4 s pass): a signal
// runs down the human hand to the fingertip while the hands close the gap;
// allok's mark closes in it (the arc draws, the dot lands); the signal runs on
// up the machine's arm; and everything holds still. The scene only asks for
// frames while something changes: none while it waits, none once it closed.

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
/** A signal fades in as it leaves and out as it arrives, so it never pops. */
const envelope = (p: number) => {
  if (p <= 0 || p >= 1) return 0;
  const i = clamp01(p / 0.12);
  const o = clamp01((1 - p) / 0.2);
  return i * i * (3 - 2 * i) * o * o * (3 - 2 * o);
};

// The entrance, in seconds: the hands draw on ease-out (1.5 s, the scripted
// exception), travel in from 1.4 times the open gap on ease-in-out (1.2 s,
// duration-story) while the camera dollies in 6 %. The answer's timeline is
// RESPUESTA (manos-trazo.ts), shared with the sketch.
const ENTRADA = {
  human: [0, 1.5],
  machine: [0.12, 1.62],
  travel: [0.35, 1.55],
  dolly: [0, 1.7],
  end: 1.7,
} as const;

// Each line shows once the drawing passes its place on the hand (aS: 0 at
// the elbow, 1 at the fingertip). The signal is a band that runs along every
// line, each a little out of step with the next.
const LINE_VERT = /* glsl */ `
  attribute float aS;
  attribute float aRnd;
  attribute float aKind;
  uniform float uDraw;
  uniform float uWave;
  uniform float uWaveAmp;
  uniform float uWrist;
  varying float vAlpha;
  varying float vGlow;
  varying float vDepth;
  varying float vKind;
  varying float vS;
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

// uKind: 1 lets the chips glint in the signal's color; 0 (the Steel ink) draws them like any trace.
const LINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uOpacity;
  uniform float uLift;
  uniform float uTip;
  uniform float uKind;
  varying float vAlpha;
  varying float vGlow;
  varying float vDepth;
  varying float vKind;
  varying float vS;
  void main() {
    float kind = vKind * uKind;
    // Fibers bunch up at the fingertips; soften them there so the mark stays the brightest thing.
    float a = max(vAlpha * uOpacity * vDepth * (1.0 - uTip * smoothstep(0.88, 1.0, vS)), kind * vAlpha * 0.7);
    vec3 c = mix(uColor, uGlow, max(vGlow, kind * 0.8));
    gl_FragColor = vec4(c, clamp(a + vGlow * vAlpha * vDepth * uLift, 0.0, 1.0));
  }
`;

const PAD_VERT = /* glsl */ `
  attribute float aS;
  attribute float aRnd;
  uniform float uDraw;
  uniform float uSize;
  uniform float uWave;
  uniform float uWaveAmp;
  varying float vAlpha;
  varying float vGlow;
  void main() {
    float head = uDraw * 1.3 - aRnd * 0.25;
    vAlpha = 1.0 - smoothstep(head - 0.05, head, aS);
    float front = uWave + (aRnd - 0.5) * 0.1;
    vGlow = (1.0 - smoothstep(0.0, 0.07, abs(aS - front))) * uWaveAmp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize;
  }
`;

const PAD_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vGlow;
  void main() {
    gl_FragColor = vec4(mix(uColor, uGlow, vGlow), vAlpha * uOpacity);
  }
`;

// allok's mark, as Brand draws it, on a quad that faces the camera: on an
// 80 grid, a circle of radius 24 and stroke 12, round caps, open from 5° to
// 85° in the lower right, and a dot of radius 6 at 45°. The quad spans 64
// units, so the ring sits at 0.75 and the stroke and dot at 0.1875. The arc
// draws the way the master's path runs, from 5° around the top to 85°; the
// dot then lands. Never rotated, mirrored or tinted.
const MARK_VERT = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = uv * 2.0 - 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const MARK_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uArc;
  uniform float uArcA;
  uniform float uDot;
  varying vec2 vP;
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
    gl_FragColor = vec4(uColor, a);
  }
`;

/** The canvas and WebGL2 context Manos.tsx asked for before loading this module. */
export type Contexto = { canvas: HTMLCanvasElement; gl: WebGL2RenderingContext };

export type Estado = "entrando" | "espera" | "respondiendo" | "cerrado";

/** What the scene tells the strip, besides the answer's moments. */
export type AvisosEscena = Avisos & {
  /** The first frame of the entrance is on screen. */
  alEntrar?: () => void;
  /** The drawing has passed its half: the sketch under it can leave. */
  alTrazar?: () => void;
  /** The entrance is over: the hands wait, still. */
  alEsperar?: () => void;
  /** The context was lost (the canvas is blank until it comes back), or came back. */
  alPerder?: () => void;
  alRecuperar?: () => void;
  /** The hands could not be built. */
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
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  // Off in production, as three.js recommends: each check is a synchronous wait on the GPU in the first frame.
  renderer.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
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
  let escena: ReturnType<typeof armar> | null = null;

  // Each step of the mount is its own task (the renderer, then the scene, then
  // its first frame), so none of them holds the page up for long.
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
    const tone = (name: string, fallback: string) => {
      const c = new Color(css.getPropertyValue(name).trim() || fallback);
      c.convertLinearToSRGB();
      return new Vector3(c.r, c.g, c.b);
    };
    const text = tone("--text", "#0b0d0e");
    const blue = tone("--blue", "#315cff");
    const ground = tone("--ground", "#f7f8f8");
    const dark = ground.x * 0.2126 + ground.y * 0.7152 + ground.z * 0.0722 < 0.4;
    const blending = dark ? AdditiveBlending : NormalBlending;
    // The machine's ink. Steel waits for Adri's yes (TINTA_MAQUINA): then Blue is only the closing loop.
    const acero = TINTA_MAQUINA === "acero";
    const machineInk = acero ? tone("--steel", "#697278") : blue;

    const scene = new Scene();
    const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);

    const geometry = (l: Lines) => {
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(l.pos, 3));
      g.setAttribute("aS", new BufferAttribute(l.s, 1));
      g.setAttribute("aRnd", new BufferAttribute(l.rnd, 1));
      g.setAttribute("aKind", new BufferAttribute(l.kind, 1));
      // Worked out in the worker (manos-geometria.ts): the first frame doesn't walk every vertex to sort.
      g.boundingSphere = new Sphere(new Vector3(...l.centro), l.radio);
      return g;
    };
    const lineMaterial = (l: Lines, color: Vector3, lift: number, tip: number) =>
      new ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        transparent: true,
        depthWrite: false,
        blending,
        uniforms: {
          uDraw: { value: 0 },
          uWave: { value: -1 },
          uWaveAmp: { value: 0 },
          uWrist: { value: l.wrist },
          uColor: { value: color },
          uGlow: { value: text },
          uOpacity: { value: 0 },
          uLift: { value: lift },
          uTip: { value: tip },
          uKind: { value: acero ? 0 : 1 },
        },
      });

    // Left: the human hand, of fibers. Right: the machine, of traces (mirrored).
    // The signal lights both in the text color, never blue (Motion, Never).
    const human = new Group();
    const humanGeo = geometry(manos.human);
    const humanMat = lineMaterial(manos.human, text, 0.5, 0.45);
    const fibers = new LineSegments(humanGeo, humanMat);
    fibers.frustumCulled = false;
    human.add(fibers);

    const machine = new Group();
    const machineGeo = geometry(manos.machine);
    const machineMat = lineMaterial(manos.machine, machineInk, 0.35, 0);
    const padGeo = geometry(manos.pads);
    const padMat = new ShaderMaterial({
      vertexShader: PAD_VERT,
      fragmentShader: PAD_FRAG,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uDraw: { value: 0 },
        uSize: { value: 2 },
        uWave: { value: -1 },
        uWaveAmp: { value: 0 },
        uColor: { value: machineInk },
        uGlow: { value: text },
        uOpacity: { value: 0.9 },
      },
    });
    const traces = new LineSegments(machineGeo, machineMat);
    const pads = new Points(padGeo, padMat);
    traces.frustumCulled = false;
    pads.frustumCulled = false;
    machine.add(traces, pads);

    human.rotation.set(...GIRO_HUMANA);
    machine.rotation.set(...GIRO_MAQUINA);
    scene.add(human, machine);

    // The mark, in the text color: Cloud on Ink, Ink on Cloud (Brand, Colors).
    const markGeo = new PlaneGeometry(1, 1);
    const markMat = new ShaderMaterial({
      vertexShader: MARK_VERT,
      fragmentShader: MARK_FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uColor: { value: acero ? blue : text }, uArc: { value: 0 }, uArcA: { value: 0 }, uDot: { value: 0 } },
    });
    const mark = new Mesh(markGeo, markMat);
    mark.frustumCulled = false;
    mark.renderOrder = 10;
    scene.add(mark);

    // Layout, from the strip's size (encuadre, shared with the sketch): the
    // fingertips sit a little apart in height, like two people reaching, and
    // the mark fits between them with a little more than its clear space.
    let width = 0;
    let height = 0;
    let enc: Encuadre = encuadre(1, 1);
    const layout = () => {
      enc = encuadre(width, height);
      mark.scale.setScalar(enc.mark);
      // A phone draws at 1.5x at most: the lines stay crisp and the fill stays cheap.
      const dpr = Math.min(window.devicePixelRatio || 1, enc.compact ? 1.5 : 2);
      renderer.setPixelRatio(dpr);
      const boost = dpr >= 1.5 ? 1.35 : 1;
      // On a phone the human hand is a few dozen pixels wide: brighter and
      // less softened at the tips, it reads as a hand and not a brush.
      humanMat.uniforms.uOpacity!.value = Math.min(1, (dark && !enc.compact ? 0.14 : 0.22) * boost);
      humanMat.uniforms.uTip!.value = enc.compact ? 0.3 : 0.45;
      const machineOpacity = Math.min(1, (dark ? 0.5 : 0.55) * boost);
      machineMat.uniforms.uOpacity!.value = machineOpacity;
      padMat.uniforms.uOpacity!.value = acero ? machineOpacity : 0.9;
      padMat.uniforms.uSize!.value = (enc.compact ? 1.8 : 2.6) * dpr;
    };

    let trazado = false;
    const frame = () => {
      // The entrance's clock, and the answer's: each holds at its end once past it.
      const te = estado === "entrando" ? t : ENTRADA.end;
      const ta = estado === "respondiendo" ? t : estado === "cerrado" ? RESPUESTA.end : 0;
      const R = RESPUESTA;

      const hd = easeOut(seg(te, ENTRADA.human[0], ENTRADA.human[1]));
      const md = easeOut(seg(te, ENTRADA.machine[0], ENTRADA.machine[1]));
      humanMat.uniforms.uDraw!.value = hd;
      machineMat.uniforms.uDraw!.value = md;
      padMat.uniforms.uDraw!.value = md;

      // The signal: down the human hand to the fingertip, then, once the mark
      // has closed, on up the machine's arm.
      const si = seg(ta, R.signalIn[0], R.signalIn[1]);
      humanMat.uniforms.uWave!.value = lerp(manos.human.wrist - 0.3, 1.12, easeInOut(si));
      humanMat.uniforms.uWaveAmp!.value = envelope(si);
      const so = seg(ta, R.signalOut[0], R.signalOut[1]);
      const out = lerp(1.12, manos.machine.wrist - 0.3, easeInOut(so));
      for (const mat of [machineMat, padMat]) {
        mat.uniforms.uWave!.value = out;
        mat.uniforms.uWaveAmp!.value = envelope(so);
      }

      // The gap: in from 1.4 times open to open, then (the answer) open to shut.
      const g =
        estado === "entrando" || estado === "espera"
          ? lerp(enc.open * 1.4, enc.open, easeInOut(seg(te, ENTRADA.travel[0], ENTRADA.travel[1])))
          : lerp(enc.open, enc.shut, easeInOut(seg(ta, R.travel[0], R.travel[1])));
      human.position.set(-g / 2, enc.lift, 0);
      machine.position.set(g / 2, -enc.lift, 0);

      markMat.uniforms.uArc!.value = easeInOut(seg(ta, R.arc[0], R.arc[1]));
      markMat.uniforms.uArcA!.value = seg(ta, R.arc[0], R.arc[0] + 0.1);
      // From the fingertip the dot lands with the settle; from the visitor's
      // finger the overlay did the landing, and the mark takes it over whole.
      const d = seg(ta, R.dot[0], R.dot[1]);
      markMat.uniforms.uDot!.value = modo === "toque" && estado === "respondiendo" ? (ta >= R.dot[1] ? 1 : 0) : d > 0 ? settle(d) : 0;

      // A small dolly-in while the hands arrive, as captures grow from 96 %.
      camera.position.set(0, AIM, enc.z * (1 + 0.06 * (1 - easeOut(seg(te, ENTRADA.dolly[0], ENTRADA.dolly[1])))));
      camera.lookAt(0, AIM, 0);
      renderer.render(scene, camera);
      if (!trazado && hd > 0.5) {
        trazado = true;
        avisos.alTrazar?.();
      }
    };

    let perdido = false;
    const draw = () => {
      if (width && height && !perdido) frame();
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
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
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
    // moving it off screen: the scene waits under it, looking every 300 ms.
    let visible = false;
    let raf = 0;
    let last = 0;
    let wait = 0;
    let held = false;
    let entro = estado !== "entrando";
    const mueve = () => estado === "entrando" || estado === "respondiendo";

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
      if (document.querySelector('[aria-modal="true"]')) {
        window.clearTimeout(wait);
        wait = window.setTimeout(play, 300);
        return;
      }
      t += paso(Math.max(0, now - last) / 1000);
      last = now;
      avanzar();
      draw();
      if (!entro) {
        entro = true;
        avisos.alEntrar?.();
      }
      // A pending answer that started in this frame has already asked for the next one.
      if (mueve() && !raf) raf = requestAnimationFrame(loop);
    };
    // The clock runs from the moment it is asked to, not from the frame that follows.
    function play() {
      if (held || raf || !mueve() || !visible || document.hidden || perdido || destruido) return;
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
    // the two still frames.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __manos?: (cuando: number | "espera" | "cerrado") => void }).__manos = (cuando) => {
        held = true;
        pause();
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
        draw();
      };
    }

    const io = new IntersectionObserver(([e]) => {
      visible = !!e?.isIntersecting;
      play();
    });

    // The debut runs three.js code for the first time: in one go it held a 4x
    // slower phone up for 250 to 330 ms, so it goes one step per task. Each
    // part's programs compile in turn while the page goes on: where the
    // browser can say when they are ready (KHR_parallel_shader_compile) the
    // canvas waits for them; elsewhere it goes on in the next task. Then the
    // canvas takes the strip's size, each hand is drawn alone off the page
    // (its first frame uploads its lines and reads its program), the whole
    // frame is drawn, and the canvas goes in.
    const enTareas = (lista: (() => void)[], luego: () => void) => {
      const siguiente = (i: number) =>
        window.setTimeout(() => {
          if (destruido) return;
          if (i === lista.length) return luego();
          lista[i]!();
          siguiente(i + 1);
        }, 0);
      siguiente(0);
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
      enTareas([() => renderer.render(human, camera), () => renderer.render(machine, camera), draw], () => {
        el.appendChild(renderer.domElement);
        ro.observe(el);
        io.observe(el);
        document.addEventListener("visibilitychange", play);
        // A still scene (mounted closed) draws its frame again, now on the page; a moving one draws in the next frame.
        if (!mueve()) draw();
        play();
      });
    };
    enTareas(
      [human, machine, mark].map((parte) => () => void renderer.compile(parte, camera, scene)),
      () => {
        if (renderer.extensions.has("KHR_parallel_shader_compile")) renderer.compileAsync(scene, camera).then(estrenar, estrenar);
        else estrenar();
      },
    );

    // A lost context draws nothing until it is restored: the strip shows its sketch meanwhile.
    const lost = () => {
      if (destruido) return;
      perdido = true;
      pause();
      avisos.alPerder?.();
    };
    const restored = () => {
      if (destruido) return;
      perdido = false;
      draw();
      avisos.alRecuperar?.();
      play();
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("webglcontextrestored", restored);

    return {
      destino,
      draw,
      play,
      pause,
      dispose() {
        pause();
        window.clearTimeout(wait);
        io.disconnect();
        ro.disconnect();
        density?.removeEventListener("change", onDensity);
        document.removeEventListener("visibilitychange", play);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        renderer.domElement.removeEventListener("webglcontextrestored", restored);
        for (const g of [humanGeo, machineGeo, padGeo, markGeo]) g.dispose();
        for (const mat of [humanMat, machineMat, padMat, markMat]) mat.dispose();
      },
    };
  }

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
      escena?.draw();
    },
    estado: () => estado,
    destruir() {
      destruido = true;
      escena?.dispose();
      renderer.dispose();
      // Frees the context now instead of at garbage collection: browsers only allow a few at once.
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
