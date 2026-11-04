// Two hands reaching. One is human, made of fibers like a tractography of the
// brain; the other is a machine, made of circuit traces with rings at its
// joints and chips on its back. Pure geometry, no three.js here: it returns
// line segments ready for a buffer.
//
// Both hands share one skeleton per finger (forearm → wrist → palm → knuckle
// → joints → tip), built pointing toward +x, fingers spread along y, the back
// of the hand facing the viewer (+z), and the index fingertip at the origin,
// so the scene only has to move each hand to open or close the gap.

type V3 = [number, number, number];

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** A seeded random, so the hands are the same on every visit. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


export type Pose = {
  /** Curl per joint of the index finger, in radians. */
  index: number[];
  /** Curl per joint of the middle, ring and pinky fingers. */
  others: number[];
  /** Curl per joint of the thumb. */
  thumb: number[];
  /** Whole-hand tilt around z, in radians (positive points the fingers up). */
  tilt: number;
  /** Forearm droop: positive comes in from below. */
  arm: number;
  /** Turn around the forearm's axis, in radians: positive shows the palm and turns it up. */
  roll?: number;
};

/** The human hand: the index reaching, the other fingers relaxed and curling. */
export const HUMANA: Pose = { index: [0.04, 0.12, 0.1], others: [0.55, 0.8, 0.55], thumb: [0.15, 0.25], tilt: 0.08, arm: 0.02 };
/** On a phone the hand is a few dozen pixels wide: curled fingers bunch into a brush, open ones read as a hand. */
export const HUMANA_COMPACTA: Pose = { ...HUMANA, others: [0.25, 0.35, 0.25] };
/** The machine hand: almost straight, sure of where it goes. */
export const MAQUINA: Pose = { index: [0.0, 0.03, 0.02], others: [0.2, 0.25, 0.18], thumb: [0.08, 0.1], tilt: -0.03, arm: -0.07 };

// v2, only for the stills Adri compares before he approves it: his index
// higher and active (straight, the other fingers folded back so it leads),
// and the machine with its palm up, receiving. The thumb stays clear of the
// index: the human hand never makes the OK ring.
const HUMANA_V2: Pose = { index: [-0.04, 0.03, 0.02], others: [0.75, 1.05, 0.7], thumb: [0.3, 0.32], tilt: 0.16, arm: -0.03 };
const HUMANA_V2_COMPACTA: Pose = { ...HUMANA_V2, others: [0.45, 0.6, 0.4] };
const MAQUINA_V2: Pose = { ...MAQUINA, others: [0.3, 0.35, 0.25], tilt: 0.02, roll: 1.9 };

/** Which pose the hands take. v1 is the fresco Adri approved; v2 waits for his yes. */
export type Variante = "v1" | "v2";
export const POSE: Variante = "v1";
/** The machine's ink. `acero`: Steel lines, no glints on chips or pads, Blue only on the closing arc. Waits for his yes too. */
export type Tinta = "azul" | "acero";
export const TINTA_MAQUINA: Tinta = "azul";

/** A point of the skeleton: center, half width (along y) and half thickness (along z). */
type Node = { c: V3; ra: number; rb: number };
/** One finger from the elbow to its tip. `band` is where its fibers run in the forearm (-1 bottom, 1 top). */
type Chain = { nodes: Node[]; weight: number; band: number; joints: number[] };

/** Fingers curl toward the palm, which faces away from the viewer, and a little down. */
const PALMWARD = norm([0, -0.5, -1]);

