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
  Vector3,
  WebGLRenderer,
} from "three";
import type { Lines, Manos } from "./manos-geometria";

// The hero's scene, told once: a human hand of fibers and a machine hand of
// circuit traces draw themselves in from the elbows and travel toward each
// other; a signal runs down the human hand to the fingertip; allok's mark
// closes in the gap (the arc draws, the dot lands); the signal runs on up the
// machine's arm; and everything holds still. Nothing loops (Motion, rule 1),
// so once it has closed the scene stops drawing.

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

// The timeline, in seconds. Every move is on the system's scale: the hands
// draw on ease-out and travel on ease-in-out (1.2 s, duration-story), the arc
// draws in 700 ms (duration-slow) and the dot lands in 400 ms (duration-base),
// the only overshoot.
const T = {
  human: [0, 1.5],
  machine: [0.12, 1.62],
  travel: [0.35, 1.55],
  dolly: [0, 1.7],
  signalIn: [1.15, 1.95],
  arc: [1.85, 2.55],
  dot: [2.55, 2.95],
  signalOut: [2.65, 3.45],
  end: 3.5,
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

const LINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uOpacity;
  uniform float uLift;
  uniform float uTip;
  varying float vAlpha;
  varying float vGlow;
  varying float vDepth;
  varying float vKind;
  varying float vS;
  void main() {
    // Fibers bunch up at the fingertips; soften them there so the mark stays the brightest thing.
    float a = max(vAlpha * uOpacity * vDepth * (1.0 - uTip * smoothstep(0.88, 1.0, vS)), vKind * vAlpha * 0.7);
    vec3 c = mix(uColor, uGlow, max(vGlow, vKind * 0.8));
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

/**
 * Mounts the scene in `el` once the hands are built (`manos`, from a worker)
 * and returns how to take it down, or null when the renderer can't start on
 * the context it was given (which is then freed). With reduced motion it
 * draws the closed frame and nothing else.
 */
export function montar(el: HTMLElement, manos: Promise<Manos>, { canvas, gl }: Contexto): (() => void) | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  let disposed = false;
  let stop: (() => void) | null = null;
  manos.then(
    (m) => {
      if (!disposed) stop = escena(el, renderer, m);
    },
    () => {
      if (!disposed) el.dataset.sinWebgl = "";
    },
  );

  return () => {
    disposed = true;
    stop?.();
    renderer.dispose();
    // Frees the context now instead of at garbage collection: browsers only allow a few at once.
    renderer.forceContextLoss();
    canvas.remove();
  };
}

function escena(el: HTMLElement, renderer: WebGLRenderer, manos: Manos): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);

  const geometry = (l: Lines) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(l.pos, 3));
    g.setAttribute("aS", new BufferAttribute(l.s, 1));
    g.setAttribute("aRnd", new BufferAttribute(l.rnd, 1));
    g.setAttribute("aKind", new BufferAttribute(l.kind, 1));
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
  const machineMat = lineMaterial(manos.machine, blue, 0.35, 0);
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
      uColor: { value: blue },
      uGlow: { value: text },
      uOpacity: { value: 0.9 },
    },
  });
  const traces = new LineSegments(machineGeo, machineMat);
  const pads = new Points(padGeo, padMat);
  traces.frustumCulled = false;
  pads.frustumCulled = false;
  machine.add(traces, pads);

  human.rotation.set(0.1, 0.26, 0);
  machine.rotation.set(0.1, -0.26, 0);
  scene.add(human, machine);

  // The mark, in the text color: Cloud on Ink, Ink on Cloud (Brand, Colors).
  const markGeo = new PlaneGeometry(1, 1);
  const markMat = new ShaderMaterial({
    vertexShader: MARK_VERT,
    fragmentShader: MARK_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { uColor: { value: text }, uArc: { value: 0 }, uArcA: { value: 0 }, uDot: { value: 0 } },
  });
  const mark = new Mesh(markGeo, markMat);
  mark.frustumCulled = false;
  mark.renderOrder = 10;
  scene.add(mark);

  // Layout, from the strip's size. The fingertips sit a little apart in
  // height, like two people reaching, and the mark fits between them with
  // a little more than its clear space (Brand: the o's inner radius, 0.6 of
  // its outer one).
  const LIFT = 0.035;
  const AIM = -0.07;
  let width = 0;
  let height = 0;
  let baseZ = 2.4;
  let open = 1.3;
  let shut = 0.24;
  const layout = () => {
    const compact = width < 760;
    const size = compact ? 0.2 : 0.15;
    const reach = size / 2 + 0.8 * (size / 2) + 0.005;
    shut = 2 * Math.sqrt(reach * reach - LIFT * LIFT);
    open = compact ? 0.9 : 1.3;
    mark.scale.setScalar(size * (32 / 30));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    const boost = dpr >= 1.5 ? 1.35 : 1;
    humanMat.uniforms.uOpacity!.value = Math.min(1, (dark ? 0.14 : 0.22) * boost);
    machineMat.uniforms.uOpacity!.value = Math.min(1, (dark ? 0.5 : 0.55) * boost);
    padMat.uniforms.uSize!.value = (compact ? 1.8 : 2.6) * dpr;
  };

  const frame = (t: number) => {
    const hd = easeOut(seg(t, T.human[0], T.human[1]));
    const md = easeOut(seg(t, T.machine[0], T.machine[1]));
    humanMat.uniforms.uDraw!.value = hd;
    machineMat.uniforms.uDraw!.value = md;
    padMat.uniforms.uDraw!.value = md;

    // The signal: down the human hand to the fingertip, then, once the mark
    // has closed, on up the machine's arm.
    const si = seg(t, T.signalIn[0], T.signalIn[1]);
    humanMat.uniforms.uWave!.value = lerp(manos.human.wrist - 0.3, 1.12, easeInOut(si));
    humanMat.uniforms.uWaveAmp!.value = envelope(si);
    const so = seg(t, T.signalOut[0], T.signalOut[1]);
    const out = lerp(1.12, manos.machine.wrist - 0.3, easeInOut(so));
    for (const mat of [machineMat, padMat]) {
      mat.uniforms.uWave!.value = out;
      mat.uniforms.uWaveAmp!.value = envelope(so);
    }

    const g = lerp(open, shut, easeInOut(seg(t, T.travel[0], T.travel[1])));
    human.position.set(-g / 2, -LIFT, 0);
    machine.position.set(g / 2, LIFT, 0);

    markMat.uniforms.uArc!.value = easeInOut(seg(t, T.arc[0], T.arc[1]));
    markMat.uniforms.uArcA!.value = seg(t, T.arc[0], T.arc[0] + 0.1);
    const d = seg(t, T.dot[0], T.dot[1]);
    markMat.uniforms.uDot!.value = d > 0 ? settle(d) : 0;

    // A small dolly-in while the hands arrive, as captures grow from 96 %.
    camera.position.set(0, AIM, baseZ * (1 + 0.06 * (1 - easeOut(seg(t, T.dolly[0], T.dolly[1])))));
    camera.lookAt(0, AIM, 0);
    renderer.render(scene, camera);
  };

  let elapsed = reduce ? T.end : 0;
  const draw = () => {
    if (width && height) frame(Math.min(elapsed, T.end));
  };

  const resize = () => {
    width = el.clientWidth;
    height = el.clientHeight;
    if (!width || !height) return;
    layout();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit about 1.12 units of height, and never less than 2.1 of width:
    // on a phone the hands run from wrist to wrist, on a desktop the arms leave the frame.
    const half = Math.tan((camera.fov * Math.PI) / 360);
    baseZ = Math.max(1.12 / (2 * half), 2.1 / (2 * half * camera.aspect));
    camera.updateProjectionMatrix();
    // Resizing the canvas clears it: draw the current frame again at once.
    draw();
  };

  el.appendChild(renderer.domElement);
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  // Moving to a screen with another pixel density doesn't resize anything.
  let density: MediaQueryList | null = null;
  const onDensity = () => {
    density?.removeEventListener("change", onDensity);
    density = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    density.addEventListener("change", onDensity);
    resize();
  };
  onDensity();
  renderer.domElement.addEventListener("webglcontextrestored", draw);

  // Plays once, only while the hero is on screen and the tab is open, then
  // holds the closed frame and stops asking for frames. A project's sheet
  // (Ficha) covers the hero without moving it off screen, as when a link
  // opens one: the scene waits under it, looking every 300 ms, and plays
  // once it closes.
  let visible = false;
  let raf = 0;
  let last = 0;
  let wait = 0;
  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (document.querySelector('[aria-modal="true"]')) {
      window.clearTimeout(wait);
      wait = window.setTimeout(play, 300);
      return;
    }
    elapsed += last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    draw();
    if (elapsed < T.end) raf = requestAnimationFrame(loop);
  };
  let held = false;
  const play = () => {
    if (held || raf || elapsed >= T.end || !visible || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  };
  // Development only: hold any moment of the timeline, to look at it frame by frame.
  if (process.env.NODE_ENV === "development") {
    (window as unknown as { __manos?: (t: number) => void }).__manos = (t: number) => {
      held = true;
      cancelAnimationFrame(raf);
      raf = 0;
      elapsed = t;
      draw();
    };
  }
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;
    play();
  });
  io.observe(el);
  document.addEventListener("visibilitychange", play);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(wait);
    io.disconnect();
    ro.disconnect();
    density?.removeEventListener("change", onDensity);
    document.removeEventListener("visibilitychange", play);
    renderer.domElement.removeEventListener("webglcontextrestored", draw);
    for (const g of [humanGeo, machineGeo, padGeo, markGeo]) g.dispose();
    for (const mat of [humanMat, machineMat, padMat, markMat]) mat.dispose();
  };
}
