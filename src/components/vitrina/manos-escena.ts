import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineSegments,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { HUMANA, MAQUINA, humanHand, machineHand, type Lines } from "./manos-geometria";

// The hero's scene: a human hand of fibers and a machine hand of circuit
// traces draw themselves in from the edges, the gap between the index
// fingers closes, the brand's blue dot lands in it, and then a signal runs
// from one into the other. Loaded only after the page is up (Manos.tsx), and
// only the parts of three.js it uses.

// The system's curves (tokens.json → easing).
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const settle = (t: number) => {
  const c1 = 1.56;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// Each line shows once the drawing passes its place on the hand (aS: 0 at
// the elbow, 1 at the fingertip). A few carry a signal: it runs toward the
// fingertip on the human hand and away from it on the machine's.
const LINE_VERT = /* glsl */ `
  attribute float aS;
  attribute float aRnd;
  attribute float aKind;
  uniform float uDraw;
  uniform float uTime;
  uniform float uPulse;
  uniform float uFlow;
  uniform float uWrist;
  varying float vAlpha;
  varying float vGlow;
  varying float vDepth;
  varying float vKind;
  void main() {
    float head = uDraw * 1.3 - aRnd * 0.25;
    vAlpha = 1.0 - smoothstep(head - 0.05, head, aS);
    vKind = aKind;
    float glow = 0.0;
    if (aRnd < 0.08) {
      float k = fract(uTime * 0.16 + aRnd * 37.0);
      float at = uFlow > 0.0 ? k * 1.3 - 0.15 : 1.15 - k * 1.3;
      glow = (1.0 - smoothstep(0.0, 0.06, abs(aS - at))) * uPulse;
    }
    vGlow = glow;
    // Lines farther back are fainter, and the forearm fades out toward the edge.
    vDepth = (0.25 + 0.75 * smoothstep(-0.16, 0.08, position.z)) * (0.1 + 0.9 * smoothstep(uWrist - 0.16, uWrist + 0.05, aS));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vGlow;
  varying float vDepth;
  varying float vKind;
  void main() {
    float a = max(vAlpha * uOpacity * vDepth, vKind * vAlpha * 0.7);
    gl_FragColor = vec4(mix(uColor, uGlow, max(vGlow, vKind * 0.8)), clamp(a + vGlow * vAlpha * 0.9, 0.0, 1.0));
  }
`;

const PAD_VERT = /* glsl */ `
  attribute float aS;
  attribute float aRnd;
  uniform float uDraw;
  uniform float uSize;
  varying float vAlpha;
  void main() {
    float head = uDraw * 1.3 - aRnd * 0.25;
    vAlpha = 1.0 - smoothstep(head - 0.05, head, aS);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize;
  }
`;

const PAD_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
  }
`;

const DOT_VERT = /* glsl */ `
  uniform float uDot;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uDot / -mv.z;
  }
`;

const DOT_FRAG = /* glsl */ `
  uniform vec3 uColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, smoothstep(0.5, 0.46, d));
  }
