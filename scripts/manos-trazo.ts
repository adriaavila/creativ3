// The hands, as a pencil sketch: one drawing for five uses (the waiting
// underdrawing, the twin without WebGL, the closed frame without JavaScript,
// the close's open loop, and a reference for the link preview).
//
//   npx tsx scripts/manos-trazo.ts            writes src/components/vitrina/ManosTrazo.tsx
//   npx tsx scripts/manos-trazo.ts --check    exit 1 if that file is stale
//
// It builds the same hands as the scene (construirManos) and projects them
// through the scene's own camera and framing (encuadre), so the drawing lands
// under the lines. A phone and a desktop strip see the hands from different
// distances (and on a phone the pair meets on a diagonal), so there are two
// buckets, each projected at its reference strip (TIRAS: the hero at 390×844
// and at 1440×900); a container query shows the one that fits.
//
// It draws what the scene shows. Each bucket rasterizes both hands' bodies
// (their Solido, waiting) into a depth buffer and keeps only the stretches of
// line in front of them, as the GPU's depth test does: a ring around a finger
// shows its front half. Of those it keeps every contour and edge (they carry
// the drawing), the chips, the creases, an even subset of the lines that follow
// the form (spaced on screen, clear of the contour, split by the scene's light,
// within a byte budget) and the pads of the traces it kept. The forearms fade
// in steps, as the scene fades them. Smooth lines are written as curves.
//
// SVG units are half CSS pixels of the reference strip (RESOLUCION) on the
// plane of the fingertips, centred on the mark, y down. Each bucket is its own
// <svg>, its viewBox the least the camera keeps in view around its aim
// (encuadre's vista) and `xMidYMid meet` fitting it the way the camera does,
// so that plane lines up at any strip size; lines nearer the camera (the
// forearms) are exact at the reference size and close elsewhere. Each hand is
// drawn from its fingertip in the frame of the pair's axis, so closing is a
// slide along x (with a stretch and a skew for perspective), whatever the turn.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Group, Matrix3, Matrix4, PerspectiveCamera } from "three";
import { AIM, FOV, GIRO_HUMANA, GIRO_MAQUINA, KIND, TIRAS, construirManos, encuadre, type Lines, type Solido } from "../src/components/vitrina/manos-geometria";

const SALIDA = join(process.cwd(), "src/components/vitrina/ManosTrazo.tsx");
const ESTILOS = join(process.cwd(), "src/styles/allok/site/20-manos.src.css");

/**
 * The two buckets, and per hand: `separacion`, the least gap in CSS pixels
 * between two kept form lines that run alike (the human's are hatching, kept
 * sparse; the machine's are traces and seams, whose bundles are its look), and
 * the most bytes of path data its contour, its form lines and its fading
 * forearm may take (the gap widens until the form lines fit; the shortest
 * edges go first). `gemelo`: how close two edges run to be drawn as one;
 * `rama`: the longest stub of the human's contour dropped where it meets
 * another; `fin`: where the forearm stops, from the wrist in s (on a phone
 * the arms leave the strip through its faded top and bottom; on a desktop
 * they cross it, however wide); `trozo`: the shortest piece of the human's
 * hatching drawn. The phone's hands are about half the size: fewer lines, a
 * little closer.
 */
const CUBETAS = [
  {
    nombre: "compacto",
    ...TIRAS.compacta,
    small: true,
    gemelo: 2,
    rama: 6,
    fin: -0.2,
    trozo: 14,
    humana: { separacion: 5, contorno: 1400, forma: 1300 },
    maquina: { separacion: 3, contorno: 1500, forma: 620 },
  },
  {
    nombre: "ancho",
    ...TIRAS.ancha,
    small: false,
    gemelo: 2.5,
    rama: 8,
    fin: -0.24,
    trozo: 24,
    humana: { separacion: 5, contorno: 1950, forma: 3450 },
    maquina: { separacion: 4, contorno: 2400, forma: 1700 },
  },
] as const;

/**
 * The most ManosTrazo.tsx may weigh: it ships in the HTML twice (the markup
 * and the RSC payload). Should the hands outgrow it, the form lines give way
 * first (down to FORMA_MIN of their budgets), then everything alike.
 */
const LIMITE = 16 * 1024;
const FORMA_MIN = 0.6;
/** Lines drawn at this stroke-opacity or more are the strong ones, whose miss on closing the stats print apart (`fuerte`). */
const FUERTE = 0.45;

/**
 * Each path's stroke-opacity, as 20-manos.src.css sets it: the ink print
 * (length × opacity, per hand) weighs the lines by it, and a check warns
 * should the two drift apart.
 */
const TINTA = {
  humana: {
    "trazo-mas-lejos": 0.1,
    "trazo-lejos": 0.3,
    "trazo-forma": 0.25,
    "trazo-forma-luz": 0.5,
    "trazo-contorno": 0.75,
    "trazo-placas": 0.45,
    "trazo-pads": 0.6,
  },
  maquina: {
    "trazo-mas-lejos": 0.08,
    "trazo-lejos": 0.2,
    "trazo-forma": 0.25,
    "trazo-forma-luz": 0.5,
    "trazo-contorno": 0.45,
    "trazo-placas": 0.4,
    "trazo-pads": 0.5,
  },
} as const;
type Clase = keyof (typeof TINTA)["humana"];

/**
 * Depth buffer pixels per CSS pixel of the reference strip: RASTER over the
 * hands and the near forearm (s above FINO from the wrist), RASTER_LEJOS over
 * the faint far forearm, which runs well past the strip.
 */
const RASTER = 3;
const RASTER_LEJOS = 1;
const FINO = -0.17;
/**
 * A line shows where it is no farther behind the bodies than HOLGURA units
 * (the lines lie on the surface, the body a hair inside it), plus PENDIENTE
 * raster pixels' worth of the body's slope there, like the scene's polygon
 * offset: where the surface turns away, one pixel spans a lot of depth. Never
 * more than HOLGURA_MAX, so nothing shows through an edge-on part. Any looser
 * and the back of the machine's joints shows (they sit 0.002 behind).
 */
const HOLGURA = 0.0005;
const PENDIENTE = 1.5;
const HOLGURA_MAX = 0.03;
/** Lines are sampled this often on screen, in raster pixels. */
const PASO = 0.5;
/** Hidden gaps shorter than PUENTE CSS pixels are bridged (a line grazing its own body flickers in and out). */
const PUENTE = 2;
/** Lines that span less than MINIMO CSS pixels once joined are dropped (a crumb); a chip's pins are shorter. */
const MINIMO = 3;
const MINIMO_PLACA = 1.5;
/** Stretches whose ends meet within this many CSS pixels are one line (the machine's edges come a segment at a time, each lifted on its own). */
const UNION = 1;
/**
 * The human's form lines whose ends are this close (CSS pixels), heading the
 * same way within ENCADENA_GRADOS, are one line: where the hand's lines meet
 * the forearm's they run on instead of stopping and starting again.
 */
const ENCADENA = 5;
const ENCADENA_GRADOS = 25;
/** A form line is dropped when more than this share of it runs alongside the lines already kept. */
const JUNTO = 0.4;
/** A form line is dropped when more than JUNTO of it runs this close (CSS pixels) to the contour: it would double the outline. */
const ARRIMO = 3.5;
/** Form lines stop this many CSS pixels short of a contour or a crease they meet: the crease stays an open arc, the nail clean. */
const HUECO = 1.5;
/**
 * An edge that runs this close (CSS pixels, `gemelo` per bucket) to a longer
 * one for most of its length (DOBLE) is the same line on screen: a chamfer's
 * two edges, a seam beside an outline. One is drawn.
 */
const DOBLE = 0.7;
/** A line that turns back sharper than this (the cosine of its turn) is cut there, before twins are told apart. */
const VUELTA = -0.5;
/** The machine's form lines are cut at corners sharper than this (cosine): what runs across the hand is told from what runs along it. */
const RINCON = 0.5;
/** The human's closed loops smaller than this (CSS pixels) are crumbs; the machine's smaller than TORNILLO are screws, drawn as a dot. */
const LAZO_MIN = 6;
const TORNILLO = 5;
/**
 * The machine's form lines along which s changes less than this share of the
 * rate it runs at along the hand there run across the hand: its seams (the
 * forearm counts for less of s per unit, so the rate is measured, per s).
 */
const COSTURA = 0.2;
/**
 * Details, all kept and never spaced out: the machine's loops smaller than
 * DETALLE CSS pixels (screws, the rims of its pins; open lines inside them are
 * their slots) and the human's lines within NUDO_3D units (a nail is 0.09)
 * that turn back on themselves more than NUDO degrees (a nail's outline).
 */
const DETALLE = 30;
const NUDO_3D = 0.12;
const NUDO = 120;
/**
 * The human's form lines the scene leaves darker than BRILLO_MIN (its light
 * times its depth fade) are left out; those brighter than BRILLO_LUZ are
 * drawn stronger (trazo-forma-luz): the hatching is modelled by the light.
 */
const BRILLO_MIN = 0.12;
const BRILLO_LUZ = 0.42;
/** The hatching runs on this many CSS pixels into where the scene dims it below BRILLO_MIN (a fiber's tapered end). */
const ALARGA = 8;
/** The scene's light (LUZ in manos-escena.ts): toward it, in view space. */
const LUZ = (() => {
  const v = [-0.38, 0.62, 0.69];
  const n = Math.hypot(v[0]!, v[1]!, v[2]!);
  return v.map((x) => x / n) as [number, number, number];
})();
/**
 * The scene fades the forearms to a tenth between wrist + 0.05 and wrist −
 * 0.16 (LINE_VERT). The sketch steps down with it: full above NIVELES[0],
 * trazo-lejos above NIVELES[1], trazo-mas-lejos down to the bucket's `fin`.
 */
const NIVELES = [-0.045, -0.1] as const;
/** The far forearm's form lines are this much sparser than the hand's. */
const LEJOS_SEP = 3.5;
/**
 * Smooth lines are written as quadratic B-splines that stray at most
 * TOLERANCIA CSS pixels from the real one; they break at corners sharper than
 * ESQUINA (the machine's edges keep their corners) measured over ALCANCE pixels.
 */
const TOLERANCIA = 0.45;
const ESQUINA = { humana: 60, maquina: 35 } as const;
const ALCANCE = 1.5;
/**
 * One SVG unit, in CSS pixels at the reference strip: lines are written on
 * whole units, so this is how finely they land (a quarter pixel either way),
 * and how many digits they take.
 */
const RESOLUCION = 0.5;
/** The fading forearm is written looser (CSS pixels): it is faint. */
const TOLERANCIA_LEJOS = 1;
/** The human's lines are smoothed over SUAVE CSS pixels (a Gaussian's sigma) before they are fitted: the mesh's facets are noise, not form. */
const SUAVE = 1;
/** Each form line stops up to FIN_VARIA (in s) short of where the forearm ends, by its own rnd: they end one by one, not in a column. */
const FIN_VARIA = 0.05;
/** Each line steps down into the fading forearm up to ESCALON (in s) past NIVELES, by its own rnd: the steps don't line up either. */
const ESCALON = 0.04;

type V3 = [number, number, number];
type P = [number, number];
/** A line in its hand's own frame: xyz, s and normal per vertex, its KIND, the ids (rnd) of the lines it joins, and whether it is a crease. */
type Linea = { pts: V3[]; s: number[]; nrm: V3[]; kind: number; ids: Set<number>; pliegue: boolean };
/**
 * A stretch of line on screen (CSS pixels from the strip's centre, y down),
 * with its points in the hand's frame (for the close's fit), and at each
 * point how bright the scene draws it (`b`) and its s (where the forearm fades).
 */
