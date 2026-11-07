import { test } from "node:test";
import assert from "node:assert/strict";
import { HOME_WHATSAPP_MESSAGE, WHATSAPP_NUMBER, prefill, whatsappUrl, type Origen } from "./contact";
import { HISTORIAS } from "./historias";

const TODOS: [Origen, { nombre: string } | undefined][] = [
  ["portada", undefined],
  ["cierre", undefined],
  ["agente", undefined],
  ...HISTORIAS.map((h): [Origen, { nombre: string }] => ["pieza", { nombre: h.nombre }]),
];

test("cada primera frase contesta al «Hola, soy Adrián.» y queda abierta para que el dueño siga", () => {
  for (const [origen, pieza] of TODOS) {
    const m = prefill(origen, pieza);
    assert.ok(m.startsWith("Hola, Adrián."), `${origen}: ${m}`);
    assert.ok(m.endsWith(": ") || m.endsWith(". "), `${origen}: ${m}`);
    assert.ok(!m.includes("—"), `${origen} con raya: ${m}`);
  }
});

test("la portada, el cierre y lo que no se reconoce usan la frase de siempre", () => {
  assert.equal(prefill(), HOME_WHATSAPP_MESSAGE);
  assert.equal(prefill("portada"), HOME_WHATSAPP_MESSAGE);
  assert.equal(prefill("cierre"), HOME_WHATSAPP_MESSAGE);
  // Una pieza sin nombre no inventa uno.
  assert.equal(prefill("pieza"), HOME_WHATSAPP_MESSAGE);
});

test("cada trabajo y el agente se nombran en su frase", () => {
  for (const h of HISTORIAS) assert.ok(prefill("pieza", { nombre: h.nombre }).includes(`Vi ${h.nombre} en allok.fun`), h.id);
  assert.ok(prefill("agente").includes("el agente de WhatsApp"));
});

test("el enlace de wa.me lleva el número y la frase entera, de ida y vuelta", () => {
  for (const [origen, pieza] of TODOS) {
    const m = prefill(origen, pieza);
    const url = new URL(whatsappUrl(m));
    assert.equal(url.origin + url.pathname, `https://wa.me/${WHATSAPP_NUMBER}`);
    assert.equal(url.searchParams.get("text"), m);
  }
});
