// The hands, as a pencil sketch: one drawing for five uses (the waiting
// underdrawing, the twin without WebGL, the closed frame without JavaScript,
// the close's open loop, and a reference for the link preview).
//
//   npx tsx scripts/manos-trazo.ts            writes src/components/vitrina/ManosTrazo.tsx
//   npx tsx scripts/manos-trazo.ts --check    exit 1 if that file is stale
//
// It builds the same hands as the scene (construirManos, seeds 7 and 11),
// keeps about 1 fiber in 12 and 1 trace in 8, and projects them through the
// scene's own camera and framing (encuadre), so the drawing lands under the
// fibers. A phone and a desktop strip see the hands from different distances,
// so there are two buckets, each projected at its reference strip (the hero
// at 390×844 and at 1440×900); a container query shows the one that fits.
//
// SVG units are thousandths of a scene unit on the plane of the fingertips,
// centred on the mark, y down. The viewBox is the least the camera keeps in
// view (2.1 × 1.12 units around its aim) and `xMidYMid meet` fits it the way
// the camera does, so that plane lines up at any strip size; lines nearer the
// camera (the forearms) are exact at the reference size and close elsewhere.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Group, PerspectiveCamera, Vector3, type Matrix4 } from "three";
import { AIM, FOV, GIRO_HUMANA, GIRO_MAQUINA, LAZO, VISTA, construirManos, encuadre, type Lines } from "../src/components/vitrina/manos-geometria";

const SALIDA = join(process.cwd(), "src/components/vitrina/ManosTrazo.tsx");

const CUBETAS = [
  { nombre: "compacto", w: 390, h: 424, small: true },
  { nombre: "ancho", w: 1440, h: 460, small: false },
] as const;

/** Keep one fiber in this many, and one trace in this many, of the phone's set. */
const FIBRAS = 12;
const PISTAS = 8;
const TELEFONO = { fibras: 300, pistas: 170 };
/** Simplify each line until it strays at most this many pixels from the real one. */
const TOLERANCIA_PX = 0.6;
/**
 * The scene fades the forearms to a tenth (LINE_VERT: uWrist − 0.16); the
 * sketch stops a little before, where they are already faint.
 */
const ANTEBRAZO = 0.12;

type P = [number, number];
type Linea = { pts: Vector3[]; s: number[]; id: number; kind: number };

