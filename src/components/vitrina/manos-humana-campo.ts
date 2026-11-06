// The hand as a signed distance field: bones with a rounded-rectangle section, ellipsoids, an elliptic tube for the
// forearm, joined with a smooth minimum. A coarse grid lists the pieces near each cell, so a point visits only those.
import type { V3 } from "./manos-base";

const LEJOS = 1e9;
/** Per piece: type, group, k, frame, its own numbers, then a capsule around it (from, length, radius, culling radius²). */
const PASO = 31;
/** Group 0 is the palm and forearm; then each finger and the thumb, joined to it softly near their base. */
const GRUPOS = 6;

/** A point, the axis a piece runs along, its lateral (toward the thumb) and dorsal directions. */
export type Marco = { o: V3; d: V3; l: V3; n: V3 };
/** Half width, dorsal and palmar half thickness, corner radius. */
export type Seccion = number[];

/**
 * The forearm at `x` back from the wrist: half width (k 1) and thickness (k 2), and how far its centre moves toward
 * the thumb (k 3) and the back (k 4) as the muscles swell, so the ulnar border runs straight.
 */
export function perfil(x: number, k: number): number {
  const s = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  const a = 0.07 * s((x - 0.15) / 0.9);
  const b = 0.06 * s((x - 0.05) / 0.9);
  return k === 1 ? 0.137 + a : k === 2 ? 0.087 + b : k === 3 ? a : b / 2;
}

const smin = (a: number, b: number, k: number) => {
  const m = a < b ? a : b;
  if (k <= 0) return m;
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return m - h * h * k * 0.25;
};

export class Campo {
  private D: number[] = [];
  private caja: number[] = [];
  /** Per group: base, axis, and how softly it joins (k, fading from t0 to t1 along the axis). */
  private union: number[][] = [];
  private dg = new Float64Array(GRUPOS);
  private B = new Float64Array(0);
  private F = new Float64Array(0);
  private g0: V3 = [0, 0, 0];
  private gn = [1, 1, 1];
  private inicio = new Int32Array(1);
  private lista = new Int32Array(0);
  private static C = 0.04;

  private pon(tipo: number, g: number, k: number, m: Marco, datos: number[], lo: V3, hi: V3, a: number, b: number, r: number) {
    this.D.push(tipo, g, k, ...m.o, ...m.d, ...m.l, ...m.n, ...datos);
    while (this.D.length % PASO < 27) this.D.push(0);
    this.D.push(a, b - a, r, 0);
    this.caja.push(...lo, ...hi);
  }

  /** A bone along m.d for `L`, its section from s0 to s1, narrower by `cintura` midway, its ends rounded by c0 and c1. */
  pieza(g: number, k: number, m: Marco, L: number, s0: Seccion, s1: Seccion, c0: number, c1: number, cintura = 0) {
    const r = Math.max(...s0, ...s1, c0, c1);
    const b: V3 = [m.o[0] + m.d[0] * L, m.o[1] + m.d[1] * L, m.o[2] + m.d[2] * L];
    const lo = [0, 1, 2].map((i) => Math.min(m.o[i]!, b[i]!) - r) as V3;
    this.pon(0, g, k, m, [L, ...s0, ...s1, c0, c1, cintura], lo, [0, 1, 2].map((i) => Math.max(m.o[i]!, b[i]!) + r) as V3, 0, L, r * 1.42);
  }

  /** An ellipsoid centred at m.o, with radii r along m.d, m.l and m.n. */
  elipsoide(g: number, k: number, m: Marco, r: V3) {
    const x = Math.max(...r);
    this.pon(1, g, k, m, r, m.o.map((v) => v - x) as V3, m.o.map((v) => v + x) as V3, 0, 0, x);
  }

  /** The forearm: an elliptic tube back along m.d, ending `e` past the wrist, rounded by `rc`. */
  antebrazo(m: Marco, e: number, rc: number, lo: V3, hi: V3) {
    this.pon(2, 0, 0, m, [e, rc], lo, hi, -e - rc, 3, 0.3);
  }

  unir(g: number, o: V3, d: V3, k: number, t0: number, t1: number) {
    this.union[g] = [...o, ...d, k, t0, t1];
  }

  /** The grid of piece lists; each piece's box grows by its k and by `banda`, how far off the skin the field must be right. */
  cerrar(lo: V3, hi: V3, banda: number) {
    const C = Campo.C;
    const n = this.caja.length / 6;
    this.F = new Float64Array(this.D);
    this.g0 = lo;
    this.gn = [0, 1, 2].map((i) => Math.max(1, Math.ceil((hi[i]! - lo[i]!) / C)));
    const [nx, ny, nz] = this.gn as V3;
    const celdas: number[][] = Array.from({ length: nx * ny * nz }, () => []);
    const B = (this.B = new Float64Array(this.caja));
    for (let i = 0; i < n; i++) {
      const u = this.union[this.D[i * PASO + 1]!];
      const m = Math.max(this.D[i * PASO + 2]!, u ? u[6]! : 0) + banda;
      for (let k = 0; k < 6; k++) B[i * 6 + k] += k < 3 ? -m : m;
      this.F[i * PASO + 30] = (this.F[i * PASO + 29]! + m) ** 2;
      const a = [0, 1, 2].map((k) => Math.max(0, Math.floor((B[i * 6 + k]! - lo[k]!) / C)));
      const z = [0, 1, 2].map((k) => Math.min(this.gn[k]! - 1, Math.floor((B[i * 6 + k + 3]! - lo[k]!) / C)));
      for (let x = a[0]!; x <= z[0]!; x++) for (let y = a[1]!; y <= z[1]!; y++) for (let w = a[2]!; w <= z[2]!; w++) celdas[(x * ny + y) * nz + w]!.push(i);
    }
    this.inicio = new Int32Array(celdas.length + 1);
    celdas.forEach((l, i) => (this.inicio[i + 1] = this.inicio[i]! + l.length));
    this.lista = Int32Array.from(celdas.flat());
  }

