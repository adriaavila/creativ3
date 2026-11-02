import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PALETTE, STATES } from "./brand";

// src/app/allok-tokens.css es el mismo archivo en creativ3 y en vocero-crm.
// Si esta huella cambia, el archivo se editó: cópialo entero al otro repo y
// pon la huella nueva en las dos pruebas (aquí y en
// vocero-crm/tests/unit/allok-tokens.test.ts).
const HUELLA = "2d440e94cd2cbde173f445a53cad4c17687ffb155b5258e4da815e3415c2d8e5";

const css = readFileSync(join(process.cwd(), "src/app/allok-tokens.css"), "utf8");

function token(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(m, `falta --${name} en allok-tokens.css`);
  return m[1].trim().toLowerCase();
}

test("allok-tokens.css es el mismo que en vocero-crm", () => {
  const huella = createHash("sha256").update(css).digest("hex");
  assert.equal(huella, HUELLA, "allok-tokens.css cambió: cópialo a vocero-crm y actualiza la huella en las dos pruebas");
});

test("los estados del CSS son los de brand.ts", () => {
  const nombre = { activo: "ok", atendiendo: "atendiendo", atencion: "atencion", pausado: "pausado" } as const;
  for (const [estado, def] of Object.entries(STATES)) {
    const n = nombre[estado as keyof typeof nombre];
    assert.equal(token(`allok-${n}`), def.dot.toLowerCase(), `${estado}: dot`);
    assert.equal(token(`allok-${n}-ink`), def.ink.toLowerCase(), `${estado}: ink`);
    assert.equal(token(`allok-${n}-soft`), def.soft.toLowerCase(), `${estado}: soft`);
  }
  assert.equal(token("allok-tinta"), PALETTE.ink.toLowerCase());
  assert.equal(token("allok-noche"), PALETTE.ink.toLowerCase());
});
