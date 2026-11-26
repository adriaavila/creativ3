/**
 * «I never lift the pen»: la geometría de la línea de /pen.
 *
 * Una página tiene UNA línea. Sale del titular y no se levanta: tacha el
 * problema, dibuja la pieza, subraya el resultado, envuelve la captura, teje
 * entre las piezas chicas y cierra con un lazo en la única acción.
 *
 * Aquí no hay DOM: entran cajas ya medidas (en píxeles de la página) y salen
 * tramos de SVG encadenados, cada uno empezando donde terminó el anterior.
 * `PenLine` mide, pinta y los revela con el scroll; la prueba de al lado
 * comprueba que la línea de verdad no se levanta.
 */

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

export const GLYPHS = [
  "house",
  "building",
  "receipt",
  "lanes",
  "bubble",
  "bars",
  "clock",
  "document",
  "cart",
  "inbox",
  "bolt",
  "loop",
] as const;
export type GlyphId = (typeof GLYPHS)[number];

export type Gesture =
  /** El trazo de salida, bajo el titular. `word` es la palabra que firma. */
  | { kind: "start"; box: Box; word: Box }
  /** Lo que dibuja quien visita, en la portada, antes de bajar. */
  | { kind: "hand"; points: Point[] }
  /** Tachar un problema, renglón por renglón, ida y vuelta. */
  | { kind: "strike"; lines: Box[] }
  /** Un dibujo de un solo trazo dentro de su caja. */
  | { kind: "draw"; box: Box; glyph: GlyphId }
  /** El resultado: el único trazo azul junto con el lazo. */
  | { kind: "underline"; line: Box; top?: number }
  /** Un renglón para escribir encima: el campo de «Your turn». */
  | { kind: "rule"; box: Box }
  /** Una vuelta completa a una captura. */
  | { kind: "wrap"; box: Box }
  /** Pasar entre piezas chicas: por arriba de una, por debajo de la otra. */
  | { kind: "weave"; rows: Box[][] }
  /** El cierre: una vuelta a la acción de la página. */
  | { kind: "loop"; box: Box };

export type Stroke = {
  /** Un `path` completo: empieza con `M` en el punto donde terminó el tramo anterior. */
  d: string;
  end: Point;
  ink: "black" | "blue";
  kind: Gesture["kind"] | "travel";
  /** El gesto al que pertenece (los viajes pertenecen al gesto al que llegan). */
  gesture: number;
  /** Al completarse este tramo, el gesto (o una pieza de un tejido) queda hecho. */
  mark?: { gesture: number; tile?: number };
};

export type LineOptions = {
  /** Aire entre una captura y la línea que la envuelve. */
  pad: number;
  /** Los márgenes de la página: por ahí baja la línea en los viajes largos, sin pisar el texto. */
  lanes?: { left: number; right: number };
  /** Desde cuántos píxeles de caída un viaje va por el margen. */
  laneAfter?: number;
};

type Dir = Point;
const DOWN: Dir = { x: 0, y: 1 };
const RIGHT: Dir = { x: 1, y: 0 };
const LEFT: Dir = { x: -1, y: 0 };

const n = (v: number) => String(Math.round(v * 10) / 10);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function unit(dx: number, dy: number): Dir {
  const len = Math.hypot(dx, dy);
  return len < 0.001 ? DOWN : { x: dx / len, y: dy / len };
}

/** La pluma: recuerda dónde está y hacia dónde iba. */
class Pen {
  x: number;
  y: number;
  dir: Dir;
  private parts: string[];

  constructor(from: Point, dir: Dir) {
    this.x = from.x;
    this.y = from.y;
    this.dir = dir;
    this.parts = [`M${n(from.x)} ${n(from.y)}`];
  }

  private to(x: number, y: number, fromX: number, fromY: number) {
    if (Math.hypot(x - fromX, y - fromY) > 0.01) this.dir = unit(x - fromX, y - fromY);
    this.x = x;
    this.y = y;
  }

  L(x: number, y: number) {
    this.parts.push(`L${n(x)} ${n(y)}`);
    this.to(x, y, this.x, this.y);
    return this;
  }