function fingerNodes(base: V3, dir: V3, lengths: number[], curls: number[], r: number, toward: V3 = PALMWARD): Node[] {
  const nodes: Node[] = [{ c: base, ra: r * 1.15, rb: r }];
  let p = base;
  // Every joint curls in the same plane, the one from the finger's direction
  // toward the palm, so a deep curl keeps tucking under instead of bending back.
  const d0 = norm(dir);
  const side = sub(toward, mul(d0, dot(toward, d0)));
  const perp = len(side) < 1e-6 ? d0 : norm(side);
  let bent = 0;
  let d = d0;
  let rr = r;
  lengths.forEach((l, i) => {
    bent += curls[i] ?? 0;
    d = norm(add(mul(d0, Math.cos(bent)), mul(perp, Math.sin(bent))));
    if (i === lengths.length - 1) {
      // One more node near the end keeps the fingertip round, not pointed.
      nodes.push({ c: add(p, mul(d, l * 0.78)), ra: rr * 0.95, rb: rr * 0.85 });
      p = add(p, mul(d, l));
      nodes.push({ c: p, ra: rr * 0.45, rb: rr * 0.4 });
    } else {
      p = add(p, mul(d, l));
      rr *= 0.88;
      nodes.push({ c: p, ra: rr * 1.1, rb: rr });
    }
  });
  return nodes;
}

type Skeleton = { chains: Chain[]; xf: (v: V3) => V3; inv: (v: V3) => V3 };

function skeleton(pose: Pose): Skeleton {
  const armDir = norm([-1, -pose.arm, 0]);
  const W: V3 = [-0.04, 0, 0];
  const arm: Node[] = [
    { c: add(W, mul(armDir, 3.4)), ra: 0.165, rb: 0.14 },
    { c: add(W, mul(armDir, 1.3)), ra: 0.135, rb: 0.105 },
    { c: W, ra: 0.118, rb: 0.072 },
  ];
  const fingers: { y: number; base: V3; dir: V3; lengths: number[]; r: number; weight: number; band: number; curls: number[] }[] = [
    { y: 0.135, base: [0.44, 0.135, 0], dir: [1, 0.04, 0], lengths: [0.2, 0.125, 0.1], r: 0.043, weight: 0.25, band: 0.45, curls: pose.index },
    { y: 0.045, base: [0.46, 0.045, 0], dir: [1, 0, 0], lengths: [0.22, 0.14, 0.1], r: 0.044, weight: 0.21, band: 0.12, curls: pose.others },
    { y: -0.045, base: [0.44, -0.045, 0], dir: [1, -0.05, 0], lengths: [0.2, 0.13, 0.095], r: 0.041, weight: 0.18, band: -0.22, curls: pose.others.map((c) => c * 1.05) },
    { y: -0.13, base: [0.4, -0.125, 0], dir: [1, -0.14, 0], lengths: [0.155, 0.1, 0.085], r: 0.035, weight: 0.14, band: -0.55, curls: pose.others.map((c) => c * 1.12) },
  ];
  const chains: Chain[] = fingers.map((f) => {
    const palm: Node[] = [
      // Far enough past the wrist, and close enough to the arm's axis, that the
      // surface never folds back on itself where the hand meets the arm.
      { c: [0.08, f.y * 0.42, 0], ra: 0.06, rb: 0.058 },
      { c: [0.25, f.y * 0.85, 0], ra: 0.052, rb: 0.056 },
    ];
    const nodes = [...arm, ...palm, ...fingerNodes(f.base, f.dir, f.lengths, f.curls, f.r)];
    return { nodes, weight: f.weight, band: f.band, joints: [5, 6, 7] };
  });
  // The thumb: out of the palm toward the top, then forward beside the index.
  const t0: V3 = [0.13, 0.14, -0.01];
  const t1 = add(t0, mul(norm([0.65, 0.42, -0.1]), 0.13));
  const thumb: Node[] = [
    ...arm,
    { c: [0.07, 0.05, 0], ra: 0.068, rb: 0.062 },
    { c: t0, ra: 0.06, rb: 0.054 },
    { c: t1, ra: 0.05, rb: 0.046 },
    ...fingerNodes(t1, [0.9, 0.2, -0.06], [0.12, 0.09], pose.thumb, 0.046, norm([1, -0.4, -0.6])).slice(1),
  ];
  chains.push({ nodes: thumb, weight: 0.2, band: 0.8, joints: [5, 6] });

  // Turn the hand around the forearm (v2 only), tilt it around the wrist,
  // then move the index tip to the origin.
  const c = Math.cos(pose.tilt);
  const s = Math.sin(pose.tilt);
  const cr = Math.cos(pose.roll ?? 0);
  const sr = Math.sin(pose.roll ?? 0);
  const rot = (v: V3): V3 => {
    const d = sub(v, W);
    const y = d[1] * cr - d[2] * sr;
    const z = d[1] * sr + d[2] * cr;
    return add(W, [d[0] * c - y * s, d[0] * s + y * c, z]);
  };
  const index = chains[0]!.nodes;
  const tip = rot(index[index.length - 1]!.c);
  const xf = (v: V3) => sub(rot(v), tip);
  const inv = (v: V3): V3 => {
    const d = sub(add(v, tip), W);
    const x = d[0] * c + d[1] * s;
    const y = -d[0] * s + d[1] * c;
    return add(W, [x, y * cr + d[2] * sr, -y * sr + d[2] * cr]);
  };
  return { chains: chains.map((ch) => ({ ...ch, nodes: ch.nodes.map((n) => ({ ...n, c: xf(n.c) })) })), xf, inv };
}

