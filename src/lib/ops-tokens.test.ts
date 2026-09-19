import { test } from "node:test";
import assert from "node:assert/strict";
import { tokenFor } from "../../scripts/ops-tokens.mjs";

type TokenFor = (prefix: string, hex: string) => string;
const classify: TokenFor = tokenFor;

/**
 * El clasificador que convirtió 821 colores de Ops en tokens. Se prueba porque
 * su primera versión no tenía banda ámbar y mandó 33 avisos —«requiere
 * revisión»— a gris: la regresión no la habría cazado ningún build.
 */
test("el ámbar sigue siendo un aviso y no texto gris", () => {
  assert.equal(classify("text", "#8a5d19"), "--status-warn");
  assert.equal(classify("text", "#7f6b39"), "--status-warn");
  assert.equal(classify("bg", "#fff3df"), "--warn-soft");
  assert.equal(classify("bg", "#d49b42"), "--warn-mid");
  assert.equal(classify("border", "#eadcb7"), "--warn-line");
});

test("el verde es tinta oscura sobre papel y relleno sólo de fondo", () => {
  // #c5f04a da 1,20:1 como tinta sobre papel: inservible para texto.
  assert.equal(classify("text", "#c5f04a"), "--assist-ink");
  assert.equal(classify("bg", "#c5f04a"), "--assist");
  assert.equal(classify("bg", "#edf7df"), "--assist-soft");
});

test("los azules marinos de Ops eran tinta, no un estado", () => {
  for (const navy of ["#142b4b", "#172238", "#263850", "#526174"]) {
    assert.match(classify("text", navy), /^--ink/, navy);
  }
});

test("la función decide el papel: el mismo valor no es lo mismo en borde que en fondo", () => {
  assert.equal(classify("border", "#edf0f3"), "--hairline");
  assert.equal(classify("bg", "#edf0f3"), "--ground-3");
});