  Q(cx: number, cy: number, x: number, y: number) {
    this.parts.push(`Q${n(cx)} ${n(cy)} ${n(x)} ${n(y)}`);
    this.to(x, y, cx, cy);
    return this;
  }

  C(ax: number, ay: number, bx: number, by: number, x: number, y: number) {
    this.parts.push(`C${n(ax)} ${n(ay)} ${n(bx)} ${n(by)} ${n(x)} ${n(y)}`);
    this.to(x, y, bx, by);
    return this;
  }

  /** Arco de elipse. `dir` es la tangente al llegar: un arco no la deja deducir de sus puntos. */
  A(rx: number, ry: number, large: 0 | 1, sweep: 0 | 1, x: number, y: number, dir: Dir) {
    this.parts.push(`A${n(rx)} ${n(ry)} 0 ${large} ${sweep} ${n(x)} ${n(y)}`);
    this.x = x;
    this.y = y;
    this.dir = dir;
    return this;
  }

  /** Un viaje suave hasta `to`, saliendo como venía y llegando en la dirección `arrive`. */
  travel(to: Point, arrive: Dir) {
    const dist = Math.hypot(to.x - this.x, to.y - this.y);
    if (dist < 0.5) return this;
    const k = clamp(dist * 0.4, 18, 160);
    return this.C(this.x + this.dir.x * k, this.y + this.dir.y * k, to.x - arrive.x * k, to.y - arrive.y * k, to.x, to.y);
  }

  /** Una poligonal con las esquinas redondeadas. */
  rounded(points: Point[], radius: number) {
    for (let i = 0; i < points.length; i++) {
      const b = points[i]!;
      const c = points[i + 1];
      if (!c) {
        this.L(b.x, b.y);
        break;
      }
      const a = { x: this.x, y: this.y };
      const inLen = Math.hypot(b.x - a.x, b.y - a.y);
      const outLen = Math.hypot(c.x - b.x, c.y - b.y);
      const r = Math.min(radius, inLen / 2, outLen / 2);
      if (r < 0.5) {
        this.L(b.x, b.y);
        continue;
      }
      const u = unit(b.x - a.x, b.y - a.y);
      const v = unit(c.x - b.x, c.y - b.y);
      this.L(b.x - u.x * r, b.y - u.y * r);
      this.Q(b.x, b.y, b.x + v.x * r, b.y + v.y * r);
    }
    return this;
  }

  get d() {
    return this.parts.join("");
  }
  get end(): Point {
    return { x: this.x, y: this.y };
  }
}

/* ── Los dibujos ─────────────────────────────────────────────
   Cada uno es UN trazo en una caja de 0 a 1. Si hay que pasar dos veces por
   el mismo borde para no levantar la pluma, se pasa: así se dibuja a mano. */

type Cmd =
  | ["L", number, number]
  | ["Q", number, number, number, number]
  | ["C", number, number, number, number, number, number]
  /** Arco de radio `r` (en unidades de la caja) hasta x, y. */
  | ["A", number, 0 | 1, 0 | 1, number, number];

type GlyphPath = { from: [number, number]; cmds: Cmd[] };

function lines(points: [number, number][]): GlyphPath {
  const [from, ...rest] = points;
  return { from: from!, cmds: rest.map(([x, y]) => ["L", x, y]) };
}

/** Tres carriles de piscina: tres ondas, ida, vuelta e ida. */
function lanes(): GlyphPath {
  const cmds: Cmd[] = [];
  const rows = [0.24, 0.5, 0.76];
  const waves = 3;
  const amp = 0.075;
  rows.forEach((y, row) => {
    const dir = row % 2 === 0 ? 1 : -1;
    const x0 = dir === 1 ? 0.06 : 0.94;
    const step = (0.88 / (waves * 2)) * dir;
    for (let i = 0; i < waves * 2; i++) {
      const up = i % 2 === 0 ? -1 : 1;
      cmds.push(["Q", x0 + step * (i + 0.5), y + amp * 2 * up, x0 + step * (i + 1), y]);
    }
    const next = rows[row + 1];
    if (next !== undefined) {
      const edge = dir === 1 ? 0.94 : 0.06;
      cmds.push(["C", edge + 0.09 * dir, y, edge + 0.09 * dir, next, edge, next]);
    }
  });
  return { from: [0.06, rows[0]!], cmds };
}