/** Centripetal Catmull-Rom: no loops where long and short segments meet (the wrist). */
function spline(p0: V3, p1: V3, p2: V3, p3: V3, u: number): V3 {
  const d = (a: V3, b: V3) => Math.max(1e-4, Math.sqrt(len(sub(b, a))));
  const t1 = d(p0, p1);
  const t2 = t1 + d(p1, p2);
  const t3 = t2 + d(p2, p3);
  const t = t1 + (t2 - t1) * u;
  const mix = (a: V3, b: V3, ta: number, tb: number) => lerp3(a, b, (t - ta) / (tb - ta));
  const a1 = mix(p0, p1, 0, t1);
  const a2 = mix(p1, p2, t1, t2);
  const a3 = mix(p2, p3, t2, t3);
  return mix(mix(a1, a2, 0, t2), mix(a2, a3, t1, t3), t1, t2);
}

/** A sample along a finger's tube: center, radii, a frame (A ≈ up, B ≈ toward the viewer) and where it is. */
type Sample = { c: V3; ra: number; rb: number; A: V3; B: V3; s: number; palm: number; node: number };

const UP: V3 = [0, 1, 0];

function tube(chain: Chain, perSeg: number): Sample[] {
  const n = chain.nodes;
  const last = n.length - 1;
  const at = (i: number): V3 => {
    if (i < 0) return sub(mul(n[0]!.c, 2), n[1]!.c);
    if (i > last) return sub(mul(n[last]!.c, 2), n[last - 1]!.c);
    return n[i]!.c;
  };
  const raw: { c: V3; ra: number; rb: number; node: number }[] = [];
  for (let i = 0; i < last; i++) {
    // The long forearm segments get more steps, so waves and turns stay smooth there too.
    const steps = i < 2 ? perSeg + 4 : perSeg;
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      raw.push({ c: spline(at(i - 1), at(i), at(i + 1), at(i + 2), t), ra: lerp(n[i]!.ra, n[i + 1]!.ra, t), rb: lerp(n[i]!.rb, n[i + 1]!.rb, t), node: i + t });
    }
  }
  raw.push({ c: n[last]!.c, ra: n[last]!.ra, rb: n[last]!.rb, node: last });
  // Arc length, with the forearm counted at a third: the eye (and the timing) goes to the hand.
  const sArr = [0];
  for (let i = 1; i < raw.length; i++) {
    const d = len(sub(raw[i]!.c, raw[i - 1]!.c));
    sArr.push(sArr[i - 1]! + d * (raw[i]!.node <= 2 ? 0.3 : 1));
  }
  const total = sArr[sArr.length - 1] || 1;
  return raw.map((p, i) => {
    const T = norm(sub(raw[Math.min(raw.length - 1, i + 1)]!.c, raw[Math.max(0, i - 1)]!.c));
    let A = sub(UP, mul(T, dot(UP, T)));
    A = len(A) < 1e-4 ? [0, 0, 1] : norm(A);
    const B = norm(cross(T, A));
    return { ...p, A, B, s: sArr[i]! / total, palm: smooth(2, 4, p.node) };
  });
}

