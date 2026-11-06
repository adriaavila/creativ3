// The human hand in lines of light along its skin, like an engraver's hatching: a distance field (-campo.ts) made into
// a mesh (-malla.ts), and on it level lines (-trazos.ts): fibers along the fingers, the contour, nails and creases.
// Built with x toward the fingers, y toward the thumb, z out of the back (1 unit ≈ 22 cm).
import { Builder, Cuerpo, GIRO_HUMANA, KIND, TIRAS, cross, dot, encuadre, norm, ojoLocal, rng, smooth, sub, type Lines, type Solido, type V3 } from "./manos-base";
import { Campo, perfil, type Marco, type Seccion } from "./manos-humana-campo";
import { gradiente, mallar, type Malla } from "./manos-humana-malla";
import { aristas, niveles, type Aristas, type Curva } from "./manos-humana-trazos";

/**
 * Curl per joint: the index reaching, the others hanging in a cascade, bending most at the middle joint. The thumb
 * leans in toward the index, its tip bent.
 */
const POSE = { dedos: [0.04, 0.12, 0.1, 0.3, 0.5, 0.22, 0.35, 0.6, 0.26, 0.4, 0.7, 0.3], pulgar: [0.12, 0.38], tilt: 0.08, arm: 0.02 };
const S_MUNECA = 0.34;
const BRAZO = 2.7;
const O_BRAZO: V3 = [0, 0, 0.005];
const X: V3 = [1, 0, 0];
const Y: V3 = [0, 1, 0];
const Z: V3 = [0, 0, 1];
/** Along the forearm, where the hand's mesh gives way to a tube; and how far a fiber's two halves overlap there. */
const SEAM = 0.12;
const CRUCE = 0.016;
/**
 * Per finger: knuckle, metacarpal base, splay, length from the knuckle (phalanges 1 : 0.62 : 0.5), half width, how far
 * its curl leans toward the little finger (so the bend shows from above). The knuckles arc: the middle farthest out.
 */
const DEDOS: [V3, V3, number, number, number, number][] = [
  [[0.381, 0.15, 0.008], [0.06, 0.085, 0.012], 0.05, 0.425, 0.0455, 0.15],
  [[0.4, 0.05, 0.012], [0.065, 0.028, 0.014], 0, 0.455, 0.0466, 0.55],
  [[0.373, -0.048, 0.006], [0.06, -0.03, 0.012], -0.03, 0.43, 0.0432, 0.55],
  [[0.328, -0.14, -0.008], [0.055, -0.085, 0.005], -0.06, 0.345, 0.0375, 0.6],
];
/** Metacarpal and phalanges, in half widths: sections at both ends (width, back, palm, corner), waist. Nearly straight sided. */
type Plantilla = [Seccion, Seccion, number];
const FAL: Plantilla[] = [
  [[0.6, 0.62, 0.66, 0.5], [0.66, 0.66, 0.7, 0.54], 0],
  [[1.03, 0.66, 0.9, 0.58], [1, 0.66, 0.84, 0.56], 0.01],
  [[0.97, 0.64, 0.82, 0.56], [0.9, 0.6, 0.76, 0.52], 0.01],
  [[0.89, 0.58, 0.76, 0.5], [0.86, 0.46, 0.78, 0.46], 0],
];
const PULGAR: Plantilla[] = [[[0.92, 0.84, 1, 0.64], [0.96, 0.76, 0.92, 0.6], 0], FAL[1]!, [[0.92, 0.62, 0.84, 0.54], [0.92, 0.52, 0.82, 0.5], 0]];
/** How deep under a phalanx's axis its fibers turn about: less follows the form more. */
const HONDO = 0.5;

const mas = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const comb = (a: V3, ka: number, b: V3, kb: number) => mas([a[0] * ka, a[1] * ka, a[2] * ka], b, kb);
const dist = (a: V3, b: V3) => Math.hypot(...sub(a, b));
const perp = (hacia: V3, d: V3) => norm(mas(hacia, d, -dot(hacia, d)));
const recto = (o: V3): Marco => ({ o, d: X, l: Y, n: Z });
const girar = (d: V3, a: number) => {
  const n0 = perp(Z, d);
  return comb(n0, Math.cos(a), cross(n0, d), Math.sin(a));
};

type Falange = Marco & { L: number; a: number; curl: number };

/**
 * The hand's pieces into the field; per bone (H) what the fibers need: φ = c + u across it, or on a phalanx the angle
 * about a point D under its axis, c + R·atan2(u, v + D), so each fiber follows the finger's swell. And the relief
 * the light alone feels (R): the extensor tendons fanning from the wrist to the knuckles, and a vein.
 */