type Tramo = { p2: P[]; p3: V3[]; b: number[]; s: number[]; largo: number; ids: Set<number>; kind: number; pliegue: boolean };
/** A point of a hand's frame → screen (CSS pixels from the strip's centre, y down) and its depth (units in front of the camera). */
type Proy = (x: number, y: number, z: number) => [number, number, number];
/** A stretch of a line to write: straight steps, or a quadratic B-spline's control points (clamped: it starts at c[0] and ends at the last). */
type Trozo = { curva: false; p: P[] } | { curva: true; c: P[] };
/** A line to write: stretches end to end, or a closed smooth loop (a periodic B-spline's control points). */
type Dibujo = { trozos: Trozo[] } | { lazo: P[] };

const lerp2 = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const medio = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const suave = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
/** How far a polyline spans on screen: the diagonal of its box. */
const extension = (p: P[]) => {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of p) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return Math.hypot(x1 - x0, y1 - y0);
};
const cerrado = (p: P[]) => p.length > 3 && dist(p[0]!, p[p.length - 1]!) < UNION && extension(p) > 1;
/** How far a line spans in its hand's frame: the diagonal of its box. */
const extension3 = (p: V3[]) => {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const v of p)
    for (let e = 0; e < 3; e++) {
      lo[e] = Math.min(lo[e]!, v[e]!);
      hi[e] = Math.max(hi[e]!, v[e]!);
    }
  return Math.hypot(hi[0]! - lo[0]!, hi[1]! - lo[1]!, hi[2]! - lo[2]!);
};
/** How far a point is from a segment. */
const aSegmento = (p: P, a: P, b: P) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const L2 = dx * dx + dy * dy;
  const t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};

/** Segments in a grid of `celda`-pixel cells, for how near the closest one is (within a cell's reach; farther is Infinity). */
class Rejilla {
  private readonly celdas = new Map<number, number[]>();
  private readonly segs: [P, P, number][] = [];
  constructor(readonly celda: number) {}
  private static llave(i: number, j: number) {
    return (i + 32768) * 65536 + (j + 32768);
  }
  add(a: P, b: P, dueno = 0) {
    const k = this.segs.push([a, b, dueno]) - 1;
    const C = this.celda;
    for (let i = Math.floor(Math.min(a[0], b[0]) / C); i <= Math.floor(Math.max(a[0], b[0]) / C); i++)
      for (let j = Math.floor(Math.min(a[1], b[1]) / C); j <= Math.floor(Math.max(a[1], b[1]) / C); j++) {
        const l = Rejilla.llave(i, j);
        const c = this.celdas.get(l);
        if (c) c.push(k);
        else this.celdas.set(l, [k]);
      }
  }
  linea(p: P[], dueno = 0) {
    for (let i = 1; i < p.length; i++) this.add(p[i - 1]!, p[i]!, dueno);
    return this;
  }
  cerca(p: P, excepto = -1) {
    let d = Infinity;
    const [ci, cj] = [Math.floor(p[0] / this.celda), Math.floor(p[1] / this.celda)];
    for (let i = ci - 1; i <= ci + 1; i++)
      for (let j = cj - 1; j <= cj + 1; j++)
        for (const k of this.celdas.get(Rejilla.llave(i, j)) ?? []) {
          const [a, b, o] = this.segs[k]!;
          if (o !== excepto) d = Math.min(d, aSegmento(p, a, b));
        }
    return d;
  }
}

/**
 * Lines → polylines: segments of one kind that share an end are one line, in
 * whatever order they were pushed (a ring may come as loose segments). A
 * crease is a short form line across a finger: s, which runs along the hand,
 * hardly changes on it.
 */
function lineas(l: Lines, conPliegues: boolean): Linea[] {
  const n = l.count >> 1;
  const llave = (i: number) => `${l.kind[i]} ${l.pos[i * 3]} ${l.pos[i * 3 + 1]} ${l.pos[i * 3 + 2]}`;
  const ends = new Map<string, number[]>();
  for (let i = 0; i < 2 * n; i++) {
    const k = llave(i);
    const e = ends.get(k);
    if (e) e.push(i);
    else ends.set(k, [i]);
  }
  const usado = new Uint8Array(n);
  // From vertex v, on along whichever unused segment starts or ends there.
  const seguir = (v: number) => {
    const vs: number[] = [];
    for (;;) {
      const e = ends.get(llave(v))?.find((x) => !usado[x >> 1]);
      if (e === undefined) return vs;
      usado[e >> 1] = 1;
      v = e ^ 1;
      vs.push(v);
    }
  };
  const out: Linea[] = [];
  for (let g = 0; g < n; g++) {
    if (usado[g]) continue;
    usado[g] = 1;
    const idx = [...seguir(2 * g).reverse(), 2 * g, 2 * g + 1, ...seguir(2 * g + 1)];
    const pts = idx.map((i): V3 => [l.pos[i * 3]!, l.pos[i * 3 + 1]!, l.pos[i * 3 + 2]!]);
    const s = idx.map((i) => l.s[i]!);
    let largo = 0;
    for (let i = 1; i < pts.length; i++) largo += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1], pts[i]![2] - pts[i - 1]![2]);
    const kind = l.kind[2 * g]!;
    out.push({
      pts,
      s,
      nrm: idx.map((i): V3 => [l.nrm[i * 3]!, l.nrm[i * 3 + 1]!, l.nrm[i * 3 + 2]!]),
      kind,
      ids: new Set(idx.map((i) => l.rnd[i]!)),
      pliegue: conPliegues && kind === KIND.forma && largo < 0.05 && Math.max(...s) - Math.min(...s) < 0.12 * largo,
    });
  }
  return out;
}

/**
 * How fast s runs along a hand at each s (per unit of length): the lines that
 * run along the hand set it (the fastest tenth of them, per band of s), so a
 * line across the hand is one along which s hardly moves for that rate.
 */
function ritmo(ls: Linea[]): (s: number) => number {
  const BANDA = 0.02;
  const n = Math.ceil(1 / BANDA) + 1;
  const tasas: number[][] = Array.from({ length: n }, () => []);
  for (const l of ls)
    for (let i = 1; i < l.pts.length; i++) {
      const [a, b] = [l.pts[i - 1]!, l.pts[i]!];
      const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      // Only what runs along the hand sets it: a joint's ring, all of it at one s, would bring it to nothing.
      const v = d > 1e-6 ? Math.abs(l.s[i]! - l.s[i - 1]!) / d : 0;
      if (v > 1e-6) tasas[Math.min(n - 1, Math.max(0, Math.floor((l.s[i - 1]! + l.s[i]!) / 2 / BANDA)))]!.push(v);
    }
  const r = tasas.map((t) => (t.length >= 5 ? t.sort((x, y) => x - y)[Math.floor(0.9 * (t.length - 1))]! : NaN));
  // Bands with too few lines take the nearest measured rate.
  const lleno = r.map((v, i) => {
    if (!Number.isNaN(v)) return v;
    for (let d = 1; d < n; d++) for (const j of [i - d, i + d]) if (j >= 0 && j < n && !Number.isNaN(r[j]!)) return r[j]!;
    return 1;
  });
  return (s: number) => lleno[Math.min(n - 1, Math.max(0, Math.floor(s / BANDA)))]!;
}

/** A hand's frame → screen, through a clip matrix (projection · view · the hand's group). */
function proyector(clip: Matrix4, w: number, h: number): Proy {
  const e = clip.elements;
  return (x, y, z) => {
    const cw = e[3]! * x + e[7]! * y + e[11]! * z + e[15]!;
    return [((e[0]! * x + e[4]! * y + e[8]! * z + e[12]!) / cw) * (w / 2), (-(e[1]! * x + e[5]! * y + e[9]! * z + e[13]!) / cw) * (h / 2), cw];
  };
}

/**
 * The bodies' depth, nearest first, per raster pixel over a box of the screen
 * (CSS pixels from the strip's centre), and how fast it changes there (per
 * raster pixel), for the slope term of the tolerance.
 */
class Profundidad {
  readonly d: Float32Array;
  readonly g: Float32Array;
  readonly W: number;
  readonly H: number;
  constructor(
    readonly x0: number,
    readonly y0: number,
    x1: number,
    y1: number,
    readonly raster: number,
  ) {
    this.W = Math.ceil((x1 - x0) * raster);
    this.H = Math.ceil((y1 - y0) * raster);
    this.d = new Float32Array(this.W * this.H).fill(Infinity);
    this.g = new Float32Array(this.W * this.H);
  }

  cuerpo(c: Solido, proy: Proy) {
    const n = c.pos.length / 3;
    const X = new Float64Array(n);
    const Y = new Float64Array(n);
    const U = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const [sx, sy, d] = proy(c.pos[i * 3]!, c.pos[i * 3 + 1]!, c.pos[i * 3 + 2]!);
      X[i] = (sx - this.x0) * this.raster;
      Y[i] = (sy - this.y0) * this.raster;
      U[i] = 1 / d;
    }
    for (let t = 0; t < c.idx.length; t += 3) {
      const [a, b, k] = [c.idx[t]!, c.idx[t + 1]!, c.idx[t + 2]!];
      this.triangulo(X[a]!, Y[a]!, U[a]!, X[b]!, Y[b]!, U[b]!, X[k]!, Y[k]!, U[k]!);
    }
  }

  /** One triangle, by barycentrics at pixel centres; 1/depth is what runs straight across the screen. */
  private triangulo(ax: number, ay: number, au: number, bx: number, by: number, bu: number, cx: number, cy: number, cu: number) {
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    if (Math.abs(area) < 1e-9) return;
    const i0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const i1 = Math.min(this.W - 1, Math.ceil(Math.max(ax, bx, cx)));
    const j0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const j1 = Math.min(this.H - 1, Math.ceil(Math.max(ay, by, cy)));
    if (i0 > i1 || j0 > j1) return;
    const ux = ((bu - au) * (cy - ay) - (cu - au) * (by - ay)) / area;
    const uy = ((cu - au) * (bx - ax) - (bu - au) * (cx - ax)) / area;
    const gu = Math.max(Math.abs(ux), Math.abs(uy));
    const inv = 1 / area;
    const EPS = -1e-7;
    for (let j = j0; j <= j1; j++) {
      const py = j + 0.5;
      for (let i = i0; i <= i1; i++) {
        const px = i + 0.5;
        const wa = ((bx - px) * (cy - py) - (cx - px) * (by - py)) * inv;
        if (wa < EPS) continue;
        const wb = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) * inv;
        if (wb < EPS || 1 - wa - wb < EPS) continue;
        const d = 1 / (wa * au + wb * bu + (1 - wa - wb) * cu);
        const k = j * this.W + i;
        if (d < this.d[k]!) {
          this.d[k] = d;
          this.g[k] = gu * d * d;
        }
      }
    }
  }

  /** Whether a point on screen at a depth is in front of the bodies, give or take the tolerance; null off its box. */
  ve(sx: number, sy: number, d: number) {
    const i = Math.floor((sx - this.x0) * this.raster);
    const j = Math.floor((sy - this.y0) * this.raster);
    if (i < 0 || j < 0 || i >= this.W || j >= this.H) return null;
    const k = j * this.W + i;
    return d <= this.d[k]! + HOLGURA + Math.min(HOLGURA_MAX, PENDIENTE * this.g[k]!);
  }
}

/** The fine buffer where it reaches, the coarse one past it, in view beyond both. */
class Profundidades {
  constructor(
    readonly fino: Profundidad,
    readonly grueso: Profundidad,
  ) {}
  ve(sx: number, sy: number, d: number) {
    return this.fino.ve(sx, sy, d) ?? this.grueso.ve(sx, sy, d) ?? true;
  }
}

/**
 * The stretches of a line the bodies leave in view, down to where the forearm
 * stops: sampled every PASO raster pixels along each segment (in 3D, so the
 * perspective is exact), keeping the vertices and the points where it hides,
 * and how bright the scene draws it.
 */
