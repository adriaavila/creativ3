import assert from "node:assert/strict";
import test from "node:test";
import { type AgentState, type CapturedRow, displayStage, followupFor, passesFilter } from "@/lib/ops-capture";
import { capturedLeadId, capturedRowSchema } from "@/lib/ops-capture-server";
import { ASKED_PREFIX, NO_SHOW_ACTION } from "@/lib/sales-queue";
import { messageFor, salesQueue, stageOf } from "@/lib/sales-queue";
import type { GrowthLead } from "@/lib/growth-types";

// Sábado 26-09 a las 15:00 en Caracas (UTC−4).
const NOW = new Date("2026-09-26T19:00:00Z");

const row = (over: Partial<CapturedRow> = {}): CapturedRow => ({
  conversationId: "conv_abc",
  phone: "584121234567",
  name: "Nurbelys",
  crmUrl: "https://crm.allok.fun/inbox/conv_abc",
  source: "anuncio",
  adHeadline: "Responde, califica y agenda",
  firstMessage: "Hola, vi el anuncio",
  rubro: "bufete",
  dolor: "no alcanzamos a contestar a todos",
  calificado: null,
  resultado: null,
  askedPrice: false,
  handoffAt: null,
  handoffReason: null,
  booking: null,
  lastInboundAt: "2026-09-26T15:00:00Z",
  lastAiAt: "2026-09-26T15:01:00Z",
  lastManualAt: null,
  ...over,
});

const state = (over: Partial<AgentState> = {}): AgentState => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { phone: _phone, ...rest } = row();
  return { ...rest, stage: "followup", step: 0, computedAt: NOW.toISOString(), ...over };
};

test("el filtro: sólo pasa lo que el agente ya calificó, agendó, pasó a Adrian o preguntó precio", () => {
  assert.equal(passesFilter(row()), false, "conversando: se queda con el agente");
  assert.equal(passesFilter(row({ calificado: true })), true);
  assert.equal(passesFilter(row({ askedPrice: true })), true);
  assert.equal(passesFilter(row({ resultado: "agendo" })), true);
  assert.equal(passesFilter(row({ booking: { at: "2026-09-29T19:00:00Z", status: "agendada", meetLink: null } })), true);
  assert.equal(passesFilter(row({ booking: { at: "2026-09-29T19:00:00Z", status: "cancelada", meetLink: null } })), false);
  assert.equal(passesFilter(row({ handoffAt: NOW.toISOString(), handoffReason: "modelo" })), true);
  assert.equal(passesFilter(row({ handoffAt: NOW.toISOString(), handoffReason: "manual_reply" })), false, "Adrian ya contestó");
  assert.equal(passesFilter(row({ handoffAt: NOW.toISOString(), handoffReason: "hostilidad" })), false);
  assert.equal(passesFilter(row({ calificado: false, resultado: "dio_diy", askedPrice: true })), false, "no encaja");
});

test("un pase del agente va hoy, arriba de todo", () => {
  const patch = followupFor(row({ calificado: true, handoffAt: "2026-09-26T18:00:00Z", handoffReason: "modelo" }), null, NOW);
  assert.equal(patch.stage, "handoff");
  assert.equal(patch.nextActionAt, "2026-09-26");
});

test("una llamada: vence el día de la llamada; si ya pasó, toca el después", () => {
  const future = followupFor(row({ booking: { at: "2026-09-29T19:00:00Z", status: "agendada", meetLink: "https://meet.google.com/x" } }), null, NOW);
  assert.deepEqual([future.stage, future.nextActionAt, future.status], ["call", "2026-09-29", "meeting_booked"]);
  const past = followupFor(row({ booking: { at: "2026-09-26T14:00:00Z", status: "agendada", meetLink: null } }), null, NOW);
  assert.deepEqual([past.stage, past.nextActionAt], ["after_call", "2026-09-26"]);
  const noShow = followupFor(row({ booking: { at: "2026-09-26T14:00:00Z", status: "no_show", meetLink: null } }), null, NOW);
  assert.equal(noShow.stage, "no_show");
});

