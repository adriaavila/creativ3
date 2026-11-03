import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { HISTORIAS, OTRAS, ratioMedido } from "./historias";
import { ESTADO, PIEZAS } from "./vitrina";

test("las cuatro historias apuntan a piezas que existen, sin repetirse, numeradas 01 a 04", () => {
  assert.equal(HISTORIAS.length, 4);
  const ids = HISTORIAS.map((h) => h.id);
  for (const id of ids) assert.ok(PIEZAS.some((p) => p.id === id), `${id} no está en PIEZAS`);
  assert.equal(new Set(ids).size, ids.length, "una pieza contada dos veces");
  assert.deepEqual(
    HISTORIAS.map((h) => h.n),
    ["01", "02", "03", "04"],
  );
});

test("cada captura de las historias está en public/ y tiene sus medidas reales", () => {
  for (const h of HISTORIAS) {
    assert.ok(h.capturas.length > 0, `${h.id} sin captura`);
    for (const c of h.capturas) {
      assert.ok(existsSync(join(process.cwd(), "public", c.src)), c.src);
      // Sin medida, una captura de celular se enmarcaría en 16/10, recortada.
      const ratio = ratioMedido(c.src);
      assert.ok(ratio, `${c.src} sin medidas`);
      assert.equal(c.ratio, ratio, c.src);
      assert.equal(c.celular, ratio < 1, c.src);
    }
  }
});

test("los enlaces de cada historia son los de su pieza", () => {
  for (const h of HISTORIAS) {
    const p = PIEZAS.find((x) => x.id === h.id)!;
    if (h.url) assert.equal(h.url, p.liveUrl, `${h.id}: url`);
    for (const a of h.acciones) {
      if (a.tipo === "web") assert.equal(a.href, p.liveUrl, `${h.id}: ${a.texto}`);
      if (a.tipo === "caso") assert.equal(a.href, p.casoHref, `${h.id}: ${a.texto}`);
    }
  }
});

test("las piezas dicen «celular», nunca «móvil»", () => {
  for (const p of PIEZAS) assert.doesNotMatch(`${p.tipo} ${p.linea} ${p.historia}`, /móvil/i, p.id);
});

test("las otras son todas las demás piezas, una vez cada una, numeradas desde 05 sin huecos", () => {
  assert.equal(OTRAS.length, PIEZAS.length - 4);
  const contadas = new Set(HISTORIAS.map((h) => h.id));
  const ids = OTRAS.map((f) => f.pieza.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of PIEZAS) assert.equal(ids.includes(p.id), !contadas.has(p.id), p.id);
  OTRAS.forEach((f, i) => assert.equal(f.n, String(i + 5).padStart(2, "0")));
  // Agrupadas por su primera disciplina, en el orden web, producto, agentes.
  const orden = ["web", "producto", "agentes"];
  for (let i = 1; i < OTRAS.length; i++) assert.ok(orden.indexOf(OTRAS[i - 1]!.grupo) <= orden.indexOf(OTRAS[i]!.grupo));
  for (const f of OTRAS) assert.equal(f.grupo, f.pieza.disciplinas[0], f.pieza.id);
  // Dentro de cada grupo, lo que está en uso antes que lo que crece, y eso antes que demos y prototipos.
  const rango = { launched: 0, improving: 1, demo: 2, prototype: 3 } as const;
  for (let i = 1; i < OTRAS.length; i++) {
    const [a, b] = [OTRAS[i - 1]!, OTRAS[i]!];
    if (a.grupo === b.grupo) assert.ok(rango[a.pieza.status] <= rango[b.pieza.status], `${a.pieza.id} antes que ${b.pieza.id}`);
  }
});

test("ESTADO nombra cada estado de PIEZAS, sin «En vivo», «Privado» ni «En producción»", () => {
  for (const p of PIEZAS) assert.ok(ESTADO[p.status], `${p.id}: sin palabra para ${p.status}`);
  for (const palabra of Object.values(ESTADO)) assert.doesNotMatch(palabra, /en vivo|privado|en producción/i);
});
