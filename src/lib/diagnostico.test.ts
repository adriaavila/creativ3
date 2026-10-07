import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnosticoSchema, diagnosticoSummary, isHighTicket } from "./diagnostico";

const base = { name: "Ana Pérez", company: "Clínica Sol", email: "Ana@ClinicaSol.com " };

test("acepta lo mínimo y normaliza el correo", () => {
  const r = diagnosticoSchema.safeParse(base);
  assert.ok(r.success);
  assert.equal(r.data.email, "ana@clinicasol.com");
  assert.deepEqual(r.data.areas, []);
});

test("rechaza correo inválido, área desconocida y la trampa de bots llena", () => {
  assert.equal(diagnosticoSchema.safeParse({ ...base, email: "no-es-correo" }).success, false);
  assert.equal(diagnosticoSchema.safeParse({ ...base, areas: ["marte"] }).success, false);
  assert.equal(diagnosticoSchema.safeParse({ ...base, company_url: "http://spam" }).success, false);
  assert.equal(diagnosticoSchema.safeParse({ ...base, phone: "12" }).success, false);
});

test("recorta un mensaje largo en vez de rechazarlo", () => {
  const r = diagnosticoSchema.safeParse({ ...base, message: "a".repeat(5000) });
  assert.ok(r.success);
  assert.equal(r.data.message.length, 2000);
});

test("el resumen lleva lo que el equipo necesita y nada vacío", () => {
  const r = diagnosticoSchema.parse({ ...base, areas: ["ventas", "operacion"], budget: "10-25", website: "clinicasol.com" });
  const s = diagnosticoSummary(r);
  assert.match(s, /Ana Pérez de Clínica Sol/);
  assert.match(s, /Ventas y atención, Operación interna/);
  assert.match(s, /US\$10\.000 a 25\.000/);
  assert.doesNotMatch(s, /undefined|null/);
  assert.equal(isHighTicket(r), true);
  assert.equal(isHighTicket(diagnosticoSchema.parse(base)), false);
});
