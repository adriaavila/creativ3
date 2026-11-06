// The machine hand's workshop: parts as small closed meshes (rings stitched
// into a capped tube: shells, drums, slabs), and the lines a technical drawing
// inks from them. No three.js: this runs in the worker and in Node.
import { KIND, add, cross, dot, mul, norm, sub, type Builder, type V3 } from "./manos-base";

export type P2 = [number, number];

/** A place to build in: an origin and three axes (x along the part, y to its side, z up its back). */
export type Marco = { o: V3; x: V3; y: V3; z: V3 };
export const en = (f: Marco, u: number, v: number, w: number): V3 => [f.o[0] + f.x[0] * u + f.y[0] * v + f.z[0] * w, f.o[1] + f.x[1] * u + f.y[1] * v + f.z[1] * w, f.o[2] + f.x[2] * u + f.y[2] * v + f.z[2] * w];

/** `v` turned by `a` radians about the unit axis `k` (Rodrigues). */
export function rotar(v: V3, k: V3, a: number): V3 {
  const c = Math.cos(a);
  return add(add(mul(v, c), mul(cross(k, v), Math.sin(a))), mul(k, dot(k, v) * (1 - c)));
}

const clave = (a: number, b: number) => (a < b ? a * 1048576 + b : b * 1048576 + a);

/** Besides a KIND, an edge may ask to be a seam (a form line even on the silhouette: another part runs on behind it) or never inked (a rim inside another part, where a lifted line would show through). */
export const COSTURA = 3;
export const OCULTA = 4;

/** One part: an indexed mesh wound outward, the s of each vertex, the lines it asks for, and one rnd for all its lines. */
export class Malla {
  p: number[] = [];
  t: number[] = [];
  s: number[] = [];
  /** Edges inked whenever they face the eye, and the KIND they are inked with. */
  pide = new Map<number, number>();
  constructor(public rnd: number) {}
  v(q: V3, s: number): number {
    this.p.push(q[0], q[1], q[2]);
    this.s.push(s);
    return this.s.length - 1;
  }
}

/**
 * Rings (as many points each, turning right-handed about the way the tube
 * runs) stitched into a tube, a flat cap at each end. What its edges ask for:
 * `borde`, the first and last caps' rims; `largo`, the lines along the tube
 * through those ring points (rings `desde` to `hasta`); `aros`, [ring, KIND].
 */
export function tubo(m: Malla, anillos: V3[][], s: (q: V3) => number, borde: (number | undefined)[] = [], largo: number[] = [], desde = 0, hasta = anillos.length - 1, aros: P2[] = []) {
  const n = anillos[0]!.length;
  const base = m.s.length;
  for (const r of anillos) for (const q of r) m.v(q, s(q));
  const id = (k: number, i: number) => base + k * n + ((i + n) % n);
  for (let k = 0; k + 1 < anillos.length; k++)
    for (let i = 0; i < n; i++) m.t.push(id(k, i), id(k, i + 1), id(k + 1, i + 1), id(k, i), id(k + 1, i + 1), id(k + 1, i));
  for (const [k, fuera] of [[0, false], [anillos.length - 1, true]] as const) {
    const r = anillos[k]!;
    const c: V3 = [0, 0, 0];
    for (const q of r) for (let j = 0; j < 3; j++) c[j] += q[j]! / n;
    const ci = m.v(c, s(c));
    const b = borde[fuera ? 1 : 0];
    for (let i = 0; i < n; i++) {
      m.t.push(ci, fuera ? id(k, i) : id(k, i + 1), fuera ? id(k, i + 1) : id(k, i));
      if (b !== undefined) m.pide.set(clave(id(k, i), id(k, i + 1)), b);
    }
  }
  for (const i of largo) for (let k = desde; k < hasta; k++) m.pide.set(clave(id(k, i), id(k + 1, i)), KIND.forma);
  for (const [k, kind] of aros) for (let i = 0; i < n; i++) m.pide.set(clave(id(k, i), id(k, i + 1)), kind);
}

/**
 * A drum about the unit axis `eje` through `o`: [height, radius] steps, `n`
 * sides from `ref`. With `rayas`, every `rayas`th line along it is inked
 * (rings `desde` to `hasta`): hatching that bunches toward the silhouette.
 */
export function tambor(m: Malla, o: V3, eje: V3, ref: V3, perfil: P2[], n: number, s: (q: V3) => number, rayas = 0, desde = 1, hasta = perfil.length - 2, aros: P2[] = []) {
  const u = norm(cross(cross(eje, ref), eje));
  const v = cross(eje, u);
  const largo: number[] = [];
  for (let i = 0; rayas && i < n; i += rayas) largo.push(i);
  const aro = (c: V3, r: number) => Array.from({ length: n }, (_, i) => add(c, add(mul(u, r * Math.cos((i / n) * Math.PI * 2)), mul(v, r * Math.sin((i / n) * Math.PI * 2)))));
  tubo(m, perfil.map(([h, r]) => aro(add(o, mul(eje, h)), r)), s, [], largo, desde, hasta, aros);
}