const GLYPH_PATHS: Record<GlyphId, GlyphPath> = {
  house: lines([
    [0.08, 0.94],
    [0.08, 0.46],
    [0.5, 0.08],
    [0.92, 0.46],
    [0.92, 0.94],
    [0.6, 0.94],
    [0.6, 0.62],
    [0.4, 0.62],
    [0.4, 0.94],
    [0.08, 0.94],
  ]),
  building: lines([
    [0.6, 0.94],
    [0.1, 0.94],
    [0.1, 0.08],
    [0.6, 0.08],
    [0.6, 0.38],
    [0.1, 0.38],
    [0.1, 0.66],
    [0.6, 0.66],
    [0.6, 0.38],
    [0.92, 0.38],
    [0.92, 0.94],
    [0.6, 0.94],
    [0.6, 0.66],
  ]),
  receipt: lines([
    [0.2, 0.06],
    [0.8, 0.06],
    [0.8, 0.94],
    [0.7, 0.86],
    [0.6, 0.94],
    [0.5, 0.86],
    [0.4, 0.94],
    [0.3, 0.86],
    [0.2, 0.94],
    [0.2, 0.06],
    [0.34, 0.28],
    [0.66, 0.28],
    [0.66, 0.46],
    [0.34, 0.46],
    [0.34, 0.64],
    [0.56, 0.64],
  ]),
  lanes: lanes(),
  bubble: {
    // Sale por la cola y cierra yendo hacia la derecha: lo que sigue casi siempre está de ese lado.
    from: [0.3, 0.74],
    cmds: [
      ["L", 0.3, 0.94],
      ["L", 0.52, 0.74],
      ["L", 0.8, 0.74],
      ["Q", 0.92, 0.74, 0.92, 0.62],
      ["L", 0.92, 0.24],
      ["Q", 0.92, 0.12, 0.8, 0.12],
      ["L", 0.2, 0.12],
      ["Q", 0.08, 0.12, 0.08, 0.24],
      ["L", 0.08, 0.62],
      ["Q", 0.08, 0.74, 0.2, 0.74],
      ["L", 0.36, 0.74],
    ],
  },
  bars: lines([
    [0.08, 0.08],
    [0.08, 0.92],
    [0.24, 0.92],
    [0.24, 0.62],
    [0.4, 0.62],
    [0.4, 0.92],
    [0.5, 0.92],
    [0.5, 0.42],
    [0.66, 0.42],
    [0.66, 0.92],
    [0.76, 0.92],
    [0.76, 0.2],
    [0.92, 0.2],
    [0.92, 0.92],
  ]),
  clock: {
    from: [0.5, 0.08],
    cmds: [
      ["A", 0.42, 1, 1, 0.5, 0.92],
      ["A", 0.42, 1, 1, 0.5, 0.08],
      ["L", 0.5, 0.5],
      ["L", 0.72, 0.63],
    ],
  },
  document: lines([
    [0.62, 0.06],
    [0.62, 0.26],
    [0.82, 0.26],
    [0.62, 0.06],
    [0.2, 0.06],
    [0.2, 0.94],
    [0.82, 0.94],
    [0.82, 0.26],
  ]),
  cart: {
    from: [0.05, 0.16],
    cmds: [
      ["L", 0.2, 0.16],
      ["L", 0.31, 0.62],
      ["L", 0.38, 0.62],
      ["L", 0.38, 0.72],
      ["A", 0.08, 1, 1, 0.38, 0.88],
      ["A", 0.08, 1, 1, 0.38, 0.72],
      ["L", 0.38, 0.62],
      ["L", 0.72, 0.62],
      ["L", 0.72, 0.72],
      ["A", 0.08, 1, 1, 0.72, 0.88],
      ["A", 0.08, 1, 1, 0.72, 0.72],
      ["L", 0.72, 0.62],
      ["L", 0.82, 0.62],
      ["L", 0.92, 0.28],
      ["L", 0.24, 0.28],
    ],
  },
  inbox: {
    from: [0.08, 0.55],
    cmds: [
      ["L", 0.25, 0.14],
      ["L", 0.75, 0.14],
      ["L", 0.92, 0.55],
      ["L", 0.92, 0.88],
      ["L", 0.08, 0.88],
      ["L", 0.08, 0.55],
      ["L", 0.34, 0.55],
      ["Q", 0.5, 0.82, 0.66, 0.55],
      ["L", 0.92, 0.55],
    ],
  },
  bolt: lines([
    [0.58, 0.05],
    [0.2, 0.56],
    [0.48, 0.56],
    [0.4, 0.95],
    [0.8, 0.43],
    [0.52, 0.43],
    [0.58, 0.05],
  ]),
  loop: {
    from: [0.08, 0.5],
    cmds: [
      ["C", 0.08, 0.2, 0.4, 0.2, 0.5, 0.5],
      ["C", 0.6, 0.8, 0.92, 0.8, 0.92, 0.5],
      ["C", 0.92, 0.2, 0.6, 0.2, 0.5, 0.5],
      ["C", 0.4, 0.8, 0.08, 0.8, 0.08, 0.5],
    ],
  },
};

