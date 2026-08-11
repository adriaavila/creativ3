import assert from "node:assert/strict";
import test from "node:test";
import { handoverBlocker, parseClientInput } from "@/lib/clients";

const ORG = "6f2c0a3e-9d61-4a2b-8f0e-1c2d3e4f5a6b";

// ── Alta de cliente ──────────────────────────────────────────────

test("un cliente de la bandeja de allok no necesita referencia externa", () => {
  const parsed = parseClientInput({ slug: "Panaderia-Sur", name: "  Panadería Sur  " });
  assert.deepEqual("error" in parsed ? parsed.error : parsed.input, {
    slug: "panaderia-sur",
    name: "Panadería Sur",
    destination: "allok",
    destinationRef: null,
    status: "invited",
    contact: null,
    notes: null,
  });
});

test("un cliente que trabaja en otra app guarda su referencia en ella", () => {
  // Qué referencia exige cada app la sabe la tabla de destinos, no este parser:
  // acá sólo se rechaza lo que no puede viajar en un JSON de provisión.
  const ok = parseClientInput({
    slug: "santorini",
    name: "Santorini",
    destination: "rei_crm",
    destination_ref: ORG,
    status: "connected",
  });
  assert.equal("error" in ok ? null : ok.input.destinationRef, ORG);

  const refRota = parseClientInput({
    slug: "santorini",
    name: "Santorini",
    destination: "vocero",
    destination_ref: "con espacios",
  });
  assert.ok("error" in refRota);
});

test("un cliente de allok no puede llevar referencia externa colgada", () => {
  // Si queda una referencia vieja al cambiar el destino, la fila miente sobre
  // dónde trabaja el cliente.
  const parsed = parseClientInput({ slug: "santorini", name: "Santorini", destination_ref: ORG });
  assert.ok("error" in parsed);
});

test("un slug o un nombre inválidos no crean cliente", () => {
  for (const bogus of [
    null,
    { name: "Sin slug" },
    { slug: "-empieza-con-guion", name: "X" },
    { slug: "con espacio", name: "X" },
    { slug: "ok", name: "   " },
  ]) {
    assert.ok("error" in parseClientInput(bogus), JSON.stringify(bogus));
  }
});

test("un destino nuevo se acepta; uno con forma inválida cae a la bandeja de allok", () => {
  // Dar de alta una app es guardar su destino, no editar una lista cerrada.
  const nuevo = parseClientInput({ slug: "x", name: "X", destination: "vocero", destination_ref: "org-9" });
  assert.equal("error" in nuevo ? null : nuevo.input.destination, "vocero");

  const parsed = parseClientInput({ slug: "x", name: "X", destination: "NO VALIDO", status: "vip" });
  assert.equal("error" in parsed ? null : parsed.input.destination, "allok");
  assert.equal("error" in parsed ? null : parsed.input.status, "invited");
});

// ── Entrega ──────────────────────────────────────────────────────

const entregable = {
  destination: "rei_crm" as const,
  destinationRef: ORG,
  phoneNumberId: "987654321098765",
  connectionStatus: "subscribed",
};

test("con destino y número conectado se puede entregar", () => {
  assert.equal(handoverBlocker(entregable), null);
  // La referencia externa sólo la exigen los destinos con provisión, y eso lo
  // decide la entrega leyendo la tabla de destinos.
  assert.equal(handoverBlocker({ ...entregable, destinationRef: null }), null);
});

test("cada cosa que falta tiene su motivo", () => {
  assert.equal(handoverBlocker({ ...entregable, destination: "allok" }), "in_allok");
  assert.equal(handoverBlocker({ ...entregable, phoneNumberId: null }), "no_connection");
  // Entregar un número desautorizado copia un token que Meta ya no acepta.
  assert.equal(handoverBlocker({ ...entregable, connectionStatus: "deauthorized" }), "connection_inactive");
});