/** The sample at a fractional node position, interpolated between its neighbors. */
function sampleAt(samples: Sample[], node: number): Sample {
  let i = 0;
  while (i < samples.length - 2 && samples[i + 1]!.node < node) i++;
  const a = samples[i]!;
  const b = samples[i + 1]!;
  const t = Math.min(1, Math.max(0, (node - a.node) / (b.node - a.node || 1)));
  return {
    c: lerp3(a.c, b.c, t),
    ra: lerp(a.ra, b.ra, t),
    rb: lerp(a.rb, b.rb, t),
    A: norm(lerp3(a.A, b.A, t)),
    B: norm(lerp3(a.B, b.B, t)),
    s: lerp(a.s, b.s, t),
    palm: lerp(a.palm, b.palm, t),
    node,
  };
}

/** A point on the tube's surface: angle 0 is the top edge, π/2 faces the viewer, π the bottom edge. */
const onSurface = (p: Sample, th: number, k = 1): V3 => add(p.c, add(mul(p.A, Math.cos(th) * p.ra * k), mul(p.B, Math.sin(th) * p.rb * k)));

/** A point on the back of the palm, in the hand's own coordinates before the tilt. */
const backOfPalm = (x: number, y: number, lift = 0.012): V3 => {
  const q = 1 - ((x - 0.2) / 0.3) ** 2 - (y / 0.22) ** 2;
  return [x, y, 0.06 * Math.sqrt(Math.max(0, q)) + lift];
};

/**
 * Flat buffers for three.js: `pos` holds xyz per vertex; `s` says how far
 * along the hand each vertex is (0 elbow, 1 fingertip) and drives the
 * drawing; `rnd` is one value per line, the same at both ends; `kind` is 1
 * for the lines of a chip, which take the other color; `wrist` is the `s` of
 * the wrist, where the forearm starts fading out.
 */
/**
 * One hand's segments (or points) for the GPU. `centro` and `radio` are its
 * bounding sphere, worked out where the hand is built (the worker): three.js
 * needs the centre to sort the transparent lines and would otherwise walk
 * every vertex in the scene's first frame, on the main thread.
 */
export type Lines = {
  pos: Float32Array;
  s: Float32Array;
  rnd: Float32Array;
  kind: Float32Array;
  count: number;
  wrist: number;
  centro: [number, number, number];
  radio: number;
};

/** The bounding sphere three.js would compute (BufferGeometry.computeBoundingSphere): the box's centre, the farthest vertex. */
function esfera(pos: Float32Array): { centro: [number, number, number]; radio: number } {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = pos[i + k]!;
      if (v < min[k]!) min[k] = v;
      if (v > max[k]!) max[k] = v;
    }
  }
  if (!pos.length) return { centro: [0, 0, 0], radio: 0 };
  const centro: [number, number, number] = [(min[0]! + max[0]!) / 2, (min[1]! + max[1]!) / 2, (min[2]! + max[2]!) / 2];
  let r2 = 0;
  for (let i = 0; i < pos.length; i += 3) {
    const dx = pos[i]! - centro[0], dy = pos[i + 1]! - centro[1], dz = pos[i + 2]! - centro[2];
    r2 = Math.max(r2, dx * dx + dy * dy + dz * dz);
  }
  return { centro, radio: Math.sqrt(r2) };
}

class Builder {
  private pos: number[] = [];
  private s: number[] = [];
  private rnd: number[] = [];
  private kind: number[] = [];
  constructor(private mirror: boolean) {}
  private push(p: V3, s: number, r: number, k: number) {
    this.pos.push(this.mirror ? -p[0] : p[0], p[1], p[2]);
    this.s.push(s);
    this.rnd.push(r);
    this.kind.push(k);
  }
  seg(a: V3, b: V3, sa: number, sb: number, r: number, k = 0) {
    this.push(a, sa, r, k);
    this.push(b, sb, r, k);
  }
  point(p: V3, s: number, r: number) {
    this.push(p, s, r, 0);
  }
  done(wrist: number): Lines {
    const f = (a: number[]) => new Float32Array(a);
    const pos = f(this.pos);
    return { pos, s: f(this.s), rnd: f(this.rnd), kind: f(this.kind), count: this.s.length, wrist, ...esfera(pos) };
  }
}

