// What both hands are built with: vector math, a seeded random, the buffers
// the GPU gets (lines to draw, and a body for the depth buffer) and where
// everything sits on screen. No three.js here: the hands are built in a worker
// (manos-obra.ts), and the pencil sketch (scripts/manos-trazo.ts) and the scene
// (manos-escena.ts) frame them with these same numbers.

export type V3 = [number, number, number];

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** A seeded random, so the hands are the same on every visit. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * How a hand's lines are inked on Ink, at 1x (the scene brightens them on a
 * denser screen): `alfa` is the opacity of the lines that follow the form,
 * `contorno` that of the contour and the edges, `sombra` what a form line keeps
 * on the side away from the light (1: no light at all), and `punta` how much
 * the lines soften at the fingertip, so the mark stays the brightest thing.
 */
export type Estilo = { alfa: number; contorno: number; sombra: number; punta: number };

/** What each line is, for the shader (the `kind` buffer). */
export const KIND = {
  /** A line that follows the form: lit by the scene's light through its normal. */
  forma: 0,
  /** A chip's outline: it glints in the signal's color. */
  chip: 1,
  /** The contour (silhouette) and the hard edges: unlit, at `contorno`. */
  contorno: 2,
} as const;

/**
 * One hand's segments (or points) for the GPU. `pos` holds xyz per vertex;
 * `s` says how far along the hand each vertex is (0 elbow, 1 fingertip) and
 * drives the drawing and the signal; `rnd` is one value per line, the same at
 * both ends; `kind` is a KIND per vertex; `nrm` the outward normal of the
 * surface under the vertex (unit), or 0, 0, 0 for a line the light doesn't
 * touch; `wrist` is the `s` of the wrist, where the forearm starts fading out.
 * `centro` and `radio` are its bounding sphere, worked out where the hand is
 * built (the worker): three.js needs the centre to sort the transparent lines
 * and would otherwise walk every vertex in the scene's first frame, on the main
 * thread.
 */
export type Lines = {
  pos: Float32Array;
  s: Float32Array;
  rnd: Float32Array;
  kind: Float32Array;
  nrm: Float32Array;
  count: number;
  wrist: number;
  centro: [number, number, number];
  radio: number;
  estilo: Estilo;
};

/**
 * A hand's body: triangles that only write depth, so the lines behind the
 * hand are hidden the way they would be on a solid hand. It is never drawn in
 * any color. It sits a hair inside the surface the lines lie on.
 */
export type Solido = {
  pos: Float32Array;
  idx: Uint32Array;
  centro: [number, number, number];
  radio: number;
};

/** Both hands, as the hero draws them: denser on a wide screen, lighter on a phone. */
export type Manos = { human: Lines; machine: Lines; pads: Lines; cuerpos: { human: Solido; machine: Solido } };

/** The bounding sphere three.js would compute (BufferGeometry.computeBoundingSphere): the box's centre, the farthest vertex. */
export function esfera(pos: Float32Array): { centro: [number, number, number]; radio: number } {
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
    const dx = pos[i]! - centro[0],
      dy = pos[i + 1]! - centro[1],
      dz = pos[i + 2]! - centro[2];
    r2 = Math.max(r2, dx * dx + dy * dy + dz * dz);
  }
  return { centro, radio: Math.sqrt(r2) };
}

const CERO: V3 = [0, 0, 0];

/** Lines, a segment at a time. `mirror` flips x (the machine is built as a right hand and shown as a left one). */
export class Builder {
  private pos: number[] = [];
  private s: number[] = [];
  private rnd: number[] = [];
  private kind: number[] = [];
  private nrm: number[] = [];
  constructor(private mirror: boolean) {}
  private push(p: V3, s: number, r: number, k: number, n: V3) {
    this.pos.push(this.mirror ? -p[0] : p[0], p[1], p[2]);
    this.nrm.push(this.mirror ? -n[0] : n[0], n[1], n[2]);
    this.s.push(s);
    this.rnd.push(r);
    this.kind.push(k);
  }
  seg(a: V3, b: V3, sa: number, sb: number, r: number, k = 0, na: V3 = CERO, nb: V3 = na) {
    this.push(a, sa, r, k, na);
    this.push(b, sb, r, k, nb);
  }
  point(p: V3, s: number, r: number, n: V3 = CERO) {
    this.push(p, s, r, 0, n);
  }
  done(wrist: number, estilo: Estilo): Lines {
    const f = (a: number[]) => new Float32Array(a);
    const pos = f(this.pos);
    return { pos, s: f(this.s), rnd: f(this.rnd), kind: f(this.kind), nrm: f(this.nrm), count: this.s.length, wrist, estilo, ...esfera(pos) };
  }
}