/** Por dónde entra un dibujo: su primer punto y hacia dónde arranca. */
function glyphEntry(glyph: GlyphPath, box: Box): { at: Point; dir: Dir } {
  const at = { x: box.x + glyph.from[0] * box.w, y: box.y + glyph.from[1] * box.h };
  const first = glyph.cmds[0];
  if (!first) return { at, dir: DOWN };
  // Para una curva, el primer punto de control dice la tangente; para una recta o un arco, su destino.
  const [tx, ty] = first[0] === "A" ? [first[4], first[5]] : [first[1], first[2]];
  const dir = first[0] === "A" ? RIGHT : unit(box.x + tx * box.w - at.x, box.y + ty * box.h - at.y);
  return { at, dir };
}

function drawGlyph(pen: Pen, glyph: GlyphPath, box: Box) {
  const X = (u: number) => box.x + u * box.w;
  const Y = (v: number) => box.y + v * box.h;
  for (const c of glyph.cmds) {
    if (c[0] === "L") pen.L(X(c[1]), Y(c[2]));
    else if (c[0] === "Q") pen.Q(X(c[1]), Y(c[2]), X(c[3]), Y(c[4]));
    else if (c[0] === "C") pen.C(X(c[1]), Y(c[2]), X(c[3]), Y(c[4]), X(c[5]), Y(c[6]));
    else {
      // Los arcos de los dibujos son medias vueltas verticales: llegan yendo hacia el lado contrario.
      const down = Y(c[5]) > pen.y;
      pen.A(c[1] * box.w, c[1] * box.h, c[2], c[3], X(c[4]), Y(c[5]), down === (c[3] === 1) ? LEFT : RIGHT);
    }
  }
}

/* ── La línea ────────────────────────────────────────────── */

/** Dónde queda un gesto, para que el anterior sepa hacia dónde salir. */
function whereIs(g: Gesture): Point | null {
  const top = (b: Box | undefined) => (b ? { x: b.x + b.w / 2, y: b.y } : null);
  if (g.kind === "hand") return null;
  if (g.kind === "strike") return top(g.lines[0]);
  if (g.kind === "underline") return top(g.line);
  if (g.kind === "weave") return top(g.rows[0]?.[0]);
  return top(g.box);
}

/**
 * De gestos medidos a tramos encadenados. El orden de `gestures` es el orden
 * en que la línea los visita: el del documento.
 *
 * Dos reglas de recorrido: lo que queda cerca se alcanza con una curva
 * directa, y lo que queda lejos, bajando por un margen. Cada gesto empieza
 * por el lado del que viene la pluma, así ningún viaje cruza un párrafo.
 */