/** A closed outline with rounded corners, counterclockwise: each corner is [x, y, radius]; arcs in steps of `paso` radians at most. */
export function redondeado(c: [number, number, number][], paso: number): P2[] {
  const out: P2[] = [];
  const n = c.length;
  for (let i = 0; i < n; i++) {
    const [px, py, r] = c[i]!;
    const [ax, ay] = c[(i + n - 1) % n]!;
    const [bx, by] = c[(i + 1) % n]!;
    const lu = Math.hypot(ax - px, ay - py);
    const lv = Math.hypot(bx - px, by - py);
    const ux = (ax - px) / lu;
    const uy = (ay - py) / lu;
    const vx = (bx - px) / lv;
    const vy = (by - py) / lv;
    const A = Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy)));
    const lw = Math.hypot(ux + vx, uy + vy) || 1;
    const d = r / Math.sin(A / 2);
    const cx = px + ((ux + vx) / lw) * d;
    const cy = py + ((uy + vy) / lw) * d;
    const t = r / Math.tan(A / 2);
    const a0 = Math.atan2(py + uy * t - cy, px + ux * t - cx);
    let a1 = Math.atan2(py + vy * t - cy, px + vx * t - cx);
    while (a1 < a0) a1 += Math.PI * 2;
    const k = Math.max(1, Math.ceil((a1 - a0) / paso));
    for (let j = 0; j <= k; j++) {
      const a = a0 + ((a1 - a0) * j) / k;
      out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return out;
}

/** The outline moved in by `d` along its normals (counterclockwise, smooth corners wider than `d`). */
export function adentro(o: P2[], d: number): P2[] {
  const n = o.length;
  return o.map(([x, y], i) => {
    const [ax, ay] = o[(i + n - 1) % n]!;
    const [bx, by] = o[(i + 1) % n]!;
    const l = Math.hypot(bx - ax, by - ay) || 1;
    return [x - ((by - ay) / l) * d, y + ((bx - ax) / l) * d];
  });
}

/**
 * A slab over plane `f`: the outline (counterclockwise from above) moved in at
 * each [inset, height] of `perfil`; its top closes flat or over `cupula` (rings
 * shrunk toward the middle); `alto(u, v, w)` may lift each point (a dome).
 */
export function losa(m: Malla, f: Marco, o: P2[], perfil: P2[], s: (q: V3) => number, alto: (u: number, v: number, w: number) => number = (_u, _v, w) => w, cupula: number[] = []) {
  const anillos = perfil.map(([d, w]) => (d ? adentro(o, d) : o).map(([u, v]) => en(f, u, v, alto(u, v, w))));
  const [d, w] = perfil[perfil.length - 1]!;
  const ultimo = d ? adentro(o, d) : o;
  let cu = 0;
  let cv = 0;
  for (const [u, v] of ultimo) {
    cu += u / ultimo.length;
    cv += v / ultimo.length;
  }
  for (const k of cupula)
    anillos.push(
      ultimo.map(([u, v]) => {
        const a = cu + (u - cu) * k;
        const b = cv + (v - cv) * k;
        return en(f, a, b, alto(a, b, w));
      }),
    );
  tubo(m, anillos, s);
}

/** How a part is inked: the lift off its surface, and the cosines past which an edge is a crease and a hard edge. */
export type Tinta = { lift: number; pliegue: number; duro: number };

/**
 * Inks a part into `out`, skipping edges whose faces both look away from
 * `ojo`: a seam follows the form; a silhouette is a contour; then what the
 * part asks for; then a hard edge is a contour, a softer crease a form line
 * lit through its faces' mean normal. Each line rises `lift` along that mean,
 * so the body never hides it. With `doble`, a silhouette or an edge asked to
 * be a contour is inked twice, the second `doble` out: an outline's weight.
 */
export function aristas(m: Malla, ojo: V3, out: Builder, t: Tinta, doble = 0) {
  const P = m.p;
  const T = m.t;
  const S = m.s;
  const nf = T.length / 3;
  const N = new Float64Array(nf * 3);
  const F = new Uint8Array(nf);
  const q = (i: number): V3 => [P[3 * i]!, P[3 * i + 1]!, P[3 * i + 2]!];
  const Nf = (f: number): V3 => [N[3 * f]!, N[3 * f + 1]!, N[3 * f + 2]!];
  for (let f = 0; f < nf; f++) {
    const a = q(T[3 * f]!);
    const n = cross(sub(q(T[3 * f + 1]!), a), sub(q(T[3 * f + 2]!), a));
    const l = Math.hypot(n[0], n[1], n[2]) || 1;
    for (let k = 0; k < 3; k++) N[3 * f + k] = n[k]! / l;
    F[f] = dot(n, sub(ojo, a)) > 0 ? 1 : 0;
  }
  const visto = new Map<number, number>();
  for (let f = 0; f < nf; f++)
    for (let e = 0; e < 3; e++) {
      const i = T[3 * f + e]!;
      const j = T[3 * f + ((e + 1) % 3)]!;
      const k = clave(i, j);
      const g = visto.get(k);
      if (g === undefined) {
        visto.set(k, f);
        continue;
      }
      if (!F[f] && !F[g]) continue;
      const c = dot(Nf(f), Nf(g));
      const pedido = m.pide.get(k);
      if (pedido === OCULTA) continue;
      let kind: number;
      if (pedido === COSTURA) kind = KIND.forma;
      else if (F[f] !== F[g]) kind = KIND.contorno;
      else if (pedido !== undefined) kind = pedido;
      else if (c < t.duro) kind = KIND.contorno;
      else if (c < t.pliegue) kind = KIND.forma;
      else continue;
      const n = norm(add(Nf(f), Nf(g)));
      const veces = (F[f] !== F[g] || pedido === kind) && kind === KIND.contorno && doble ? 2 : 1;
      // The copy steps out across the line of sight (along a normal half facing the eye it would land on the line).
      const vista = norm(sub(q(i), ojo));
      const o = norm(sub(n, mul(vista, dot(n, vista))));
      for (let v = 0; v < veces; v++) {
        const sobre = (k: number) => add(add(q(k), mul(n, t.lift)), mul(o, v * doble));
        out.seg(sobre(i), sobre(j), S[i]!, S[j]!, m.rnd, kind, n, n);
      }
    }
}