/** A body, a triangle at a time. Mirrored like Builder; its winding doesn't matter (the scene draws both sides). */
export class Cuerpo {
  private pos: number[] = [];
  private idx: number[] = [];
  constructor(private mirror: boolean) {}
  /** Adds a vertex and returns its index. */
  v(p: V3): number {
    this.pos.push(this.mirror ? -p[0] : p[0], p[1], p[2]);
    return this.pos.length / 3 - 1;
  }
  tri(a: number, b: number, c: number) {
    this.idx.push(a, b, c);
  }
  /** A whole indexed mesh at once: xyz per vertex, three indices per triangle. */
  malla(pos: ArrayLike<number>, idx: ArrayLike<number>) {
    const base = this.pos.length / 3;
    for (let i = 0; i < pos.length; i += 3) this.v([pos[i]!, pos[i + 1]!, pos[i + 2]!]);
    for (let i = 0; i < idx.length; i++) this.idx.push(base + idx[i]!);
  }
  done(): Solido {
    const pos = new Float32Array(this.pos);
    return { pos, idx: new Uint32Array(this.idx), ...esfera(pos) };
  }
}

// ── Where everything sits ────────────────────────────────────────────────
// The scene (manos-escena.ts) frames the hands with these numbers and
// scripts/manos-trazo.ts projects the 2D sketch with the very same ones, so
// the pencil drawing lands under the lines.

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
export function encuadre(width: number, height: number): Encuadre {
  const compact = width < 760;
  const vista = compact ? VISTA_COMPACTA : VISTA;
  const size = compact ? 0.2 : 0.15;
  const reach = size / 2 + 0.8 * (size / 2) + 0.005;
  const half = Math.tan((FOV * Math.PI) / 360);
  const aspect = width / (height || 1);
  return {
    compact,
    vista,
    size,
    mark: size * (32 / 30),
    espera: compact ? 0.54 : 0.56,
    shut: 2 * Math.sqrt(reach * reach - LIFT * LIFT),
    lift: -LIFT,
    giro: compact ? DIAGONAL : 0,
    z: Math.max(vista.alto / (2 * half), vista.ancho / (2 * half * aspect)),
    px: Math.min(width / vista.ancho, height / vista.alto),
  };
}

/** The strips the hands are drawn for: the hero at 390 × 844 (a phone) and at 1440 × 900. The sketch is projected at these. */
export const TIRAS = { compacta: { w: 390, h: 424 }, ancha: { w: 1440, h: 460 } } as const;

/**
 * Where the camera sits in a hand's own frame, as the hand is built (before
 * the machine is mirrored), with the hands waiting and the dolly done, on the
 * reference strip of a phone (`small`) or of a wide screen. A contour drawn
 * for this eye is the hand's silhouette on screen; the hands move a little
 * while they enter and close (the view turns by a degree or two), too little
 * for a contour to slip off its edge.
 */
export function ojoLocal(small: boolean, mano: "humana" | "maquina"): V3 {
  const t = small ? TIRAS.compacta : TIRAS.ancha;
  const e = encuadre(t.w, t.h);
  const humana = mano === "humana";
  // World: the pair turns by giro about z; each group sits at (∓gap/2, ±lift, 0), turned by its Euler XYZ.
  const ojo: V3 = [0, AIM, e.z];
  const rz = (v: V3, a: number): V3 => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]];
  const ry = (v: V3, a: number): V3 => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)];
  const rx = (v: V3, a: number): V3 => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)];
  const enPareja = rz(ojo, -e.giro);
  const g = humana ? GIRO_HUMANA : GIRO_MAQUINA;
  const sitio: V3 = humana ? [-e.espera / 2, e.lift, 0] : [e.espera / 2, -e.lift, 0];
  // Euler XYZ is Rx·Ry·Rz: undone as Rz⁻¹·Ry⁻¹·Rx⁻¹.
  const local = rz(ry(rx(sub(enPareja, sitio), -g[0]), -g[1]), -g[2]);
  // The machine is built unmirrored and mirrored in x as it is pushed.
  return humana ? local : [-local[0], local[1], local[2]];
}
