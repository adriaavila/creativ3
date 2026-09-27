import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { verifiedEvent, webhookSecrets } from "@/lib/stripe-webhook";

const stripe = new Stripe("sk_test_check_only");
const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: {} } });
const sign = (secret: string, body = payload) => stripe.webhooks.generateTestHeaderString({ payload: body, secret });

test("las dos cuentas de Stripe entran por la misma URL, cada una con su llave", () => {
  const secrets = webhookSecrets(" whsec_agencia , whsec_llc,");
  assert.deepEqual(secrets, ["whsec_agencia", "whsec_llc"]);
  assert.equal(verifiedEvent(stripe, payload, sign("whsec_agencia"), secrets)?.id, "evt_1");
  assert.equal(verifiedEvent(stripe, payload, sign("whsec_llc"), secrets)?.id, "evt_1");
  assert.equal(verifiedEvent(stripe, payload, sign("whsec_otra"), secrets), null, "una llave desconocida no entra");
  assert.equal(verifiedEvent(stripe, `${payload} `, sign("whsec_llc"), secrets), null, "un cuerpo alterado no entra");
  assert.deepEqual(webhookSecrets(undefined), []);
});