test("calificado sin llamada: seguimiento 1 al día siguiente, 2 a los 3 días del toque, cierre a los 4 más", () => {
  const first = followupFor(row({ calificado: true }), null, NOW);
  assert.deepEqual([first.stage, first.step, first.nextActionAt], ["followup", 0, "2026-09-27"]);

  // Adrian mandó el seguimiento desde la app: cuenta solo, sin tocar «Qué pasó».
  const prev = { status: first.status, nextAction: first.nextAction, nextActionAt: first.nextActionAt, lastContactedAt: null, step: 0 };
  const touched = followupFor(row({ calificado: true, lastManualAt: "2026-09-27T14:00:00Z" }), prev, new Date("2026-09-27T20:00:00Z"));
  assert.deepEqual([touched.stage, touched.step, touched.nextActionAt], ["followup", 1, "2026-09-30"]);
  assert.equal(touched.lastContactedAt, "2026-09-27T14:00:00Z");

  const prev2 = { ...prev, lastContactedAt: touched.lastContactedAt, step: 1 };
  const last = followupFor(row({ calificado: true, lastManualAt: "2026-09-30T14:00:00Z" }), prev2, new Date("2026-09-30T20:00:00Z"));
  assert.deepEqual([last.stage, last.step, last.nextActionAt], ["close", 2, "2026-10-04"]);
});

test("si contesta después de que Adrian le escribió, vuelve hoy como «Te respondió»", () => {
  const prev = { status: "replied", nextAction: "Seguimiento 2", nextActionAt: "2026-09-30", lastContactedAt: "2026-09-26T14:00:00Z", step: 1 };
  const patch = followupFor(row({ calificado: true, lastManualAt: "2026-09-26T14:00:00Z", lastInboundAt: "2026-09-26T18:00:00Z", lastAiAt: "2026-09-26T13:00:00Z" }), prev, NOW);
  assert.deepEqual([patch.stage, patch.nextActionAt], ["replied", "2026-09-26"]);
});

test("lo que decide Adrian manda: un lead cerrado o con pago pedido no se reescribe", () => {
  const lost = followupFor(row({ calificado: true }), { status: "lost", nextAction: "No por ahora: caro", nextActionAt: null, lastContactedAt: "2026-09-25T12:00:00Z", step: 1 }, NOW);
  assert.deepEqual([lost.status, lost.nextAction], ["lost", "No por ahora: caro"]);
  const asked = followupFor(row({ calificado: true }), { status: "meeting_booked", nextAction: "Pago pedido: confirmar", nextActionAt: "2026-09-28", lastContactedAt: "2026-09-26T12:00:00Z", step: 0 }, NOW);
  assert.deepEqual([asked.stage, asked.nextActionAt], ["asked", "2026-09-28"]);
});

test("la tarjeta: un «Qué pasó» posterior manda, y una llamada vencida se ve como después de la llamada", () => {
  assert.equal(displayStage(state({ stage: "followup" }), "2026-09-27T12:00:00Z", NOW), null);
  const call = state({ stage: "call", booking: { at: "2026-09-26T18:00:00Z", status: "agendada", meetLink: null } });
  assert.equal(displayStage(call, null, NOW), "after_call");
  assert.equal(displayStage(null, null, NOW), null);
});

const captured = (over: Partial<GrowthLead> = {}, agent: Partial<AgentState> = {}): GrowthLead => ({
  id: over.id ?? "x",
  businessName: "Nurbelys",
  vertical: "bufete",
  location: "",
  websiteUrl: null,
  instagramUrl: null,
  businessPhone: "584121234567",
  contactSourceUrl: null,
  evidence: "Fuente: anuncio",
  sourceUrls: [],
  problemDetected: "",
  offerAngle: "vocero",
  leadScore: 5,
  status: "replied",
  nextAction: "Seguimiento 1",
  nextActionAt: "2026-09-26",
  closeProbability: null,
  potentialValue: null,
  lastContactedAt: null,
  createdAt: "2026-09-26T12:00:00.000Z",
  agentState: state(agent),
  ...over,
});

