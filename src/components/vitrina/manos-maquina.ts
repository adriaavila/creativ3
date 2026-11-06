// The machine hand: a robotic right hand at human scale, drawn as a technical
// illustration (the scene inks it and mirrors it into a left hand). Each part
// is a small closed mesh (manos-maquina-malla.ts): three shells per finger,
// hinge pins, a sensor plate and a pad at each tip, a domed back plate on the
// palm's frame, the thumb on a turret, a bearing at the wrist, a tapered
// forearm. Lines: their hard edges and silhouettes, and the chips and traces.
import { Builder, Cuerpo, KIND, add, cross, dot, lerp, mul, norm, ojoLocal, rng, sub, type Estilo, type Lines, type Solido, type V3 } from "./manos-base";
import { COSTURA, Malla, OCULTA, aristas, en, losa, redondeado, rotar, tambor, tubo, type Marco, type P2, type Tinta } from "./manos-maquina-malla";
import { brazoCircuito, placaCircuito, type Salida, type Superficie } from "./manos-maquina-pistas";

/** s at the wrist: the forearm (BRAZO units to the elbow) takes the first 0.3 of the drawing. */
const WS = 0.3;
const BRAZO = 3;
/** Wrist to fingertips: s runs over it from WS to 1. */
const LARGO = 0.86;
const sPalma = (q: V3) => WS + (1 - WS) * Math.min(1, Math.max(0, q[0] / LARGO));
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/**
 * The first version's pose: curl per joint (index, the other three, thumb),
 * tilt about z at the wrist, the forearm's droop. The other three curl a touch
 * more than its 0.2, 0.25, 0.18, or the longer middle finger reaches the index.
 */
const POSE = { indice: [0, 0.03, 0.02], otros: [0.27, 0.33, 0.24], pulgar: [0.08, 0.1], tilt: -0.03, brazo: -0.07 };

/**
 * The fingers (wrist at the origin, fingers +x, thumb +y, back +z): knuckle,
 * splay, phalanx lengths, half width, roll (so a curl reads from the front),
 * share of the pose's curl (0: the index's own).
 */
type Dedo = { m: V3; abre: number; l: number[]; a: number; giro: number; k: number };
const DEDOS: Dedo[] = [
  { m: [0.414, 0.152, 0.004], abre: 0.05, l: [0.2, 0.124, 0.1], a: 0.043, giro: 0, k: 0 },
  { m: [0.424, 0.052, 0.01], abre: 0, l: [0.218, 0.135, 0.109], a: 0.044, giro: -0.1, k: 1 },
  { m: [0.401, -0.048, 0.004], abre: -0.06, l: [0.202, 0.125, 0.101], a: 0.042, giro: -0.16, k: 1.05 },
  { m: [0.355, -0.138, -0.01], abre: -0.15, l: [0.163, 0.101, 0.082], a: 0.036, giro: -0.22, k: 1.12 },
];

/**
 * The thumb: its turret's centre, the metacarpal's way out (≈ 35° off the
 * index), its roll (its side faces the back, so it curls toward the index),
 * lengths, half width, the knuckle's resting bend.
 */
const PULGAR = { base: [0.078, 0.13, -0.02] as V3, dir: norm([0.8, 0.56, -0.16]), giro: -1, meta: 0.19, l: [0.138, 0.118], a: 0.047, dobla: 0.36 };

/** A shell runs CAPUCHA past its joint, a hood over the next, which starts DENTRO inside it and takes its taper at HUECO; CH: the forearm's chamfer. */
const CAPUCHA = 0.016;
const DENTRO = 0.008;
const HUECO = 0.004;
const CH = 0.004;

const TINTA: Tinta = { lift: 0.0015, pliegue: Math.cos((35 * Math.PI) / 180), duro: Math.cos((62 * Math.PI) / 180) };

type Calidad = { np: number; nariz: number; lados: number; tapa: number; paso: number };

/** A finger's back over half width A, at v across it: crowned between the chamfers. */
const lomo = (A: number, v: number) => A * (0.72 + 0.06 * Math.max(0, 1 - (v / (0.8 * A)) ** 2));

/**
 * A finger's section, counterclockwise from the palm: the crowned back, 45°
 * chamfers down to the ridges (`a` out), the palm side rounded in `n` steps.
 * `m` rounds the back into a dome (a closing nose); the sides stay flat, so
 * the outline from above stays on the ridges.
 */