`;

/**
 * Mounts the scene in `el` and returns how to take it down, or null when
 * the browser has no WebGL. With reduced motion it draws the last frame once.
 */
export function montar(el: HTMLElement): (() => void) | null {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");

  // Colors come from the theme the hero sits on, so Cloud and Ink both work.
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
  const boost = dpr >= 1.5 ? 1.35 : 1;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 50);
  const small = el.clientWidth < 760;

  const geometry = (l: Lines) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(l.pos, 3));
    g.setAttribute("aS", new BufferAttribute(l.s, 1));
    g.setAttribute("aRnd", new BufferAttribute(l.rnd, 1));
    g.setAttribute("aKind", new BufferAttribute(l.kind, 1));
    return g;
  };
  const lineMaterial = (l: Lines, color: Vector3, glow: Vector3, opacity: number, flow: number) =>
    new ShaderMaterial({
      vertexShader: LINE_VERT,
      fragmentShader: LINE_FRAG,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uDraw: { value: 0 },
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uFlow: { value: flow },
        uWrist: { value: l.wrist },
        uColor: { value: color },
        uGlow: { value: glow },
        uOpacity: { value: Math.min(1, opacity * boost) },
      },
    });

  // Left: the human hand, of fibers. Right: the machine, of traces (mirrored).
  const h = humanHand(HUMANA, small ? 380 : 560, 7);
  const humanGeo = geometry(h);
  const humanMat = lineMaterial(h, text, blue, dark ? 0.14 : 0.22, 1);
  const human = new Group();
  const fibers = new LineSegments(humanGeo, humanMat);
  fibers.frustumCulled = false;
  human.add(fibers);

  const m = machineHand(MAQUINA, small ? 170 : 260, 11);
  const machineGeo = geometry(m.lines);
  const machineMat = lineMaterial(m.lines, blue, text, dark ? 0.5 : 0.55, -1);
  const padGeo = geometry(m.pads);
  const padMat = new ShaderMaterial({
    vertexShader: PAD_VERT,
    fragmentShader: PAD_FRAG,
    transparent: true,
    depthWrite: false,
    blending,
    uniforms: { uDraw: { value: 0 }, uSize: { value: (small ? 1.8 : 2.6) * dpr }, uColor: { value: blue }, uOpacity: { value: 0.9 } },
  });
  const machine = new Group();
  const traces = new LineSegments(machineGeo, machineMat);
  const pads = new Points(padGeo, padMat);
  traces.frustumCulled = false;
  pads.frustumCulled = false;
  machine.add(traces, pads);

  human.rotation.set(0.1, 0.26, 0);
  machine.rotation.set(0.1, -0.26, 0);
  scene.add(human, machine);

  const dotGeo = new BufferGeometry();
  dotGeo.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0]), 3));
  const dotMat = new ShaderMaterial({
    vertexShader: DOT_VERT,
    fragmentShader: DOT_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: { uDot: { value: 0 }, uColor: { value: blue } },
  });
  const dot = new Points(dotGeo, dotMat);
  dot.frustumCulled = false;
  dot.renderOrder = 10;
  scene.add(dot);

  const DOT_SIZE = (small ? 54 : 72) * dpr;
  let width = 0;
  let height = 0;
  let baseZ = 2.4;
  const resize = () => {
    width = el.clientWidth;
    height = el.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = width / height;
    // Fit about 1.12 units of height, and never less than 2.1 of width:
    // on a phone the hands run from wrist to wrist, on a desktop the arms leave the frame.
    const half = Math.tan((camera.fov * Math.PI) / 360);
    baseZ = Math.max(1.12 / (2 * half), 2.1 / (2 * half * camera.aspect));
    camera.position.z = baseZ;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(el);

  // Timeline, in seconds: the hands draw in from the edges (0–2.5), the
  // gap closes (0.6–2.6), the dot lands (2.6–3.0, the only overshoot),
  // then the signals start and everything breathes.
  const OPEN = small ? 0.9 : 1.3;
  const SHUT = 0.16;
  const AIM = -0.07;
  camera.position.y = AIM;
  const frame = (t: number, px: number, py: number, signals: boolean) => {
    humanMat.uniforms.uDraw!.value = 0.3 + 0.7 * easeOut(clamp01(t / 2.2));
    const md = 0.3 + 0.7 * easeOut(clamp01((t - 0.3) / 2.2));
    machineMat.uniforms.uDraw!.value = md;
    padMat.uniforms.uDraw!.value = md;
    const pulse = signals ? clamp01((t - 3) / 0.8) : 0;
    for (const mat of [humanMat, machineMat]) {
      mat.uniforms.uTime!.value = t;
      mat.uniforms.uPulse!.value = pulse;
    }
    const g = OPEN + (SHUT - OPEN) * easeInOut(clamp01((t - 0.6) / 2));
    const breath = Math.sin(t * 0.7) * 0.01 * clamp01(t - 3);
    human.position.set(-g / 2 - breath, -0.035 + breath * 0.5, 0);
    machine.position.set(g / 2 + breath, 0.035 - breath * 0.5, 0);
    const d = clamp01((t - 2.6) / 0.4);
    dotMat.uniforms.uDot!.value = d > 0 ? DOT_SIZE * settle(d) : 0;
    // The wrists sit below the fingertips: aim a little low so the whole gesture is centered.
    camera.position.x += (px * 0.12 - camera.position.x) * 0.06;
    camera.position.y += (AIM + py * 0.06 - camera.position.y) * 0.06;
    camera.position.z = baseZ;
    camera.lookAt(0, AIM, 0);
    renderer.render(scene, camera);
  };

  const dispose = () => {
    ro.disconnect();
    for (const g of [humanGeo, machineGeo, padGeo, dotGeo]) g.dispose();
    for (const mat of [humanMat, machineMat, padMat, dotMat]) mat.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  if (reduce) {
    frame(10, 0, 0, false);
    return dispose;
  }

  let px = 0;
  let py = 0;
  const onMove = (e: PointerEvent) => {
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = -(e.clientY / window.innerHeight - 0.5) * 2;
  };
  if (fine) window.addEventListener("pointermove", onMove, { passive: true });

  // Runs only while on screen and the tab is open; after the entrance,
  // at half the frame rate, which is plenty for a breath.
  let visible = true;
  const io = new IntersectionObserver(([e]) => {
    visible = !!e?.isIntersecting;
  });
  io.observe(el);
  let elapsed = 0;
  let last = performance.now();
  let raf = 0;
  let odd = false;
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (visible && !document.hidden) {
      elapsed += dt;
      odd = !odd;
      if (elapsed < 4 || odd) frame(elapsed, px, py, true);
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener("pointermove", onMove);
    dispose();
  };
}