function pick(chains: Chain[], x: number) {
  let left = x * chains.reduce((a, c) => a + c.weight, 0);
  for (let i = 0; i < chains.length - 1; i++) {
    if (left < chains[i]!.weight) return i;
    left -= chains[i]!.weight;
  }
  return chains.length - 1;
}

/**
 * The human hand: long fibers that run from the forearm to the fingertips,
 * bundled by finger in the arm and fanning out in the palm, each one waving a
 * little, like the tracts of a brain scan.
 */
export function humanHand(pose: Pose, fibers: number, seed: number, mirror = false): Lines {
  const rand = rng(seed);
  const { chains, xf } = skeleton(pose);
  const tubes = chains.map((c) => tube(c, 9));
  const out = new Builder(mirror);
  for (let f = 0; f < fibers; f++) {
    const ci = pick(chains, rand());
    const chain = chains[ci]!;
    const samples = tubes[ci]!;
    // Where the fiber lands in its finger: denser toward the surface, so the outline reads.
    const r = Math.pow(rand(), 0.4);
    const th = rand() * Math.PI * 2;
    const a = r * Math.cos(th);
    const b = r * Math.sin(th);
    // Where it runs in the forearm, apart from that: fibers braid at the wrist.
    const r2 = Math.sqrt(rand());
    const th2 = rand() * Math.PI * 2;
    const a2 = r2 * Math.cos(th2);
    const b2 = r2 * Math.sin(th2);
    const freq = 5 + rand() * 9;
    const freq2 = 13 + rand() * 14;
    const ph = rand() * Math.PI * 2;
    const ph2 = rand() * Math.PI * 2;
    const amp = 0.08 + rand() * 0.16;
    const amp2 = 0.02 + rand() * 0.05;
    const id = rand();
    const begin = rand() < 0.45 ? 0.15 + rand() * 0.3 : 0;
    const end = rand() < 0.3 ? 0.55 + rand() * 0.4 : 1;
    let prev: V3 | null = null;
    let ps = 0;
    for (const p of samples) {
      if (p.s < begin) continue;
      if (p.s > end) break;
      const wave = amp * Math.sin(p.s * freq + ph) + amp2 * Math.sin(p.s * freq2 + ph2);
      const u = (0.55 * a2 + 0.45 * chain.band) * (1 - p.palm) + a * p.palm + wave;
      const v = 0.85 * b2 * (1 - p.palm) + b * p.palm + amp * Math.cos(p.s * freq * 1.3 + ph);
      const q = add(add(p.c, mul(p.A, u * p.ra)), mul(p.B, v * p.rb));
      if (prev) out.seg(prev, q, ps, p.s, id);
      prev = q;
      ps = p.s;
    }
  }
  // A few fibers cross the back of the hand on a slant, from the base of the
  // thumb toward the little finger, like a second tract over the first.
  const palmS = sampleAt(tubes[1]!, 3.5).s;
  const across = Math.round(fibers * 0.05);
  for (let f = 0; f < across; f++) {
    const x0 = 0.02 + rand() * 0.2;
    const x1 = x0 + 0.08 + rand() * 0.16;
    const bow = (rand() - 0.5) * 0.06;
    const id = 0.3 + rand() * 0.7;
    const N = 18;
    // Near the wrist the hand is narrower: start and end inside its outline.
    const top = Math.min(0.15, 0.1 + 0.4 * x0);
    const bottom = -Math.min(0.15, 0.1 + 0.4 * x1);
    let prev = xf(backOfPalm(x0, top, 0.004));
    for (let j = 1; j <= N; j++) {
      const t = j / N;
      const y = lerp(top, bottom, t);
      const q = xf(backOfPalm(lerp(x0, x1, t) + bow * Math.sin(Math.PI * t), y, 0.004));
      out.seg(prev, q, palmS, palmS, id);
      prev = q;
    }
  }
  return out.done(sampleAt(tubes[1]!, 2).s);
}

