import assert from "node:assert/strict";
import test from "node:test";
import type { GrowthLead } from "@/lib/growth-types";
import {
  localDate,
  messageFor,
  outcomePatch,
  salesQueue,
  stageOf,
  waDigits,
  weekStart,
  weekStats,
} from "@/lib/sales-queue";

const lead = (over: Partial<GrowthLead>): GrowthLead => ({
  id: over.id ?? "x",
  businessName: "Taller Sur",
  vertical: "Manual",
  location: "Caracas, Venezuela",
  websiteUrl: null,
  instagramUrl: null,
  businessPhone: "0412 555 1234",
  contactSourceUrl: null,
  evidence: "Fuente: aliado",
  sourceUrls: [],
  problemDetected: "",
  offerAngle: "vocero",
  leadScore: 5,
  status: "new",
  nextAction: "Primer contacto",
  nextActionAt: "2026-09-24",
  closeProbability: null,
  potentialValue: null,
  lastContactedAt: null,
  createdAt: "2026-09-20T12:00:00.000Z",
  ...over,
});

test("el día es el de Caracas: las 21:30 del 23 siguen siendo el 23", () => {
  assert.equal(localDate("2026-09-24T01:30:00Z"), "2026-09-23");
});

test("la semana arranca el lunes, también si hoy es domingo", () => {
  assert.equal(weekStart("2026-09-24"), "2026-09-21");
  assert.equal(weekStart("2026-09-27"), "2026-09-21");
  assert.equal(weekStart("2026-09-21"), "2026-09-21");
});

test("la cola: primero a quien se le pidió el pago, luego interesados, luego primer contacto", () => {
  const queue = salesQueue(
    [
      lead({ id: "first", nextActionAt: "2026-09-20" }),
      lead({ id: "future", nextActionAt: "2026-09-30" }),
      lead({ id: "won", status: "won", nextActionAt: "2026-09-20" }),
      lead({ id: "undated", nextActionAt: null }),
      lead({ id: "interested", status: "replied", nextAction: "Pedir el pago", nextActionAt: "2026-09-24" }),
      lead({ id: "asked", status: "meeting_booked", nextAction: "Pago pedido: confirmar", nextActionAt: "2026-09-24" }),
    ],
    "2026-09-24",
  );
  assert.deepEqual(queue.map((l) => l.id), ["asked", "interested", "first"]);
});

test("qué pasó: cada botón deja el estado y la próxima fecha", () => {
  assert.deepEqual(outcomePatch("talked", "2026-09-24"), { status: "replied", nextAction: "Pedir el pago", nextActionAt: "2026-09-26" });
  const asked = outcomePatch("asked", "2026-09-24");
  assert.equal(stageOf({ status: asked.status, nextAction: asked.nextAction }), "asked");
  assert.deepEqual(outcomePatch("paid", "2026-09-24"), { status: "won", nextAction: null, nextActionAt: null });
  assert.equal(outcomePatch("not_now", "2026-09-24", "  caro  ").nextAction, "No por ahora: caro");
  assert.equal(outcomePatch("not_now", "2026-09-24").nextAction, "No por ahora: sin motivo");
});

test("la semana cuenta tocados desde el lunes, en hora de Caracas", () => {
  const stats = weekStats(
    [
      lead({ id: "a", status: "replied", lastContactedAt: "2026-09-22T15:00:00Z" }),
      lead({ id: "b", status: "meeting_booked", nextAction: "Pago pedido: confirmar", lastContactedAt: "2026-09-23T15:00:00Z" }),
      lead({ id: "c", status: "won", nextAction: null, lastContactedAt: "2026-09-24T15:00:00Z" }),
      // domingo 20 a las 23:00 en Caracas: semana pasada, aunque en UTC ya sea lunes
      lead({ id: "d", status: "replied", lastContactedAt: "2026-09-21T03:00:00Z" }),
    ],
    "2026-09-24",
  );
  assert.deepEqual(stats, { conversations: 3, asked: 2, paid: 1 });
});

test("teléfonos para wa.me", () => {
  assert.equal(waDigits("0412-555.12.34"), "584125551234");
  assert.equal(waDigits("+58 412 555 1234"), "584125551234");
  assert.equal(waDigits("0058 412 555 1234"), "584125551234");
  assert.equal(waDigits("+1 (305) 555-0100"), "13055550100");
  assert.equal(waDigits("555"), null);
  assert.equal(waDigits(null), null);
});

test("el pedido de pago sale de la hoja de precios y sin rayas largas", () => {
  const text = messageFor("interested", lead({}));
  assert.match(text, /US\$49 al mes/);
  assert.match(text, /US\$499/);
  for (const stage of ["first", "interested", "asked"] as const) assert.doesNotMatch(messageFor(stage, lead({})), /—/);
});

test("un pago pedido no se des-pide: hablar después lo deja pedido, y un no conserva la marca", () => {
  const talked = outcomePatch("talked", "2026-09-24", undefined, true);
  assert.equal(stageOf({ status: talked.status, nextAction: talked.nextAction }), "asked");
  const no = outcomePatch("not_now", "2026-09-24", "caro", true);
  assert.equal(no.status, "lost");
  const stats = weekStats([lead({ status: no.status, nextAction: no.nextAction, lastContactedAt: "2026-09-24T15:00:00Z" })], "2026-09-24");
  assert.deepEqual(stats, { conversations: 1, asked: 1, paid: 0 });
});

test("REI y agencia no heredan el precio de Vocero", () => {
  for (const offerAngle of ["rei", "agencia"]) {
    for (const stage of ["first", "interested"] as const) {
      assert.doesNotMatch(messageFor(stage, lead({ offerAngle })), /US\$/);
    }
  }
  assert.match(messageFor("first", lead({ offerAngle: "rei" })), /inmobiliarias/);
});