function seccion(a: number, n: number, m = 0): P2[] {
  const r = 0.52 * a;
  const lado: P2[] = [];
  for (let j = 0; j <= n; j++) {
    const t = ((n - j) / n) * (Math.PI / 2);
    lado.push([0.45 * a + 0.55 * a * Math.cos(t), r - 1.4 * a * Math.sin(t)]);
  }
  for (let j = 0; j <= 4; j++) lado.push([0.8 * a * (1 - j / 2), lomo(a, 0.8 * a * (1 - j / 2))]);
  return [...lado, ...lado.slice(0, n + 1).map(([y, z]): P2 => [-y, z]).reverse()].map(([y, z]) => {
    const t = Math.atan2((z - r) / (0.26 * a), y / a);
    return z > r ? [lerp(y, a * Math.cos(t), m), lerp(z, r + 0.26 * a * Math.sin(t), m)] : [y, z];
  });
}
/** That section at u, shrunk by k toward the axis, morphed by m. */
const anillo = (f: Marco, u: number, a: number, n: number, k = 1, m = 0) => seccion(a, n, m).map(([y, z]) => en(f, u, y * k, z * k));
/** An inner shell's first rings, tapering from u0 toward u1: shrunk at the start, so its edges stay clear of the hood's as the joint turns. */
const entrada = (f: Marco, u0: number, u1: number, a0: number, a1: number, q: Calidad) => [anillo(f, u0, a0, q.np, 0.88), anillo(f, HUECO, lerp(a0, a1, (HUECO - u0) / (u1 - u0)), q.np)];
/** A rounded end: rings from the section at u to a point `largo` past it, along a quarter ellipse. */
const cierre = (f: Marco, u: number, largo: number, a: number, q: Calidad) =>
  Array.from({ length: q.nariz }, (_, j) => {
    const t = ((j + 1) / q.nariz) * (Math.PI / 2);
    return anillo(f, u + largo * Math.sin(t), a, q.np, Math.max(0.12, Math.cos(t)), Math.sin(t));
  });

/** The last phalanx: a shell closing into a rounded nose, the sensor plate on its back, the soft pad under it (the tip). Returns the tip. */
function yema(partes: () => Malla, f: Marco, u0: number, l: number, a0: number, a1: number, s: (p: V3) => number, q: Calidad, pulgar: boolean): V3 {
  const nariz = 0.8 * a1;
  const un = l - 0.011 - nariz;
  tubo(partes(), [...entrada(f, u0, un, a0, a1, q), anillo(f, un, a1, q.np), ...cierre(f, un, nariz, a1, q)], s, [OCULTA]);
  // The sensor plate, on the crowned back, ending as the nose rounds.
  const A = (u: number) => (u < un ? lerp(a0, a1, clamp01((u - u0) / (un - u0))) : a1 * Math.sqrt(Math.max(0, 1 - ((u - un) / nariz) ** 2)));
  // An oval: a curled tip seen end-on shows a nail, not a box.
  const w = 0.38 * a1;
  const p0 = CAPUCHA + 0.25 * (un - CAPUCHA);
  const p1 = un + 0.2 * nariz;
  const placa = redondeado([[p0, -w, 0.9 * w], [p1, -w, 0.9 * w], [p1, w, 0.9 * w], [p0, w, 0.9 * w]], q.paso);
  losa(partes(), f, placa, [[0, -0.004], [0, 0.0026]], s, (u, v, h) => lomo(A(u), v) + h, [0.7, 0.4, 0.15]);
  // The pad: an egg under the nose, its front past it. The thumb shows its side: its pad is shorter and lower, or it hooks out.
  const [k, fin, zc] = pulgar ? [0.75, 0.026, -0.74 * a1] : [1, 0, -0.5 * a1];
  const pa = 0.42 * k * (l - u0);
  const pc = l - fin - pa;
  const T = (4 / 4.5) * (Math.PI / 2);
  const huevo = Array.from({ length: 9 }, (_, j) => {
    const t = ((j - 4) / 4) * T;
    return Array.from({ length: q.tapa }, (_, i) => {
      const th = (i / q.tapa) * Math.PI * 2;
      return en(f, pc + pa * Math.sin(t), 0.9 * k * a1 * Math.cos(t) * Math.cos(th), zc + 0.46 * k * a1 * Math.cos(t) * Math.sin(th));
    });
  });
  tubo(partes(), huevo, s);
  return en(f, pc + pa * Math.sin(T), 0, zc);
}

