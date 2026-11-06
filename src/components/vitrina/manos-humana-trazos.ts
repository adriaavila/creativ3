// Level lines of a value given per vertex of a triangle mesh (marching triangles), chained into polylines in order,
// so each line can draw itself in as one stroke.
import type { Malla } from "./manos-humana-malla";

/** The mesh's edges (two vertices each) and, per triangle, its three edges. */
export type Aristas = { a: Int32Array; b: Int32Array; te: Int32Array };

export function aristas(m: Malla): Aristas {
  const nt = m.tri.length / 3;
  let cap = 1;
  while (cap < nt * 4) cap <<= 1;
  const ka = new Int32Array(cap).fill(-1);
  const kb = new Int32Array(cap);
  const id = new Int32Array(cap);
  const a: number[] = [];
  const b: number[] = [];
  const te = new Int32Array(nt * 3);
  for (let t = 0; t < nt; t++)
    for (let e = 0; e < 3; e++) {
      let x = m.tri[3 * t + e]!;
      let y = m.tri[3 * t + ((e + 1) % 3)]!;
      if (x > y) [x, y] = [y, x];
      let h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) & (cap - 1);
      while (ka[h] !== -1 && (ka[h] !== x || kb[h] !== y)) h = (h + 1) & (cap - 1);
      if (ka[h] === -1) {
        ka[h] = x;
        kb[h] = y;
        id[h] = a.length;
        a.push(x);
        b.push(y);
      }
      te[3 * t + e] = id[h]!;
    }
  return { a: new Int32Array(a), b: new Int32Array(b), te };
}

/** A level line: its level, its points (each on an edge at `t` from its first vertex), the triangle each piece crosses. */
export type Curva = { k: number; arista: number[]; t: number[]; tri: number[] };

/** The lines where `val` crosses k·paso for every whole k, across the triangles `sirve` keeps. */
export function niveles(m: Malla, A: Aristas, val: ArrayLike<number>, paso: number, sirve: (tri: number) => boolean): Curva[] {
  const ne = A.a.length;
  const k0 = new Int32Array(ne);
  const base = new Int32Array(ne + 1);
  for (let e = 0; e < ne; e++) {
    const x = val[A.a[e]!]! / paso;
    const y = val[A.b[e]!]! / paso;
    const lo = Math.floor(Math.min(x, y)) + 1;
    const hi = Math.ceil(Math.max(x, y)) - 1;
    k0[e] = lo;
    base[e + 1] = base[e]! + Math.max(0, hi - lo + 1);
  }
  const np = base[ne]!;
  const v0 = new Int32Array(np).fill(-1);
  const v1 = new Int32Array(np).fill(-1);
  const t0 = new Int32Array(np);
  const t1 = new Int32Array(np);
  const lado = (p: number, q: number, t: number) => {
    if (v0[p]! < 0) {
      v0[p] = q;
      t0[p] = t;
    } else {
      v1[p] = q;
      t1[p] = t;
    }
  };
  const punto = (e: number, k: number) => (k >= k0[e]! && k < k0[e]! + base[e + 1]! - base[e]! ? base[e]! + k - k0[e]! : -1);
  const nt = m.tri.length / 3;
  for (let t = 0; t < nt; t++) {
    if (!sirve(t)) continue;
    const fa = val[m.tri[3 * t]!]! / paso;
    const fb = val[m.tri[3 * t + 1]!]! / paso;
    const fc = val[m.tri[3 * t + 2]!]! / paso;
    const lo = Math.floor(Math.min(fa, fb, fc)) + 1;
    const hi = Math.ceil(Math.max(fa, fb, fc)) - 1;
    for (let k = lo; k <= hi; k++) {
      let p = -1;
      let q = -1;
      for (let e = 0; e < 3; e++) {
        const x = punto(A.te[3 * t + e]!, k);
        if (x < 0) continue;
        if (p < 0) p = x;
        else q = x;
      }
      if (q >= 0) {
        lado(p, q, t);
        lado(q, p, t);
      }
    }
  }
  // Walk each chain from one of its ends; what is left are closed loops.
  const visto = new Uint8Array(np);
  const curvas: Curva[] = [];
  const pid = (p: number) => {
    let lo = 0;
    let hi = ne;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (base[mid + 1]! <= p) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  const andar = (p0: number) => {
    const e0 = pid(p0);
    const c: Curva = { k: k0[e0]! + p0 - base[e0]!, arista: [], t: [], tri: [] };
    let prev = -1;
    let p = p0;
    while (p >= 0) {
      const e = pid(p);
      const k = k0[e]! + p - base[e]!;
      const ya = visto[p];
      visto[p] = 1;
      const fa = val[A.a[e]!]!;
      const fb = val[A.b[e]!]!;
      c.arista.push(e);
      c.t.push((k * paso - fa) / (fb - fa));
      if (ya) break;
      const otro = v0[p] !== prev;
      const n = otro ? v0[p]! : v1[p]!;
      if (n >= 0) c.tri.push(otro ? t0[p]! : t1[p]!);
      prev = p;
      p = n;
    }
    if (c.arista.length > 1) curvas.push(c);
  };
  for (let p = 0; p < np; p++) if (!visto[p] && v0[p]! >= 0 && v1[p]! < 0) andar(p);
  for (let p = 0; p < np; p++) if (!visto[p] && v0[p]! >= 0) andar(p);
  return curvas;
}