function armar() {
  const campo = new Campo();
  const H: number[] = [];
  const R: number[] = [];
  const dedos: Falange[][] = [];
  const hueso = (a: V3, b: V3, c: number, l: V3, n: V3, sa: number, sb: number, R = 0, D = 0) =>
    H.push(...a, ...norm(sub(b, a)), dist(a, b), c, ...l, ...n, sa, sb, R, D);
  const brazo = norm([-1, -POSE.arm, 0]);
  const lb: V3 = [brazo[1], -brazo[0], 0];
  // The forearm's φ continues the palm's, fitted to the metacarpals, so it widens toward the elbow.
  const my = DEDOS.reduce((x, f) => x + f[1][1], 0) / 4;
  const mc = DEDOS.reduce((x, f) => x + f[0][1], 0) / 4;
  const sig = DEDOS.reduce((x, f) => x + (f[1][1] - my) * (f[0][1] - mc), 0) / DEDOS.reduce((x, f) => x + (f[1][1] - my) ** 2, 0);
  H.push(...O_BRAZO, ...brazo, BRAZO, mc - sig * my, ...lb, ...Z, sig, 0, 0, 0);
  campo.antebrazo({ o: O_BRAZO, d: brazo, l: lb, n: Z }, -0.01, 0.07, [-0.4, -0.3, -0.2], [0.2, 0.36, 0.3]);
  campo.elipsoide(0, 0.05, recto([0.03, 0.005, 0.005]), [0.08, 0.14, 0.078]);
  campo.pieza(0, 0.04, recto([0.01, 0.008, 0]), 0.315, [0.135, 0.06, 0.062, 0.05], [0.172, 0.036, 0.055, 0.04], 0.05, 0.04);

  /** A finger: metacarpal from b to m, knuckle, phalanges curling from d0 toward −en, kept upright to `up`. */
  const dedo = (g: number, b: V3, m: V3, nm: V3, d0: V3, en: V3, up: V3, curl: number[], L: number[], w: number, P: Plantilla[], c: number) => {
    const dm = norm(sub(m, b));
    const n0 = perp(nm, dm);
    const fm: Marco = { o: b, d: dm, l: cross(n0, dm), n: n0 };
    const sc = (x: Seccion) => x.map((v) => v * w);
    const pulgar = g === 5;
    campo.pieza(pulgar ? 5 : 0, pulgar ? 0 : 0.03, fm, dist(m, b), sc(P[0]![0]), sc(P[0]![1]), 0.6 * w, 0.6 * w);
    // The knuckle rises as its finger bends.
    const nk = mas(m, dm, -0.01);
    campo.elipsoide(pulgar ? 5 : 0, 0.012, { ...fm, o: comb(nk, 1, n0, 0.014 + 0.014 * curl[0]!) }, [0.66 * w, 0.62 * w, 0.6 * w]);
    // Its extensor tendon, from the middle of the wrist to the knuckle (none to the little finger, too faint).
    if (g > 0 && g < 4) R.push(0.03, 0.035 * (2 - g), nk[0] - 0.02, nk[1], 0.018, 0.024, 0.25, 0.4);
    const total = dist(b, O_BRAZO) + dist(m, b) + L.reduce((x, y) => x + y);
    let arco = dist(b, O_BRAZO);
    const s = (x: number) => S_MUNECA + ((1 - S_MUNECA) * x) / total;
    hueso(b, m, c, fm.l, n0, s(arco), s((arco += dist(m, b))));
    let p = m;
    let ang = 0;
    const fr: Falange[] = [];
    L.forEach((Lj, j) => {
      ang += curl[j]!;
      const d = comb(d0, Math.cos(ang), en, -Math.sin(ang));
      const n = perp(up, d);
      const l = cross(n, d);
      const [s0, s1, cin] = P[j + 1]!;
      const ult = j === L.length - 1;
      const a = s1[0]! * w;
      const tip = ult ? a * 0.85 : 0;
      // On past the joint by as much as its bend opens the back, so a bent knuckle is round, not notched.
      const e = ult ? -tip : s1[1]! * w * Math.tan(curl[j + 1]! / 2) + 0.004;
      campo.pieza(g, j ? 0.004 : 0, { o: p, d, l, n }, Lj + e, sc(s0), sc(s1), 0.5 * w, ult ? tip : 0.5 * w, cin);
      fr.push({ o: p, d, l, n, L: Lj, a: ((s0[0]! + s1[0]!) / 2) * w, curl: curl[j]! });
      const q = mas(p, d, Lj);
      const alto = ((s0[1]! + s1[1]!) / 2) * w;
      hueso(p, q, c, l, n, s(arco), s((arco += Lj)), (1 + HONDO) * alto, HONDO * alto);
      if (ult) campo.elipsoide(g, 0.012, { o: comb(mas(p, d, 0.55 * Lj), 1, n, -0.3 * a), d, l, n }, [0.85 * a, (pulgar ? 0.92 : 0.84) * a, (pulgar ? 0.66 : 0.56) * a]);
      p = q;
    });
    dedos.push(fr);
  };
  DEDOS.forEach(([m, b, a, L, w, baja], i) => {
    const d0: V3 = [Math.cos(a), Math.sin(a), 0];
    campo.unir(i + 1, m, d0, 0.02, -0.02, 0.04);
    dedo(i + 1, b, m, Z, d0, perp(norm([0, baja, 1]), d0), Z, POSE.dedos.slice(3 * i, 3 * i + 3), [1, 0.62, 0.5].map((k) => (k * L) / 2.12), w, FAL, m[1]);
  });
  // The thumb, nail turned out, leaning in so the gap to the index closes in a V; its web joins softly past the knuckle.
  const tb: V3 = [0.03, 0.105, -0.02];
  const tdm = norm([0.78, 0.6, -0.18]);
  const td0 = norm([0.95, 0.34, -0.02]);
  campo.unir(5, tb, tdm, 0.04, 0.2, 0.38);
  const en = girar(td0, 1.15);
  dedo(5, tb, mas(tb, tdm, 0.21), girar(tdm, 0.9), td0, en, en, POSE.pulgar, [0.152, 0.132], 0.05, PULGAR, 0.28);
  // Thenar, hypothenar, the first dorsal interosseous, the ulnar head.
  const nt = girar(tdm, 0.44);
  campo.elipsoide(0, 0.04, { o: mas(mas(tb, tdm, 0.09), [0, -0.03, -0.035]), d: tdm, l: cross(nt, tdm), n: nt }, [0.11, 0.065, 0.05]);
  campo.elipsoide(0, 0.04, recto([0.16, -0.132, -0.025]), [0.15, 0.055, 0.05]);
  const ei = norm([0.8, 0.55, -0.1]);
  campo.elipsoide(0, 0.04, { o: [0.15, 0.16, -0.01], d: ei, l: cross(Z, ei), n: Z }, [0.08, 0.04, 0.032]);
  campo.elipsoide(0, 0.04, recto([-0.02, -0.118, 0.03]), [0.045, 0.03, 0.028]);
  // A vein from the thumb's web toward the wrist.
  R.push(0.25, 0.165, -0.01, 0.075, 0.007, 0.012, 0.2, 0.3);
  return { campo, H: Float64Array.from(H), R: Float64Array.from(R), dedos, brazo, lb };
}

/** The scene's light in the hand's frame, undone as ojoLocal does for the eye. */
function luzLocal(small: boolean): V3 {
  const t = small ? TIRAS.compacta : TIRAS.ancha;
  const gira = (v: V3, a: number, i: number, j: number): V3 => {
    const o: V3 = [...v];
    o[i] = v[i] * Math.cos(a) - v[j] * Math.sin(a);
    o[j] = v[i] * Math.sin(a) + v[j] * Math.cos(a);
    return o;
  };
  return gira(gira(gira(norm([-0.38, 0.62, 0.69]), -encuadre(t.w, t.h).giro, 0, 1), -GIRO_HUMANA[0], 1, 2), -GIRO_HUMANA[1], 2, 0);
}