/** A drum about the frame's y: [height, radius] steps. */
const drum = (m: Malla, f: Marco, perfil: P2[], n: number, s: (p: V3) => number, rayas = 0, desde?: number, hasta?: number, aros?: P2[]) => tambor(m, f.o, f.y, f.x, perfil, n, s, rayas, desde, hasta, aros);

/** A drum's profile from h0 to h1 at radius r, its ends chamfered by c. */
const chaflan = (h0: number, h1: number, r: number, c: number): P2[] => [[h0, r - c], [h0 + c, r], [h1 - c, r], [h1, r - c]];

/**
 * A finger as a chain of rigid shells: the first rounds off into a heel under
 * the back plate (the thumb's starts inside its turret); each runs on past its
 * joint, a hood over the next, a size smaller, so a joint shows one seam.
 * Returns the tip.
 */
function dedo(partes: () => Malla, base: V3, x0: V3, z0: V3, l: number[], curl: number[], a: number, s0: number, q: Calidad, pulgar = false): V3 {
  const y = cross(z0, x0);
  const total = l.reduce((t, v) => t + v, 0);
  const marcos: Marco[] = [];
  let o = base;
  let phi = 0;
  for (let i = 0; i < l.length; i++) {
    phi += curl[i] ?? 0;
    const x = add(mul(x0, Math.cos(phi)), mul(z0, -Math.sin(phi)));
    marcos.push({ o, x, y, z: cross(x, y) });
    o = add(o, mul(x, l[i]!));
  }
  // s from the knuckle's to 1 at the tip, by length walked.
  const sDe = (i: number) => {
    const antes = l.slice(0, i).reduce((t, v) => t + v, 0);
    const f = marcos[i]!;
    return (p: V3) => s0 + ((1 - s0) * (antes + Math.min(l[i]!, Math.max(0, dot(sub(p, f.o), f.x))))) / total;
  };
  // Ridge half widths at each shell's ends, closing in toward the tip.
  const ancho = [1, 0.94, 0.87, 0.83, 0.76, 0.72].map((k) => k * a);
  let punta = base;
  for (let i = 0; i < l.length; i++) {
    const f = marcos[i]!;
    const desde = i ? -DENTRO : pulgar ? -0.02 : 0;
    // The thumb's root narrows, so its outlines cut the turret's rim at an angle, not along it.
    const a0 = pulgar && !i ? 0.82 * a : ancho[2 * i]!;
    const a1 = ancho[2 * i + 1]!;
    if (i === l.length - 1) punta = yema(partes, f, desde, l[i]!, a0, a1, sDe(i), q, pulgar);
    else tubo(partes(), [...(i ? entrada(f, desde, l[i]! + CAPUCHA, a0, a1, q) : [...(pulgar ? [] : cierre(f, 0, -0.4 * a, a0, q).reverse()), anillo(f, desde, a0, q.np)]), anillo(f, l[i]! + CAPUCHA, a1, q.np)], sDe(i), [OCULTA, COSTURA]);
    // Seen from above, a pin's cap shows only on a finger rolled on its side (the thumb); elsewhere it lies along the outline.
    if (i && Math.abs(f.y[2]) > 0.5) drum(partes(), f, chaflan(-ancho[2 * i - 1]!, ancho[2 * i - 1]!, 0.3 * a, 0.0015), q.tapa, sDe(i));
  }
  return punta;
}

/**
 * The palm's frame (counterclockwise from the wrist) and the back plate on it,
 * whose front runs just past the knuckles: a hood the fingers come out from
 * under. Every turn is convex. The frame's rear corner, under the boss, is just
 * rounder than its top inset (0.012): a tighter one folds the top.
 */
const MARCO: [number, number, number][] = [[0.025, -0.122, 0.0135], [0.32, -0.178, 0.04], ...DEDOS.map((d): [number, number, number] => [d.m[0] - 0.012, d.m[1], 0.03]).reverse(), [0.395, 0.196, 0.04], [0.2, 0.17, 0.08], [0.025, 0.1, 0.045]];
const PLACA: [number, number, number][] = [[0.06, -0.1, 0.04], [0.37, -0.195, 0.02], [0.39, -0.138, 0.05], [0.418, -0.048, 0.05], [0.44, 0.052, 0.05], [0.433, 0.15, 0.05], [0.428, 0.21, 0.02], [0.2, 0.185, 0.08], [0.06, 0.105, 0.04]];

