import assert from "node:assert/strict";
import { test } from "node:test";
import { AGENT, SKETCHBOOK, SKETCH_EXAMPLES, STORIES, countWord } from "./pen";
import { GLYPHS } from "./pen-linea";
import { SKETCH_MAX, SKETCH_MIN, clip, sketchRequestSchema, sketchSchema, sketchWhatsappMessage } from "./pen-sketch";

test("cada historia trae lo que la línea necesita: qué tachar, qué subrayar y una captura", () => {
  assert.ok(STORIES.length >= 3);
  for (const s of STORIES) {
    assert.ok(s.before.length > 20, s.id);
    assert.ok(s.after.length > 8, s.id);
    assert.ok(GLYPHS.includes(s.glyph), s.id);
    assert.ok(s.image.src.startsWith("/"), s.id);
    assert.ok(s.image.alt.length > 0, s.id);
  }
  assert.ok(AGENT.before.length > 20 && AGENT.after.length > 8);
});

test("el cuaderno solo muestra piezas que existen, sin repetir", () => {
  assert.ok(SKETCHBOOK.length >= 4);
  assert.equal(new Set(SKETCHBOOK.map((t) => t.id)).size, SKETCHBOOK.length);
  for (const t of SKETCHBOOK) assert.ok(t.src && t.alt && t.name && t.line, t.id);
});

test("el titular cuenta las historias con palabras", () => {
  assert.equal(countWord(4), "Four");
  assert.equal(countWord(12), "12");
});

test("los ejemplos de «Your turn» pasan la validación de la ruta", () => {
  for (const text of SKETCH_EXAMPLES) assert.ok(sketchRequestSchema.safeParse({ text }).success, text);
  assert.equal(sketchRequestSchema.safeParse({ text: "x".repeat(SKETCH_MIN - 1) }).success, false);
  assert.equal(sketchRequestSchema.safeParse({ text: "x".repeat(SKETCH_MAX + 1) }).success, false);
});

test("la ficha exige un dibujo conocido y tres pasos", () => {
  const ok = { problem: "You answer the same questions.", glyph: "bubble", result: "Answers, already written.", steps: ["a", "b", "c"] };
  assert.ok(sketchSchema.safeParse(ok).success);
  assert.equal(sketchSchema.safeParse({ ...ok, glyph: "rocket" }).success, false);
  assert.equal(sketchSchema.safeParse({ ...ok, steps: ["a"] }).success, false);
});

test("un campo largo del modelo se recorta en una palabra, y el mensaje de WhatsApp lleva el caso", () => {
  const long = "word ".repeat(80);
  const cut = clip(long, 90);
  assert.ok(cut.length <= 91 && cut.endsWith("…"));
  assert.equal(clip("  two   spaces ", 90), "two spaces");
  assert.equal(clip(undefined, 90), "");
  assert.match(sketchWhatsappMessage("My case here", "A result"), /"A result"\. My case: My case here$/);
  assert.match(sketchWhatsappMessage("My case here"), /What eats my time: My case here$/);
});