/** s along the forearm: 0.3 per unit near the wrist, less off frame. */
const sBrazo = (x: number) => {
  if (x <= 0) return S_MUNECA - x * 0.77;
  const g = (y: number) => 0.3 * Math.min(y, 1) + 0.1 * Math.max(0, y - 1);
  return S_MUNECA * (1 - g(x) / g(BRAZO));
};

const HB = 18;
const QB = new Float64Array(32);
/** φ, s and how much a point belongs to the fingers: each bone's, weighted by 1/distance⁶. */
function campos(H: Float64Array, x: number, y: number, z: number, out: number[]) {
  let qmin = 1e9;
  for (let o = 0, i = 0; o < H.length; o += HB, i++) {
    const qx = x - H[o]!;
    const qy = y - H[o + 1]!;
    const qz = z - H[o + 2]!;
    const w0 = qx * H[o + 3]! + qy * H[o + 4]! + qz * H[o + 5]!;
    const t = w0 <= 0 ? 0 : w0 >= H[o + 6]! ? H[o + 6]! : w0;
    const q = (QB[i] = (qx - H[o + 3]! * t) ** 2 + (qy - H[o + 4]! * t) ** 2 + (qz - H[o + 5]! * t) ** 2 + 6.4e-5);
    if (q < qmin) qmin = q;
  }
  let W = 0;
  let F = 0;
  let S = 0;
  let D = 0;
  for (let o = 0, i = 0; o < H.length; o += HB, i++) {
    // Past 22 times the nearest's, a bone weighs under 1e-4 of it.
    const q = QB[i]!;
    if (q > 22 * qmin) continue;
    const w = 1 / (q * q * q);
    const qx = x - H[o]!;
    const qy = y - H[o + 1]!;
    const qz = z - H[o + 2]!;
    const w0 = qx * H[o + 3]! + qy * H[o + 4]! + qz * H[o + 5]!;
    const u = qx * H[o + 8]! + qy * H[o + 9]! + qz * H[o + 10]!;
    const R = H[o + 16]!;
    W += w;
    if (!o) {
      F += w * (H[7]! + (H[14]! * (u - perfil(w0, 3)) * perfil(0, 1)) / perfil(w0, 1));
      S += w * sBrazo(w0);
      continue;
    }
    if (R) D += w;
    F += w * (H[o + 7]! + (R ? R * Math.atan2(u, qx * H[o + 11]! + qy * H[o + 12]! + qz * H[o + 13]! + H[o + 17]!) : u));
    S += w * (H[o + 14]! + (H[o + 15]! - H[o + 14]!) * (w0 <= 0 ? 0 : w0 >= H[o + 6]! ? 1 : w0 / H[o + 6]!));
  }
  out[0] = F / W;
  out[1] = Math.max(0, S / W);
  out[2] = D / W;
}

/** The tilt the relief gives a normal (x, y, z): each ridge's flanks lean away from it, on the back of the hand only. */
function relieve(R: Float64Array, x: number, y: number, n: Float64Array, o: number) {
  let gx = 0;
  let gy = 0;
  for (let r = 0; r < R.length; r += 8) {
    const dx = R[r + 2]! - R[r]!;
    const dy = R[r + 3]! - R[r + 1]!;
    const t = ((x - R[r]!) * dx + (y - R[r + 1]!) * dy) / (dx * dx + dy * dy);
    if (t < 0 || t > 1) continue;
    const ex = x - R[r]! - t * dx;
    const ey = y - R[r + 1]! - t * dy;
    const s2 = R[r + 5]! ** 2;
    const q = (ex * ex + ey * ey) / s2;
    if (q > 9) continue;
    const f = (((2 * R[r + 4]!) / s2) * Math.exp(-q) * smooth(0, R[r + 6]!, t)) * (1 - smooth(1 - R[r + 7]!, 1, t));
    gx -= f * ex;
    gy -= f * ey;
  }
  // The surface gradient (the part along the skin) tilts the normal; it fades as the skin turns off the back.
  const k = smooth(0.3, 0.7, n[o + 2]!);
  const gn = gx * n[o]! + gy * n[o + 1]!;
  const nx = n[o]! - k * (gx - gn * n[o]!);
  const ny = n[o + 1]! - k * (gy - gn * n[o + 1]!);
  const nz = n[o + 2]! + k * gn * n[o + 2]!;
  const l = Math.hypot(nx, ny, nz);
  n[o] = nx / l;
  n[o + 1] = ny / l;
  n[o + 2] = nz / l;
}

/** Margin to the patches the fibers stop at (nails, and creases): below 0 inside one, on the back of its finger. */
function mascara(U: Float64Array, x: number, y: number, z: number) {
  let m = 1;
  for (let o = 0; o < U.length; o += 18) {
    const qx = x - U[o]!;
    const qy = y - U[o + 1]!;
    const qz = z - U[o + 2]!;
    if (qx * qx + qy * qy + qz * qz > U[o + 17]! || qx * U[o + 9]! + qy * U[o + 10]! + qz * U[o + 11]! <= 0) continue;
    const a = qx * U[o + 3]! + qy * U[o + 4]! + qz * U[o + 5]!;
    const u = qx * U[o + 6]! + qy * U[o + 7]! + qz * U[o + 8]!;
    const k = (u / U[o + 14]!) ** 2;
    m = Math.min(m, Math.max(Math.abs(u) - U[o + 14]!, U[o + 12]! + U[o + 15]! * k - a, a - U[o + 13]! + U[o + 16]! * k));
  }
  return m;
}

