// A distance field to a triangle mesh: surface nets on a fine grid, followed cell by cell from a seed so the field is
// evaluated only near the surface. Small functions, so the engine optimizes each on its own.
import type { V3 } from "./manos-base";

/** Vertices (xyz), unit normals (xyz) and triangles (three indices each). */
export type Malla = { pos: Float64Array; nrm: Float64Array; tri: Uint32Array };

type Campo = (x: number, y: number, z: number) => number;

/** The grid: size in cells, the field at its points (NaN until needed), each cell's vertex (-1 unseen, -2 queued). */
class Rejilla {
  n: V3;
  val: Float32Array;
  vid: Int32Array;
  constructor(
    private f: Campo,
    readonly lo: V3,
    hi: V3,
    readonly h: number,
  ) {
    this.n = [0, 1, 2].map((i) => Math.ceil((hi[i]! - lo[i]!) / h)) as V3;
    this.val = new Float32Array((this.n[0] + 1) * (this.n[1] + 1) * (this.n[2] + 1)).fill(NaN);
    this.vid = new Int32Array(this.n[0] * this.n[1] * this.n[2]).fill(-1);
  }
  V(i: number, j: number, k: number) {
    const p = (i * (this.n[1] + 1) + j) * (this.n[2] + 1) + k;
    let v = this.val[p]!;
    if (v !== v) v = this.val[p] = this.f(this.lo[0] + i * this.h, this.lo[1] + j * this.h, this.lo[2] + k * this.h);
    return v;
  }
}

/** The surface where `f` is 0 in lo..hi on a grid of `h`, found from the points `dentro` upward. */
export function mallar(f: Campo, lo: V3, hi: V3, h: number, dentro: V3[]): Malla {
  const R = new Rejilla(f, lo, hi, h);
  const cola: number[] = [];
  for (const p of dentro) {
    const i = Math.floor((p[0] - lo[0]) / h);
    const j = Math.floor((p[1] - lo[1]) / h);
    for (let k = Math.floor((p[2] - lo[2]) / h); k < R.n[2]; k++)
      if (R.V(i, j, k + 1) >= 0) {
        R.vid[(i * R.n[1] + j) * R.n[2] + k] = -2;
        cola.push(i, j, k);
        break;
      }
  }
  const pos = seguir(R, cola);
  const tri = caras(R, cola, pos);
  return { pos, nrm: normales(pos, tri), tri };
}

/** Each crossed cell gets a vertex (its edges' crossings' mean) and queues the cells around each crossed edge; `cola` keeps the crossed cells. */
function seguir(R: Rejilla, cola: number[]): Float64Array {
  const [nx, ny, nz] = R.n;
  const { vid, h, lo } = R;
  const pos: number[] = [];
  const esq = new Float64Array(8);
  let w = 0;
  for (let q = 0; q < cola.length; q += 3) {
    const i = cola[q]!;
    const j = cola[q + 1]!;
    const k = cola[q + 2]!;
    let signo = 0;
    for (let e = 0; e < 8; e++) if ((esq[e] = R.V(i + (e & 1), j + ((e >> 1) & 1), k + (e >> 2))) < 0) signo |= 1 << e;
    if (signo === 0 || signo === 255) continue;
    let x = 0;
    let y = 0;
    let z = 0;
    let n = 0;
    for (let e = 0; e < 8; e++)
      for (let eje = 0; eje < 3; eje++) {
        const b = e | (1 << eje);
        if (b === e || esq[e]! < 0 === esq[b]! < 0) continue;
        const t = esq[e]! / (esq[e]! - esq[b]!);
        const ax = i + (e & 1);
        const ay = j + ((e >> 1) & 1);
        const az = k + (e >> 2);
        x += ax - i + (eje === 0 ? t : 0);
        y += ay - j + (eje === 1 ? t : 0);
        z += az - k + (eje === 2 ? t : 0);
        n++;
        for (let du = 0; du < 2; du++)
          for (let dw = 0; dw < 2; dw++) {
            const ci = ax - (eje ? du : 0);
            const cj = ay - (eje === 0 ? du : eje === 2 ? dw : 0);
            const ck = az - (eje === 2 ? 0 : dw);
            if (ci < 0 || cj < 0 || ck < 0 || ci >= nx || cj >= ny || ck >= nz) continue;
            const c = (ci * ny + cj) * nz + ck;
            if (vid[c] === -1) {
              vid[c] = -2;
              cola.push(ci, cj, ck);
            }
          }
      }
    vid[(i * ny + j) * nz + k] = pos.length / 3;
    pos.push(lo[0] + (i + x / n) * h, lo[1] + (j + y / n) * h, lo[2] + (k + z / n) * h);
    cola[w++] = i;
    cola[w++] = j;
    cola[w++] = k;
  }
  cola.length = w;
  return new Float64Array(pos);
}