/**
 * The machine hand: traces that run along the surface in lanes, bundled by
 * finger in the forearm like a bus, turning at 45° with a pad at every turn;
 * chips on the back of the hand that the traces run into, rings at the
 * joints and a cuff at the wrist.
 */
export function machineHand(pose: Pose, traces: number, seed: number, mirror = true): { lines: Lines; pads: Lines } {
  const rand = rng(seed);
  const { chains, xf, inv } = skeleton(pose);
  const tubes = chains.map((c) => tube(c, 14));
  const lines = new Builder(mirror);
  const pads = new Builder(mirror);
  const mid = tubes[1]!;
  const palmS = sampleAt(mid, 3.5).s;

  // Chips on the back of the hand: [center x, center y, width, height], before the tilt.
  const chips: [number, number, number, number][] = [
    [0.22, 0.03, 0.15, 0.11],
    [0.06, -0.09, 0.08, 0.06],
    [0.08, 0.09, 0.06, 0.045],
  ];
  const PIN = 0.014;
  const inChip = (h: V3) => chips.some(([cx, cy, w, hh]) => Math.abs(h[0] - cx) < w / 2 + PIN && Math.abs(h[1] - cy) < hh / 2 + PIN);
  // A trace on the back of the hand that reaches a chip ends at its pin;
  // along the hand's edges it runs on underneath, like an inner layer.
  const onChip = (q: V3) => {
    const h = inv(q);
    return h[2] >= 0.02 && inChip(h);
  };
  // But no pad ever sits inside a chip's outline.
  const pad = (q: V3, s: number, id: number) => {
    if (!inChip(inv(q))) pads.point(q, s, id);
  };

  const LANES = 14;
  // Lanes cover the half that faces the viewer and wrap a little past the edges.
  const laneAngle = (k: number) => -0.12 * Math.PI + ((k + 0.5) / LANES) * 1.24 * Math.PI;
  for (let t = 0; t < traces; t++) {
    const ci = pick(chains, rand());
    const chain = chains[ci]!;
    const samples = tubes[ci]!;
    // In the forearm a finger's traces run together near its band; in the palm they spread out.
    const bandAngle = ((1 - chain.band) / 2) * Math.PI;
    const angle = (lane: number, palm: number) => lerp(bandAngle + (laneAngle(lane) - Math.PI / 2) * 0.3, laneAngle(lane), palm);
    let lane = Math.floor(rand() * LANES);
    const start = Math.floor(rand() * samples.length * 0.5);
    const end = rand() < 0.4 ? Math.floor((samples.length - 1) * (0.62 + rand() * 0.36)) : samples.length - 1;
    // Turns: where they start, and how many lanes each one crosses (one lane per step: 45°).
    const turns = new Map<number, number>();
    const nTurns = 2 + Math.floor(rand() * 3);
    for (let j = 0; j < nTurns; j++) {
      const s = 0.3 + rand() * 0.65;
      let i = 0;
      while (i < samples.length - 1 && samples[i]!.s < s) i++;
      turns.set(i, (rand() < 0.5 ? -1 : 1) * (1 + Math.floor(rand() * 2)));
    }
    const id = rand();
    const first = samples[start]!;
    let prev = onSurface(first, angle(lane, first.palm), 1.01);
    if (onChip(prev)) continue;
    let ps = first.s;
    pad(prev, ps, id);
    let steer = 0;
    for (let i = start + 1; i <= end; i++) {
      const p = samples[i]!;
      const turn = turns.get(i);
      if (turn) steer += turn;
      let bent = false;
      if (steer !== 0) {
        const next = Math.min(LANES - 1, Math.max(0, lane + Math.sign(steer)));
        steer = next === lane ? 0 : steer - Math.sign(steer);
        bent = next !== lane;
        lane = next;
      }
      const q = onSurface(p, angle(lane, p.palm), 1.01);
      // A trace that reaches a chip ends at its pin.
      if (onChip(q)) break;
      lines.seg(prev, q, ps, p.s, id);
      if (bent && steer === 0) pad(q, p.s, id);
      prev = q;
      ps = p.s;
    }
    pad(prev, ps, id);
  }

  // A ring at every joint: a band open at the back, where nobody looks.
  const ring = (p: Sample, k: number, from: number, to: number, id: number) => {
    const N = 22;
    let prev = onSurface(p, from, k);
    for (let j = 1; j <= N; j++) {
      const q = onSurface(p, from + ((to - from) * j) / N, k);
      lines.seg(prev, q, p.s, p.s, id);
      prev = q;
    }
  };
  chains.forEach((chain, ci) => {
    for (const j of chain.joints) {
      ring(sampleAt(tubes[ci]!, j - 0.04), 1.07, -0.2 * Math.PI, 1.2 * Math.PI, 0.5 + rand() * 0.5);
      ring(sampleAt(tubes[ci]!, j + 0.04), 1.07, -0.2 * Math.PI, 1.2 * Math.PI, 0.5 + rand() * 0.5);
    }
  });
  // The cuff: two bands around the wrist.
  for (const node of [1.96, 1.9]) ring(sampleAt(mid, node), 1.12, -0.25 * Math.PI, 1.25 * Math.PI, 0.5 + rand() * 0.5);

  // The chips: an outline, the die inside it and the pins, in the other color.
  const back = (x: number, y: number) => xf(backOfPalm(x, y));
  const rect = (x0: number, y0: number, x1: number, y1: number, id: number) => {
    const edge = (ax: number, ay: number, bx: number, by: number) => {
      const N = 6;
      let prev = back(ax, ay);
      for (let j = 1; j <= N; j++) {
        const q = back(lerp(ax, bx, j / N), lerp(ay, by, j / N));
        lines.seg(prev, q, palmS, palmS, id, 1);
        prev = q;
      }
    };
    edge(x0, y0, x1, y0);
    edge(x1, y0, x1, y1);
    edge(x1, y1, x0, y1);
    edge(x0, y1, x0, y0);
  };
  for (const [cx, cy, w, h] of chips) {
    const id = 0.5 + rand() * 0.5;
    const x0 = cx - w / 2;
    const x1 = cx + w / 2;
    const y0 = cy - h / 2;
    const y1 = cy + h / 2;
    rect(x0, y0, x1, y1, id);
    rect(cx - w * 0.22, cy - h * 0.22, cx + w * 0.22, cy + h * 0.22, id);
    const STEP = 0.016;
    for (let x = x0 + STEP / 2; x < x1; x += STEP) {
      lines.seg(back(x, y0), back(x, y0 - PIN), palmS, palmS, id, 1);
      lines.seg(back(x, y1), back(x, y1 + PIN), palmS, palmS, id, 1);
    }
    for (let y = y0 + STEP / 2; y < y1; y += STEP) {
      lines.seg(back(x0, y), back(x0 - PIN, y), palmS, palmS, id, 1);
      lines.seg(back(x1, y), back(x1 + PIN, y), palmS, palmS, id, 1);
    }
  }
  const wrist = sampleAt(mid, 2).s;
  return { lines: lines.done(wrist), pads: pads.done(wrist) };
}