/** The forearm past the field: an elliptic tube to the elbow, its vertices counted from `v0`. */
function tubo(brazo: V3, lb: V3, desde: number, lados: number, v0: number) {
  const pos: number[] = [];
  const nrm: number[] = [];
  const tri: number[] = [];
  for (let d = desde, r = 0; ; r++) {
    const a = perfil(d, 1);
    const b = perfil(d, 2);
    for (let i = 0; i < lados; i++) {
      const th = (i / lados) * Math.PI * 2;
      pos.push(...mas(mas(O_BRAZO, brazo, d), comb(lb, perfil(d, 3) + a * Math.cos(th), Z, perfil(d, 4) + b * Math.sin(th))));
      nrm.push(...norm(comb(lb, Math.cos(th) / a, Z, Math.sin(th) / b)));
      const o = v0 + (r - 1) * lados;
      const j = (i + 1) % lados;
      if (r) tri.push(o + i, o + j, o + lados + i, o + j, o + lados + j, o + lados + i);
    }
    if (d >= BRAZO) break;
    d = Math.min(BRAZO, d + 0.02 + 0.05 * d);
  }
  return { pos, nrm, tri };
}

type Obra = {
  m: Malla;
  nMano: number;
  H: Float64Array;
  R: Float64Array;
  U: Float64Array;
  paso: number;
  brazo: V3;
  c: number;
  sn: number;
  T: V3;
  ojo: V3;
  L: V3;
  sombra: number;
  small: boolean;
};

/**
 * Per vertex: φ (wandering a little, so the fibers look drawn, not ruled), s, how much it is finger, seam and patch
 * margins, the normal with the relief the light feels (nb); then placed, facing and light.
 */
function vertices({ m, nMano, H, R, U, paso, brazo, c, sn, T, ojo, L }: Obra) {
  const { pos, nrm } = m;
  const nv = pos.length / 3;
  const V = {
    phi: new Float64Array(nv),
    s: new Float64Array(nv),
    fd: new Float64Array(nv),
    cara: new Float64Array(nv),
    ax: new Float64Array(nv),
    luz: new Float64Array(nv),
    una: new Float64Array(nv),
    nb: Float64Array.from(nrm),
  };
  const { phi, s, fd, cara, ax, luz, una, nb } = V;
  const tmp = [0, 0, 0];
  for (let v = 0, o = 0; v < nv; v++, o += 3) {
    const x = pos[o]!;
    const y = pos[o + 1]!;
    const z = pos[o + 2]!;
    campos(H, x, y, z, tmp);
    phi[v] = tmp[0]! + paso * 0.22 * (Math.sin(x * 41 + y * 23 - z * 17 + 1.3) + 0.6 * Math.sin(y * 67 - x * 19 + z * 31 + 4.1));
    s[v] = tmp[1]!;
    fd[v] = tmp[2]!;
    una[v] = v < nMano ? mascara(U, x, y, z) : 1;
    ax[v] = (x - O_BRAZO[0]) * brazo[0] + (y - O_BRAZO[1]) * brazo[1] + (z - O_BRAZO[2]) * brazo[2] - SEAM;
    if (x > -0.05 && x < 0.42 && nb[o + 2]! > 0.3) relieve(R, x, y, nb, o);
    pos[o] = x * c - y * sn + T[0];
    pos[o + 1] = x * sn + y * c + T[1];
    pos[o + 2] = z + T[2];
    for (const n of [nrm, nb]) {
      const nx = n[o]!;
      n[o] = nx * c - n[o + 1]! * sn;
      n[o + 1] = nx * sn + n[o + 1]! * c;
    }
    const ex = pos[o]! - ojo[0];
    const ey = pos[o + 1]! - ojo[1];
    const ez = pos[o + 2]! - ojo[2];
    cara[v] = (nrm[o]! * ex + nrm[o + 1]! * ey + nrm[o + 2]! * ez) / Math.sqrt(ex * ex + ey * ey + ez * ez);
    luz[v] = Math.max(0, Math.min(1, 0.5 + 0.5 * (nrm[o]! * L[0] + nrm[o + 1]! * L[1] + nrm[o + 2]! * L[2]))) ** 2;
  }
  return V;
}
type Vertices = ReturnType<typeof vertices>;

/** Fewest CSS pixels between two fibers on screen: closer, and they read as a slab. */
const HUECO = 1.5;

/**
 * Per triangle: 1 if it faces the eye, 2 if φ is also smooth on it; how far apart its fibers fall, as a share of what
 * they need: in 3D (in shade a fiber on the back needs more room; on the fingers shade only dims them) and on screen,
 * where the skin turns away; and how far up the forearm it is.
 */
function triangulos({ pos, tri }: Malla, { phi, cara, luz, fd, ax }: Vertices, paso: number, e1: V3, e2: V3, px: number) {
  const nt = tri.length / 3;
  const vale = new Uint8Array(nt);
  const sep = new Float64Array(nt);
  const arm = new Float64Array(nt);
  for (let t = 0; t < nt; t++) {
    const a = tri[3 * t]!;
    const b = tri[3 * t + 1]!;
    const d = tri[3 * t + 2]!;
    vale[t] = +(Math.min(cara[a]!, cara[b]!, cara[d]!) < 0.25) * (Math.max(phi[a]!, phi[b]!, phi[d]!) - Math.min(phi[a]!, phi[b]!, phi[d]!) < 6 * paso ? 2 : 1);
    let g11 = 0;
    let g22 = 0;
    let g12 = 0;
    let u1 = 0;
    let v1 = 0;
    let u2 = 0;
    let v2 = 0;
    for (let q = 0; q < 3; q++) {
      const e = pos[3 * b + q]! - pos[3 * a + q]!;
      const f = pos[3 * d + q]! - pos[3 * a + q]!;
      g11 += e * e;
      g22 += f * f;
      g12 += e * f;
      u1 += e * e1[q]!;
      v1 += e * e2[q]!;
      u2 += f * e1[q]!;
      v2 += f * e2[q]!;
    }
    const f1 = phi[b]! - phi[a]!;
    const f2 = phi[d]! - phi[a]!;
    const det = g11 * g22 - g12 * g12;
    const g2 = (f1 * (f1 * g22 - f2 * g12) + f2 * (f2 * g11 - f1 * g12)) / det;
    const l = (luz[a]! + luz[b]! + luz[d]!) / 3;
    const k = (fd[a]! + fd[b]! + fd[d]!) / 3;
    const en3d = det > 0 && g2 > 0 ? ((paso / Math.sqrt(g2)) * (0.4 + 0.6 * l + 0.6 * k * (1 - l))) / (1.6 * paso) : 1;
    // On screen: φ's gradient on the triangle as the eye sees it.
    const dp = u1 * v2 - u2 * v1;
    const gx = (f1 * v2 - f2 * v1) / dp;
    const gy = (f2 * u1 - f1 * u2) / dp;
    const en2d = dp ? (paso * px) / Math.hypot(gx, gy) / (2 * HUECO) : 0;
    sep[t] = Math.min(en3d, en2d);
    arm[t] = (ax[a]! + ax[b]! + ax[d]!) / 3 + SEAM;
  }
  return { vale, sep, arm };
}

