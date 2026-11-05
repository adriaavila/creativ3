// The old shared skeleton: one chain per finger (forearm → wrist → palm →
// knuckle → joints → tip), pointing toward +x, fingers spread along y, the back
// of the hand facing the viewer (+z), the index fingertip at the origin.
// Temporary: the placeholders of manos-humana.ts and manos-maquina.ts use it
// until each hand is rebuilt on its own.
import { add, cross, dot, len, lerp, lerp3, mul, norm, smooth, sub, type V3 } from "./manos-base";

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
};

/** The human hand: the index reaching, the other fingers relaxed and curling. */
export const HUMANA: Pose = { index: [0.04, 0.12, 0.1], others: [0.55, 0.8, 0.55], thumb: [0.15, 0.25], tilt: 0.08, arm: 0.02 };
/** On a phone the hand is a few dozen pixels wide: curled fingers bunch into a brush, open ones read as a hand. */
export const HUMANA_COMPACTA: Pose = { ...HUMANA, others: [0.25, 0.35, 0.25] };
/** The machine hand: almost straight, sure of where it goes. */
export const MAQUINA: Pose = { index: [0.0, 0.03, 0.02], others: [0.2, 0.25, 0.18], thumb: [0.08, 0.1], tilt: -0.03, arm: -0.07 };

/** A point of the skeleton: center, half width (along y) and half thickness (along z). */
export type Node = { c: V3; ra: number; rb: number };
/** One finger from the elbow to its tip. `band` is where its fibers run in the forearm (-1 bottom, 1 top). */
export type Chain = { nodes: Node[]; weight: number; band: number; joints: number[] };

/** Fingers curl toward the palm, which faces away from the viewer, and a little down. */
const PALMWARD = norm([0, -0.5, -1]);

export function fingerNodes(base: V3, dir: V3, lengths: number[], curls: number[], r: number, toward: V3 = PALMWARD): Node[] {
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

export type Skeleton = { chains: Chain[]; xf: (v: V3) => V3; inv: (v: V3) => V3 };

export function skeleton(pose: Pose): Skeleton {
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

  // Tilt the hand around the wrist, then move the index tip to the origin.
  const c = Math.cos(pose.tilt);
  const s = Math.sin(pose.tilt);
  const rot = (v: V3): V3 => {
    const d = sub(v, W);
    return add(W, [d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2]]);
  };
  const index = chains[0]!.nodes;
  const tip = rot(index[index.length - 1]!.c);
  const xf = (v: V3) => sub(rot(v), tip);
  const inv = (v: V3): V3 => {
    const d = sub(add(v, tip), W);
    const x = d[0] * c + d[1] * s;
    const y = -d[0] * s + d[1] * c;
    return add(W, [x, y, d[2]]);
  };
  return { chains: chains.map((ch) => ({ ...ch, nodes: ch.nodes.map((n) => ({ ...n, c: xf(n.c) })) })), xf, inv };
}

/** Centripetal Catmull-Rom: no loops where long and short segments meet (the wrist). */
export function spline(p0: V3, p1: V3, p2: V3, p3: V3, u: number): V3 {
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
export type Sample = { c: V3; ra: number; rb: number; A: V3; B: V3; s: number; palm: number; node: number };

const UP: V3 = [0, 1, 0];

export function tube(chain: Chain, perSeg: number): Sample[] {
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
export function sampleAt(samples: Sample[], node: number): Sample {
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
export const onSurface = (p: Sample, th: number, k = 1): V3 => add(p.c, add(mul(p.A, Math.cos(th) * p.ra * k), mul(p.B, Math.sin(th) * p.rb * k)));

/** A point on the back of the palm, in the hand's own coordinates before the tilt. */
export const backOfPalm = (x: number, y: number, lift = 0.012): V3 => {
  const q = 1 - ((x - 0.2) / 0.3) ** 2 - (y / 0.22) ** 2;
  return [x, y, 0.06 * Math.sqrt(Math.max(0, q)) + lift];
};

export function pick(chains: Chain[], x: number) {
  let left = x * chains.reduce((a, c) => a + c.weight, 0);
  for (let i = 0; i < chains.length - 1; i++) {
    if (left < chains[i]!.weight) return i;
    left -= chains[i]!.weight;
  }
  return chains.length - 1;
}