test("la cola pone primero el pase del agente y después los seguimientos", () => {
  const queue = salesQueue(
    [
      captured({ id: "seguimiento" }),
      captured({ id: "pase", nextAction: "Te pasó el agente" }, { stage: "handoff" }),
      captured({ id: "manana", nextActionAt: "2026-09-27" }),
    ],
    "2026-09-26",
  );
  assert.deepEqual(queue.map((l) => l.id), ["pase", "seguimiento"]);
  assert.equal(stageOf(captured({}, { stage: "handoff" }), NOW), "handoff");
});

test("los mensajes salen de lo que sabe el agente, sin huecos ni rayas largas", () => {
  const lead = captured();
  const follow1 = messageFor("followup", lead);
  assert.match(follow1, /^Hola Nurbelys, soy Adrian de allok\. Vi lo que le contaste a nuestro agente sobre tu bufete: no alcanzamos a contestar a todos\./);
  const priced = messageFor("followup", captured({}, { askedPrice: true }));
  assert.match(priced, /^Hola Nurbelys, soy Adrian de allok\. Le preguntaste a nuestro agente por el precio: la puesta en marcha son US\$499 una vez y el plan Esencial US\$49 al mes\. Se paga aquí: https:\/\/buy\.stripe\.com\//);
  assert.match(priced, /verlo antes en tu bufete/);
  assert.doesNotMatch(messageFor("followup", captured({}, { askedPrice: true, rubro: null })), /en tu/);
  assert.match(messageFor("followup", captured({}, { askedPrice: true, step: 1 })), /^Nurbelys, ¿lo vemos esta semana\?/, "el segundo seguimiento no repite el precio");
  const bare = messageFor("followup", captured({}, { name: null, rubro: null, dolor: null }));
  assert.match(bare, /^Hola, soy Adrian de allok\. Quedó pendiente/);
  assert.match(messageFor("followup", captured({}, { step: 1 })), /^Nurbelys, ¿lo vemos esta semana\?/);
  const call = messageFor("call", captured({}, { booking: { at: "2026-09-29T19:00:00Z", status: "agendada", meetLink: "https://meet.google.com/uvz" } }));
  assert.equal(call, "Hola Nurbelys, te confirmo la llamada de hoy a las 15:00. El enlace es https://meet.google.com/uvz ¿Seguimos?");
  assert.match(messageFor("after_call", lead), /US\$499 una vez y el plan Esencial US\$49 al mes\. Se paga aquí: https:\/\/buy\.stripe\.com\//);
  assert.match(messageFor("after_call", lead), /buy\.stripe\.com\/\S+\?client_reference_id=x /, "el link lleva el id del lead");
  for (const stage of ["asked", "interested"] as const) {
    assert.match(messageFor(stage, lead), /\?client_reference_id=x$/, `${stage}: link con el id del lead`);
  }
  assert.match(priced, /\?client_reference_id=x /);
  assert.match(messageFor("onboard", lead), /^Hola Nurbelys, recibí tu pago, gracias\./);
  assert.equal(messageFor("replied", lead), "");
  const longName = messageFor("handoff", captured({}, { name: "Clínica Odontológica del Este C.A." }));
  assert.match(longName, /^Hola, soy Adrian/, "un nombre de negocio largo no va en el saludo");

  const stages = ["handoff", "call", "after_call", "onboard", "no_show", "followup", "asked", "interested", "first"] as const;
  for (const stage of stages) {
    const text = messageFor(stage, lead);
    assert.doesNotMatch(text, /[—–]/, `${stage}: sin rayas largas`);
    assert.doesNotMatch(text, /\p{Extended_Pictographic}/u, `${stage}: sin emojis`);
    assert.doesNotMatch(text, /undefined|null|\{/, `${stage}: sin huecos`);
  }
  const pricedText = messageFor("followup", captured({}, { askedPrice: true }));
  assert.doesNotMatch(pricedText, /[—–]|\p{Extended_Pictographic}|undefined|null|\{/u);
});

test("la misma conversación siempre da el mismo lead; el lote rechaza lo que no cumple", () => {
  assert.equal(capturedLeadId("conv_abc"), capturedLeadId("conv_abc"));
  assert.notEqual(capturedLeadId("conv_abc"), capturedLeadId("conv_abd"));
  assert.match(capturedLeadId("conv_abc"), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(capturedRowSchema.safeParse(row()).success, true);
  assert.equal(capturedRowSchema.safeParse({ ...row(), crmUrl: "javascript:alert(1)" }).success, false);
  assert.equal(capturedRowSchema.safeParse({ ...row(), phone: "bsuid:xyz" }).success, false, "sin dígitos no hay llave");
});

test("un mensaje con emojis se recorta en vez de frenar el lote", () => {
  const parsed = capturedRowSchema.parse({ ...row(), firstMessage: "🙂".repeat(450) });
  assert.equal(Array.from(parsed.firstMessage!).length, 400);
});

const prevOf = (over: Partial<{ status: string; nextAction: string | null; nextActionAt: string | null; lastContactedAt: string | null; step: number }>) => ({
  status: "replied",
  nextAction: null,
  nextActionAt: "2026-09-26",
  lastContactedAt: "2026-09-26T14:00:00Z",
  step: 0,
  ...over,
});

test("«Pedí el pago» y después contesta: vuelve hoy sin perder la marca de pago pedido", () => {
  const prev = prevOf({ status: "meeting_booked", nextAction: `${ASKED_PREFIX}: confirmar`, nextActionAt: "2026-09-28" });
  const patch = followupFor(row({ calificado: true, lastInboundAt: "2026-09-26T18:00:00Z", lastAiAt: "2026-09-26T13:00:00Z" }), prev, NOW);
  assert.equal(patch.nextActionAt, "2026-09-26");
  assert.ok(patch.nextAction?.startsWith(ASKED_PREFIX), patch.nextAction ?? "");
  assert.equal(stageOf({ status: patch.status, nextAction: patch.nextAction }, NOW), "asked");
});

test("«Hablamos» y «No vino» no se pisan con la actividad del agente", () => {
  // Después de «Hablamos», el agente sigue contestando: no es un primer seguimiento.
  const talked = followupFor(
    row({ calificado: true, lastInboundAt: "2026-09-26T13:00:00Z", lastAiAt: "2026-09-26T13:30:00Z" }),
    prevOf({ nextAction: "Pedir el pago", nextActionAt: "2026-09-28" }),
    NOW,
  );
  assert.deepEqual([talked.nextAction, talked.nextActionAt], ["Pedir el pago", "2026-09-28"]);
  const noShow = followupFor(
    row({ booking: { at: "2026-09-26T13:00:00Z", status: "agendada", meetLink: null } }),
    prevOf({ status: "meeting_booked", nextAction: NO_SHOW_ACTION, nextActionAt: "2026-09-27" }),
    NOW,
  );
  assert.deepEqual([noShow.nextAction, noShow.nextActionAt], [NO_SHOW_ACTION, "2026-09-27"]);
});

test("si el lead contesta, la secuencia de seguimientos vuelve a empezar", () => {
  // Iba en el seguimiento 1; contestó; Adrian le respondió: no toca «cerrar sin respuesta».
  const patch = followupFor(
    row({ calificado: true, lastInboundAt: "2026-09-26T15:00:00Z", lastAiAt: "2026-09-26T12:00:00Z", lastManualAt: "2026-09-26T16:00:00Z" }),
    prevOf({ nextAction: "Seguimiento 2", lastContactedAt: "2026-09-25T14:00:00Z", step: 1 }),
    NOW,
  );
  assert.deepEqual([patch.stage, patch.step], ["followup", 1]);
  assert.equal(patch.nextAction, "Seguimiento 2");
});

test("un lead investigado por Growth no entra a Hoy hasta que vuelve por el agente", () => {
  const researched = captured({ runId: "run-1", agentState: null, status: "contacted", nextAction: "Seguimiento 1 de la invitación" });
  assert.equal(stageOf(researched, NOW), null);
  assert.deepEqual(salesQueue([researched], "2026-09-26"), []);
  const back = captured({ runId: "run-1" }, { source: "invitacion", stage: "followup" });
  assert.equal(stageOf(back, NOW), "followup");
});