// One curve's points: place, normal, s, margins (all, and the seam's alone), kept pieces, arc length.
let P = new Float64Array(0);
let N = P;
let S = P;
let Q = P;
let QS = P;
let D = P;
let LT = P;
let SI = new Uint8Array(0);
const pa: V3 = [0, 0, 0];
const pb: V3 = [0, 0, 0];
const na: V3 = [0, 0, 0];
const nb: V3 = [0, 0, 0];

/** Moves point i along to point o, to where the margin crosses 0. */
function corta(i: number, o: number) {
  if (Q[i]! > 0) return;
  const t = Q[i]! / (Q[i]! - Q[o]!);
  for (let q = 3 * i; q < 3 * i + 3; q++) {
    P[q] += (P[q + 3 * (o - i)]! - P[q]!) * t;
    N[q] += (N[q + 3 * (o - i)]! - N[q]!) * t;
  }
  S[i] += (S[o]! - S[i]!) * t;
}

/** Eases the mesh's zigzag: each point halfway to its neighbours' mean, along the skin (or, for the contour, across the eye's ray). */
function liso(n: number, ojo: V3 | null) {
  let x = P[0]!;
  let y = P[1]!;
  let z = P[2]!;
  for (let o = 3; o < 3 * n - 3; o += 3) {
    let dx = (x + P[o + 3]!) / 2 - P[o]!;
    let dy = (y + P[o + 4]!) / 2 - P[o + 1]!;
    let dz = (z + P[o + 5]!) / 2 - P[o + 2]!;
    let rx = N[o]!;
    let ry = N[o + 1]!;
    let rz = N[o + 2]!;
    if (ojo) {
      rx = P[o]! - ojo[0];
      ry = P[o + 1]! - ojo[1];
      rz = P[o + 2]! - ojo[2];
      const l = Math.sqrt(rx * rx + ry * ry + rz * rz);
      rx /= l;
      ry /= l;
      rz /= l;
    }
    const k = dx * rx + dy * ry + dz * rz;
    dx -= k * rx;
    dy -= k * ry;
    dz -= k * rz;
    x = P[o]!;
    y = P[o + 1]!;
    z = P[o + 2]!;
    P[o] = x + dx / 2;
    P[o + 1] = y + dy / 2;
    P[o + 2] = z + dz / 2;
  }
}

/** The scene's half-Lambert brightness of a normal: what a form line keeps of its alpha. */
const luzDe = (n: V3, L: V3, sombra: number) => sombra + (1 - sombra) * Math.max(0, Math.min(1, 0.5 + 0.5 * dot(n, L))) ** 2;
/** A normal the light shades to `t` of full brightness, turned from n toward or away from the light. */
const tono = (n: V3, t: number, L: V3, sombra: number): V3 => {
  const c = 2 * Math.sqrt(Math.min(1, Math.max(0, (t - sombra) / (1 - sombra)))) - 1;
  return comb(L, c, perp(n, L), Math.sqrt(1 - c * c));
};

/** A curve's points into P, N, S, Q, QS (margins: the seam's; a patch's or a halo's), eased; how many. */
function cargar(o: Obra, A: Aristas, V: Vertices, cv: Curva, contorno: boolean, tapa?: Uint8Array) {
  const { m, nMano, ojo, small } = o;
  const pos = m.pos;
  const nrm = contorno ? m.nrm : V.nb;
  const alza = contorno ? 0.002 : 0;
  const n = cv.arista.length;
  if (S.length < n + 1) {
    P = new Float64Array(6 * n);
    N = new Float64Array(6 * n);
    S = new Float64Array(2 * n);
    Q = new Float64Array(2 * n);
    QS = new Float64Array(2 * n);
    D = new Float64Array(2 * n);
    LT = new Float64Array(2 * n);
    SI = new Uint8Array(2 * n);
  }
  const mano = A.a[cv.arista[0]!]! < nMano;
  // Each level meets its other half at its own place along the seam, so the joins never line up into a visible seam.
  const off = 0.015 + 0.015 * Math.sin(cv.k * 2.4);
  for (let i = 0; i < n; i++) {
    const t = cv.t[i]!;
    const a = A.a[cv.arista[i]!]!;
    const b = A.b[cv.arista[i]!]!;
    let l = 0;
    for (let q = 0; q < 3; q++) l += (N[3 * i + q] = nrm[3 * a + q]! * (1 - t) + nrm[3 * b + q]! * t) ** 2;
    l = 1 / Math.sqrt(l);
    for (let q = 0; q < 3; q++) P[3 * i + q] = pos[3 * a + q]! * (1 - t) + pos[3 * b + q]! * t + (N[3 * i + q] *= l) * alza;
    S[i] = V.s[a]! * (1 - t) + V.s[b]! * t;
    const x = V.ax[a]! * (1 - t) + V.ax[b]! * t;
    // A fiber's halves overlap across the seam, one fading out as the other fades in; the contour's just meet.
    Q[i] = QS[i] = (mano ? off - x : x - off) + (contorno ? -0.0003 : CRUCE / 2);
    if (!contorno) Q[i] = Math.min(Q[i]!, V.una[a]! * (1 - t) + V.una[b]! * t);
    else if (tapa?.[i]) Q[i] = -1;
  }
  for (let p = contorno && !small ? 3 : 2; p--; ) liso(n, contorno ? ojo : null);
  return n;
}

/**
 * Where a contour runs within r CSS pixels (on screen) of a nearer one, it stops, as an engraver leaves a hair of paper
 * where an edge passes under another: at a web the two fingers' edges then never draw one doubled stroke.
 */
