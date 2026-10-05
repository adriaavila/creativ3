import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CRM_APP_URL, FROM_PRICE, PLANS, SETUP_SERVICE, closingOffer, headerCta, headerNav, heroCta, isSelfServe, metaMonthlyCost, planCta, priceLabel, registerUrl, trialNote, usd } from "./plans";

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
  // mínimo, la página seguiría diciendo 99 — pero si algún día fuera más
  // barato que un plan, la frase «desde» mentiría.
  assert.equal(FROM_PRICE, 99, "Esencial ($49) está oculto: no cuenta para el «desde»");
  assert.ok(PLANS.every((p) => (p.appPlan === null) === (p.talkTo !== undefined)));
});

test("la puesta en marcha cobra lo que dice la página", () => {
  assert.equal(SETUP_SERVICE.price, 199, "/pago/puesta-en-marcha cobra este número por Checkout");
});

/** Corre `fn` con el autoservicio encendido (`"true"`), apagado (`undefined`) o con otro valor. */
function withSelfServe<T>(value: string | undefined, fn: () => T): T {
  const before = process.env.NEXT_PUBLIC_SELF_SERVE;
  if (value === undefined) delete process.env.NEXT_PUBLIC_SELF_SERVE;
  else process.env.NEXT_PUBLIC_SELF_SERVE = value;
  try {
    return fn();
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_SELF_SERVE;
    else process.env.NEXT_PUBLIC_SELF_SERVE = before;
  }
}

test("el autoservicio nace apagado: sin la variable (o con otro valor) nada cambia en el sitio", () => {
  for (const value of [undefined, "", "false", "1", "TRUE"]) {
    withSelfServe(value, () => {
      assert.equal(isSelfServe(), false, String(value));
      for (const plan of PLANS) {
        const { href, label } = planCta(plan);
        assert.ok(href.startsWith("https://wa.me/"), `${plan.key} no va a WhatsApp: ${href}`);
        const text = decodeURIComponent(new URL(href).searchParams.get("text") ?? "");
        assert.ok(text.includes("vengo de allok.fun"), `${plan.key}: ${text}`);
        assert.ok(!text.trimEnd().endsWith(":"), `${plan.key} deja la frase a medias: ${text}`);
        assert.equal(label, "Hablemos");
      }
      // Como antes: solo Completo lleva su prueba.
      assert.equal(trialNote(PLANS.find((p) => p.key === "esencial")!), null);
      assert.equal(trialNote(PLANS.find((p) => p.key === "completo")!), null, "sin prueba en la web por ahora");
    });
  }
});

test("NEXT_PUBLIC_SELF_SERVE=true: cada plan de suscripción lleva al registro del CRM y la medida a una conversación", () => {
  withSelfServe("true", () => {
    assert.equal(isSelfServe(), true);
    for (const plan of PLANS) {
      const { href, label } = planCta(plan);
      if (plan.appPlan) {
        assert.equal(href, `${CRM_APP_URL}/register?plan=${plan.appPlan}`, plan.key);
        assert.equal(label, "Crear mi cuenta", plan.key);
        continue;
      }
      // El plan a medida se conversa: el agente de allok solo arranca con una frase completa.
      assert.ok(href.startsWith("https://wa.me/"), `${plan.key} no va a WhatsApp: ${href}`);
      assert.equal(label, "Hablemos");
    }
    assert.equal(registerUrl(), `${CRM_APP_URL}/register`);
  });
});

test("encendido, ninguna tarjeta promete prueba (quitada de la web el 2026-10-05)", () => {
  withSelfServe("true", () => {
    for (const plan of PLANS) assert.equal(trialNote(plan), null, plan.key);
  });
});