function visibles(l: Linea, proy: Proy, z: Profundidades, fin: number, brillo: (n: V3, z: number) => number): Tramo[] {
  const xs: number[] = [];
  const ys: number[] = [];
  const largo: number[] = [];
  const ve: boolean[] = [];
  const ss: number[] = [];
  const luz: number[] = [];
  const vert: boolean[] = [];
  const at: [number, number][] = [];
  for (let i = 0; i + 1 < l.pts.length; i++) {
    const a = l.pts[i]!;
    const b = l.pts[i + 1]!;
    const pa = proy(...a);
    const pb = proy(...b);
    const n = Math.max(1, Math.ceil((Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * RASTER) / PASO));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) {
      const t = k / n;
      const p = lerp3(a, b, t);
      const [sx, sy, d] = k === 0 ? pa : k === n ? pb : proy(...p);
      const s = l.s[i]! + (l.s[i + 1]! - l.s[i]!) * t;
      const m = xs.length;
      largo.push(m ? largo[m - 1]! + Math.hypot(sx - xs[m - 1]!, sy - ys[m - 1]!) : 0);
      xs.push(sx);
      ys.push(sy);
      ve.push(s >= fin && z.ve(sx, sy, d));
      ss.push(s);
      luz.push(brillo(lerp3(l.nrm[i]!, l.nrm[i + 1]!, t), p[2]));
      vert.push(k === 0 || k === n);
      at.push([i, t]);
    }
  }
  // Runs of visible samples, across hidden gaps shorter than PUENTE.
  const runs: [number, number][] = [];
  for (let i = 0; i < xs.length; i++) {
    if (!ve[i]) continue;
    let j = i;
    while (j + 1 < xs.length && ve[j + 1]) j++;
    const ult = runs[runs.length - 1];
    if (ult && largo[i]! - largo[ult[1]]! < PUENTE) ult[1] = j;
    else runs.push([i, j]);
    i = j;
  }
  return runs
    .filter(([a, b]) => largo[b]! > largo[a]!)
    .map(([a, b]) => {
      const idx = [a];
      for (let k = a + 1; k < b; k++) if (vert[k]) idx.push(k);
      idx.push(b);
      return {
        p2: idx.map((k): P => [xs[k]!, ys[k]!]),
        p3: idx.map((k) => {
          const [i, t] = at[k]!;
          return lerp3(l.pts[i]!, l.pts[i + 1]!, t);
        }),
        b: idx.map((k) => luz[k]!),
        s: idx.map((k) => ss[k]!),
        largo: largo[b]! - largo[a]!,
        ids: l.ids,
        kind: l.kind,
        pliegue: l.pliegue,
      };
    });
}

/**
 * A line cut where it turns sharper than `umbral` (the cosine of the turn):
 * where it doubles back on itself (an edge and its twin a hair apart, joined
 * end to end on screen, become two lines, so the twin can go), or at the
 * machine's corners (a joint's line apart from the lines along the finger).
 */
function vueltas(t: Tramo, umbral = VUELTA): Tramo[] {
  const d = densa(t, 0.5);
  const n = d.p2.length;
  const L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1]! + dist(d.p2[i]!, d.p2[i - 1]!));
  // How sharply the line turns at each point, over ALCANCE pixels each way (cosine: -1 is straight back).
  const giro = d.p2.map((p, i) => {
    let a = i;
    while (a > 0 && L[i]! - L[a]! < ALCANCE) a--;
    let b = i;
    while (b < n - 1 && L[b]! - L[i]! < ALCANCE) b++;
    const [ux, uy, vx, vy] = [p[0] - d.p2[a]![0], p[1] - d.p2[a]![1], d.p2[b]![0] - p[0], d.p2[b]![1] - p[1]];
    return a === i || b === i ? 1 : (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1);
  });
  const cortes: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (giro[i]! > umbral) continue;
    let j = i;
    let mejor = i;
    while (j + 1 < n - 1 && giro[j + 1]! <= umbral) if (giro[++j]! < giro[mejor]!) mejor = j;
    cortes.push(mejor);
    i = j;
  }
  if (!cortes.length) return [t];
  const out: Tramo[] = [];
  let i0 = 0;
  for (const i of [...cortes, n - 1]) {
    out.push(parte(d, i0, i));
    i0 = i;
  }
  return out;
}

/** How far a line turns from end to end, in degrees (signed along it, so its wiggles cancel): a nail's outline turns back on itself, a fiber hardly turns. */
function vira(p: P[]): number {
  const q = remuestrear(p, 1.5);
  let a = 0;
  for (let i = 2; i < q.length; i++) {
    const [ux, uy, vx, vy] = [q[i - 1]![0] - q[i - 2]![0], q[i - 1]![1] - q[i - 2]![1], q[i]![0] - q[i - 1]![0], q[i]![1] - q[i - 1]![1]];
    a += Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  }
  return (Math.abs(a) * 180) / Math.PI;
}

/** Two stretches end to end (`b` already turned to start where `a` ends), as one. */
function juntar(a: Tramo, b: Tramo, puente = 0): Tramo {
  return {
    p2: [...a.p2, ...b.p2],
    p3: [...a.p3, ...b.p3],
    b: [...a.b, ...b.b],
    s: [...a.s, ...b.s],
    largo: a.largo + b.largo + puente,
    ids: new Set([...a.ids, ...b.ids]),
    kind: a.kind,
    pliegue: a.pliegue && b.pliegue,
  };
}
const volver = (t: Tramo): Tramo => ({ ...t, p2: [...t.p2].reverse(), p3: [...t.p3].reverse(), b: [...t.b].reverse(), s: [...t.s].reverse() });
/** How bright the scene draws a stretch, on average along it. */
function brilloDe(t: Tramo) {
  let w = 0;
  let L = 0;
  for (let i = 1; i < t.p2.length; i++) {
    const d = dist(t.p2[i]!, t.p2[i - 1]!);
    w += ((t.b[i]! + t.b[i - 1]!) / 2) * d;
    L += d;
  }
  return L ? w / L : (t.b[0] ?? 1);
}
/** Part of a stretch, from point i to point j. */
function parte(t: Tramo, i: number, j: number): Tramo {
  const p2 = t.p2.slice(i, j + 1);
  let largo = 0;
  for (let k = 1; k < p2.length; k++) largo += dist(p2[k]!, p2[k - 1]!);
  return { ...t, p2, p3: t.p3.slice(i, j + 1), b: t.b.slice(i, j + 1), s: t.s.slice(i, j + 1), largo };
}

/**
 * A stretch cut where its s crosses each of `umbrales` (highest first): the
 * pieces meet at the crossing, each with the index of the band of s it lies
 * in (0 above the first). Pieces in a band `fuera` says to drop are left out.
 */
function porS(t: Tramo, umbrales: readonly number[], fuera: (banda: number) => boolean = () => false): [number, Tramo][] {
  const banda = (s: number) => umbrales.filter((u) => s < u).length;
  const d = densa(t, 1);
  const out: [number, Tramo][] = [];
  let i0 = 0;
  const cerrar = (i1: number, extra: { p2: P; p3: V3; b: number; s: number } | null) => {
    const q = parte(d, i0, i1);
    if (extra) {
      q.p2.push(extra.p2);
      q.p3.push(extra.p3);
      q.b.push(extra.b);
      q.s.push(extra.s);
      q.largo += dist(q.p2[q.p2.length - 2]!, extra.p2);
    }
    const n = banda(d.s[i0]!);
    if (!fuera(n) && q.p2.length > 1) out.push([n, q]);
  };
  for (let i = 1; i < d.p2.length; i++) {
    const [a, b] = [banda(d.s[i - 1]!), banda(d.s[i]!)];
    if (a === b) continue;
    // Where s crosses the threshold between the two points: both pieces end and start there.
    const u = umbrales[Math.min(a, b)]!;
    const f = (u - d.s[i - 1]!) / (d.s[i]! - d.s[i - 1]!);
    const x = { p2: lerp2(d.p2[i - 1]!, d.p2[i]!, f), p3: lerp3(d.p3[i - 1]!, d.p3[i]!, f), b: d.b[i - 1]! + (d.b[i]! - d.b[i - 1]!) * f, s: u };
    cerrar(i - 1, x);
    d.p2[i - 1] = x.p2;
    d.p3[i - 1] = x.p3;
    d.b[i - 1] = x.b;
    d.s[i - 1] = u;
    i0 = i - 1;
    // The crossing point now leads the next piece, whose band is the second point's.
    d.s[i - 1] = b > a ? u - 1e-9 : u;
  }
  cerrar(d.p2.length - 1, null);
  return out;
}

/**
 * Stretches whose ends meet on screen (within UNION) become one line, turned
 * around where they meet end to end: fewer moves in the path, and the curves
 * run across the joins.
 */
function unir(ts: Tramo[]): Tramo[] {
  const celda = (p: P) => `${Math.floor(p[0] / UNION)} ${Math.floor(p[1] / UNION)}`;
  // Ends: 2i is where stretch i starts, 2i + 1 where it ends.
  const extremo = (e: number) => {
    const t = ts[e >> 1]!;
    return e & 1 ? t.p2[t.p2.length - 1]! : t.p2[0]!;
  };
  const malla = new Map<string, number[]>();
  for (let e = 0; e < 2 * ts.length; e++) {
    const k = celda(extremo(e));
    const c = malla.get(k);
    if (c) c.push(e);
    else malla.set(k, [e]);
  }
  const usado = new Uint8Array(ts.length);
  const cerca = (p: P) => {
    let mejor = -1;
    let dmin = UNION;
    const [cx, cy] = [Math.floor(p[0] / UNION), Math.floor(p[1] / UNION)];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const e of malla.get(`${cx + dx} ${cy + dy}`) ?? []) {
          if (usado[e >> 1]) continue;
          const d = dist(extremo(e), p);
          if (d < dmin || (d === dmin && e < mejor)) {
            dmin = d;
            mejor = e;
          }
        }
    return mejor;
  };
  const out: Tramo[] = [];
  for (let i = 0; i < ts.length; i++) {
    if (usado[i]) continue;
    usado[i] = 1;
    let r = ts[i]!;
    // Appended, it must start where we end; prepended, end where we start.
    for (let e = cerca(r.p2[r.p2.length - 1]!); e >= 0; e = cerca(r.p2[r.p2.length - 1]!)) {
      usado[e >> 1] = 1;
      r = juntar(r, e & 1 ? volver(ts[e >> 1]!) : ts[e >> 1]!);
    }
    for (let e = cerca(r.p2[0]!); e >= 0; e = cerca(r.p2[0]!)) {
      usado[e >> 1] = 1;
      r = juntar(e & 1 ? ts[e >> 1]! : volver(ts[e >> 1]!), r);
    }
    out.push(r);
  }
  return out;
}

/**
 * Form lines whose ends are within `radio` pixels and head the same way (the
 * gap between them too) become one line, nearest pairs first, where the gap
 * is in view: a hand's line running on into the forearm's.
 */