/** Lines → polylines: consecutive segments that share an end and an id are one line. */
function lineas(l: Lines): Linea[] {
  const out: Linea[] = [];
  for (let i = 0; i < l.count; i += 2) {
    const a = new Vector3(l.pos[i * 3]!, l.pos[i * 3 + 1]!, l.pos[i * 3 + 2]!);
    const b = new Vector3(l.pos[i * 3 + 3]!, l.pos[i * 3 + 4]!, l.pos[i * 3 + 5]!);
    const id = l.rnd[i]!;
    const cur = out[out.length - 1];
    const last = cur?.pts[cur.pts.length - 1];
    if (cur && last && cur.id === id && last.equals(a)) {
      cur.pts.push(b);
      cur.s.push(l.s[i + 1]!);
    } else out.push({ pts: [a, b], s: [l.s[i]!, l.s[i + 1]!], id, kind: l.kind[i]! });
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
      // A closed outline (a chip) starts where it ends: measure from that point instead of a chord of length 0.
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

/** Numbers for path data: no space before a minus sign. */
function numeros(ns: number[]) {
  return ns.reduce((s, n, i) => s + (i && n >= 0 ? " " : "") + n, "");
}

/** One path for many lines: an absolute move, then relative steps on whole units (rounded once, so nothing drifts). */
function trazar(lineas: P[][]) {
  let d = "";
  for (const l of lineas) {
    const r = l.map(([x, y]) => [Math.round(x), Math.round(y)] as P).filter((p, i, a) => i === 0 || p[0] !== a[i - 1]![0] || p[1] !== a[i - 1]![1]);
    if (r.length < 2) continue;
    const steps = r.slice(1).flatMap((p, i) => [p[0] - r[i]![0], p[1] - r[i]![1]]);
    d += `M${numeros(r[0]!)}l${numeros(steps)}`;
  }
  return d;
}

/** Dots (the machine's pads): a zero-length step with a round cap draws a dot. */
function puntos(ps: P[]) {
  let d = "";
  let prev: P | null = null;
  for (const [x, y] of ps.map(([x, y]) => [Math.round(x), Math.round(y)] as P)) {
    d += prev ? `m${numeros([x - prev[0], y - prev[1]])}h0` : `M${numeros([x, y])}h0`;
    prev = [x, y];
  }
  return d;
}

function cubeta({ nombre, w, h, small }: (typeof CUBETAS)[number]) {
  const m = construirManos(small);
  const e = encuadre(w, h);
  const camera = new PerspectiveCamera(FOV, w / h, 0.1, 50);
  camera.position.set(0, AIM, e.z);
  camera.lookAt(0, AIM, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  // The groups as the scene places them, with the hands waiting (open) or closed (shut).
  const grupo = (giro: readonly [number, number, number], x: number, y: number) => {
    const g = new Group();
    g.rotation.set(...giro);
    g.position.set(x, y, 0);
    g.updateMatrixWorld();
    return g.matrixWorld;
  };
  const pose = (gap: number) => ({ human: grupo(GIRO_HUMANA, -gap / 2, e.lift), machine: grupo(GIRO_MAQUINA, gap / 2, -e.lift) });
  const abierta = pose(e.open);
  const cerrada = pose(e.shut);

  // Screen → SVG units: thousandths of a unit on the plane z = 0, from the mark, y down.
  const half = { x: w / 2, y: h / 2 };
  const proyectar = (v: Vector3, mat: typeof abierta.human): P => {
    const p = v.clone().applyMatrix4(mat).project(camera);
    const sx = p.x * half.x;
    const sy = -p.y * half.y;
    return [(sx / e.px) * 1000, (sy / e.px - AIM) * 1000];
  };
  const tol = (TOLERANCIA_PX / e.px) * 1000;

  // The hands' lines, cut where the scene has faded the forearm.
  const corte = (l: Lines) => l.wrist - ANTEBRAZO;
  const dibujar = (ls: Linea[], mat: typeof abierta.human, desde: number) =>
    ls
      .map((l) => l.pts.filter((_, i) => l.s[i]! >= desde).map((v) => proyectar(v, mat)))
      .filter((l) => l.length > 1)
      .map((l) => simplificar(l, tol));

  const humanas = lineas(m.human);
  const varia = (l: Linea) => l.s[0] !== l.s[l.s.length - 1];
  // Fibers run elbow to fingertip (their s grows); the few that cross the back
  // of the hand keep one s. Both buckets draw the same fibers and traces: the
  // first of each are the same on every screen (same seeds), so 1 in 12 and
  // 1 in 8 of the phone's set.
  const fibras = humanas.filter(varia).slice(0, TELEFONO.fibras).filter((_, i) => i % FIBRAS === 0);
  const maquinas = lineas(m.machine);
  const pistas = maquinas
    .filter((l) => l.kind === 0 && varia(l))
    .slice(0, TELEFONO.pistas)
    .filter((_, i) => i % PISTAS === 0);
  const ids = new Set(pistas.map((l) => l.id));
  // The pads of the kept traces (a pad shares its trace's id), and the cuff: the two rings at the wrist, the widest.
  const pads: Vector3[] = [];
  for (let i = 0; i < m.pads.count; i++) {
    if (ids.has(m.pads.rnd[i]!) && m.pads.s[i]! >= corte(m.machine)) pads.push(new Vector3(m.pads.pos[i * 3]!, m.pads.pos[i * 3 + 1]!, m.pads.pos[i * 3 + 2]!));
  }
  // One ring of each joint's pair (they come in pairs, a hair apart), and both bands of the cuff.
  const todos = maquinas.filter((l) => l.kind === 0 && !varia(l));
  const anillos = todos.filter((_, i) => i % 2 === 0 || i >= todos.length - 2);
  const chips = maquinas.filter((l) => l.kind === 1 && l.pts.length > 3);

  // Each hand is drawn from its own fingertip, so closing is a transform about it.
  const origen = new Vector3(0, 0, 0);
  const puntas = { human: proyectar(origen, abierta.human), machine: proyectar(origen, abierta.machine) };
  const desde = (o: P) => (ls: P[][]) => ls.map((l) => l.map(([x, y]) => [x - o[0], y - o[1]] as P));
  const humana = desde(puntas.human)(dibujar(fibras, abierta.human, corte(m.human)));
  const maquina = desde(puntas.machine)(dibujar(pistas, abierta.machine, corte(m.machine)));
  const juntas = desde(puntas.machine)(dibujar(anillos, abierta.machine, 0));
  const placas = desde(puntas.machine)(dibujar(chips, abierta.machine, 0));

  // Closing moves each hand sideways in the scene. On screen that is exact at
  // the fingertip (on z = 0) and grows toward the elbow, which is nearer the
  // camera: a translation plus a horizontal stretch about the fingertip,
  // fitted to the lines that show in the reference strip.
  const cierre = ((e.open - e.shut) / 2) * 1000;
  const enCaja = (q: P) => Math.abs(q[0]) < (w / 2 / e.px) * 1000 && Math.abs(q[1] + AIM * 1000) < (h / 2 / e.px) * 1000;
  const ajuste = (ls: Linea[], a: Matrix4, c: Matrix4, o: P, mover: number) => {
    let num = 0;
    let den = 0;
    const pares: [P, P][] = [];
    for (const l of ls)
      for (const v of l.pts) {
        const p = proyectar(v, a);
        const q = proyectar(v, c);
        if (!enCaja(q)) continue;
        pares.push([p, q]);
        num += (p[0] - o[0]) * (q[0] - o[0] - mover);
        den += (p[0] - o[0]) ** 2;
      }
    const estira = den ? num / den : 1;
    let peor = 0;
    let solo = 0;
    for (const [p, q] of pares) {
      peor = Math.max(peor, Math.hypot(o[0] + mover + estira * (p[0] - o[0]) - q[0], p[1] - q[1]) * (e.px / 1000));
      solo = Math.max(solo, Math.hypot(p[0] + mover - q[0], p[1] - q[1]) * (e.px / 1000));
    }
    return { estira: +estira.toFixed(4), peor: +peor.toFixed(2), soloTraslado: +solo.toFixed(2) };
  };
  const ajusteHumana = ajuste(fibras, abierta.human, cerrada.human, puntas.human, cierre);
  const ajusteMaquina = ajuste(pistas, abierta.machine, cerrada.machine, puntas.machine, -cierre);

  const k = (e.size * 1000) / 60;
  return {
    nombre,
    cierre: Math.round(cierre),
    puntas: { human: puntas.human.map(Math.round), machine: puntas.machine.map(Math.round) },
    estira: { human: ajusteHumana.estira, machine: ajusteMaquina.estira },
    escala: +k.toFixed(4),
    humana: trazar(humana),
    maquina: trazar(maquina),
    juntas: trazar(juntas),
    placas: trazar(placas),
    pads: puntos(desde(puntas.machine)([pads.map((v) => proyectar(v, abierta.machine))])[0]!),
    stats: {
      fibras: fibras.length,
      pistas: pistas.length,
      pads: pads.length,
      anillos: anillos.length,
      chips: chips.length,
      cierreHumana: ajusteHumana,
      cierreMaquina: ajusteMaquina,
      punto: [LAZO.anillo * e.size * Math.SQRT1_2 * 1000, LAZO.anillo * e.size * Math.SQRT1_2 * 1000].map((n) => +n.toFixed(1)),
      px: +e.px.toFixed(2),
    },
  };
}

const cubetas = CUBETAS.map(cubeta);
const vb = [-VISTA.ancho * 500, -AIM * 1000 - VISTA.alto * 500, VISTA.ancho * 1000, VISTA.alto * 1000].map((n) => +n.toFixed(3)).join(" ");

const g = (c: (typeof cubetas)[number]) => `      <g className="trazo-cubeta" data-cubeta="${c.nombre}">
        <g transform="translate(${c.puntas.human.join(" ")})">
          <g className="trazo-humana" style={vars({ "--cierre": "${c.cierre}px", "--estira": ${c.estira.human} })}>
            <path d="${c.humana}" />
          </g>
        </g>
        <g transform="translate(${c.puntas.machine.join(" ")})">
          <g className="trazo-maquina" style={vars({ "--cierre": "${-c.cierre}px", "--estira": ${c.estira.machine} })}>
            <path d="${c.maquina}" />
            <path className="trazo-juntas" d="${c.juntas}" />
            <path className="trazo-placas" d="${c.placas}" />
            <path className="trazo-pads" d="${c.pads}" />
          </g>
        </g>
        <g className="trazo-lazo" transform="scale(${c.escala})">
          <path className="trazo-arco" pathLength={1} d="M23.909 2.092A24 24 0 1 0 2.092 23.909" />
          <circle className="trazo-punto" cx="16.971" cy="16.971" r="6" />
        </g>
      </g>`;

const tsx = `// Generated by scripts/manos-trazo.ts from manos-geometria.ts (seeds 7 and 11). Do not edit: run \`npx tsx scripts/manos-trazo.ts\`.
import { vars } from "@/components/ak/Brand";

/**
 * The two hands as a pencil sketch, projected through the scene's camera so
 * it lands under the fibers: one bucket per strip shape (a container query
 * picks it), the hands as groups that translate to close (--cierre), and the
 * mark (Brand's master) open until the controller or CSS closes it
 * (data-lazo: abierto, cerrando, cerrado).
 */
export default function ManosTrazo() {
  return (
    <svg className="manos-trazo" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-lazo="abierto">
${cubetas.map(g).join("\n")}
    </svg>
  );
}
`;

for (const c of cubetas) console.log(c.nombre, JSON.stringify(c.stats));
console.log(`ManosTrazo.tsx: ${Buffer.byteLength(tsx)} bytes`);
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