export function traceLine(gestures: Gesture[], options: LineOptions): Stroke[] {
  const strokes: Stroke[] = [];
  let at: Point | null = null;
  let dir: Dir = DOWN;
  const lanes = options.lanes;
  const laneAfter = options.laneAfter ?? 320;
  const mid = lanes ? (lanes.left + lanes.right) / 2 : 0;

  const open = () => new Pen(at ?? { x: 0, y: 0 }, dir);
  const push = (pen: Pen, stroke: Omit<Stroke, "d" | "end">) => {
    at = pen.end;
    dir = pen.dir;
    strokes.push({ ...stroke, d: pen.d, end: pen.end });
  };

  /**
   * Cómo se llega a algo que está en (x, y): por la derecha o por la izquierda,
   * y por cuál margen si queda lejos. `free` es para los gestos que pueden
   * empezar por cualquier lado: ahí manda dónde está la pluma, no el destino.
   */
  const plan = (x: number, y: number, free: boolean): { right: boolean; lane: number | null } => {
    if (!at) return { right: false, lane: null };
    if (lanes && y - at.y > laneAfter) {
      const right = dir.x > 0.35 ? true : dir.x < -0.35 ? false : (free ? at.x : x) > mid;
      return { right, lane: right ? lanes.right : lanes.left };
    }
    return { right: at.x > x, lane: null };
  };

  /** Viaja hasta el arranque de un gesto. El primero no viaja: ahí nace la línea. */
  const arrive = (to: Point, arriveDir: Dir, gesture: number, lane: number | null = null) => {
    if (!at) {
      at = to;
      dir = arriveDir;
      return;
    }
    if (Math.hypot(to.x - at.x, to.y - at.y) < 0.5) return;
    const pen = open();
    const fall = to.y - at.y;
    if (lane !== null && fall > 120) {
      const y1 = at.y + clamp(fall * 0.3, 50, 200);
      const y2 = to.y - clamp(fall * 0.25, 40, 160);
      pen.travel({ x: lane, y: y1 }, DOWN);
      if (y2 > y1) pen.L(lane, y2);
    }
    pen.travel(to, arriveDir);
    push(pen, { ink: "black", kind: "travel", gesture });
  };

  gestures.forEach((g, i) => {
    if (g.kind === "start") {
      // Un subrayado largo bajo el titular que termina en un rizo, como una rúbrica.
      const y = g.box.y + g.box.h + Math.max(10, g.word.h * 0.1);
      const x0 = g.box.x - 6;
      const x1 = g.word.x + g.word.w + g.word.h * 0.12;
      const w = x1 - x0;
      const s = clamp(g.word.h * 0.34, 18, 54);
      arrive({ x: x0, y: y + s * 0.2 }, RIGHT, i);
      const pen = open();
      pen.C(x0 + w * 0.34, y + s * 0.55, x0 + w * 0.68, y - s * 0.3, x1, y);
      pen.C(x1 + s * 1.5, y + s * 0.3, x1 + s * 1.35, y - s * 1.25, x1 + s * 0.25, y - s * 0.8);
      pen.C(x1 - s * 0.7, y - s * 0.42, x1 - s * 0.2, y + s * 0.7, x1 + s * 1.1, y + s * 1.05);
      push(pen, { ink: "black", kind: "start", gesture: i, mark: { gesture: i } });
      return;
    }

    if (g.kind === "hand") {
      if (g.points.length < 2) return;
      const pen = open();
      const [first, ...rest] = g.points;
      pen.travel(first!, unit(rest[0]!.x - first!.x, rest[0]!.y - first!.y));
      // Curvas por los puntos medios: el pulso del mouse queda suave, no quebrado.
      for (let k = 0; k < rest.length - 1; k++) {
        const p = rest[k]!;
        const q = rest[k + 1]!;
        pen.Q(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
      }
      const last = rest[rest.length - 1]!;
      pen.L(last.x, last.y);
      // Sale hacia abajo: lo que sigue está abajo, y un trazo libre puede terminar mirando a cualquier lado.
      pen.dir = DOWN;
      push(pen, { ink: "black", kind: "hand", gesture: i });
      return;
    }

    if (g.kind === "strike") {
      if (g.lines.length === 0) return;
      const over = 6;
      const yOf = (l: Box) => l.y + l.h * 0.56;
      const first = g.lines[0]!;
      // Empieza por el lado del que viene la pluma.
      const way = plan(first.x + first.w / 2, first.y, true);
      let startLtr = !way.right;
      // Si lo que sigue es el dibujo, el tachado termina de su lado: la línea no cruza la captura para llegar.
      const after = gestures[i + 1];
      const last = g.lines[g.lines.length - 1]!;
      if (after?.kind === "draw" && after.box.y - last.y < 400) {
        const endsRight = after.box.x + after.box.w / 2 > last.x + last.w / 2;
        startLtr = (g.lines.length % 2 === 1) === endsRight;
      }
      // Si le toca empezar por el lado contrario al que viene, da la vuelta por el margen y no por encima del rótulo.
      let lane = way.lane;
      if (lane === null && lanes && at && startLtr === way.right) lane = startLtr ? lanes.left : lanes.right;
      arrive(
        { x: startLtr ? first.x - over : first.x + first.w + over, y: yOf(first) + 1.5 * (startLtr ? 1 : -1) },
        startLtr ? RIGHT : LEFT,
        i,
        lane,
      );
      const pen = open();
      g.lines.forEach((l, row) => {
        const ltr = (row % 2 === 0) === startLtr;
        const y = yOf(l);
        const from = ltr ? l.x - over : l.x + l.w + over;
        const to = ltr ? l.x + l.w + over : l.x - over;
        if (row > 0) {
          // La vuelta entre renglones: un codo por fuera del texto.
          const side = ltr ? -1 : 1;
          const bulge = clamp(l.h * 0.5, 10, 26) * side;
          pen.C(pen.x + bulge, pen.y, from + bulge, y + 1.5 * (ltr ? 1 : -1), from, y + 1.5 * (ltr ? 1 : -1));
        }
        // Un pelo inclinado: una regla perfecta no parece una mano.
        pen.L(to, y - 1.5 * (ltr ? 1 : -1));
      });
      push(pen, { ink: "black", kind: "strike", gesture: i, mark: { gesture: i } });
      return;
    }

    if (g.kind === "draw") {
      const glyph = GLYPH_PATHS[g.glyph];
      const entry = glyphEntry(glyph, g.box);
      arrive(entry.at, entry.dir, i, plan(g.box.x + g.box.w / 2, g.box.y, false).lane);
      const pen = open();
      drawGlyph(pen, glyph, g.box);
      push(pen, { ink: "black", kind: "draw", gesture: i, mark: { gesture: i } });
      return;
    }

    if (g.kind === "underline") {
      const l = g.line;
      const y = l.y + l.h + clamp(l.h * 0.08, 3, 7);
      const x0 = l.x - 4;
      const x1 = l.x + l.w + 6;
      const sag = clamp(l.w * 0.012, 2, 7);
      const gap = clamp(l.h * 0.16, 6, 10);
      const from: Point = { x: x0, y: y + 1 };
      const way = plan((x0 + x1) / 2, l.y, false);
      const top = g.top ?? l.y;
      if (at && way.lane === null && at.y < top + 4 && at.x > x0 - 24) {
        // Viene del dibujo, que está arriba del título: baja por su costado, no por encima de las letras.
        const mx = Math.max(5, x0 - 22);
        const pen = open();
        pen.travel({ x: mx, y: Math.max(top - 8, at.y + 12) }, DOWN);
        pen.L(mx, y - 12);
        pen.Q(mx, y + 1, from.x, from.y);
        push(pen, { ink: "black", kind: "travel", gesture: i });
      } else {
        arrive(from, RIGHT, i, way.lane);
      }

      // Hacia dónde sigue la línea decide cómo termina el subrayado.
      const next = gestures.slice(i + 1).map(whereIs).find(Boolean);
      const below = next ? next.y - (y + gap) > 60 : false;
      const toRight = below ? Boolean(lanes) && (x0 + x1) / 2 > mid : next ? next.x > (x0 + x1) / 2 : false;

      const pen = open();
      pen.Q((x0 + x1) / 2, y + sag, x1, y - 1);
      if (toRight) {
        // Un rizo y sigue de largo hacia la derecha.
        pen.C(x1 + gap * 2.6, y - 3, x1 + gap * 2.4, y - gap * 2.3, x1 + gap, y - gap * 1.7);
        pen.C(x1 - gap * 0.1, y - gap * 1.2, x1 + gap * 0.5, y + gap * 0.8, x1 + gap * 2.8, y + gap * 0.1);
      } else {
        // Vuelve por debajo: doble raya, como quien da algo por hecho.
        pen.C(x1 + gap * 2.2, y - 2, x1 + gap * 1.6, y + gap * 1.05, x1 - gap, y + gap);
        if (below) {
          // Lo que sigue está abajo, detrás de un párrafo: la raya llega al margen y baja por ahí.
          const mx = Math.max(5, lanes ? Math.max(lanes.left, x0 - 44) : x0 - 22);
          const r = Math.min(x0 - mx, 22);
          pen.Q((x0 + x1) / 2, y + gap + sag * 0.6, x0 + r, y + gap - 1);
          pen.L(mx + r, y + gap - 1);
          pen.Q(mx, y + gap - 1, mx, y + gap - 1 + r);
        } else {
          pen.Q((x0 + x1) / 2 + l.w * 0.18, y + gap + sag * 0.6, x0 + l.w * 0.42, y + gap - 1);
        }
      }
      push(pen, { ink: "blue", kind: "underline", gesture: i, mark: { gesture: i } });
      return;
    }

    if (g.kind === "rule") {
      const y = g.box.y + g.box.h;
      const x0 = g.box.x;
      const x1 = g.box.x + g.box.w;
      arrive({ x: x0, y: y + 1 }, RIGHT, i, plan((x0 + x1) / 2, y, false).lane);
      const pen = open();
      pen.Q((x0 + x1) / 2, y + clamp(g.box.w * 0.008, 2, 5), x1, y - 1);
      push(pen, { ink: "black", kind: "rule", gesture: i, mark: { gesture: i } });
      return;
    }

    if (g.kind === "wrap") {
      const m = options.pad;
      const r = Math.min(14, g.box.w / 4, g.box.h / 4);
      const x0 = g.box.x - m;
      const x1 = g.box.x + g.box.w + m;
      const y0 = g.box.y - m;
      const y1 = g.box.y + g.box.h + m;
      // Entra por el lado del que viene. `fx` refleja la vuelta cuando ese lado es el derecho.
      const way = plan(g.box.x + g.box.w / 2, g.box.y, false);
      const fx = (x: number) => (way.right ? x0 + x1 - x : x);
      const side = way.right ? 1 : -1;
      const drop = Math.min(24, g.box.h / 4);
      // Si viene de al lado, entra a su altura; si viene de arriba, cerca de la esquina.
      const high = y0 + r + drop;
      const low = Math.max(high, y1 - r - 60);
      const ys = at && way.lane === null && at.y > high ? clamp(at.y + 30, high, low) : high;
      arrive({ x: fx(x0), y: ys }, DOWN, i, way.lane);

      const lap = open();
      lap.L(fx(x0), y1 - r);
      lap.Q(fx(x0), y1, fx(x0 + r), y1);
      lap.L(fx(x1 - r), y1);
      lap.Q(fx(x1), y1, fx(x1), y1 - r);
      lap.L(fx(x1), y0 + r);
      lap.Q(fx(x1), y0, fx(x1 - r), y0);
      lap.L(fx(x0 + r), y0);
      lap.Q(fx(x0), y0, fx(x0), y0 + r);
      lap.L(fx(x0), ys);
      push(lap, { ink: "black", kind: "wrap", gesture: i, mark: { gesture: i } });

      // Baja otra vez por el mismo lado, un pelo más afuera, y sale por abajo.
      const out = open();
      const off = 6 * side;
      out.C(fx(x0), ys + drop * 0.4, fx(x0) + off, ys + drop * 0.6, fx(x0) + off, ys + drop * 1.4);
      out.L(fx(x0) + off, y1 - 2);
      out.Q(fx(x0) + off, y1 + 16, fx(x0) + off - 10 * side, y1 + 26);
      out.dir = DOWN;
      push(out, { ink: "black", kind: "wrap", gesture: i });
      return;
    }

    if (g.kind === "weave") {
      const rows = g.rows.filter((row) => row.length > 0);
      if (rows.length === 0) return;
      const air = 12;
      type Run = { from: Point; to: Point; tile: number };
      const runs: Run[] = [];
      let tile = 0;
      let enterX: number | null = null;
      const head = rows[0]!;
      const span = { x0: head[0]!.x, x1: head[head.length - 1]!.x + head[head.length - 1]!.w };
      const way = plan((span.x0 + span.x1) / 2, head[0]!.y, true);
      rows.forEach((row, r) => {
        const ltr = (r % 2 === 0) !== way.right;
        const order = ltr ? row : [...row].reverse();
        // La primera fila entra por arriba; las demás llegan bajando por fuera y entran por abajo.
        let top = r === 0;
        order.forEach((box, k) => {
          const next = order[k + 1];
          const y = top ? box.y - air : box.y + box.h + air;
          const outer = ltr ? box.x - air : box.x + box.w + air;
          const fromX: number = k === 0 ? (enterX ?? outer) : runs[runs.length - 1]!.to.x;
          let toX: number;
          if (next) {
            // El pasillo entre dos piezas, por su centro.
            toX = ltr ? (box.x + box.w + next.x) / 2 : (next.x + next.w + box.x) / 2;
          } else {
            toX = ltr ? box.x + box.w + air : box.x - air;
          }
          // El índice de la pieza en el orden del DOM (fila por fila, de izquierda a derecha).
          const index = tile + (ltr ? k : order.length - 1 - k);
          runs.push({ from: { x: fromX, y }, to: { x: toX, y }, tile: index });
          top = !top;
        });
        tile += row.length;
        enterX = runs[runs.length - 1]!.to.x;
      });

      const first = runs[0]!;
      const lead = 26;
      arrive({ x: first.from.x, y: first.from.y - lead }, DOWN, i, way.lane);
      runs.forEach((run, k) => {
        const next = runs[k + 1];
        const pen = open();
        const points: Point[] = [run.from, run.to];
        if (next) {
          // Corta a mitad del pasillo vertical: la esquina queda dentro del tramo.
          points.push({ x: run.to.x, y: (run.to.y + next.from.y) / 2 });
        } else {
          points.push({ x: run.to.x, y: run.to.y + lead });
        }
        pen.rounded(points, 12);
        push(pen, { ink: "black", kind: "weave", gesture: i, mark: { gesture: i, tile: run.tile } });
      });
      return;
    }

    if (g.kind === "loop") {
      const cx = g.box.x + g.box.w / 2;
      const cy = g.box.y + g.box.h / 2;
      const rx = g.box.w / 2 + 22;
      const ry = g.box.h / 2 + 18;
      const way = plan(cx, cy, true);
      const s = way.right ? -1 : 1;
      const sweep = way.right ? 1 : 0;
      arrive({ x: cx - rx * s, y: cy }, DOWN, i, way.lane);
      const pen = open();
      pen.A(rx, ry, 1, sweep, cx + rx * s, cy, { x: 0, y: -1 });
      // No cierra justo donde abrió: termina un poco adentro, como una vuelta hecha a mano.
      pen.A(rx, ry, 1, sweep, cx - (rx - 7) * s, cy - 9, DOWN);
      push(pen, { ink: "blue", kind: "loop", gesture: i, mark: { gesture: i } });
    }
  });

  return strokes;
}

/** Píxeles de CSS a metros de tinta (96 px por pulgada), para el contador de la página. */
export function inkMeters(px: number): number {
  return (px / 96) * 0.0254;
}