function encadenar(ts: Tramo[], radio: number, puenteVisible: (a: V3, b: V3) => boolean): Tramo[] {
  const cos = Math.cos((ENCADENA_GRADOS * Math.PI) / 180);
  // Each end's place and the way the line heads out of it (over its last 3 px).
  const fuera = (t: Tramo, fin: boolean): [P, P] => {
    const p = fin ? [...t.p2].reverse() : t.p2;
    const a = p[0]!;
    let b = p[p.length - 1]!;
    let L = 0;
    for (let i = 1; i < p.length; i++) {
      L += dist(p[i]!, p[i - 1]!);
      if (L >= 3) {
        b = p[i]!;
        break;
      }
    }
    const n = dist(a, b) || 1;
    return [a, [(a[0] - b[0]) / n, (a[1] - b[1]) / n]];
  };
  const ends = ts.flatMap((t) => [fuera(t, false), fuera(t, true)]);
  const pares: [number, number, number][] = [];
  const g = new Map<string, number[]>();
  const llave = (p: P) => `${Math.floor(p[0] / radio)} ${Math.floor(p[1] / radio)}`;
  ends.forEach(([p], e) => {
    const k = llave(p);
    const c = g.get(k);
    if (c) c.push(e);
    else g.set(k, [e]);
  });
  ends.forEach(([p, u], e) => {
    const [ci, cj] = [Math.floor(p[0] / radio), Math.floor(p[1] / radio)];
    for (let i = ci - 1; i <= ci + 1; i++)
      for (let j = cj - 1; j <= cj + 1; j++)
        for (const f of g.get(`${i} ${j}`) ?? []) {
          if (f <= e || f >> 1 === e >> 1) continue;
          const [q, v] = ends[f]!;
          const d = dist(p, q);
          if (d > radio) continue;
          // Out of e toward f, and out of f back toward e, all one way.
          const dir: P = d > 0.3 ? [(q[0] - p[0]) / d, (q[1] - p[1]) / d] : u;
          if (u[0] * dir[0] + u[1] * dir[1] < cos || -(v[0] * dir[0] + v[1] * dir[1]) < cos) continue;
          pares.push([d, e, f]);
        }
  });
  pares.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  // Each end takes one partner; a chain never closes on itself.
  const pareja = new Int32Array(ends.length).fill(-1);
  const raiz = ts.map((_, i) => i);
  const de = (i: number): number => (raiz[i] === i ? i : (raiz[i] = de(raiz[i]!)));
  const p3De = (e: number) => {
    const t = ts[e >> 1]!;
    return e & 1 ? t.p3[t.p3.length - 1]! : t.p3[0]!;
  };
  for (const [, e, f] of pares) {
    if (pareja[e]! >= 0 || pareja[f]! >= 0 || de(e >> 1) === de(f >> 1)) continue;
    if (!puenteVisible(p3De(e), p3De(f))) continue;
    pareja[e] = f;
    pareja[f] = e;
    raiz[de(e >> 1)] = de(f >> 1);
  }
  // Walk each chain from a free end.
  const out: Tramo[] = [];
  const hecho = new Uint8Array(ts.length);
  const recorrerCadena = (e0: number) => {
    // e0: the end the chain starts from; the stretch is read away from it.
    let e = e0;
    let r: Tramo | null = null;
    for (;;) {
      const i = e >> 1;
      hecho[i] = 1;
      const t = e & 1 ? volver(ts[i]!) : ts[i]!;
      r = r ? juntar(r, t, dist(r.p2[r.p2.length - 1]!, t.p2[0]!)) : t;
      const otro = e ^ 1;
      const f = pareja[otro]!;
      if (f < 0) return r;
      e = f;
    }
  };
  for (let i = 0; i < ts.length; i++) {
    if (hecho[i]) continue;
    if (pareja[2 * i]! < 0) out.push(recorrerCadena(2 * i));
    else if (pareja[2 * i + 1]! < 0) out.push(recorrerCadena(2 * i + 1));
  }
  return out;
}

/** A stretch with points every `paso` pixels or closer (its points in the hand's frame and its brightness alongside). */
function densa(t: Tramo, paso: number): Tramo {
  const p2: P[] = [t.p2[0]!];
  const p3: V3[] = [t.p3[0]!];
  const b: number[] = [t.b[0]!];
  const s: number[] = [t.s[0]!];
  for (let i = 1; i < t.p2.length; i++) {
    const n = Math.max(1, Math.ceil(dist(t.p2[i - 1]!, t.p2[i]!) / paso));
    for (let k = 1; k <= n; k++) {
      p2.push(lerp2(t.p2[i - 1]!, t.p2[i]!, k / n));
      p3.push(lerp3(t.p3[i - 1]!, t.p3[i]!, k / n));
      b.push(t.b[i - 1]! + ((t.b[i]! - t.b[i - 1]!) * k) / n);
      s.push(t.s[i - 1]! + ((t.s[i]! - t.s[i - 1]!) * k) / n);
    }
  }
  return { ...t, p2, p3, b, s };
}

/** Form lines cut HUECO pixels short of every barrier they meet (the contour, the creases); what is left under MINIMO goes. */
function recortar(ts: Tramo[], barreras: Tramo[]): Tramo[] {
  const g = new Rejilla(HUECO);
  barreras.forEach((b) => g.linea(b.p2));
  const out: Tramo[] = [];
  for (const t of ts) {
    const d = densa(t, 0.5);
    const libre = d.p2.map((p) => g.cerca(p) >= HUECO);
    if (libre.every(Boolean)) {
      out.push(t);
      continue;
    }
    for (let i = 0; i < d.p2.length; i++) {
      if (!libre[i]) continue;
      let j = i;
      while (j + 1 < d.p2.length && libre[j + 1]) j++;
      const q = parte(d, i, j);
      if (extension(q.p2) >= MINIMO) out.push(q);
      i = j;
    }
  }
  return out;
}

/** Walks a polyline in steps of at most `paso` pixels: each step's point, its direction as one of 8 bins over 180°, and its length. */
function recorrer(p: P[], paso: number, f: (x: number, y: number, bin: number, l: number) => void) {
  for (let i = 0; i + 1 < p.length; i++) {
    const [ax, ay] = p[i]!;
    const [bx, by] = p[i + 1]!;
    const L = Math.hypot(bx - ax, by - ay);
    if (L < 1e-9) continue;
    let a = Math.atan2(by - ay, bx - ax);
    if (a < 0) a += Math.PI;
    const bin = Math.min(7, Math.floor((a / Math.PI) * 8));
    const n = Math.max(1, Math.ceil(L / paso));
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      f(ax + (bx - ax) * t, ay + (by - ay) * t, bin, L / n);
    }
  }
}

/** Where lines run, per cell of a grid and per direction bin: what "alongside" is measured against. */
class Marcas {
  private readonly marca: Uint8Array;
  private readonly GW: number;
  private readonly GH: number;
  constructor(
    private readonly x0: number,
    private readonly y0: number,
    x1: number,
    y1: number,
    readonly C: number,
  ) {
    this.GW = Math.ceil((x1 - x0) / C) + 1;
    this.GH = Math.ceil((y1 - y0) / C) + 1;
    this.marca = new Uint8Array(this.GW * this.GH);
  }
  private readonly discos = new Map<number, [number, number][]>();
  /** Marks every cell within `r` pixels of the line (per point, if a function of it), in the line's direction there. */
  marcar(t: Tramo, r: number | ((i: number) => number), romo = false) {
    const disco = (r: number) => {
      const n = Math.ceil(r / this.C);
      let d = this.discos.get(n);
      if (!d) {
        d = [];
        for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) if (dx * dx + dy * dy <= n * n) d.push([dx, dy]);
        this.discos.set(n, d);
      }
      return d;
    };
    const radio = typeof r === "number" ? () => r : r;
    // Blunt (`romo`): nothing is marked past the line's ends, so another line may start right where this one stops.
    const p0 = t.p2[0]!;
    const p1 = t.p2[t.p2.length - 1]!;
    const [u0, u1] = [this.fuera(t.p2, false), this.fuera(t.p2, true)];
    const pasa = (x: number, y: number) => romo && ((x - p0[0]) * u0[0] + (y - p0[1]) * u0[1] > 0 || (x - p1[0]) * u1[0] + (y - p1[1]) * u1[1] > 0);
    let k = 0;
    let L = 0;
    // Which point of the line a step is at, for a radius that changes along it.
    recorrer(t.p2, this.C / 2, (x, y, bin, l) => {
      L += l;
      while (k + 1 < t.p2.length - 1 && L > dist(t.p2[k]!, t.p2[k + 1]!)) {
        L -= dist(t.p2[k]!, t.p2[k + 1]!);
        k++;
      }
      const i = Math.floor((x - this.x0) / this.C);
      const j = Math.floor((y - this.y0) / this.C);
      for (const [dx, dy] of disco(radio(k))) {
        const [a, b] = [i + dx, j + dy];
        if (a >= 0 && b >= 0 && a < this.GW && b < this.GH && !pasa(this.x0 + (a + 0.5) * this.C, this.y0 + (b + 0.5) * this.C))
          this.marca[b * this.GW + a]! |= 1 << bin;
      }
    });
  }
  /** The way a line heads out of its start (or its end), over its first 3 pixels. */
  private fuera(p: P[], fin: boolean): P {
    const q = fin ? [...p].reverse() : p;
    const a = q[0]!;
    let b = q[q.length - 1]!;
    let L = 0;
    for (let i = 1; i < q.length; i++) {
      L += dist(q[i]!, q[i - 1]!);
      if (L >= 3) {
        b = q[i]!;
        break;
      }
    }
    const n = dist(a, b) || 1;
    return [(a[0] - b[0]) / n, (a[1] - b[1]) / n];
  }
  /** How much of the line (pixels) runs in cells marked going its way (±1 bin of 22.5°). */
  junto(x: number, y: number, bin: number) {
    const i = Math.floor((x - this.x0) / this.C);
    const j = Math.floor((y - this.y0) / this.C);
    if (i < 0 || j < 0 || i >= this.GW || j >= this.GH) return false;
    return (this.marca[j * this.GW + i]! & ((1 << bin) | (1 << ((bin + 1) % 8)) | (1 << ((bin + 7) % 8)))) !== 0;
  }
}

/** The box around some stretches, with a margin. */
function caja(ts: Tramo[], margen: number): [number, number, number, number] {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const t of ts)
    for (const [x, y] of t.p2) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  return [x0 - margen, y0 - margen, x1 + margen, y1 + margen];
}

/** The seeds' marks (the contour), within `arrimo` pixels of them: worked out once, read by every spacing. */
function semillas(ts: Tramo[], arrimo: number, todo: Tramo[]): Marcas | null {
  if (!ts.length) return null;
  const m = new Marcas(...caja([...ts, ...todo], arrimo + 2), arrimo / 3);
  for (const t of ts) m.marcar(t, arrimo);
  return m;
}

/**
 * An even subset of the form lines, spaced the way an engraver spaces
 * hatching: the longest first, each kept unless more than `junto` of it runs
 * within `sep` pixels of a kept line going the same way (±1 bin of 22.5°), or
 * beside a seed (the contour); lines that cross the kept ones (a crease, a
 * nail) are not crowded by them.
 */
function espaciar(ts: Tramo[], sep: number, junto = JUNTO, semilla: Marcas | null = null): Tramo[] {
  if (!ts.length) return [];
  const m = new Marcas(...caja(ts, sep + 2), sep / 3);
  const orden = ts.map((t, i) => ({ t, i })).sort((a, b) => b.t.largo - a.t.largo || a.i - b.i);
  const out: Tramo[] = [];
  for (const { t } of orden) {
    let n = 0;
    let total = 0;
    recorrer(t.p2, 1, (x, y, bin, l) => {
      total += l;
      if (m.junto(x, y, bin) || semilla?.junto(x, y, bin)) n += l;
    });
    if (!total || n > junto * total) continue;
    out.push(t);
    m.marcar(t, sep);
  }
  return out;
}

/**
 * Hatching, the way an engraver lays it: the longest lines first, each drawn
 * where it runs clear of the lines already laid (by `sep` pixels, going the
 * same way) and of the seed (the contour, by ARRIMO), and stopped where it
 * comes too close, so lines that converge end instead of crowding; nor where
 * the scene leaves it darker than `umbral`. Pieces shorter than `minimo`
 * pixels are left out.
 */