/** Both hands, as the hero draws them: denser on a wide screen, lighter on a phone. */
export type Manos = { human: Lines; machine: Lines; pads: Lines };

/**
 * The same seeds (7 and 11) on every screen, so the hands are always the
 * same hands; a phone gets fewer lines and the open human hand.
 */
export function construirManos(small: boolean, pose: Variante = POSE): Manos {
  const v2 = pose === "v2";
  const humana = v2 ? (small ? HUMANA_V2_COMPACTA : HUMANA_V2) : small ? HUMANA_COMPACTA : HUMANA;
  const machine = machineHand(v2 ? MAQUINA_V2 : MAQUINA, small ? 170 : 340, 11);
  return { human: humanHand(humana, small ? 300 : 560, 7), machine: machine.lines, pads: machine.pads };
}

// ── Where everything sits ────────────────────────────────────────────────
// The scene (manos-escena.ts) frames the hands with these numbers and
// scripts/manos-trazo.ts projects the 2D sketch with the very same ones, so
// the pencil drawing lands under the fibers.

/** Field of view of the camera, vertical, in degrees. */
export const FOV = 30;
/** The camera looks a little under the fingertips: the arms come in from below. */
export const AIM = -0.07;
/** How far apart the fingertips sit in height, like two people reaching. */
const LIFT = 0.035;
/** Each group's turn (x, y, z), so the arms come toward the viewer from either side. */
export const GIRO_HUMANA: V3 = [0.1, 0.26, 0];
export const GIRO_MAQUINA: V3 = [0.1, -0.26, 0];
/** The least the camera keeps in view on the plane of the fingertips: 2.1 units of width and 1.12 of height. */
export const VISTA = { ancho: 2.1, alto: 1.12 } as const;
/**
 * On a phone the camera comes closer (1.75 units of width) and the pair turns
 * on a diagonal, corner to corner: a phone's strip is about as tall as it is
 * wide, and side by side the hands were two brushes at the edges. The
 * diagonal and the line under it (the hint, then the reply) need 1.9 units of
 * height: on a strip shorter than the reference phone's (390 × 424) the hands
 * get smaller instead of being cut by its top and bottom, which are not the
 * screen's edges.
 */