test("lo que dice cada plan coincide con lo que el CRM cierra por plan, con el autoservicio o sin él", () => {
  const esencial = PLANS.find((p) => p.key === "esencial")!;
  const completo = PLANS.find((p) => p.key === "completo")!;
  // Esencial contesta solo fuera del horario del negocio; a cualquier hora exige Completo.
  assert.ok(esencial.features.some((f) => /fuera de tu horario/i.test(f)));
  assert.ok(!esencial.features.some((f) => /cualquier hora|todo el día|24 horas/i.test(f)));
  assert.ok(completo.features.some((f) => /todo el día/i.test(f)));
});

test("ninguna tarjeta de plan cobra por Payment Link: el pago pasa por el registro del CRM", () => {
  for (const value of [undefined, "true"]) {
    withSelfServe(value, () => {
      for (const plan of PLANS) assert.ok(!planCta(plan).href.includes("buy.stripe.com"), plan.key);
    });
  }
  for (const file of ["src/app/page.tsx", "src/app/rei/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.ok(!source.includes("buy.stripe.com") && !source.includes("ESENCIAL_LINK"), file);
  }
});

test("/rei sigue en una conversación por WhatsApp aunque el autoservicio esté encendido", () => {
  const source = readFileSync("src/app/rei/page.tsx", "utf8");
  // Ni el botón de la home ni el registro: a una inmobiliaria la atiende una persona.
  assert.ok(!/planCta|trialNote|registerUrl|CRM_APP_URL|isSelfServe/.test(source), "/rei no debe tocar el autoservicio");
  assert.ok(source.includes("para mi inmobiliaria"), "el mensaje de WhatsApp conserva el contexto inmobiliario");
  assert.ok(source.includes("Hablemos"));
});

test("el cierre de la home: encendido ofrece el registro y deja WhatsApp de segunda opción; apagado no cambia", () => {
  const talk = "https://wa.me/584220023684?text=hola";
  withSelfServe(undefined, () => {
    const off = closingOffer(talk);
    assert.equal(off.line, "Desde US$99 al mes. Nos cuentas tu negocio por WhatsApp y nosotros lo dejamos andando.");
    assert.deepEqual(off.primary, { href: talk, label: "Quiero mi agente" });
    assert.equal(off.secondary, null);
  });
  withSelfServe("true", () => {
    const on = closingOffer(talk);
    assert.ok(!/nos cuentas tu negocio por WhatsApp|lo dejamos andando/i.test(on.line), on.line);
    assert.ok(!/días|gratis|prueba/i.test(on.line), on.line);
    assert.deepEqual(on.primary, { href: `${CRM_APP_URL}/register`, label: "Crear mi cuenta" });
    assert.deepEqual(on.secondary, { href: talk, label: "Prefiero hablarlo por WhatsApp" });
  });
});

test("sin NEXT_PUBLIC_SELF_SERVE, portada y cabecera conservan el WhatsApp y el login de siempre", () => {
  withSelfServe(undefined, () => {
    const talk = "https://wa.me/1?text=hola";
    assert.deepEqual(heroCta(talk), { href: talk, label: "Quiero mi agente" });
    assert.deepEqual(headerCta(), { href: `${CRM_APP_URL}/login`, label: "Entrar" });
    const nav = [{ href: "#precios", label: "Precios" }];
    assert.deepEqual(headerNav(nav), nav);
  });
});

test("con NEXT_PUBLIC_SELF_SERVE=true, portada y cabecera llevan al registro y el login pasa a la navegación", () => {
  withSelfServe("true", () => {
    const talk = "https://wa.me/1?text=hola";
    assert.deepEqual(heroCta(talk), { href: `${CRM_APP_URL}/register`, label: "Crear mi cuenta" });
    assert.deepEqual(headerCta(), { href: `${CRM_APP_URL}/register`, label: "Crear mi cuenta" });
    const nav = headerNav([{ href: "#precios", label: "Precios" }]);
    assert.deepEqual(nav.at(-1), { href: `${CRM_APP_URL}/login`, label: "Entrar" });
  });
});