/** A quad around each crossed edge, joining the four cells that share it, split along its shorter diagonal. */
function caras(R: Rejilla, celdas: number[], pos: Float64Array): Uint32Array {
  const [, ny, nz] = R.n;
  const vid = R.vid;
  const tri: number[] = [];
  for (let q = 0; q < celdas.length; q += 3) {
    const i = celdas[q]!;
    const j = celdas[q + 1]!;
    const k = celdas[q + 2]!;
    const v0 = R.V(i, j, k);
    for (let eje = 0; eje < 3; eje++) {
      if (v0 < 0 === R.V(i + +(eje === 0), j + +(eje === 1), k + +(eje === 2)) < 0) continue;
      const o = 9 * eje;
      if (i + VECINOS[o + 3]! < 0 || j + VECINOS[o + 4]! < 0 || k + VECINOS[o + 5]! < 0) continue;
      const a = vid[(i * ny + j) * nz + k]!;
      const b = vid[((i + VECINOS[o]!) * ny + j + VECINOS[o + 1]!) * nz + k + VECINOS[o + 2]!]!;
      const c = vid[((i + VECINOS[o + 3]!) * ny + j + VECINOS[o + 4]!) * nz + k + VECINOS[o + 5]!]!;
      const d = vid[((i + VECINOS[o + 6]!) * ny + j + VECINOS[o + 7]!) * nz + k + VECINOS[o + 8]!]!;
      if (a < 0 || b < 0 || c < 0 || d < 0) continue;
      const p = v0 < 0 ? b : d;
      const r = v0 < 0 ? d : b;
      if (d2(pos, a, c) <= d2(pos, p, r)) tri.push(a, p, c, a, c, r);
      else tri.push(a, p, r, p, c, r);
    }
  }
  return new Uint32Array(tri);
}
const VECINOS = Int8Array.of(0, -1, 0, 0, -1, -1, 0, 0, -1, 0, 0, -1, -1, 0, -1, -1, 0, 0, -1, 0, 0, -1, -1, 0, 0, -1, 0);
const d2 = (P: Float64Array, x: number, y: number) =>
  (P[3 * x]! - P[3 * y]!) ** 2 + (P[3 * x + 1]! - P[3 * y + 1]!) ** 2 + (P[3 * x + 2]! - P[3 * y + 2]!) ** 2;

/** Each vertex's normal: its triangles', weighted by area. */
function normales(P: Float64Array, tri: Uint32Array): Float64Array {
  const N = new Float64Array(P.length);
  for (let t = 0; t < tri.length; t += 3) {
    const a = 3 * tri[t]!;
    const b = 3 * tri[t + 1]!;
    const c = 3 * tri[t + 2]!;
    const ux = P[b]! - P[a]!;
    const uy = P[b + 1]! - P[a + 1]!;
    const uz = P[b + 2]! - P[a + 2]!;
    const vx = P[c]! - P[a]!;
    const vy = P[c + 1]! - P[a + 1]!;
    const vz = P[c + 2]! - P[a + 2]!;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (let q = 0; q < 3; q++) {
      const o = q === 0 ? a : q === 1 ? b : c;
      N[o] += nx;
      N[o + 1] += ny;
      N[o + 2] += nz;
    }
  }
  for (let i = 0; i < N.length; i += 3) {
    const l = Math.hypot(N[i]!, N[i + 1]!, N[i + 2]!) || 1;
    for (let q = i; q < i + 3; q++) N[q] /= l;
  }
  return N;
}

type G = [number, number, number, number];
const E = 0.0012;
/** f's gradient (g[0..2]) and value (g[3]) at a point, from four samples on a tetrahedron. */
export function gradiente(f: Campo, x: number, y: number, z: number, g: G) {
  const a = f(x + E, y - E, z - E);
  const b = f(x - E, y - E, z + E);
  const c = f(x - E, y + E, z - E);
  const d = f(x + E, y + E, z + E);
  g[0] = (a - b - c + d) / (4 * E);
  g[1] = (-a - b + c + d) / (4 * E);
  g[2] = (-a + b - c + d) / (4 * E);
  g[3] = (a + b + c + d) / 4;
}