  /** The field at a point: negative inside the hand; LEJOS far from every piece. */
  valor(x: number, y: number, z: number): number {
    const C = Campo.C;
    const ix = Math.floor((x - this.g0[0]) / C);
    const iy = Math.floor((y - this.g0[1]) / C);
    const iz = Math.floor((z - this.g0[2]) / C);
    const [nx, ny, nz] = this.gn as V3;
    if (ix < 0 || iy < 0 || iz < 0 || ix >= nx || iy >= ny || iz >= nz) return LEJOS;
    const cel = (ix * ny + iy) * nz + iz;
    const D = this.F;
    const B = this.B;
    const dg = this.dg;
    dg.fill(LEJOS);
    for (let j = this.inicio[cel]!, fin = this.inicio[cel + 1]!; j < fin; j++) {
      const i = this.lista[j]!;
      const b = i * 6;
      if (x < B[b]! || y < B[b + 1]! || z < B[b + 2]! || x > B[b + 3]! || y > B[b + 4]! || z > B[b + 5]!) continue;
      const o = i * PASO;
      // The point in the piece's frame: along its axis, across, and up its back.
      const qx = x - D[o + 3]!;
      const qy = y - D[o + 4]!;
      const qz = z - D[o + 5]!;
      const w = qx * D[o + 6]! + qy * D[o + 7]! + qz * D[o + 8]!;
      const tc = w < D[o + 27]! ? D[o + 27]! : w > D[o + 27]! + D[o + 28]! ? D[o + 27]! + D[o + 28]! : w;
      if ((qx - D[o + 6]! * tc) ** 2 + (qy - D[o + 7]! * tc) ** 2 + (qz - D[o + 8]! * tc) ** 2 > D[o + 30]!) continue;
      const u = qx * D[o + 9]! + qy * D[o + 10]! + qz * D[o + 11]!;
      const v = qx * D[o + 12]! + qy * D[o + 13]! + qz * D[o + 14]!;
      const tipo = D[o]!;
      const d =
        tipo === 0
          ? pieza(D, o + 15, w, u, v)
          : tipo === 1
            ? elipsoide(D[o + 15]!, D[o + 16]!, D[o + 17]!, w, u, v)
            : antebrazo(D[o + 15]!, D[o + 16]!, w, u, v);
      dg[D[o + 1]!] = smin(dg[D[o + 1]!]!, d, D[o + 2]!);
    }
    let d = dg[0]!;
    for (let g = 1; g < GRUPOS; g++) {
      const dd = dg[g]!;
      if (dd >= LEJOS) continue;
      const u = this.union[g]!;
      const t = Math.min(1, Math.max(0, ((x - u[0]!) * u[3]! + (y - u[1]!) * u[4]! + (z - u[2]!) * u[5]! - u[7]!) / (u[8]! - u[7]!)));
      d = smin(d, dd, u[6]! * (1 - t * t * (3 - 2 * t)));
    }
    return d;
  }
}

/** A section at distance d2 run along an axis, its ends rounded by rc. */
const redondo = (d2: number, ez: number, rc: number) => {
  const ds = d2 + rc;
  const m = ds > 0 ? ds : 0;
  const n = ez > 0 ? ez : 0;
  return Math.sqrt(m * m + n * n) + Math.min(Math.max(ds, ez), 0) - rc;
};

// A bone: a rounded rectangle, flatter on the back, swept along a segment, tapering, with a waist.
function pieza(D: Float64Array, o: number, w: number, u: number, v: number) {
  const L = D[o]!;
  const t = w <= 0 ? 0 : w >= L ? 1 : w / L;
  const q = 1 - D[o + 11]! * 4 * t * (1 - t);
  const r = (D[o + 4]! + (D[o + 8]! - D[o + 4]!) * t) * q;
  const j = v > 0 ? 2 : 3;
  const ux = Math.abs(u) - ((D[o + 1]! + (D[o + 5]! - D[o + 1]!) * t) * q - r);
  const vy = Math.abs(v) - ((D[o + j]! + (D[o + j + 4]! - D[o + j]!) * t) * q - r);
  const mx = ux > 0 ? ux : 0;
  const my = vy > 0 ? vy : 0;
  const wc = w - L / 2;
  return redondo(Math.sqrt(mx * mx + my * my) + Math.min(Math.max(ux, vy), 0) - r, Math.abs(wc) - L / 2, wc < 0 ? D[o + 9]! : D[o + 10]!);
}

// The usual first-order distance to an ellipsoid (exact on its surface).
function elipsoide(ra: number, rb: number, rc: number, w: number, u: number, v: number) {
  const a = w / ra;
  const b = u / rb;
  const c = v / rc;
  const k0 = Math.sqrt(a * a + b * b + c * c);
  const k1 = Math.sqrt((a / ra) * (a / ra) + (b / rb) * (b / rb) + (c / rc) * (c / rc));
  return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -Math.min(ra, rb, rc);
}

// An ellipse that grows toward the elbow, ending inside the carpus.
const antebrazo = (e: number, rc: number, w: number, u: number, v: number) =>
  redondo(elipsoide(1, perfil(w, 1), perfil(w, 2), 0, u - perfil(w, 3), v - perfil(w, 4)), -w - e, rc);