function rayar(ts: Tramo[], sep: number, semilla: Marcas | null, minimo: number, umbral: number, lejos: (s: number) => number = () => 1): Tramo[] {
  if (!ts.length) return [];
  const m = new Marcas(...caja(ts, sep * LEJOS_SEP + 2), sep / 3);
  const orden = ts.map((t, i) => ({ t, i })).sort((a, b) => b.t.largo - a.t.largo || a.i - b.i);
  const out: Tramo[] = [];
  for (const { t } of orden) {
    const d = densa(t, 1);
    const n = d.p2.length;
    // Lit enough, or within ALARGA pixels of where it is: the scene tapers each fiber in and out (a burin
    // stroke), and the sketch runs on through the taper, so where one fiber ends and the next begins they meet.
    const claro = d.b.map((b) => b >= umbral);
    const cerca = new Float64Array(n).fill(Infinity);
    for (let i = 0, j = -Infinity; i < n; i++) cerca[i] = i - (j = claro[i] ? i : j);
    for (let i = n - 1, j = Infinity; i >= 0; i--) cerca[i] = Math.min(cerca[i]!, (j = claro[i] ? i : j) - i);
    const vivo = (i: number) => cerca[i]! <= ALARGA;
    const libre = d.p2.map((p, i) => {
      if (!vivo(i)) return false;
      const a = d.p2[Math.max(0, i - 1)]!;
      const b = d.p2[Math.min(n - 1, i + 1)]!;
      let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (ang < 0) ang += Math.PI;
      const bin = Math.min(7, Math.floor((ang / Math.PI) * 8));
      return !(m.junto(p[0], p[1], bin) || semilla?.junto(p[0], p[1], bin));
    });
    // A line that comes close for a moment runs on: crowded gaps shorter than sep are bridged (no dashes).
    for (let i = 1, j = -1; i < n; i++) {
      if (libre[i] && !libre[i - 1] && j >= 0 && i - j - 1 < sep && vivo(i)) for (let k = j + 1; k < i; k++) libre[k] = vivo(k);
      if (libre[i]) j = i;
    }
    const nuevos: Tramo[] = [];
    for (let i = 0; i < n; i++) {
      if (!libre[i]) continue;
      let j = i;
      while (j + 1 < n && libre[j + 1]) j++;
      const q = parte(d, i, j);
      if (q.largo >= minimo) nuevos.push(q);
      i = j;
    }
    for (const q of nuevos) {
      out.push(q);
      m.marcar(q, (i) => sep * lejos(q.s[i]!), true);
    }
  }
  return out;
}

/** Ramer–Douglas–Peucker, in place of thousands of points the eye can't tell apart. */
function simplificar(pts: P[], tol: number): P[] {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = pts[a]!;
    const [bx, by] = pts[b]!;
    const dx = bx - ax;
    const dy = by - ay;
    const L = Math.hypot(dx, dy);
    let far = -1;
    let dmax = tol;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]!;
      // A closed outline (a ring, a chip) starts where it ends: measure from that point instead of a chord of length 0.
      const d = L > 1e-9 ? Math.abs(dy * (px - ax) - dx * (py - ay)) / L : Math.hypot(px - ax, py - ay);
      if (d > dmax) {
        dmax = d;
        far = i;
      }
    }
    if (far >= 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

/** Points every `paso` pixels along a polyline, its ends kept. */
function remuestrear(p: P[], paso: number): P[] {
  const out: P[] = [p[0]!];
  let falta = paso;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!;
    const b = p[i]!;
    const L = dist(a, b);
    let t = falta;
    while (t <= L) {
      out.push(lerp2(a, b, t / L));
      t += paso;
    }
    falta = t - L;
  }
  const fin = p[p.length - 1]!;
  if (dist(out[out.length - 1]!, fin) > paso / 3) out.push(fin);
  else out[out.length - 1] = fin;
  return out;
}

/** Where a line turns sharper than `grados` over ALCANCE pixels each way: one index per corner (the sharpest point of it). */
function esquinas(q: P[], paso: number, grados: number, ciclo: boolean): number[] {
  const n = q.length;
  const k = Math.max(1, Math.round(ALCANCE / paso));
  const umbral = (grados * Math.PI) / 180;
  const ang = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const ia = ciclo ? (i - k + n) % n : i - k;
    const ib = ciclo ? (i + k) % n : i + k;
    if (ia < 0 || ib >= n) continue;
    const [a, p, b] = [q[ia]!, q[i]!, q[ib]!];
    const u = [p[0] - a[0], p[1] - a[1]];
    const v = [b[0] - p[0], b[1] - p[1]];
    const c = (u[0]! * v[0]! + u[1]! * v[1]!) / (Math.hypot(u[0]!, u[1]!) * Math.hypot(v[0]!, v[1]!) || 1);
    ang[i] = Math.acos(Math.max(-1, Math.min(1, c)));
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (ang[i]! <= umbral) continue;
    let j = i;
    let mejor = i;
    while (j + 1 < n && ang[j + 1]! > umbral) if (ang[++j]! > ang[mejor]!) mejor = j;
    out.push(mejor);
    i = j;
  }
  return out;
}

/** A quadratic B-spline's pieces as Bézier triples: clamped (from c[0] to its last point) or closed. */
function segmentos(c: P[], ciclo: boolean): [P, P, P][] {
  const n = c.length;
  if (ciclo) return c.map((p, k) => [medio(c[(k + n - 1) % n]!, p), p, medio(p, c[(k + 1) % n]!)]);
  const out: [P, P, P][] = [];
  for (let k = 1; k < n - 1; k++) out.push([k === 1 ? c[0]! : medio(c[k - 1]!, c[k]!), c[k]!, k === n - 2 ? c[n - 1]! : medio(c[k]!, c[k + 1]!)]);
  return out;
}

/** The spline's points, about every half pixel. */
function evaluar(c: P[], ciclo: boolean): P[] {
  const out: P[] = [];
  for (const [a, b, d] of segmentos(c, ciclo)) {
    const n = Math.max(2, Math.ceil((dist(a, b) + dist(b, d)) / 0.5));
    for (let k = out.length ? 1 : 0; k <= n; k++) {
      const t = k / n;
      const u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * b[0] + t * t * d[0], u * u * a[1] + 2 * u * t * b[1] + t * t * d[1]]);
    }
  }
  return out;
}

/**
 * The control points of the quadratic B-spline whose pieces pass through the
 * points at their middles: p[0] and the last are its ends (clamped) or, closed,
 * every point is a middle. Strongly diagonal, so Gauss–Seidel settles fast.
 */
function interpolar(p: P[], ciclo: boolean): P[] {
  const n = p.length;
  const c = p.map((q): P => [q[0], q[1]]);
  for (let it = 0; it < 40; it++)
    for (let k = ciclo ? 0 : 1; k < (ciclo ? n : n - 1); k++)
      for (let e = 0; e < 2; e++) {
        const a = c[(k + n - 1) % n]![e]!;
        const b = c[(k + 1) % n]![e]!;
        const q = p[k]![e]!;
        // Middle of piece k: (a + 6c + b) / 8 inside, (2a + 5c + b) / 8 next to a clamped end, (a + 2c + b) / 4 when it is the only piece.
        c[k]![e] =
          ciclo || (k > 1 && k < n - 2) ? (8 * q - a - b) / 6 : n === 3 ? (4 * q - a - b) / 2 : k === 1 ? (8 * q - 2 * a - b) / 5 : (8 * q - a - 2 * b) / 5;
      }
  return c;
}

/** The farthest either polyline strays from the other (beyond a cell's reach: Infinity). */
function desvio(a: P[], b: P[]): number {
  const lejos = (x: P[], y: P[]) => {
    const g = new Rejilla(1).linea(y);
    let peor = 0;
    for (const p of x) peor = Math.max(peor, g.cerca(p));
    return peor;
  };
  return Math.max(lejos(a, b), lejos(b, a));
}

/** One stretch between corners: straight if it is, else the fewest points whose spline stays within `tol` pixels of it. */
function trozo(q: P[], tol: number): Trozo {
  if (q.length < 3 || extension(q) < 1) return { curva: false, p: [q[0]!, q[q.length - 1]!] };
  for (let r = 4 * tol; r >= 0.25 * tol; r *= 0.7) {
    const v = simplificar(q, r);
    if (v.length === 2) {
      if (desvio(q, remuestrear(v, 0.5)) <= tol) return { curva: false, p: v };
      continue;
    }
    const c = interpolar(v, false);
    if (desvio(q, evaluar(c, false)) <= tol) return { curva: true, c };
  }
  return { curva: false, p: simplificar(q, tol) };
}

/**
 * A polyline (points every `paso` pixels) smoothed by a Gaussian of SUAVE
 * pixels; open, its ends stay where they are (the window shrinks toward them,
 * evenly on both sides, so nothing drifts).
 */
function alisar(p: P[], paso: number, ciclo: boolean): P[] {
  const n = p.length;
  const sig = SUAVE / paso;
  const R = Math.ceil(3 * sig);
  const w = Array.from({ length: R + 1 }, (_, k) => Math.exp((-k * k) / (2 * sig * sig)));
  return p.map((_, i) => {
    const r = ciclo ? Math.min(R, Math.floor((n - 1) / 2)) : Math.min(R, i, n - 1 - i);
    let [x, y, W] = [0, 0, 0];
    for (let k = -r; k <= r; k++) {
      const q = p[ciclo ? (i + k + n) % n : i + k]!;
      x += w[Math.abs(k)]! * q[0];
      y += w[Math.abs(k)]! * q[1];
      W += w[Math.abs(k)]!;
    }
    return [x / W, y / W];
  });
}

/**
 * A line (CSS pixels) as smooth curves broken at its corners; a closed one
 * with no corner, as a smooth loop. `liso`: smoothed first, between corners.
 */
function ajustar(p: P[], grados: number, tol: number, liso: boolean): Dibujo {
  const H = 0.5;
  let q = remuestrear(p, H);
  if (cerrado(p) && q.length > 6) {
    let anillo = q.slice(0, -1);
    const es = esquinas(anillo, H, grados, true);
    if (!es.length) {
      if (liso) anillo = alisar(anillo, H, true);
      const r0 = [...anillo, anillo[0]!];
      for (let r = 4 * tol; r >= 0.25 * tol; r *= 0.7) {
        const v = simplificar(r0, r).slice(0, -1);
        if (v.length < 3) continue;
        const c = interpolar(v, true);
        if (desvio(r0, evaluar(c, true)) <= tol) return { lazo: c };
      }
      q = r0;
    } else q = [...anillo.slice(es[0]), ...anillo.slice(0, es[0]), anillo[es[0]!]!];
  }
  const cortes = [0, ...esquinas(q, H, grados, false).filter((i) => i > 0 && i < q.length - 1), q.length - 1];
  const trozos: Trozo[] = [];
  for (let i = 1; i < cortes.length; i++) {
    const pieza = q.slice(cortes[i - 1], cortes[i]! + 1);
    trozos.push(trozo(liso && pieza.length > 4 ? alisar(pieza, H, false) : pieza, tol));
  }
  return { trozos };
}

const inicio = (d: Dibujo): P => ("lazo" in d ? medio(d.lazo[d.lazo.length - 1]!, d.lazo[0]!) : d.trozos[0]!.curva ? d.trozos[0]!.c[0]! : d.trozos[0]!.p[0]!);
const final = (d: Dibujo): P => {
  if ("lazo" in d) return inicio(d);
  const t = d.trozos[d.trozos.length - 1]!;
  return t.curva ? t.c[t.c.length - 1]! : t.p[t.p.length - 1]!;
};
const alReves = (d: Dibujo): Dibujo =>
  "lazo" in d
    ? { lazo: [...d.lazo].reverse() }
    : { trozos: [...d.trozos].reverse().map((t) => (t.curva ? { curva: true, c: [...t.c].reverse() } : { curva: false, p: [...t.p].reverse() })) };