function halo(o: Obra, A: Aristas, V: Vertices, curvas: Curva[], e1: V3, e2: V3, f: number, r: number) {
  const vista = cross(e1, e2);
  const u: number[] = [];
  const v: number[] = [];
  const pr: number[] = [];
  const arco: number[] = [];
  const cur: number[] = [];
  const celdas = new Map<number, number[]>();
  const C = 4 * r;
  curvas.forEach((cv, c) => {
    let s = 0;
    for (let i = 0, k = cargar(o, A, V, cv, true); i < k; i++) {
      const q: V3 = [P[3 * i]! - o.ojo[0], P[3 * i + 1]! - o.ojo[1], P[3 * i + 2]! - o.ojo[2]];
      const z = dot(q, vista);
      const n = u.length;
      u.push((f * dot(q, e1)) / z);
      v.push((f * dot(q, e2)) / z);
      pr.push(Math.hypot(...q));
      if (i) s += Math.hypot(u[n]! - u[n - 1]!, v[n]! - v[n - 1]!);
      arco.push(s);
      // Past the seam a curve isn't drawn: it neither hides nor is hidden.
      cur.push(Q[i]! > 0 ? c : -1);
      if (!i || cur[n] < 0 || cur[n - 1] !== c) continue;
      // Each segment into the cells its box (grown by r) touches.
      for (let x = Math.floor((Math.min(u[n]!, u[n - 1]!) - r) / C); x <= Math.floor((Math.max(u[n]!, u[n - 1]!) + r) / C); x++)
        for (let y = Math.floor((Math.min(v[n]!, v[n - 1]!) - r) / C); y <= Math.floor((Math.max(v[n]!, v[n - 1]!) + r) / C); y++) {
          const key = x * 65536 + y;
          const l = celdas.get(key);
          if (l) l.push(n);
          else celdas.set(key, [n]);
        }
    }
  });
  const out = curvas.map((cv) => new Uint8Array(cv.arista.length));
  for (let p = 0, c = 0, i = 0; p < u.length; p++, i++) {
    if (i === curvas[c]!.arista.length) {
      c++;
      i = 0;
    }
    if (cur[p] !== c) continue;
    for (const n of celdas.get(Math.floor(u[p]! / C) * 65536 + Math.floor(v[p]! / C)) ?? []) {
      if (cur[n] === c && Math.abs(arco[n]! - arco[p]!) < 3 * r) continue;
      const dx = u[n]! - u[n - 1]!;
      const dy = v[n]! - v[n - 1]!;
      const t = Math.max(0, Math.min(1, ((u[p]! - u[n - 1]!) * dx + (v[p]! - v[n - 1]!) * dy) / (dx * dx + dy * dy || 1)));
      if ((u[n - 1]! + dx * t - u[p]!) ** 2 + (v[n - 1]! + dy * t - v[p]!) ** 2 < r * r && pr[n - 1]! + (pr[n]! - pr[n - 1]!) * t < pr[p]! - 0.003) {
        out[c]![i] = 1;
        break;
      }
    }
  }
  return out;
}

/**
 * Each curve, in the runs where `nota` keeps it (on above 1.1, off below 0.9, so it never breaks into dashes), cut at
 * the seam, a fiber at a patch and the contour (given its halo flags, `tapa`) where it passes under a nearer edge. A
 * fiber enters and leaves like a burin stroke (dimming over `afila` at an end that isn't the seam's) and each is a
 * little brighter or dimmer than the next; the contour is drawn full on the lit side and as a fainter form line in
 * shade, so its edges are lost and found.
 */
function trazar(out: Builder, o: Obra, A: Aristas, V: Vertices, curvas: Curva[], tapa: Uint8Array[] | null, rnd: (c: Curva) => number, nota: (t: number, k: number) => number, minimo: number, afila: number) {
  const { L, sombra, small } = o;
  const contorno = !!tapa;
  for (const [c, cv] of curvas.entries()) {
    const n = cargar(o, A, V, cv, contorno, tapa?.[c]);
    let on = nota(cv.tri[0]!, cv.k) >= 1;
    for (let i = 0; i < n - 1; i++) {
      const x = nota(cv.tri[i]!, cv.k);
      SI[i] = +(on = on ? x >= 0.9 : x >= 1.1);
    }
    SI[n - 1] = 0;
    for (let i = 1; i < n - 2; i++) if (!SI[i] && SI[i - 1] && (SI[i + 1] || SI[i + 2])) SI[i] = 1;
    for (let i = 0; i < n - 1; i++) if (Q[i]! <= 0 && Q[i + 1]! <= 0) SI[i] = 0;
    const r = rnd(cv);
    const brillo = 1 + 0.3 * (((r * 7.31) % 1) - 0.5);
    // The contour's light, eased along it and switched with some slack, so lit and shaded stretches don't flicker.
    if (contorno) {
      for (let i = 0, lit = true; i < n; i++) {
        let l = 0;
        for (let q = Math.max(0, i - 3); q <= Math.min(n - 1, i + 3); q++) l += N[3 * q]! * L[0] + N[3 * q + 1]! * L[1] + N[3 * q + 2]! * L[2];
        l = 0.5 + (0.5 * l) / (Math.min(n - 1, i + 3) - Math.max(0, i - 3) + 1);
        lit = lit ? l > 0.42 : l > 0.48;
        LT[i] = lit ? 2 : l;
      }
      // A lit stretch too short to read as an edge (a hair where two fingers meet) stays in shade.
      for (let i = 0, j = 0; i < n; i = j + 1) {
        let d = 0;
        for (j = i; LT[i] === 2 && j + 1 < n && LT[j + 1] === 2 && Q[j + 1]! > 0; j++) d += Math.hypot(P[3 * j + 3]! - P[3 * j]!, P[3 * j + 4]! - P[3 * j + 1]!, P[3 * j + 5]! - P[3 * j + 2]!);
        if (LT[i] === 2 && d < minimo) for (let q = i; q <= j; q++) LT[q] = 0.45;
      }
    }
    for (let i = 0, j = 0; i < n - 1; i = j) {
      D[i] = 0;
      for (j = i; j < n - 1 && SI[j] && (j === i || Q[j]! > 0); j++)
        D[j + 1] = D[j]! + Math.hypot(P[3 * j + 3]! - P[3 * j]!, P[3 * j + 4]! - P[3 * j + 1]!, P[3 * j + 5]! - P[3 * j + 2]!);
      // A contour that curls back within a few pixels (a loop where two fingers meet) reads as a dash: dropped.
      let ext = contorno ? 0 : minimo;
      for (let q = i + 1; q <= j && ext < minimo; q++) ext = Math.max(ext, Math.hypot(P[3 * q]! - P[3 * i]!, P[3 * q + 1]! - P[3 * i + 1]!, P[3 * q + 2]! - P[3 * i + 2]!));
      if (j > i && D[j]! >= minimo && ext >= 0.6 * minimo) {
        const ta = QS[i]! > 0;
        const tb = QS[j]! > 0;
        corta(i, i + 1);
        corta(j, j - 1);
        for (let q = i; q < j; q++) {
          let ka = 0;
          for (let e = 0; e < 3; e++) {
            pa[e] = P[3 * q + e]!;
            pb[e] = P[3 * q + 3 + e]!;
            na[e] = N[3 * q + e]!;
            nb[e] = N[3 * q + 3 + e]!;
          }
          if (contorno) {
            const la = LT[q]!;
            const lb = LT[q + 1]!;
            if (la < 2 || lb < 2) {
              const f = small ? 1 : 0.65;
              const sa = la < 2 ? f + (1 - f) * smooth(0.25, 0.45, la) : 1;
              const sb = lb < 2 ? f + (1 - f) * smooth(0.25, 0.45, lb) : 1;
              out.seg(pa, pb, S[q]!, S[q + 1]!, r, KIND.forma, tono(na, sa, L, sombra), tono(nb, sb, L, sombra));
              continue;
            }
            ka = KIND.contorno;
          } else {
            const fa = brillo * (ta ? smooth(0, afila, D[q]!) : 1) * (tb ? smooth(0, afila, D[j]! - D[q]!) : 1) * Math.max(0, Math.min(1, QS[q]! / CRUCE));
            const fb = brillo * (ta ? smooth(0, afila, D[q + 1]!) : 1) * (tb ? smooth(0, afila, D[j]! - D[q + 1]!) : 1) * Math.max(0, Math.min(1, QS[q + 1]! / CRUCE));
            out.seg(pa, pb, S[q]!, S[q + 1]!, r, KIND.forma, tono(na, luzDe(na, L, sombra) * fa, L, sombra), tono(nb, luzDe(nb, L, sombra) * fb, L, sombra));
            continue;
          }
          out.seg(pa, pb, S[q]!, S[q + 1]!, r, ka, na, nb);
        }
      }
      if (j === i) j++;
    }
  }
}