/** The back plate's dome. */
const domo = (x: number, y: number) => 0.046 + 0.012 * Math.max(0, 1 - ((x - 0.24) / 0.32) ** 2 - (y / 0.24) ** 2);

/** The forearm's half width at d (≤ 0, from the wrist): its section is a finger's, bigger. */
const anchoBrazo = (d: number) => lerp(0.106, 0.158, Math.min(1, -d / BRAZO));

/** The machine hand for a phone (`small`) or a wide screen: lines, pads and body, mirrored. */
export function machineHand(small: boolean): { lines: Lines; pads: Lines; solid: Solido } {
  const q: Calidad = small ? { np: 3, nariz: 4, lados: 18, tapa: 10, paso: 0.4 } : { np: 4, nariz: 5, lados: 24, tapa: 14, paso: 0.28 };
  const rand = rng(11);
  const partes: Malla[] = [];
  const parte = () => {
    const m = new Malla(rand());
    partes.push(m);
    return m;
  };

  // ── The fingers ──
  let punta: V3 = [0, 0, 0];
  DEDOS.forEach((d, i) => {
    const x0: V3 = [Math.cos(d.abre), Math.sin(d.abre), 0];
    const z0 = rotar([0, 0, 1], x0, d.giro);
    const curl = d.k ? POSE.otros.map((c) => c * d.k) : POSE.indice;
    const tip = dedo(parte, d.m, x0, z0, d.l, curl, d.a, sPalma(d.m), q);
    if (i === 0) punta = tip;
  });

  // ── The thumb: its turret, a metacarpal, two phalanges ──
  const P = PULGAR;
  // The turret stands over the plate's corner and the thumb's root, its top rim inked all round; a flat hub on it.
  const Z: V3 = [0, 0, 1];
  tambor(parte(), P.base, Z, [1, 0, 0], chaflan(-0.045, 0.086, 0.052, 0.006), q.lados, sPalma, 0, 1, 2, [[2, KIND.contorno]]);
  tambor(parte(), P.base, Z, [1, 0, 0], chaflan(0.08, 0.091, 0.022, 0.003), q.lados, sPalma, 0, 1, 2, [[2, COSTURA]]);
  {
    const z0 = norm(sub([0, 0, 1], mul(P.dir, P.dir[2])));
    const zt = rotar(z0, P.dir, P.giro);
    dedo(parte, P.base, P.dir, zt, [P.meta, ...P.l], [0, P.dobla + (POSE.pulgar[0] ?? 0), POSE.pulgar[1] ?? 0], P.a * 1.04, sPalma(P.base), q, true);
  }

  // ── The palm: its frame, rounded over at the top, and the domed back plate ──
  const H: Marco = { o: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  losa(parte(), H, redondeado(MARCO, q.paso), [[0.03, -0.066], [0.011, -0.06], [0.003, -0.05], [0, -0.035], [0, 0.018], [0.002, 0.025], [0.006, 0.0295], [0.012, 0.031]], sPalma);
  // Its wall sits in the frame, drafted in, so from above it shows one outline; its top follows the dome (heights under 0.01).
  losa(parte(), H, redondeado(PLACA, q.paso), [[0.005, 0.02], [0, 0]], sPalma, (u, v, w) => (w > 0.01 ? w : domo(u, v) + w), [0.86, 0.64, 0.4, 0.16]);

  // ── The wrist: a bearing, an actuator each side ──
  const xa = norm([1, POSE.brazo, 0]);
  const A: Marco = { o: [0, 0, 0], x: xa, y: cross([0, 0, 1], xa), z: [0, 0, 1] };
  const sBrazo = (p: V3) => WS * clamp01(1 + dot(p, xa) / BRAZO);
  // Its groove is inked, not cut (cut walls jog the outline). Low, so its back hides in the forearm; its front stops at the frame.
  const rodamiento: P2[] = [[-0.09, 0.089], [-0.085, 0.093], [-0.04, 0.093], [-0.03, 0.093], [0.016, 0.093], [0.02, 0.089]];
  drum(parte(), { o: [0, 0, -0.02], x: A.y, y: A.x, z: A.z }, rodamiento, q.lados + 8, sBrazo, 4, 1, 4, [[2, KIND.forma], [3, KIND.forma]]);
  // A cylinder half sunk in the forearm's side; its rod, clear of the bearing, runs under the turret or into the boss.
  for (const y of [0.124, -0.124]) {
    const f: Marco = { o: en(A, 0, y, 0), x: A.y, y: A.x, z: A.z };
    drum(parte(), f, chaflan(-0.28, -0.13, 0.017, 0.004), 14, sBrazo);
    drum(parte(), f, [[-0.14, 0.0075], [y > 0 ? 0.07 : 0.035, 0.0075]], 12, sBrazo);
  }
  // The boss sits over the frame's corner: the frame's edges and the rod meet its rim at separate points.
  tambor(parte(), [0.028, -0.124, -0.03], Z, [1, 0, 0], chaflan(0, 0.07, 0.022, 0.004), 16, sPalma, 0, 1, 2, [[2, KIND.contorno]]);

  // ── The forearm: a tapered housing in two pieces, a cover plate down its back ──
  // Ends chamfered (first and last rings a size smaller); a quiet seam midway down each side chamfer.
  const n = q.np + 1;
  const brazo = (d0: number, d1: number) =>
    tubo(
      parte(),
      [d0, d0 + 2 * CH, d1 - 2 * CH, d1].map((d, k) => {
        const c = seccion(anchoBrazo(d) - (k % 3 ? 0 : 2 * CH), n);
        const mitad = (i: number): P2 => [(c[i]![0] + c[i + 1]![0]) / 2, (c[i]![1] + c[i + 1]![1]) / 2];
        return [...c.slice(0, n + 1), mitad(n), ...c.slice(n + 1, n + 6), mitad(n + 5), ...c.slice(n + 6)].map(([y, z]) => en(A, d, y, z));
      }),
      sBrazo,
      [],
      [n + 1, n + 7],
      1,
      2,
    );
  // The split sits in the frame, so the forearm reads as a housing, not a beam.
  brazo(-BRAZO, -0.315);
  brazo(-0.305, -0.088);
  const CUBIERTA = 0.003;
  const alto = (u: number, v: number, w: number) => lomo(anchoBrazo(u), v) + w;
  losa(parte(), A, redondeado([[-0.98, -0.036, 0.01], [-0.13, -0.036, 0.024], [-0.13, 0.036, 0.024], [-0.98, 0.036, 0.01]], q.paso), [[0, -0.004], [0, CUBIERTA]], sBrazo, alto);

  // ── Into place: the tilt at the wrist, the index tip at the origin ──
  const ct = Math.cos(POSE.tilt);
  const st = Math.sin(POSE.tilt);
  const giro = (v: V3): V3 => [v[0] * ct - v[1] * st, v[0] * st + v[1] * ct, v[2]];
  const cero = giro(punta);
  const xf = (p: V3): V3 => sub(giro(p), cero);
  for (const { p } of partes) for (let i = 0; i < p.length; i += 3) [p[i], p[i + 1], p[i + 2]] = xf([p[i]!, p[i + 1]!, p[i + 2]!]);

  // ── Ink and body ──
  const ojo = ojoLocal(small, "maquina");
  const lines = new Builder(true);
  const pads = new Builder(true);
  const cuerpo = new Cuerpo(true);
  for (const m of partes) {
    aristas(m, ojo, lines, TINTA, small ? 0 : 0.0012);
    cuerpo.malla(m.p, m.t);
  }

  // The circuitry, in the hand's frame, moved like the parts.
  const salida: Salida = {
    seg: (a, b, sa, sb, r, k, na, nb) => lines.seg(xf(a), xf(b), sa, sb, r, k, giro(na), giro(nb)),
    pad: (p, s, r, n) => pads.point(xf(p), s, r, giro(n)),
  };
  const L = TINTA.lift;
  const e = 1e-4;
  const placa: Superficie = (x, y) => {
    const z = domo(x, y);
    const n = norm([(domo(x - e, y) - domo(x + e, y)) / (2 * e), (domo(x, y - e) - domo(x, y + e)) / (2 * e), 1]);
    return { p: [x + n[0] * L, y + n[1] * L, z + n[2] * L], n, s: sPalma([x, y, z]) };
  };
  placaCircuito(placa, salida, rand, small);
  const dorso: Superficie = (d, y) => {
    const p = en(A, d, y, alto(d, y, CUBIERTA + L));
    return { p, n: A.z, s: sBrazo(p) };
  };
  brazoCircuito(dorso, salida, rand, small);

  const estilo: Estilo = { alfa: 0.4, contorno: 0.78, sombra: 0.3, punta: 0.1 };
  return { lines: lines.done(WS, estilo), pads: pads.done(WS, estilo), solid: cuerpo.done() };
}
