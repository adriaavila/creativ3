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

test("un cliente de REI necesita un organization_id válido", () => {
  // Es la regla que evita el caso caro: marcar el cliente como REI, mandarle el
  // enlace, y descubrir recién al entregarlo que no hay a dónde entregarlo.
  const sinOrg = parseClientInput({ slug: "santorini", name: "Santorini", destination: "rei_crm" });
  assert.ok("error" in sinOrg);

  const orgMalo = parseClientInput({
    slug: "santorini",
    name: "Santorini",
    destination: "rei_crm",
    destination_ref: "santorini",
  });
  assert.ok("error" in orgMalo);

  const ok = parseClientInput({
    slug: "santorini",
    name: "Santorini",
    destination: "rei_crm",
    destination_ref: ORG,
    status: "connected",
  });
  assert.equal("error" in ok ? null : ok.input.destinationRef, ORG);
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

test("un destino o estado desconocido cae al valor por defecto, no al error", () => {
  const parsed = parseClientInput({ slug: "x", name: "X", destination: "salesforce", status: "vip" });
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

test("con destino, organización y número conectado se puede entregar", () => {
  assert.equal(handoverBlocker(entregable), null);
});

test("cada cosa que falta tiene su motivo", () => {
  assert.equal(handoverBlocker({ ...entregable, destination: "allok" }), "not_rei");
  assert.equal(handoverBlocker({ ...entregable, destinationRef: null }), "missing_org");
  assert.equal(handoverBlocker({ ...entregable, phoneNumberId: null }), "no_connection");
  // Entregar un número desautorizado copia un token que Meta ya no acepta.
  assert.equal(handoverBlocker({ ...entregable, connectionStatus: "deauthorized" }), "connection_inactive");
});