/**
 * Nails (a cuticle curving back toward the wrist, the sides fading toward a faint free edge, a sliver of fingertip past
 * it) and, on a wide screen, creases: short arcs across the joints, bowed toward the wrist. Curves above each finger's
 * back with how bright each point is, laid on the skin later; and the patches the fibers stop at.
 */
function detalles(dedos: Falange[][], small: boolean, paso: number) {
  const curvas: { p: V3[]; b: number[] }[] = [];
  const U: number[] = [];
  const curva = (f: Marco, n: number, at: (t: number) => number[]) => {
    const p: V3[] = [];
    const b: number[] = [];
    for (let i = 0; i <= n; i++) {
      const [a, u, k] = at(i / n) as V3;
      p.push(comb(mas(f.o, f.d, a), 1, comb(f.l, u, f.n, 0.06), 1));
      b.push(k);
    }
    curvas.push({ p, b });
  };
  const parche = (f: Marco, a0: number, a1: number, W: number, sag: number, e: number) =>
    U.push(...f.o, ...f.d, ...f.l, ...f.n, a0, a1, W, sag, e, (Math.max(-a0, a1) + W + 0.06) ** 2);
  dedos.forEach((fr, di) => {
    const u = fr[fr.length - 1]!;
    const W = u.a - 0.004;
    const a1 = u.L - 0.006;
    const a0 = a1 - 2.4 * W;
    const sag = 0.5 * W;
    const e = 0.15 * W;
    parche(u, a0, a1, W, sag, e);
    // The cuticle and the sides as one stroke; on the thumb, seen edge on, only the cuticle and its near side.
    const lado = di === 4 ? Math.sign(u.l[2]) : 0;
    const k = small ? 10 : 16;
    curva(u, k + 8, (t) => {
      const s = lado ? (lado > 0 ? t * 0.75 : 0.25 + t * 0.75) : t;
      if (s < 0.25 || s > 0.75) {
        const x = s < 0.25 ? 1 - s / 0.25 : (s - 0.75) / 0.25;
        return [a0 + sag + (a1 - e - a0 - sag) * x, W * Math.sign(0.5 - s), 1 - 0.7 * x];
      }
      const v = 1 - (s - 0.25) / 0.25;
      return [a0 + sag * v * v, W * v, 1];
    });
    if (!lado) curva(u, 8, (t) => [a1 - e * (2 * t - 1) ** 2, W * (2 * t - 1), 0.3]);
    // Creases across the straight joints of the four fingers (where one bends the skin is taut): three at the middle
    // joint, two at the end one, two small ones over the index's knuckle. None on a phone: they'd read as glyphs.
    if (!small && di < 4)
      fr.forEach((j, i) => {
        if ((!i && di) || j.curl > 0.25) return;
        const p = fr[i - 1] ?? j;
        const f: Marco = i ? { o: j.o, d: norm(mas(p.d, j.d)), l: j.l, n: norm(mas(p.n, j.n)) } : { ...j, o: mas(j.o, j.d, -0.012) };
        const n = i === 1 ? 3 : 2;
        let hi = 0;
        for (let c = 0; c < n; c++) {
          const off = (c - (n - 1) / 2) * 0.0055;
          const A = (i ? p.a : 0.8 * j.a) * (i === 1 ? (c === 1 ? 0.55 : 0.3) : 0.4 - 0.1 * c);
          const sg = A * (i ? 0.3 : 0.45);
          const ph = c * 2.1 + di;
          hi = Math.max(hi, A);
          curva(f, 9, (t) => [off - sg * (1 - (2 * t - 1) ** 2) + 0.0006 * Math.sin(8 * t + ph), A * (2 * t - 1), 0.3 + 0.7 * Math.sin(Math.PI * t)]);
        }
        const g = 0.5 * paso;
        parche(f, -((n - 1) / 2) * 0.0055 - hi * 0.45 - g, ((n - 1) / 2) * 0.0055 + g, hi + 0.003, 0, 0);
      });
  });
  return { curvas, U: Float64Array.from(U) };
}

