import assert from "node:assert/strict";
import { test } from "node:test";
import { GLYPHS, inkMeters, traceLine, type Box, type Gesture } from "./pen-linea";

const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

/** Una página chica con todos los gestos, en el orden en que /pen los usa. */
function page(): Gesture[] {
  return [
    { kind: "start", box: box(100, 200, 600, 260), word: box(330, 340, 200, 120) },
    { kind: "hand", points: [] },
    { kind: "strike", lines: [box(100, 1400, 580, 56), box(100, 1456, 470, 56), box(100, 1512, 500, 56)] },
    { kind: "draw", box: box(100, 1660, 84, 84), glyph: "house" },
    { kind: "underline", line: box(100, 1840, 420, 54), top: 1786 },
    { kind: "wrap", box: box(660, 1660, 680, 420) },
    { kind: "strike", lines: [box(100, 2400, 560, 56), box(100, 2456, 420, 56)] },
    { kind: "draw", box: box(860, 2600, 84, 84), glyph: "building" },
    { kind: "underline", line: box(860, 2780, 440, 54), top: 2726 },
    { kind: "wrap", box: box(100, 2600, 680, 420) },
    {
      kind: "weave",
      rows: [
        [box(100, 3600, 360, 330), box(540, 3600, 360, 330), box(980, 3600, 360, 330)],
        [box(100, 4040, 360, 330), box(540, 4040, 360, 330), box(980, 4040, 360, 330)],
      ],
    },
    { kind: "rule", box: box(100, 4900, 560, 120) },
    { kind: "loop", box: box(520, 5600, 400, 68) },
  ];
}

const OPTIONS = { pad: 14, lanes: { left: 56, right: 1384 }, laneAfter: 320 };

/** El primer punto de un `d`. */
function startOf(d: string) {
  const m = /^M(-?[\d.]+) (-?[\d.]+)/.exec(d);
  assert.ok(m, `el tramo no empieza con M: ${d.slice(0, 30)}`);
  return { x: Number(m[1]), y: Number(m[2]) };
}

test("la pluma no se levanta: cada tramo empieza donde terminó el anterior", () => {
  const strokes = traceLine(page(), OPTIONS);
  assert.ok(strokes.length > 12);
  strokes.forEach((s, i) => {
    assert.ok(!/NaN|undefined|Infinity/.test(s.d), `tramo ${i} (${s.kind}) con números rotos`);
    if (i === 0) return;
    const from = startOf(s.d);
    const prev = strokes[i - 1]!.end;
    assert.ok(Math.hypot(from.x - prev.x, from.y - prev.y) < 0.2, `salto entre el tramo ${i - 1} y el ${i} (${s.kind})`);
  });
});

test("el azul es solo del resultado y de la salida", () => {
  for (const s of traceLine(page(), OPTIONS)) {
    assert.equal(s.ink === "blue", s.kind === "underline" || s.kind === "loop", `tinta equivocada en ${s.kind}`);
  }
});

test("cada gesto queda marcado una vez, y el tejido marca cada pieza", () => {
  const gestures = page();
  const strokes = traceLine(gestures, OPTIONS);
  gestures.forEach((g, i) => {
    if (g.kind === "hand") return;
    const marks = strokes.filter((s) => s.mark?.gesture === i);
    if (g.kind === "weave") {
      assert.deepEqual(marks.map((s) => s.mark!.tile).sort(), [0, 1, 2, 3, 4, 5]);
    } else {
      assert.equal(marks.length, 1, `${g.kind} marcado ${marks.length} veces`);
    }
  });
});

test("un viaje largo baja por el margen y no en diagonal sobre la página", () => {
  const strokes = traceLine(page(), OPTIONS);
  const firstStrike = strokes.findIndex((s) => s.kind === "strike");
  const trip = strokes[firstStrike - 1]!;
  assert.equal(trip.kind, "travel");
  assert.match(trip.d, /L(56|1384) /, "el viaje desde la portada no pasó por un margen");
});

test("el tachado termina del lado del dibujo que sigue", () => {
  const gestures = page();
  const strokes = traceLine(gestures, OPTIONS);
  const strikes = strokes.filter((s) => s.kind === "strike");
  // Tres renglones y el dibujo a la izquierda: termina a la izquierda.
  assert.ok(strikes[0]!.end.x < 200);
  // Dos renglones y el dibujo a la derecha: termina a la derecha.
  assert.ok(strikes[1]!.end.x > 400);
});

test("todos los dibujos se trazan sin romperse, también lo que escribe quien visita", () => {
  for (const glyph of GLYPHS) {
    const strokes = traceLine(
      [
        { kind: "strike", lines: [box(40, 40, 300, 30)] },
        { kind: "draw", box: box(40, 120, 72, 72), glyph },
        { kind: "underline", line: box(40, 240, 260, 34), top: 240 },
      ],
      { pad: 8 },
    );
    assert.equal(strokes.filter((s) => s.kind === "draw").length, 1, glyph);
    assert.ok(strokes.every((s) => !/NaN/.test(s.d)), glyph);
  }
  const withHand = page();
  withHand[1] = { kind: "hand", points: [{ x: 800, y: 300 }, { x: 860, y: 340 }, { x: 900, y: 280 }] };
  assert.ok(traceLine(withHand, OPTIONS).some((s) => s.kind === "hand"));
});

test("sin gestos no hay línea, y la tinta se cuenta en metros", () => {
  assert.deepEqual(traceLine([], { pad: 14 }), []);
  assert.equal(inkMeters(0), 0);
  assert.ok(Math.abs(inkMeters(96) - 0.0254) < 1e-9);
});
