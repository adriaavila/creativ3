import { test } from "node:test";
import assert from "node:assert/strict";
import { assertNotCrmPlan, billingCatalog, isBillingKey } from "./catalog";

test("el catálogo de agencia no vende ninguna suscripción del CRM", () => {
  const crmLike = Object.entries(billingCatalog).filter(
    ([key, item]) => item.kind === "subscription" && key.startsWith("allok-"),
  );
  assert.deepEqual(crmLike, [], "la suscripción del CRM se cobra en la app, no acá");
});

test("una clave de plan del CRM no entra por el checkout de agencia", () => {
  for (const key of ["allok-starter", "allok-growth", "allok-pro", "allok-esencial", "allok-completo"]) {
    assert.throws(() => assertNotCrmPlan(key), /se cobra en la app/, key);
    assert.equal(isBillingKey(key), false, `${key} tampoco debería estar en el catálogo`);
  }
});

test("lo que sí se vende desde acá sigue pasando", () => {
  for (const key of ["allok-launch", "allok-automate"]) {
    assert.doesNotThrow(() => assertNotCrmPlan(key));
    assert.equal(isBillingKey(key), true);
  }
});
