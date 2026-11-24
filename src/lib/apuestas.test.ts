import assert from "node:assert/strict";
import test from "node:test";
import { APUESTAS, apuesta } from "./apuestas";

test("cada página de prueba dice en el mensaje de qué página viene, para contarla en WhatsApp", () => {
  for (const a of APUESTAS) {
    assert.ok(a.mensaje.includes(`allok.fun/para/${a.slug}`), a.slug);
    assert.ok(a.mensaje.endsWith(": "), `${a.slug}: la frase queda abierta`);
  }
});

test("los slugs son únicos y se encuentran", () => {
  assert.equal(new Set(APUESTAS.map((a) => a.slug)).size, APUESTAS.length);
  for (const a of APUESTAS) assert.equal(apuesta(a.slug), a);
  assert.equal(apuesta("otra"), undefined);
});
