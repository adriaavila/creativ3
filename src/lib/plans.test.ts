import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CRM_APP_URL, FROM_PRICE, PLANS, SELF_SERVE, SETUP_SERVICE, metaMonthlyCost, planCta, priceLabel, trialNote, usd } from "./plans";

test("el tramo gratis de Meta deja el costo en cero", () => {
  // 200 consultas × 5 respuestas = 1.000 mensajes, justo el límite gratis.
  const r = metaMonthlyCost({ consultas: 200, repliesPerConsulta: 5, adsShare: 0 });
  assert.equal(r.billable, 0);
  assert.equal(r.cost, 0);
});

test("sólo se cobra lo que pasa de los 1.000 gratis", () => {
  // 500 × 5 = 2.500 − 1.000 = 1.500 × 0,0113
  const r = metaMonthlyCost({ consultas: 500, repliesPerConsulta: 5, adsShare: 0 });
  assert.equal(r.billable, 1500);
  assert.ok(Math.abs(r.cost - 16.95) < 0.001, `cost=${r.cost}`);
});

test("lo que entra por anuncios no paga mensajería en su ventana de 72 h", () => {
  const r = metaMonthlyCost({ consultas: 500, repliesPerConsulta: 5, adsShare: 0.3 });
  // Orgánico: 350 × 5 = 1.750 − 1.000 = 750 cobrables.
  assert.equal(r.organicReplies, 1750);
  assert.equal(r.billable, 750);
  assert.ok(Math.abs(r.cost - 8.475) < 0.001, `cost=${r.cost}`);
  // Y 750 respuestas desde anuncios que nadie facturó.
  assert.equal(r.adsReplies, 750);
  assert.ok(Math.abs(r.avoided - 8.475) < 0.001, `avoided=${r.avoided}`);
});

test("todo desde anuncios sale gratis", () => {
  const r = metaMonthlyCost({ consultas: 2000, repliesPerConsulta: 8, adsShare: 1 });
  assert.equal(r.cost, 0);
  assert.equal(r.billable, 0);
});

test("usd muestra centavos sólo cuando cambian la decisión", () => {
  assert.equal(usd(0), "$0");
  assert.equal(usd(8.475), "$8.47");
  assert.equal(usd(101.7), "$102");
});

test("el «desde» sólo aparece donde el precio es un piso", () => {
  const medida = PLANS.find((p) => p.key === "a-medida")!;
  const completo = PLANS.find((p) => p.key === "completo")!;
  assert.equal(priceLabel(medida).amount, "desde $499");
  assert.equal(priceLabel(completo).amount, "$99");
});

test("FROM_PRICE ignora lo que no se contrata solo", () => {
  // El plan a medida cuesta más y no tiene autoservicio: si entrara en el
  // mínimo, la página seguiría diciendo 49 — pero si algún día fuera más
  // barato que un plan, la frase «desde» mentiría.
  assert.equal(FROM_PRICE, 49);
  assert.ok(PLANS.every((p) => (p.appPlan === null) === (p.talkTo !== undefined)));
});

test("la puesta en marcha cobra lo que dice la página", () => {
  assert.equal(SETUP_SERVICE.price, 499, "si cambia el precio, cambia también el Payment Link en Stripe");
});

test("con autoservicio, cada plan de suscripción lleva al registro del CRM y la medida a una conversación", () => {
  assert.equal(SELF_SERVE, true);
  for (const plan of PLANS) {
    const { href, label } = planCta(plan);
    if (plan.appPlan) {
      assert.equal(href, `${CRM_APP_URL}/register?plan=${plan.appPlan}`, plan.key);
      assert.equal(label, "Crear mi cuenta", plan.key);
      continue;
    }
    // El plan a medida se conversa: el agente de allok solo arranca con una frase completa.
    assert.ok(href.startsWith("https://wa.me/"), `${plan.key} no va a WhatsApp: ${href}`);
    const text = decodeURIComponent(new URL(href).searchParams.get("text") ?? "");
    assert.ok(text.includes("vengo de allok.fun"), `${plan.key}: ${text}`);
    assert.ok(!text.trimEnd().endsWith(":"), `${plan.key} deja la frase a medias: ${text}`);
    assert.equal(label, "Hablemos");
  }
});

test("las dos tarjetas de suscripción dicen la misma prueba: 7 días de Completo, sin prometer una de Esencial", () => {
  const [esencial, completo, medida] = ["esencial", "completo", "a-medida"].map((key) => PLANS.find((p) => p.key === key)!);
  const note = trialNote(completo!);
  assert.equal(note, "7 días gratis del plan Completo. Después eliges tu plan.");
  assert.equal(trialNote(esencial!), note);
  assert.ok(!/esencial/i.test(trialNote(esencial!) ?? ""), "la tarjeta de Esencial no promete una prueba de Esencial");
  assert.equal(trialNote(medida!), null);
  // Los días salen del plan Completo, que a su vez refleja el CRM (SELF_SERVE_TRIAL_DAYS = 7).
  assert.equal(completo!.trialDays, 7);
});

test("lo que dice cada plan coincide con lo que el CRM cierra por plan", () => {
  const esencial = PLANS.find((p) => p.key === "esencial")!;
  const completo = PLANS.find((p) => p.key === "completo")!;
  // Esencial contesta solo fuera del horario del negocio; a cualquier hora exige Completo.
  assert.ok(esencial.features.some((f) => /fuera de tu horario/i.test(f)));
  assert.ok(!esencial.features.some((f) => /cualquier hora|todo el día|24 horas/i.test(f)));
  assert.ok(completo.features.some((f) => /todo el día/i.test(f)));
});

test("ninguna tarjeta de plan cobra por Payment Link: el pago pasa por el registro del CRM", () => {
  for (const plan of PLANS) assert.ok(!planCta(plan).href.includes("buy.stripe.com"), plan.key);
  for (const file of ["src/app/page.tsx", "src/app/rei/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.ok(!source.includes("buy.stripe.com") && !source.includes("ESENCIAL_LINK"), file);
  }
});