export function humanHand(small: boolean): { lines: Lines; solid: Solido } {
  const h = small ? 0.015 : 0.0115;
  const paso = small ? 0.016 : 0.0085;
  const tira = small ? TIRAS.compacta : TIRAS.ancha;
  const enc = encuadre(tira.w, tira.h);
  const px = enc.px;
  const sombra = small ? 0.1 : 0.08;
  const Rn = rng(7);
  const { campo, H, R, dedos, brazo, lb } = armar();
  const { curvas, U } = detalles(dedos, small, paso);

  const lo: V3 = [-0.16, -0.3, -0.32];
  const hi: V3 = [1.0, 0.45, 0.17];
  campo.cerrar(mas(lo, [1, 1, 1], -0.03), mas(hi, [1, 1, 1], 0.03), 2 * h);
  const f = (x: number, y: number, z: number) => campo.valor(x, y, z);
  const mano = mallar(f, lo, hi, h, [
    [0.25, 0, 0.01],
    [-0.08, 0, 0],
  ]);
  const nMano = mano.pos.length / 3;
  const tb = tubo(brazo, lb, SEAM - 0.04, small ? 30 : 44, nMano);
  const une = <T extends Float64Array | Uint32Array>(a: T, b: number[], k: T) => (k.set(a), k.set(b, a.length), k);
  const m: Malla = {
    pos: une(mano.pos, tb.pos, new Float64Array(mano.pos.length + tb.pos.length)),
    nrm: une(mano.nrm, tb.nrm, new Float64Array(mano.pos.length + tb.pos.length)),
    tri: une(mano.tri, tb.tri, new Uint32Array(mano.tri.length + tb.tri.length)),
  };
  const pos = m.pos;

  // The farthest point of the index tip goes to the origin.
  const c = Math.cos(POSE.tilt);
  const sn = Math.sin(POSE.tilt);
  let tip = 0;
  for (let v = 0; v < nMano; v++) if (pos[3 * v + 1]! > 0.08 && pos[3 * v]! * c - pos[3 * v + 1]! * sn > pos[3 * tip]! * c - pos[3 * tip + 1]! * sn) tip = v;
  const T: V3 = [-(pos[3 * tip]! * c - pos[3 * tip + 1]! * sn), -(pos[3 * tip]! * sn + pos[3 * tip + 1]! * c), -pos[3 * tip + 2]!];

  const ojo = ojoLocal(small, "humana");
  const L = luzLocal(small);
  const o: Obra = { m, nMano, H, R, U, paso, brazo, c, sn, T, ojo, L, sombra, small };
  const V = vertices(o);
  const A = aristas(m);
  // The picture plane, as the eye sees the hand.
  const vista = norm(sub([-0.4, -0.1, 0], ojo));
  const e1 = perp(X, vista);
  const e2 = cross(vista, e1);
  const { vale, sep, arm } = triangulos(m, V, paso, e1, e2, px);
  const out = new Builder(false);
  const azar = Float64Array.from({ length: 4096 }, Rn);
  // Where the fibers bunch up, on the back in shade or on screen, every other one ends, then every fourth; and the
  // forearm keeps every other one from a little behind the wrist, so the back of the hand is the brightest plane.
  const rango = (k: number) => {
    let r = 0;
    while (r < 6 && k % (2 << r) === 0) r++;
    return r;
  };
  const fibras = niveles(m, A, V.phi, paso, (t) => vale[t] === 2);
  const nota = (t: number, k: number) => sep[t]! * (2 << rango(k)) * (arm[t]! > 0.17 + 0.2 * ((k * 0.618) % 1) ? 0.5 : 1);
  trazar(out, o, A, V, fibras, null, (cv) => azar[(cv.k + 2048) & 4095]!, nota, paso * 1.5, (small ? 7 : 8) / px);
  // The contour, lifted so the body never hides it; no crumbs.
  const sil = niveles(m, A, V.cara, 4, (t) => vale[t]! > 0);
  trazar(out, o, A, V, sil, halo(o, A, V, sil, e1, e2, px * enc.z, 2), () => 0.1 + 0.3 * Rn(), () => 2, 10 / px, 0);
  // The details, laid on the skin by Newton steps along the field's gradient; they draw in last.
  const g = [0, 0, 0, 0] as [number, number, number, number];
  const tmp = [0, 0, 0];
  const gira = (n: V3, k = 0): V3 => [n[0] * c - n[1] * sn + k * T[0], n[0] * sn + n[1] * c + k * T[1], n[2] + k * T[2]];
  for (const d of curvas) {
    let prev: [V3, V3, number] | null = null;
    const r = 0.95 + 0.04 * Rn();
    d.p.forEach((p, i) => {
      for (let k = 0; k < 3; k++) {
        gradiente(f, ...p, g);
        p = mas(p, g as unknown as V3, -g[3] / (g[0] ** 2 + g[1] ** 2 + g[2] ** 2));
      }
      const n = gira(norm(g.slice(0, 3) as V3));
      campos(H, ...p, tmp);
      const cur: [V3, V3, number] = [gira(mas(p, n, 0.0015), 1), tono(n, d.b[i]!, L, sombra), tmp[1]!];
      if (prev) out.seg(prev[0], cur[0], prev[2], cur[2], r, KIND.forma, prev[1], cur[1]);
      prev = cur;
    });
  }

  // The body, a hair inside the skin the lines lie on.
  const cuerpo = new Cuerpo(false);
  cuerpo.malla(
    pos.map((x, i) => x - m.nrm[i]! * 0.0015),
    m.tri,
  );
  return {
    lines: out.done(S_MUNECA, small ? { alfa: 0.7, contorno: 1, sombra, punta: 0.3 } : { alfa: 0.65, contorno: 0.95, sombra, punta: 0.35 }),
    solid: cuerpo.done(),
  };
}
