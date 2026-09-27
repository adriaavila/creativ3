import assert from "node:assert/strict";
import test from "node:test";
import { DAILY_LEADS, INVITE_PHRASE, INVITE_URL, MIN_SCORE, OFFER } from "../../apps/growth-agent/lib/offer";
import { TRY_AGENT_MESSAGE, whatsappUrl } from "@/lib/contact";
import { PLANS, SETUP_SERVICE } from "@/lib/plans";

// El Growth Agent se despliega aparte y lleva una copia de la oferta. Si esta
// prueba falla, alguien cambió un precio o la frase en un lado y no en el otro.
test("el Growth Agent vende lo mismo que la web y a los mismos precios", () => {
  assert.equal(OFFER.setup.price, SETUP_SERVICE.price);
  assert.equal(OFFER.setup.name, SETUP_SERVICE.name);
  for (const plan of OFFER.plans) {
    const web = PLANS.find((p) => p.name === plan.name);
    assert.ok(web, `${plan.name} no existe en plans.ts`);
    assert.equal(plan.price, web.price, plan.name);
  }
});

test("la invitación abre el WhatsApp de allok con la frase que despierta al agente", () => {
  assert.equal(INVITE_PHRASE, TRY_AGENT_MESSAGE);
  assert.equal(INVITE_URL, whatsappUrl(TRY_AGENT_MESSAGE));
  assert.doesNotMatch(INVITE_URL, /\s/, "un espacio corta el link dentro de WhatsApp");
  assert.ok(MIN_SCORE >= 7 && DAILY_LEADS <= 5);
});