const mover = (d: Dibujo, f: (p: P) => P): Dibujo =>
  "lazo" in d ? { lazo: d.lazo.map(f) } : { trozos: d.trozos.map((t) => (t.curva ? { curva: true, c: t.c.map(f) } : { curva: false, p: t.p.map(f) })) };

/** Lines in the order a pen would take them: each from wherever the last one ended (turned around if that end is nearer), so the moves stay short. */
function ordenar(ds: Dibujo[]): Dibujo[] {
  const out: Dibujo[] = [];
  const usado = new Uint8Array(ds.length);
  let at: P = [0, 0];
  for (let k = 0; k < ds.length; k++) {
    let mejor = -1;
    let vuelta = false;
    let dmin = Infinity;
    ds.forEach((d, i) => {
      if (usado[i]) return;
      const da = dist(at, inicio(d));
      const db = dist(at, final(d));
      if (da < dmin) [dmin, mejor, vuelta] = [da, i, false];
      if (db < dmin) [dmin, mejor, vuelta] = [db, i, true];
    });
    usado[mejor] = 1;
    const d = vuelta ? alReves(ds[mejor]!) : ds[mejor]!;
    out.push(d);
    at = final(d);
  }
  return out;
}

/**
 * Many lines as one path, all of it relative, on whole units: an `m` to
 * where each starts (the first from the origin, so it is absolute), straight
 * steps as `l`, curves as one `q` and then `t`s. A `t` mirrors the last
 * control point through the point it starts from, which is exactly how a
 * B-spline's pieces meet: each join is rounded so the mirrored control lands
 * within a unit of the true one, and nothing drifts.
 */
function escribir(ds: Dibujo[]) {
  let d = "";
  let ultimo = "";
  let at: P = [0, 0];
  const r = (p: P): P => [Math.round(p[0]), Math.round(p[1])];
  const pon = (cmd: string, ns: number[]) => {
    // A command repeats by itself after its own (and after an m, an l does).
    if (cmd !== ultimo && !(cmd === "l" && ultimo === "m")) d += cmd;
    else if (cmd === "m") d += cmd;
    for (const n of ns) d += (n >= 0 && /\d$/.test(d) ? " " : "") + n;
    ultimo = cmd;
  };
  const a = (p: P) => [p[0] - at[0], p[1] - at[1]];
  // A spline from where the pen is: its control points after the first, the last of them its end (or `cierre`, back where the loop began).
  const curva = (c: P[], fin: P | null) => {
    let C = r(c[0]!);
    for (let k = 0; k + 1 < c.length || (fin && k < c.length); k++) {
      const ultima = fin ? k === c.length - 1 : k === c.length - 2;
      const J = ultima ? (fin ?? r(c[c.length - 1]!)) : r(medio(C, c[k + 1]!));
      if (k === 0) pon("q", [...a(C), ...a(J)]);
      else pon("t", a(J));
      at = J;
      if (ultima) return;
      C = [2 * J[0] - C[0], 2 * J[1] - C[1]];
    }
  };
  for (const x of ds) {
    const p0 = r(inicio(x));
    if ("lazo" in x) {
      pon("m", a(p0));
      at = p0;
      curva(x.lazo, p0);
      continue;
    }
    pon("m", a(p0));
    at = p0;
    for (const t of x.trozos) {
      if (t.curva) curva(t.c.slice(1), null);
      else
        for (const p of t.p.slice(1)) {
          const q = r(p);
          if (q[0] === at[0] && q[1] === at[1]) continue;
          pon("l", a(q));
          at = q;
        }
    }
  }
  return d;
}

/**
 * The shift, stretch and skew (c, e, t) for which c + e·x + t·y lands each
 * point (x, y) nearest its target, the worst miss weighed by how much the
 * line counts: Lawson's reweighted least squares, which settles on the
 * minimax fit, then a pattern search with steps that halve to polish it.
 */
function minimax(ps: [P, number, number][]): [number, number, number] {
  const muestra = ps.filter((_, i) => i % Math.max(1, Math.floor(ps.length / 3000)) === 0);
  if (!muestra.length) return [0, 1, 0];
  const det = (m: number[]) => m[0]! * (m[4]! * m[8]! - m[5]! * m[7]!) - m[1]! * (m[3]! * m[8]! - m[5]! * m[6]!) + m[2]! * (m[3]! * m[7]! - m[4]! * m[6]!);
  // Least squares, each point weighed by lam.
  const mc = (lam: number[]): [number, number, number] | null => {
    const A = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const b = [0, 0, 0];
    muestra.forEach(([p, x, w], k) => {
      const v = [w, w * p[0], w * p[1]];
      for (let i = 0; i < 3; i++) {
        b[i]! += lam[k]! * v[i]! * w * x;
        for (let j = 0; j < 3; j++) A[3 * i + j]! += lam[k]! * v[i]! * v[j]!;
      }
    });
    const D = det(A);
    if (Math.abs(D) < 1e-12) return null;
    const col = (c: number) => A.map((x, i) => (i % 3 === c ? b[Math.floor(i / 3)]! : x));
    return [det(col(0)) / D, det(col(1)) / D, det(col(2)) / D];
  };
  const fallas = (g: [number, number, number]) => muestra.map(([p, x, w]) => w * Math.abs(g[0] + g[1] * p[0] + g[2] * p[1] - x));
  const falla = (g: [number, number, number]) => Math.max(...fallas(g));
  let lam = muestra.map(() => 1 / muestra.length);
  let f = mc(lam) ?? [muestra.reduce((s, [, x]) => s + x, 0) / muestra.length, 1, 0];
  for (let it = 0; it < 200; it++) {
    const r = fallas(f);
    const total = r.reduce((s, x, k) => s + lam[k]! * x, 0);
    if (total < 1e-12) break;
    lam = lam.map((l, k) => (l * r[k]!) / total);
    f = mc(lam) ?? f;
  }
  // A step moves the farthest points about as much in each parameter.
  const S = Math.max(1, ...muestra.map(([p]) => Math.hypot(p[0], p[1])));
  const dirs: [number, number, number][] = [];
  for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) for (const k of [-1, 0, 1]) if (i || j || k) dirs.push([i, j, k]);
  let mejor = falla(f);
  for (let paso = 1; paso > 1e-3; paso /= 2)
    for (let mejora = true; mejora; ) {
      mejora = false;
      for (const [i, j, k] of dirs) {
        const g: [number, number, number] = [f[0] + i * paso, f[1] + (j * paso) / S, f[2] + (k * paso) / S];
        const e = falla(g);
        if (e < mejor) [mejor, f, mejora] = [e, g, true];
      }
    }
  return f;
}

/** Dots (the machine's pads and screws): a zero-length step with a round cap draws a dot. */
function puntos(ps: P[]) {
  let d = "";
  let at: P = [0, 0];
  for (const [x, y] of ps.map(([x, y]) => [Math.round(x), Math.round(y)] as P)) {
    d += `m${[x - at[0], y - at[1]].reduce((s: string, n, i) => s + (i && n >= 0 ? " " : "") + n, "")}h0`;
    at = [x, y];
  }
  return d;
}

