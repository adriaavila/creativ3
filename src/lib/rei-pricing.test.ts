import { test } from "node:test";
import assert from "node:assert/strict";
import { metaMonthlyCost, usd } from "./rei-pricing";

test("el tramo gratis de Meta deja el costo en cero", () => {
  // 200 consultas × 5 respuestas = 1.000 mensajes, justo el límite gratis.
  const r = metaMonthlyCost({ consultas: 200, repliesPerConsulta: 5, adsShare: 0 });
  assert.equal(r.billable, 0);
  assert.equal(r.cost, 0);
});

test("sólo se cobra lo que pasa de los 1.000 gratis", () => {
  // 500 × 5 = 2.500 − 1.000 = 1.500 × 0,0113
  const r = metaMonthlyCost({ consultas: 500, repliesPerConsulta: 5, adsShare: 0 });
  assert.equal(r.billable, 1500);
  assert.ok(Math.abs(r.cost - 16.95) < 0.001, `cost=${r.cost}`);
});

test("lo que entra por anuncios no paga mensajería en su ventana de 72 h", () => {
  const r = metaMonthlyCost({ consultas: 500, repliesPerConsulta: 5, adsShare: 0.3 });
  // Orgánico: 350 × 5 = 1.750 − 1.000 = 750 cobrables.
  assert.equal(r.organicReplies, 1750);
  assert.equal(r.billable, 750);
  assert.ok(Math.abs(r.cost - 8.475) < 0.001, `cost=${r.cost}`);
  // Y 750 respuestas desde anuncios que nadie facturó.
  assert.equal(r.adsReplies, 750);
  assert.ok(Math.abs(r.avoided - 8.475) < 0.001, `avoided=${r.avoided}`);
});

test("todo desde anuncios sale gratis", () => {
  const r = metaMonthlyCost({ consultas: 2000, repliesPerConsulta: 8, adsShare: 1 });
  assert.equal(r.cost, 0);
  assert.equal(r.billable, 0);
});

test("usd muestra centavos sólo cuando cambian la decisión", () => {
  assert.equal(usd(0), "$0");
  assert.equal(usd(8.475), "$8.47");
  assert.equal(usd(101.7), "$102");
});
