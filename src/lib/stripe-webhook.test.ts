import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import { SETUP_SERVICE } from "@/lib/plans";
import { itemOf, verifiedEvent, webhookSecrets } from "@/lib/stripe-webhook";

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

test("sólo el link de la puesta en marcha cobra como puesta en marcha", () => {
  assert.equal(itemOf({ payment_link: SETUP_SERVICE.paymentLinkId, metadata: { kind: "puesta_en_marcha" } }), "puesta-en-marcha");
  assert.equal(itemOf({ payment_link: { id: SETUP_SERVICE.paymentLinkId } as Stripe.PaymentLink, metadata: {} }), "puesta-en-marcha", "link expandido");
  assert.equal(itemOf({ payment_link: "plink_otro_de_la_agencia", metadata: {} }), "", "otro link sin metadata no es la puesta en marcha");
  assert.equal(itemOf({ payment_link: null, metadata: { item: "project-juanete" } }), "project-juanete", "nuestro checkout manda su item");
  assert.equal(itemOf({ payment_link: null, metadata: null }), "");
});