function cubeta(cubeta: (typeof CUBETAS)[number]) {
  const { nombre, w, h, small } = cubeta;
  const m = construirManos(small);
  const e = encuadre(w, h);
  const camera = new PerspectiveCamera(FOV, w / h, 0.1, 50);
  camera.position.set(0, AIM, e.z);
  camera.lookAt(0, AIM, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const vista = new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

  // The groups as the scene places them (inside the pair, turned by giro), with the hands waiting or closed (shut).
  const grupo = (giro: readonly [number, number, number], x: number, y: number) => {
    const pareja = new Group();
    pareja.rotation.z = e.giro;
    const g = new Group();
    g.rotation.set(...giro);
    g.position.set(x, y, 0);
    pareja.add(g);
    pareja.updateMatrixWorld();
    const normal = new Matrix3().getNormalMatrix(new Matrix4().multiplyMatrices(camera.matrixWorldInverse, g.matrixWorld)).elements;
    return { proy: proyector(new Matrix4().multiplyMatrices(vista, g.matrixWorld), w, h), normal };
  };
  const pose = (gap: number) => ({ humana: grupo(GIRO_HUMANA, -gap / 2, e.lift), maquina: grupo(GIRO_MAQUINA, gap / 2, -e.lift) });
  const abierta = pose(e.espera);
  const cerrada = pose(e.shut);

  // Each hand's lines, and where its forearm steps down and stops.
  const manos = {
    humana: { l: m.human, cuerpo: m.cuerpos.human, ls: lineas(m.human, true), cortes: [0, ...NIVELES, cubeta.fin].map((d) => m.human.wrist + d) },
    maquina: { l: m.machine, cuerpo: m.cuerpos.machine, ls: lineas(m.machine, false), cortes: [0, ...NIVELES, cubeta.fin].map((d) => m.machine.wrist + d) },
  };

  // The depth buffers cover every line they will test: the fine one the hands
  // and the near forearm, the coarse one the far forearm, past the strip on wider screens.
  const caja3 = (desde: number) => {
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const k of ["humana", "maquina"] as const) {
      const { ls, l } = manos[k];
      for (const ln of ls)
        ln.pts.forEach((p, i) => {
          if (ln.s[i]! < l.wrist + desde) return;
          const [sx, sy] = abierta[k].proy(...p);
          x0 = Math.min(x0, sx);
          y0 = Math.min(y0, sy);
          x1 = Math.max(x1, sx);
          y1 = Math.max(y1, sy);
        });
    }
    return [x0 - 4, y0 - 4, x1 + 4, y1 + 4] as const;
  };
  const z = new Profundidades(new Profundidad(...caja3(FINO), RASTER), new Profundidad(...caja3(cubeta.fin - 0.02), RASTER_LEJOS));
  for (const b of [z.fino, z.grueso]) {
    b.cuerpo(manos.humana.cuerpo, abierta.humana.proy);
    b.cuerpo(manos.maquina.cuerpo, abierta.maquina.proy);
  }

  // On screen (y down) the pair's axis runs at -giro: a point relative to a
  // fingertip, turned into the axis frame (x along the axis, toward the machine).
  const [cos, sin] = [Math.cos(e.giro), Math.sin(e.giro)];
  const alEje = ([x, y]: P): P => [x * cos - y * sin, x * sin + y * cos];
  // Screen → SVG units: RESOLUCION pixels each on the plane z = 0, from the mark, y down.
  const U = e.px / RESOLUCION;
  const svg = (p: readonly number[]): P => [(p[0]! / e.px) * U, (p[1]! / e.px - AIM) * U];
  // Each hand is drawn from its own fingertip, so closing is a transform about it.
  const puntas = { humana: svg(abierta.humana.proy(0, 0, 0)), maquina: svg(abierta.maquina.proy(0, 0, 0)) };
  const desde =
    (o: P) =>
    (p: P): P => {
      const [x, y] = svg(p);
      return alEje([x - o[0], y - o[1]]);
    };

  // Closing slides each hand along the pair's axis, parallel to the screen:
  // there a point moves along the axis by the slide over its depth, so parts
  // nearer the camera than the fingertip move more. Across a flat surface
  // 1/depth runs straight over the screen, so a slide, a stretch and a skew
  // are exact for a flat hand; a curled finger or the round forearm is not
  // flat. All three are fitted to the lines in view in the reference strip for
  // the least worst miss, a faint line's weighed down by its ink, the slide too (the
  // fingertip gives a little so the curled fingers give less): the handover
  // from sketch to scene shows the worst strong line, not the average one.
  // `peor` is the worst miss of any line in CSS pixels, `fuerte` of the lines
  // drawn at FUERTE or more.
  const enCaja = (q: P) => Math.abs(q[0]) < w / 2 / RESOLUCION && Math.abs(q[1] + AIM * U) < h / 2 / RESOLUCION;
  const ajuste = (ts: [Tramo, number][], a: Proy, c: Proy, o: P) => {
    // Each point waiting and closed, both in the axis frame from the waiting fingertip, and its line's ink.
    const pares = ts.flatMap(([t, tinta]) =>
      t.p3.flatMap((v): [P, P, number][] => {
        const p = svg(a(...v));
        const q = svg(c(...v));
        return enCaja(q) ? [[alEje([p[0] - o[0], p[1] - o[1]]), alEje([q[0] - o[0], q[1] - o[1]]), tinta]] : [];
      }),
    );
    const f = minimax(pares.map(([p, q, tinta]) => [p, q[0], Math.min(1, tinta / FUERTE)]));
    // As written: the slide to a tenth of a unit, the stretch to 4 places, the skew in degrees to 3.
    const cierre = +f[0].toFixed(1);
    const estira = +f[1].toFixed(4);
    const grados = +((Math.atan(f[2]) * 180) / Math.PI).toFixed(3);
    const sesgo = Math.tan((grados * Math.PI) / 180);
    let peor = 0;
    let fuerte = 0;
    for (const [p, q, tinta] of pares) {
      const d = Math.hypot(cierre + estira * p[0] + sesgo * p[1] - q[0], p[1] - q[1]) * RESOLUCION;
      peor = Math.max(peor, d);
      if (tinta >= FUERTE) fuerte = Math.max(fuerte, d);
    }
    return { cierre, estira, sesgo: grados, peor: +peor.toFixed(2), fuerte: +fuerte.toFixed(2) };
  };

  // Each hand's candidates are worked out once; what is drawn of them depends on the bytes (`escala` of the budgets).
  const mano = (k: "humana" | "maquina") => {
    const { ls, cortes, l: lns } = manos[k];
    const { proy, normal: nm } = abierta[k];
    const humana = k === "humana";
    const grados = ESQUINA[k];
    const sombra = lns.estilo.sombra;
    // How bright the scene draws a form line here: its light (half-Lambert, squared, from sombra) times its depth fade.
    const luzEn = (n: V3, zl: number) => {
      const prof = 0.25 + 0.75 * suave(-0.16, 0.08, zl);
      if (n[0] * n[0] + n[1] * n[1] + n[2] * n[2] < 0.25) return prof;
      const v = [nm[0]! * n[0] + nm[3]! * n[1] + nm[6]! * n[2], nm[1]! * n[0] + nm[4]! * n[1] + nm[7]! * n[2], nm[2]! * n[0] + nm[5]! * n[1] + nm[8]! * n[2]];
      const L = Math.hypot(v[0]!, v[1]!, v[2]!) || 1;
      const l = Math.max(0, Math.min(1, 0.5 + (0.5 * (v[0]! * LUZ[0] + v[1]! * LUZ[1] + v[2]! * LUZ[2])) / L));
      return (sombra + (1 - sombra) * l * l) * prof;
    };
    const puenteVisible = (a: V3, b: V3) => {
      const [ax, ay, ad] = proy(...a);
      const [bx, by, bd] = proy(...b);
      const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * RASTER));
      for (let i = 1; i < n; i++) {
        const t = i / n;
        if (!z.ve(ax + (bx - ax) * t, ay + (by - ay) * t, ad + (bd - ad) * t)) return false;
      }
      return true;
    };
    // What shows of each kind, joined on screen; crumbs go once joined (an edge
    // may come in pieces a pixel long). The form lines end one by one before
    // the forearm does, each by its own rnd.
    const fin = (l: Linea) => cortes[3]! + (l.kind === KIND.forma ? FIN_VARIA * Math.min(...l.ids) : 0);
    const vistos = ls.flatMap((l) => visibles(l, proy, z, fin(l), luzEn));
    // The human's contour turns into a form line where it falls in shade (its edges are lost and found): those
    // stretches keep the contour's ids, and the sketch draws them as contour, lighter.
    const idsContorno = new Set(humana ? ls.filter((l) => l.kind === KIND.contorno).flatMap((l) => [...l.ids]) : []);
    const enSombra = (t: Tramo) => t.kind === KIND.forma && [...t.ids].some((i) => idsContorno.has(i));
    const de = (kind: number, pliegue = false, sombra = false) =>
      unir(vistos.filter((t) => t.kind === kind && enSombra(t) === sombra && (sombra || t.pliegue === pliegue))).filter(
        (t) => extension(t.p2) >= (kind === KIND.chip ? MINIMO_PLACA : MINIMO),
      );

    // Twins drawn once: lines cut where they double back, the shorter of two that run together left out, the rest joined again.
    const gemelos = (ts: Tramo[]) =>
      unir(
        espaciar(
          ts.flatMap((t) => (cerrado(t.p2) && extension(t.p2) < TORNILLO ? [t] : vueltas(t))),
          cubeta.gemelo,
          DOBLE,
        ),
      ).filter((t) => extension(t.p2) >= MINIMO);
    // The contour: every edge, twins drawn once; the human's stubs where it meets itself go, and its crumbs of loops.
    let todos = [...gemelos(de(KIND.contorno)), ...gemelos(de(KIND.forma, false, true))];
    const dots: P[] = [];
    const tornillos = (ts: Tramo[]) =>
      ts.filter((t) => {
        if (!cerrado(t.p2)) return true;
        const x = extension(t.p2);
        if (humana) return x >= LAZO_MIN;
        if (x >= TORNILLO) return true;
        dots.push(t.p2.reduce((s, p) => [s[0] + p[0] / t.p2.length, s[1] + p[1] / t.p2.length], [0, 0] as P));
        return false;
      });
    todos = tornillos(todos);
    if (humana) {
      const g = new Rejilla(2);
      todos.forEach((t, i) => g.linea(t.p2, i));
      todos = todos.filter((t, i) => cerrado(t.p2) || extension(t.p2) >= cubeta.rama || (g.cerca(t.p2[0]!, i) > 2 && g.cerca(t.p2[t.p2.length - 1]!, i) > 2));
    }
    const placas = de(KIND.chip);
    // The human's creases, spaced among themselves (the machine's seams are below), and the lines that follow the form.
    let pliegues = humana ? espaciar(de(KIND.forma, true), small ? 3 : 2) : [];
    let formas = tornillos(de(KIND.forma));
    // The machine's traces: each ends in a pad, which shares its id. They are its look, so they come first.
    let trazas: Tramo[] = [];
    // The machine's small loops are screws (their slots inside them): details, all kept.
    const detalles: Tramo[] = [];
    if (!humana) {
      const anillos = formas.filter((t) => cerrado(t.p2) && extension(t.p2) < DETALLE);
      const dentro = (t: Tramo) => {
        const c = t.p2.reduce((s, p) => [s[0] + p[0] / t.p2.length, s[1] + p[1] / t.p2.length], [0, 0] as P);
        return anillos.some((a) => {
          const x = a.p2.map((p) => p[0]);
          const y = a.p2.map((p) => p[1]);
          return c[0] > Math.min(...x) && c[0] < Math.max(...x) && c[1] > Math.min(...y) && c[1] < Math.max(...y);
        });
      };
      for (const t of formas) if (anillos.includes(t) || (!cerrado(t.p2) && extension(t.p2) < TORNILLO && dentro(t))) detalles.push(t);
      formas = gemelos(formas.filter((t) => !detalles.includes(t))).flatMap((t) =>
        cerrado(t.p2) ? [t] : vueltas(t, RINCON).filter((q) => extension(q.p2) >= MINIMO),
      );
      // Its seams: lines across the way the hand runs (s hardly changes along them): its joints. The rest are its shells' folds.
      const conPad = new Set(Array.from(m.pads.rnd));
      const esTraza = (t: Tramo) => [...t.ids].some((i) => conPad.has(i));
      const r = ritmo(ls);
      const costura = (t: Tramo) => {
        let L = 0;
        for (let i = 1; i < t.p3.length; i++) L += Math.hypot(t.p3[i]![0] - t.p3[i - 1]![0], t.p3[i]![1] - t.p3[i - 1]![1], t.p3[i]![2] - t.p3[i - 1]![2]);
        const [s0, s1] = [Math.min(...t.s), Math.max(...t.s)];
        return s1 - s0 < COSTURA * r((s0 + s1) / 2) * L;
      };
      trazas = formas.filter(esTraza);
      pliegues = espaciar(
        formas.filter((t) => !esTraza(t) && costura(t)),
        cubeta.gemelo,
        DOBLE,
      );
      formas = formas.filter((t) => !esTraza(t) && !costura(t));
    }
    if (humana) {
      for (const t of formas) if (extension3(t.p3) < NUDO_3D && vira(t.p2) > NUDO) detalles.push(t);
      formas = recortar(
        encadenar(
          formas.filter((t) => !detalles.includes(t)),
          ENCADENA,
          puenteVisible,
        ),
        [...todos, ...pliegues],
      );
    }
    // The pads in view (a pad shares its trace's id).
    const visos: { p: P; id: number }[] = [];
    if (!humana)
      for (let i = 0; i < m.pads.count; i++) {
        if (m.pads.s[i]! < cortes[1]!) continue;
        const [sx, sy, d] = proy(m.pads.pos[i * 3]!, m.pads.pos[i * 3 + 1]!, m.pads.pos[i * 3 + 2]!);
        if (z.ve(sx, sy, d)) visos.push({ p: [sx, sy], id: m.pads.rnd[i]! });
      }
    const o = puntas[k];
    // Each line cut where the forearm steps down (band 0 the hand, 1 and 2 the fading forearm), once.
    const partes = new Map<Tramo, [number, Tramo][]>();
    const porBanda = (t: Tramo) => {
      let r = partes.get(t);
      // Each line steps down at its own place (by its rnd), so the steps don't line up in a column across the arm.
      const d = ESCALON * (Math.min(...t.ids) % 1);
      if (!r) partes.set(t, (r = porS(t, [cortes[1]! - d, cortes[2]! - d])));
      return r;
    };
    // Each piece is fitted once (in CSS pixels, the faint ones looser); a path is then the fitted pieces, in pen order, in SVG units.
    const ajustados = new Map<Tramo, Dibujo>();
    const dibujo = (t: Tramo, banda: number) => {
      let d = ajustados.get(t);
      if (!d) ajustados.set(t, (d = ajustar(t.p2, grados, banda ? TOLERANCIA_LEJOS : TOLERANCIA, humana)));
      return d;
    };
    const escribe = (ps: [number, Tramo][]) => escribir(ordenar(ps.map(([b, t]) => mover(dibujo(t, b), desde(o)))));
    const camino = (ts: Tramo[]) => escribe(ts.flatMap(porBanda));
    const largo = (ts: Tramo[]) => Math.round(ts.reduce((a, t) => a + t.largo, 0));
    const sep0 = cubeta[k].separacion;
    // Past the first step the forearm's hatching opens up, to LEJOS_SEP times its gap by the second.
    const abre = (s: number) => 1 + (LEJOS_SEP - 1) * Math.max(0, Math.min(1, (cortes[1]! - s) / (cortes[1]! - cortes[2]!)));
    // The form lines: as many as fit their bytes, spaced evenly clear of the contour (the gap widens until they fit).
    // The human's are hatching (pieces of lines, stopped where they crowd); the machine's are whole traces.
    const espaciado = (ts: Tramo[], s: number, semilla: Marcas | null) =>
      humana ? rayar(ts, s, semilla, cubeta.trozo, BRILLO_MIN, abre) : espaciar(ts, s, JUNTO, semilla);
    const elegir = (ts: Tramo[], sep: number, presupuesto: number, semilla: Marcas | null, espacia = espaciado) => {
      let s = sep;
      let el = espacia(ts, s, semilla);
      let d = camino(el);
      while (d.length > presupuesto && el.length) {
        s *= 1.1;
        el = s > 16 * sep ? [] : espacia(ts, s, semilla);
        d = camino(el);
      }
      return { el, sep: s, bytes: d.length };
    };
    // The machine's seams are spaced among themselves already: short of bytes, they thin out like the rest.
    const juntas = (ts: Tramo[], s: number) => espaciar(ts, s, DOBLE);

    return (escala: number, escalaForma: number) => {
      // Every contour and edge, unless they outgrow their bytes: then the shortest go first.
      let minimo = MINIMO;
      let contorno = todos;
      while (camino(contorno).length > cubeta[k].contorno * escala) {
        minimo *= 1.25;
        contorno = todos.filter((t) => t.largo >= minimo);
      }
      // The form lines by rank, each taking what the bytes leave: the screws; the
      // machine's seams (its joints), then its traces, then its folds; the human's creases, then its hatching.
      let resto = cubeta[k].forma * escala * escalaForma - camino(detalles).length;
      const toma = (r: { el: Tramo[]; sep: number; bytes: number }) => ((resto -= r.bytes), r);
      const costuras = humana ? toma({ el: pliegues, sep: 0, bytes: camino(pliegues).length }) : toma(elegir(pliegues, cubeta.gemelo, resto, null, juntas));
      const pistas = toma(elegir(trazas, sep0, resto, null));
      const forma = toma(elegir(formas, sep0, resto, semillas(contorno, ARRIMO, formas)));
      // Each piece to its path: the forearm's by how far it has faded, the
      // human's hatching on the hand by the scene's light (the lit lines stronger).
      const orden: Clase[] = ["trazo-mas-lejos", "trazo-lejos", "trazo-forma", "trazo-forma-luz", "trazo-contorno", "trazo-placas"];
      const clases = new Map<Clase, [number, Tramo][]>(orden.map((c) => [c, []]));
      const pon = (c: Clase, p: [number, Tramo]) => clases.get(c)!.push(p);
      for (const t of contorno)
        for (const p of porBanda(t))
          pon(([t.kind === KIND.contorno ? "trazo-contorno" : "trazo-forma-luz", "trazo-lejos", "trazo-mas-lejos"] as const)[p[0]]!, p);
      for (const t of forma.el)
        for (const p of porBanda(t))
          pon(p[0] === 2 ? "trazo-mas-lejos" : p[0] === 0 && humana && brilloDe(p[1]) >= BRILLO_LUZ ? "trazo-forma-luz" : "trazo-forma", p);
      for (const t of [...pistas.el, ...costuras.el, ...detalles])
        for (const p of porBanda(t))
          pon(p[0] === 2 ? "trazo-mas-lejos" : p[0] === 0 && humana && brilloDe(p[1]) >= BRILLO_LUZ ? "trazo-forma-luz" : "trazo-forma", p);
      for (const t of placas) pon("trazo-placas", [0, t]);
      // The pads of the traces it kept: theirs, and on one of them on screen; the screws too small to draw, as dots.
      const ids = new Set(pistas.el.flatMap((t) => [...t.ids]));
      const enTraza = (p: P) => pistas.el.some((t) => t.p2.some((q, i) => i > 0 && aSegmento(p, t.p2[i - 1]!, q) < 2));
      const pads = [...visos.filter((v) => ids.has(v.id) && enTraza(v.p)).map((v) => v.p), ...dots];
      const tinta = TINTA[k];
      const paths: [Clase, string, Tramo[]][] = orden.map((c) => [c, escribe(clases.get(c)!), clases.get(c)!.map(([, t]) => t)]);
      paths.push(["trazo-pads", puntos(ordenar(pads.map((p) => mover({ trozos: [{ curva: false, p: [p] }] }, desde(o)))).map(inicio)), []]);
      const ink = Math.round(paths.reduce((s, [c, , ts]) => s + tinta[c] * (c === "trazo-pads" ? 2.4 * pads.length : largo(ts)), 0));
      return {
        paths: paths.map(([c, d]) => [c, d] as [Clase, string]),
        ajuste: ajuste(
          paths.flatMap(([c, , ts]) => ts.map((t): [Tramo, number] => [t, tinta[c]])),
          abierta[k].proy,
          cerrada[k].proy,
          o,
        ),
        stats: {
          contorno: [contorno.length, todos.length, largo(contorno), largo(todos)],
          minimo: +minimo.toFixed(1),
          forma: [forma.el.length, formas.length, largo(forma.el), largo(formas)],
          sep: +forma.sep.toFixed(1),
          luz: clases.get("trazo-forma-luz")!.length,
          brillos: humana
            ? [0.1, 0.25, 0.5, 0.75, 0.9].map((q) => +(forma.el.map(brilloDe).sort((a, b) => a - b)[Math.floor(q * (forma.el.length - 1))] ?? 0).toFixed(2))
            : [],
          pliegues: [costuras.el.length, pliegues.length],
          ...(humana ? {} : { pistas: [pistas.el.length, trazas.length, +pistas.sep.toFixed(1)] }),
          reparto: {
            contorno: camino(contorno).length,
            pliegues: costuras.bytes,
            pistas: pistas.bytes,
            formas: forma.bytes,
            detalles: camino(detalles).length,
          },
          detalles: detalles.length,
          lejos: [clases.get("trazo-lejos")!.length, clases.get("trazo-mas-lejos")!.length],
          placas: placas.length,
          pads: pads.length,
          tinta: ink,
          bytes: Object.fromEntries(paths.filter(([, d]) => d).map(([c, d]) => [c.replace("trazo-", ""), d.length])),
        },
      };
    };
  };
  const humana = mano("humana");
  const maquina = mano("maquina");

  const k = (e.size * U) / 60;
  const vb = [(-e.vista.ancho * U) / 2, -AIM * U - (e.vista.alto * U) / 2, e.vista.ancho * U, e.vista.alto * U].map((n) => +n.toFixed(3)).join(" ");
  return (escala: number, escalaForma: number) => {
    const h = humana(escala, escalaForma);
    const q = maquina(escala, escalaForma);
    return {
      nombre,
      vb,
      giro: +((-e.giro * 180) / Math.PI).toFixed(3),
      puntas: { humana: puntas.humana.map(Math.round), maquina: puntas.maquina.map(Math.round) },
      ajuste: { humana: h.ajuste, maquina: q.ajuste },
      escala: +k.toFixed(4),
      humana: h,
      maquina: q,
      stats: {
        humana: h.stats,
        maquina: q.stats,
        cierreHumana: h.ajuste,
        cierreMaquina: q.ajuste,
        raster: [z.fino.W, z.fino.H, z.grueso.W, z.grueso.H],
        px: +e.px.toFixed(2),
      },
    };
  };
}