export const VISTA_COMPACTA = { ancho: 1.75, alto: 1.9 } as const;
/** The pair's turn about the camera's axis on a phone, in radians (about 29°): the human hand comes up from the lower left. */
const DIAGONAL = 0.5;
/**
 * The mark's proportions, as shares of its outer diameter (Brand, on the 80
 * grid: 60 across, the ring's centre line at r 24, the dot r 6 at 45°). The
 * scene's shader, the sketch and the visitor's dot all land on these.
 */
export const LAZO = { anillo: 0.4, punto: 0.1 } as const;

export type Encuadre = {
  /** A phone-sized strip: the lighter hands and the bigger mark. */
  compact: boolean;
  /** The mark's outer diameter, in units. */
  size: number;
  /** The mark quad's scale (the ring is 0.75 of it). */
  mark: number;
  /** The least the camera keeps in view (VISTA, or VISTA_COMPACTA on a phone). */
  vista: { ancho: number; alto: number };
  /**
   * Gap between the fingertips while the hands wait, reaching, with just the
   * room the loop needs between them (they come in from 1.4 times it), and
   * once the loop closes.
   */
  espera: number;
  shut: number;
  /** The pair's turn about the camera's axis, in radians (0 on a wide strip). */
  giro: number;
  /** Height of the human fingertip (the machine's is the opposite). */
  lift: number;
  /** Camera distance with the dolly done. */
  z: number;
  /** CSS pixels per unit on the plane of the fingertips. */
  px: number;
};

/**
 * The framing for a strip of `width` × `height` CSS pixels. The camera fits
 * about 1.12 units of height and never less than 2.1 of width (1.9 and 1.75
 * on a phone, where the pair meets on a diagonal): either way the arms leave
 * the frame. The mark fits between the fingertips with a little more than its
 * clear space (Brand: the o's inner radius, 0.6 of its outer one).
 */
export function encuadre(width: number, height: number, pose: Variante = POSE): Encuadre {
  const compact = width < 760;
  const vista = compact ? VISTA_COMPACTA : VISTA;
  const size = compact ? 0.2 : 0.15;
  const reach = size / 2 + 0.8 * (size / 2) + 0.005;
  const half = Math.tan((FOV * Math.PI) / 360);
  const aspect = width / (height || 1);
  const lift = pose === "v2" ? LIFT : -LIFT;
  return {
    compact,
    vista,
    size,
    mark: size * (32 / 30),
    espera: compact ? 0.54 : 0.56,
    shut: 2 * Math.sqrt(reach * reach - LIFT * LIFT),
    lift,
    giro: compact ? DIAGONAL : 0,
    z: Math.max(vista.alto / (2 * half), vista.ancho / (2 * half * aspect)),
    px: Math.min(width / vista.ancho, height / vista.alto),
  };
}
