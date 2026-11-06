// The machine hand's circuitry: chips, and buses that leave their pins
// straight, turn at 45° and end at a pad (a via). Drawn on a surface given as
// a map from 2D, so the same code inks the back plate and the forearm.
import { KIND, type V3 } from "./manos-base";

type P2 = [number, number];

/** A point of the surface under (x, y): where it is, its outward normal, its s. */
export type Superficie = (x: number, y: number) => { p: V3; n: V3; s: number };

/** Where the circuitry goes: line segments, and pads. */
export type Salida = {
  seg(a: V3, b: V3, sa: number, sb: number, rnd: number, kind: number, na: V3, nb: V3): void;
  pad(p: V3, s: number, rnd: number, n: V3): void;
};

/** The eight headings, 45° apart: 0 is +x, 2 is +y. */
const RUMBO: P2[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/** A path from `p`, a move at a time: [heading, how far along x or y]. */
const camino = (p: P2, moves: number[][]): P2[] => {
  const out: P2[] = [p];
  let [x, y] = p;
  for (const [r, l] of moves) {
    const [dx, dy] = RUMBO[r!]!;
    x += dx * l!;
    y += dy * l!;
    out.push([x, y]);
  }
  return out;
};

/** The path moved `d` to its left, mitred at the turns: the lanes of a bus stay parallel. */
const carril = (c: P2[], d: number): P2[] => {
  const nor = (u: P2, v: P2): P2 => {
    const l = Math.hypot(v[0] - u[0], v[1] - u[1]) || 1;
    return [-(v[1] - u[1]) / l, (v[0] - u[0]) / l];
  };
  return c.map((p, i) => {
    const n0 = i ? nor(c[i - 1]!, p) : nor(p, c[1]!);
    const n1 = i < c.length - 1 ? nor(p, c[i + 1]!) : n0;
    const k = 1 + n0[0] * n1[0] + n0[1] * n1[1];
    return [p[0] + (d * (n0[0] + n1[0])) / k, p[1] + (d * (n0[1] + n1[1])) / k];
  });
};

/** A polyline in the surface's coordinates, inked in steps short enough to follow its curve. */
function linea(sup: Superficie, out: Salida, c: P2[], rnd: number, kind: number, paso = 0.012) {
  let prev = sup(c[0]![0], c[0]![1]);
  for (let i = 1; i < c.length; i++) {
    const [ax, ay] = c[i - 1]!;
    const [bx, by] = c[i]!;
    const k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / paso));
    for (let j = 1; j <= k; j++) {
      const q = sup(ax + ((bx - ax) * j) / k, ay + ((by - ay) * j) / k);
      out.seg(prev.p, q.p, prev.s, q.s, rnd, kind, prev.n, q.n);
      prev = q;
    }
  }
}

/** A bus: `n` lanes `paso` apart along a centre path, each a trace with a pad at its end (and at its start, `vias`). */
function bus(sup: Superficie, out: Salida, rand: () => number, inicio: P2, moves: number[][], n: number, paso: number, vias = false) {
  const c = camino(inicio, moves);
  for (let k = 0; k < n; k++) {
    const lane = carril(c, (k - (n - 1) / 2) * paso);
    const r = rand();
    linea(sup, out, lane, r, KIND.forma);
    for (const p of vias ? [lane[0]!, lane[lane.length - 1]!] : [lane[lane.length - 1]!]) {
      const q = sup(p[0], p[1]);
      out.pad(q.p, q.s, r, q.n);
    }
  }
}