type Cubeta = ReturnType<ReturnType<typeof cubeta>>;

/** Where a hand's group sits: its fingertip, turned to the pair's axis (no turn on a wide strip). */
const sitio = (punta: number[], giro: number) => `translate(${punta.join(" ")})${giro ? ` rotate(${giro})` : ""}`;

/** A hand's paths, lightest first (the far forearm, form, contour, chips, pads); a path with nothing to draw is left out. */
const caminos = (x: Cubeta["humana"]) =>
  x.paths
    .filter(([, d]) => d)
    .map(([c, d]) => `\n            <path className="${c}" d="${d}" />`)
    .join("");

const g = (
  c: Cubeta,
) => `      <svg className="trazo-cubeta" data-cubeta="${c.nombre}" viewBox="${c.vb}" preserveAspectRatio="xMidYMid meet" overflow="visible">
        <g transform="${sitio(c.puntas.humana, c.giro)}">
          <g className="trazo-humana" style={vars({ "--cierre": "${c.ajuste.humana.cierre}px", "--estira": ${c.ajuste.humana.estira}, "--sesgo": "${c.ajuste.humana.sesgo}deg" })}>${caminos(c.humana)}
          </g>
        </g>
        <g transform="${sitio(c.puntas.maquina, c.giro)}">
          <g className="trazo-maquina" style={vars({ "--cierre": "${c.ajuste.maquina.cierre}px", "--estira": ${c.ajuste.maquina.estira}, "--sesgo": "${c.ajuste.maquina.sesgo}deg" })}>${caminos(c.maquina)}
          </g>
        </g>
        <g className="trazo-lazo" transform="scale(${c.escala})">
          <path className="trazo-arco" pathLength={1} d="M23.909 2.092A24 24 0 1 0 2.092 23.909" />
          <circle className="trazo-punto" cx="16.971" cy="16.971" r="6" />
        </g>
      </svg>`;

const archivo = (cubetas: Cubeta[]) => `// Generated by scripts/manos-trazo.ts from manos-geometria.ts. Do not edit: run \`npx tsx scripts/manos-trazo.ts\`.
import { vars } from "@/components/ak/Brand";

/**
 * The hands as a pencil sketch through the scene's camera, hidden lines left
 * out: an <svg> per strip shape, each hand a group that closes by --cierre,
 * --estira and --sesgo, and the mark, open until data-lazo closes it.
 */
export default function ManosTrazo() {
  return (
    <svg className="manos-trazo" aria-hidden="true" data-lazo="abierto">
${cubetas.map(g).join("\n")}
    </svg>
  );
}
`;

// The CSS must weigh the paths as TINTA does, or the ink print lies.
{
  const css = readFileSync(ESTILOS, "utf8");
  for (const [mano, clases] of Object.entries(TINTA))
    for (const [c, v] of Object.entries(clases)) {
      const propio = new RegExp(`\\.trazo-${mano} \\.${c}(?![\\w-])[^{]*\\{[^}]*stroke-opacity:\\s*([\\d.]+)`).exec(css);
      const comun = new RegExp(`\\.manos-trazo \\.${c}(?![\\w-])[^{]*\\{[^}]*stroke-opacity:\\s*([\\d.]+)`).exec(css);
      const real = Number((propio ?? comun)?.[1]);
      if (real !== v) console.warn(`20-manos.src.css: .trazo-${mano} .${c} has stroke-opacity ${real}, TINTA says ${v}`);
    }
}

// Each bucket's lines in view once; then the drawing at full budget. Should it weigh
// too much, the form lines give way first, then every budget alike.
const dibujos = CUBETAS.map(cubeta);
let escala = 1;
let escalaForma = 1;
let cubetas = dibujos.map((d) => d(escala, escalaForma));
let tsx = archivo(cubetas);
while (Buffer.byteLength(tsx) > LIMITE && escala > 0.2) {
  if (escalaForma > FORMA_MIN) escalaForma *= 0.95;
  else escala *= 0.95;
  cubetas = dibujos.map((d) => d(escala, escalaForma));
  tsx = archivo(cubetas);
}
for (const c of cubetas) console.log(c.nombre, JSON.stringify(c.stats));
console.log(`ManosTrazo.tsx: ${Buffer.byteLength(tsx)} bytes`);
// The human hand leads the piece: on each strip it must draw at least the machine's ink. The hands keep
// changing, so say so when a new pair tips it the other way.
for (const c of cubetas)
  if (c.stats.humana.tinta < c.stats.maquina.tinta)
    console.warn(
      `${c.nombre}: the human hand draws ${c.stats.humana.tinta} of ink, the machine ${c.stats.maquina.tinta}. Raise the human's form budget in CUBETAS or lower TINTA.maquina (and its CSS).`,
    );
if (escala < 1 || escalaForma < 1)
  console.warn(
    `Over ${LIMITE} bytes at full budget: form budgets at ${Math.round(escalaForma * 100)} %, all budgets at ${Math.round(escala * 100)} %. Lower the budgets in CUBETAS or raise LIMITE.`,
  );
if (process.argv.includes("--check")) {
  let actual = "";
  try {
    actual = readFileSync(SALIDA, "utf8");
  } catch {}
  if (actual !== tsx) {
    console.error("ManosTrazo.tsx is stale: run npx tsx scripts/manos-trazo.ts");
    process.exit(1);
  }
} else writeFileSync(SALIDA, tsx);
