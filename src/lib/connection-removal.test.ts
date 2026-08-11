import assert from "node:assert/strict";
import test from "node:test";
import { canRemoveConnection } from "@/lib/connection-removal";

test("una conexión entregada exige retirar primero sus credenciales externas", () => {
  assert.equal(canRemoveConnection({ confirmation: "ELIMINAR", handedToExternalApp: false, externalCredentialsRemoved: false }), true);
  assert.equal(canRemoveConnection({ confirmation: "eliminar", handedToExternalApp: false, externalCredentialsRemoved: false }), false);
  assert.equal(canRemoveConnection({ confirmation: "ELIMINAR", handedToExternalApp: true, externalCredentialsRemoved: false }), false);
  assert.equal(canRemoveConnection({ confirmation: "ELIMINAR", handedToExternalApp: true, externalCredentialsRemoved: true }), true);
});