/** A chip: its outline, the die inside it and short pins along its sides, `paso` apart (KIND.chip glints with the signal). */
function chip(sup: Superficie, out: Salida, cx: number, cy: number, w: number, h: number, paso: number, r: number) {
  const caja = (x0: number, y0: number, x1: number, y1: number) => linea(sup, out, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], r, KIND.chip);
  caja(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
  caja(cx - w * 0.22, cy - h * 0.22, cx + w * 0.22, cy + h * 0.22);
  const PIN = 0.009;
  for (const [lado, largo] of [[0, w], [1, h]] as const) {
    const n = Math.floor(largo / paso);
    for (let k = 0; k < n; k++) {
      const t = (k - (n - 1) / 2) * paso;
      for (const sg of [-1, 1]) {
        const a: P2 = lado ? [cx + (sg * w) / 2, cy + t] : [cx + t, cy + (sg * h) / 2];
        const b: P2 = lado ? [a[0] + sg * PIN, a[1]] : [a[0], a[1] + sg * PIN];
        linea(sup, out, [a, b], r, KIND.chip);
      }
    }
  }
}

/** A screw head: a ring and its slot. */
function tornillo(sup: Superficie, out: Salida, x: number, y: number, r: number, rnd: number) {
  const c: P2[] = [];
  for (let k = 0; k <= 12; k++) c.push([x + r * Math.cos((k / 12) * Math.PI * 2), y + r * Math.sin((k / 12) * Math.PI * 2)]);
  linea(sup, out, c, rnd, KIND.forma);
  linea(sup, out, [[x - 0.6 * r, y + 0.35 * r], [x + 0.6 * r, y - 0.35 * r]], rnd, KIND.forma);
}

/** The back plate (the hand's x and y): three chips, buses to its edges, four screws; on a phone, fewer lanes and screws, no stubs. */
export function placaCircuito(sup: Superficie, out: Salida, rand: () => number, small: boolean) {
  const P = 0.014;
  // [centre x, centre y, length along x, along y]
  const chips: [number, number, number, number][] = [[0.26, 0.005, 0.1, 0.082], [0.135, -0.072, 0.054, 0.042], [0.16, 0.08, 0.046, 0.036]];
  for (const [cx, cy, w, h] of chips) chip(sup, out, cx, cy, w, h, small ? 2 * P : P, 0.5 + 0.5 * rand());
  const L = small ? 2 : 0;
  // Out of the big chip: forward toward the knuckles, up and down toward the corners, back toward the wrist.
  bus(sup, out, rand, [0.319, 0.005], [[0, 0.03], [0, 0.022]], small ? 2 : 4, small ? 2 * P : P);
  bus(sup, out, rand, [0.26, 0.055], [[2, 0.018], [1, 0.042], [0, 0.03]], 3 - L / 2, P);
  bus(sup, out, rand, [0.267, -0.045], [[6, 0.016], [7, 0.036], [0, 0.03]], 3 - L / 2, P);
  bus(sup, out, rand, [0.201, 0.005], [[4, 0.04], [5, 0.012], [4, 0.025], [3, 0.012], [4, 0.012]], 3 - L / 2, P);
  if (!small) {
    // Short stubs out of the small chips, each to its via.
    bus(sup, out, rand, [0.099, -0.072], [[4, 0.022]], 2, P);
    bus(sup, out, rand, [0.128, 0.08], [[4, 0.016]], 2, P);
    bus(sup, out, rand, [0.135, -0.042], [[2, 0.014], [1, 0.012]], 2, P);
    bus(sup, out, rand, [0.16, 0.053], [[6, 0.012], [7, 0.01]], 2, P);
  }
  const torn: P2[] = small ? [[0.09, -0.07], [0.375, 0.12]] : [[0.088, -0.03], [0.088, 0.04], [0.352, -0.108], [0.385, 0.125]];
  for (const [x, y] of torn) tornillo(sup, out, x, y, 0.0068, rand());
}

/** The forearm's lanes (along the arm from the wrist, negative, and across it): two buses down its back. */
export function brazoCircuito(sup: Superficie, out: Salida, rand: () => number, small: boolean) {
  const P = 0.014;
  bus(sup, out, rand, [-0.16, 0.012], [[4, 0.22], [3, 0.016], [4, 0.3], [5, 0.016], [4, 0.25]], small ? 2 : 3, P, true);
  if (!small) bus(sup, out, rand, [-0.22, -0.024], [[4, 0.16], [3, 0.012], [4, 0.2]], 2, P, true);
}
