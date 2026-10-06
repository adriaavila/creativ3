import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { leadsFromCsv } from "./demo-profile-build";
import {
  bounceGuardTripped,
  countryCode,
  emailProblem,
  inSendWindow,
  isFreemail,
  matchDemoSlug,
  nextSendAt,
  outreachLeadsFromCsv,
  readSendConfig,
  sameSite,
  unsubscribeToken,
  verifySvixSignature,
  verifyUnsubscribeToken,
} from "./outreach";
import { displayName, offerHook, outreachLink, renderOutreachEmail, sectorPageSlug } from "./outreach-templates";

const HEADER = `"empresa","vertical","ciudad","pais","web","email","whatsapp","instagram","oferta_1_linea","evidencia_whatsapp_url","score","fuente_url","fecha"`;
const row = (empresa: string, vertical: string, pais: string, web: string, email: string, fuente = web, oferta = "") =>
  [empresa, vertical, "Ciudad", pais, web, email, "", "", oferta, "", "9", fuente, "2026-10-06"].map((v) => `"${v.replace(/"/g, '""')}"`).join(",");

// ─── Correos y CSV ────────────────────────────────────────────

test("freemail and invalid addresses are recognised", () => {
  assert.equal(isFreemail("Foo@Gmail.com"), true);
  assert.equal(isFreemail("contacto@clinica.com.mx"), false);
  assert.equal(emailProblem("info@clinica.mx"), null);
  assert.equal(emailProblem("no-reply@clinica.mx"), "casilla que nadie lee");
  assert.equal(emailProblem("postmaster@clinica.mx"), "casilla que nadie lee");
  assert.equal(emailProblem("logo@2x.png"), "correo inválido");
  assert.equal(emailProblem("user@example.com"), "dominio de plantilla");
  assert.equal(emailProblem("administración@centrosthetic.com.co"), "correo inválido");
  assert.equal(emailProblem("a..b@clinica.mx"), "correo inválido");
  assert.equal(emailProblem("sin-arroba"), "correo inválido");
});

test("sameSite ignores www and accepts subdomains", () => {
  assert.equal(sameSite("hola@clinica.mx", "https://www.clinica.mx/contacto"), true);
  assert.equal(sameSite("hola@mx.clinica.com", "https://clinica.com"), true);
  assert.equal(sameSite("hola@otra.mx", "https://clinica.mx"), false);
});

test("countryCode reads the column, then the website TLD", () => {
  assert.equal(countryCode("México"), "MX");
  assert.equal(countryCode("Colombia"), "CO");
  assert.equal(countryCode("CO"), "CO");
  assert.equal(countryCode("", "https://clinica.com.mx"), "MX");
  assert.equal(countryCode("", "https://clinica.com.co"), "CO");
  assert.equal(countryCode("Perú", "https://clinica.com.co"), null);
  assert.equal(countryCode("", "https://clinica.com"), null);
});

test("CSV import maps the leads header and keeps only website emails", () => {
  const csv = [
    HEADER,
    row("Clínica VËA", "clinica_estetica_dermatologia_dental (estética)", "México", "https://veaclinic.com.mx/", "Contacto@VeaClinic.com.mx", undefined, "Spa médico y estética avanzada (Del Valle): tratamientos desde $1,900 MXN"),
    row("Baila Bonito", "academia_cursos (baile)", "México", "http://www.bailabonito.mx/", "bailabonitoadmin@gmail.com"),
    row("Sin correo", "academia_cursos (idiomas)", "Colombia", "https://sincorreo.co/", ""),
    row("Fuente ajena", "academia_cursos (idiomas)", "Colombia", "https://academia.co/", "info@academia.co", "https://directorio.com/academia"),
    // Correo con otro dominio, pero la fuente dice que está en su web: vale.
    row("Inglés YA", "academia_cursos (idiomas)", "México", "http://inglesya.mx/", "contacto@traduccionesya.mx"),
    row("Repetida", "academia_cursos (idiomas)", "México", "https://veaclinic.com.mx/", "contacto@veaclinic.com.mx"),
    row("Suprimida", "academia_cursos (música)", "Colombia", "https://musica.co/", "hola@musica.co"),
    row("Varios", "academia_cursos (música)", "Colombia", "https://varios.co/", "no-reply@varios.co; hola@varios.co"),
    row("Peruana", "academia_cursos (música)", "Perú", "https://peru.pe/", "hola@peru.pe"),
  ].join("\n");
  const { leads, skipped, columns } = outreachLeadsFromCsv(csv, { suppressed: new Set(["hola@musica.co"]) });
  assert.equal(columns.name, 0);
  assert.equal(columns.sector, 1);
  assert.equal(columns.emailSource, 11);
  assert.equal(columns.offer, 8);
  assert.deepEqual(
    leads.map((l) => l.email),
    ["contacto@veaclinic.com.mx", "contacto@traduccionesya.mx", "hola@varios.co"],
  );
  assert.equal(leads[0].country, "MX");
  assert.equal(leads[0].offer.startsWith("Spa médico"), true);
  const reasons = Object.fromEntries(skipped.map((s) => [s.name, s.reason]));
  assert.equal(reasons["Baila Bonito"], "webmail gratuito");
  assert.equal(reasons["Sin correo"], "sin correo");
  assert.equal(reasons["Fuente ajena"], "la fuente del correo no es la web del negocio");
  assert.equal(reasons["Repetida"], "repetido");
  assert.equal(reasons["Suprimida"], "en la lista de supresión");
  assert.equal(reasons["Peruana"], "país fuera de MX/CO o desconocido");

  const withFree = outreachLeadsFromCsv(csv, { allowFreemail: true });
  assert.ok(withFree.leads.some((l) => l.email === "bailabonitoadmin@gmail.com"));
});

test("without a source column the email domain must match the website", () => {
  const csv = ["name,website,email,country", "A,https://a.mx,hola@a.mx,MX", "B,https://b.mx,hola@otra.mx,MX", "C,https://c.mx,c@gmail.com,MX"].join("\n");
  const plain = outreachLeadsFromCsv(csv);
  assert.deepEqual(plain.leads.map((l) => l.email), ["hola@a.mx"]);
  assert.equal(plain.skipped.find((s) => s.name === "B")?.reason, "el dominio del correo no es el de la web");
  assert.deepEqual(outreachLeadsFromCsv(csv, { allowFreemail: true }).leads.map((l) => l.email), ["hola@a.mx", "c@gmail.com"]);
});

test("demo-build reads the same leads header", () => {
  const { leads, columns } = leadsFromCsv([HEADER, row("Baila Bonito", "academia_cursos (baile)", "México", "http://www.bailabonito.mx/", "")].join("\n"));
  assert.equal(columns.name, 0);
  assert.equal(columns.website, 4);
  assert.equal(columns.city, 2);
  assert.equal(columns.country, 3);
  assert.equal(columns.sector, 1);
  assert.equal(leads[0].website, "http://www.bailabonito.mx/");
});

test("matchDemoSlug matches by website host, then by name", () => {
  const demos = [
    { slug: "clinica-vea-cdmx", businessName: "Clínica VËA", website: "https://www.veaclinic.com.mx" },
    { slug: "baila-bonito", businessName: "Baila Bonito", website: null },
  ];
  assert.equal(matchDemoSlug({ businessName: "Otra", website: "https://veaclinic.com.mx/contacto" }, demos), "clinica-vea-cdmx");
  assert.equal(matchDemoSlug({ businessName: "BAILA BONITO", website: "https://x.mx" }, demos), "baila-bonito");
  assert.equal(matchDemoSlug({ businessName: "Nadie", website: "https://nadie.mx" }, demos), null);
});

// ─── Tiempo ───────────────────────────────────────────────────

test("send window is Mon–Fri 9:00–16:59 local", () => {
  // 2026-10-05 is a Monday. CDMX is UTC-6, Bogotá UTC-5.
  assert.equal(inSendWindow(new Date("2026-10-05T15:00:00Z"), "MX"), true); // 9:00 CDMX
  assert.equal(inSendWindow(new Date("2026-10-05T14:59:00Z"), "MX"), false); // 8:59 CDMX
  assert.equal(inSendWindow(new Date("2026-10-05T14:00:00Z"), "CO"), true); // 9:00 Bogotá
  assert.equal(inSendWindow(new Date("2026-10-05T22:59:00Z"), "MX"), true); // 16:59 CDMX
  assert.equal(inSendWindow(new Date("2026-10-05T23:00:00Z"), "MX"), false); // 17:00 CDMX
  assert.equal(inSendWindow(new Date("2026-10-05T22:00:00Z"), "CO"), false); // 17:00 Bogotá
  assert.equal(inSendWindow(new Date("2026-10-10T16:00:00Z"), "MX"), false); // Saturday
  assert.equal(inSendWindow(new Date("2026-10-09T20:00:00Z"), "CO"), true); // Friday 15:00
});

test("sequence runs day 0, 3 and 8", () => {
  const t0 = new Date("2026-10-05T16:00:00Z");
  const t1 = nextSendAt(1, t0)!;
  assert.equal(t1.toISOString(), "2026-10-08T16:00:00.000Z");
  assert.equal(nextSendAt(2, t1)!.toISOString(), "2026-10-13T16:00:00.000Z");
  assert.equal(nextSendAt(3, t1), null);
});

test("bounce guard trips over 3 %", () => {
  assert.equal(bounceGuardTripped(100, 3), false);
  assert.equal(bounceGuardTripped(100, 4), true);
  assert.equal(bounceGuardTripped(0, 0), false);
  assert.equal(bounceGuardTripped(10, 1), true);
});

// ─── Tokens y firmas ──────────────────────────────────────────

test("unsubscribe token round-trips and rejects tampering", () => {
  const secret = "s3cret-s3cret-s3cret";
  const token = unsubscribeToken(" Hola@Clinica.MX ", secret);
  assert.equal(verifyUnsubscribeToken(token, secret), "hola@clinica.mx");
  assert.equal(verifyUnsubscribeToken(token, "other-secret-other"), null);
  const [, mac] = token.split(".");
  const forged = `${Buffer.from("otro@clinica.mx").toString("base64url")}.${mac}`;
  assert.equal(verifyUnsubscribeToken(forged, secret), null);
  assert.equal(verifyUnsubscribeToken("garbage", secret), null);
  assert.equal(verifyUnsubscribeToken(null, secret), null);
  assert.equal(verifyUnsubscribeToken(`${token}x`, secret), null);
});

test("svix signature verification", () => {
  const key = Buffer.from("resend-webhook-test-key-32-bytes!");
  const secret = `whsec_${key.toString("base64")}`;
  const body = JSON.stringify({ type: "email.bounced", data: { to: ["a@b.mx"] } });
  const nowMs = 1_790_000_000_000;
  const ts = String(Math.floor(nowMs / 1000));
  const sig = createHmac("sha256", key).update(`msg_1.${ts}.${body}`).digest("base64");
  const base = { rawBody: body, id: "msg_1", timestamp: ts, secret, nowMs };
  assert.equal(verifySvixSignature({ ...base, signature: `v1,${sig}` }), true);
  assert.equal(verifySvixSignature({ ...base, signature: `v1,bogus v1,${sig}` }), true);
  assert.equal(verifySvixSignature({ ...base, signature: `v1,${sig}`, rawBody: `${body} ` }), false);
  assert.equal(verifySvixSignature({ ...base, signature: `v1,${sig}`, nowMs: nowMs + 10 * 60_000 }), false);
  assert.equal(verifySvixSignature({ ...base, signature: `v2,${sig}` }), false);
  assert.equal(verifySvixSignature({ ...base, signature: null }), false);
});

test("send config needs the kill switch, the key and a hola.allok.fun sender", () => {
  const good = {
    OUTREACH_ENABLED: "true",
    RESEND_API_KEY: "re_x",
    OUTREACH_FROM: "Adrián de allok <adrian@hola.allok.fun>",
    OUTREACH_SECRET: "0123456789abcdef0123",
  };
  const ok = readSendConfig(good);
  assert.deepEqual(ok.problems, []);
  assert.equal(ok.config?.dailyCap, 20);
  assert.equal(ok.config?.replyTo, "hi@allok.fun");
  assert.equal(readSendConfig({ ...good, OUTREACH_ENABLED: "1" }).config, null);
  assert.equal(readSendConfig({ ...good, RESEND_API_KEY: "" }).config, null);
  assert.equal(readSendConfig({ ...good, OUTREACH_FROM: "adrian@allok.fun" }).config, null);
  assert.equal(readSendConfig({ ...good, OUTREACH_DAILY_CAP: "40" }).config?.dailyCap, 40);
});

// ─── Plantillas ───────────────────────────────────────────────

const SECRET = "template-test-secret-123";
const base = { email: "contacto@veaclinic.com.mx", businessName: "Clínica VËA", sector: "clinica_estetica_dermatologia_dental (estética)", offer: "" };

test("sector pages follow the CSV vertical and its subtype", () => {
  assert.equal(sectorPageSlug("clinica_estetica_dermatologia_dental (dental)"), "clinicas-dentales");
  assert.equal(sectorPageSlug("clinica_estetica_dermatologia_dental (estética)"), "clinicas-esteticas");
  assert.equal(sectorPageSlug("clinica_estetica_dermatologia_dental (dermatología)"), "clinicas-esteticas");
  assert.equal(sectorPageSlug("academia_cursos (belleza)"), "academias");
  assert.equal(sectorPageSlug("academia_cursos (preuniversitario)"), "academias");
  assert.equal(sectorPageSlug("Clínica dental"), "clinicas-dentales");
  assert.equal(sectorPageSlug("Ferretería"), null);
});

test("display names drop legal suffixes and shouting", () => {
  assert.equal(displayName("PROCLINIC ESPECIALIDADES DENTALES"), "Proclinic Especialidades Dentales");
  assert.equal(displayName("Clínica Sonrisa, S.A. de C.V."), "Clínica Sonrisa");
  assert.equal(displayName("Ingenius S.A.S."), "Ingenius");
  assert.equal(displayName("ELEGANZ SPA"), "Eleganz Spa");
  assert.equal(displayName("Dental Artex"), "Dental Artex");
});

test("offer hook keeps the first clause and drops what reads badly", () => {
  assert.equal(offerHook("Clases de francés con profesores nativos, presenciales y en línea, todos los niveles; horarios"), "clases de francés con profesores nativos, presenciales y en línea, todos los niveles");
  assert.equal(offerHook("Musicala: escuela de música, danza, artes plásticas"), "escuela de música, danza, artes plásticas");
  assert.equal(offerHook("Corto"), null);
  assert.equal(offerHook(""), null);
  assert.equal(offerHook("Ver https://x.mx para más información de cursos"), null);
});

test("links go to the demo, the sector page or the home, always on allok.fun", () => {
  assert.equal(
    outreachLink({ demoSlug: "clinica-vea-cdmx", sector: "" }, 1),
    "https://allok.fun/demo/clinica-vea-cdmx?utm_source=cold_email&utm_medium=email&utm_campaign=q4_demo&utm_content=step1",
  );
  assert.match(outreachLink({ demoSlug: null, sector: base.sector }, 2), /^https:\/\/allok\.fun\/whatsapp-para\/clinicas-esteticas\?.*utm_content=step2$/);
  assert.match(outreachLink({ demoSlug: null, sector: "Ferretería" }, 3), /^https:\/\/allok\.fun\/\?utm_source=cold_email/);
});

test("every step renders a short plain-text email with opt-out and only allok.fun links", () => {
  for (const demoSlug of ["clinica-vea-cdmx", null]) {
    for (const step of [1, 2, 3]) {
      const e = renderOutreachEmail({ ...base, demoSlug }, step, { secret: SECRET });
      const urls = e.text.match(/https?:\/\/[^\s)»]+/g) ?? [];
      assert.ok(urls.length >= 2, "content link + unsubscribe link");
      for (const u of urls) assert.match(u, /^https:\/\/allok\.fun\//, `link outside allok.fun: ${u}`);
      assert.doesNotMatch(e.text, /<[a-z][^>]*>/i, "no HTML");
      assert.doesNotMatch(e.text, /\b(tú|tienes|quieres|puedes|tu negocio)\b/i, "usted, not tú");
      assert.match(e.text, /Adrián, allok/);
      assert.match(e.text, /darse de baja aquí: https:\/\/allok\.fun\/api\/outreach\/baja\?t=/);
      assert.match(e.text, /allok · hi@allok\.fun/);
      assert.ok(e.text.split(/\s+/).length < 170, `step ${step} is short`);
      assert.match(e.headers["List-Unsubscribe"], /^<https:\/\/allok\.fun\/api\/outreach\/baja\?t=[^>]+>, <mailto:hi@allok\.fun\?subject=baja>$/);
      assert.equal(e.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
      assert.ok(e.subject.includes("Clínica VËA"));
      const token = /baja\?t=([^\s>]+)/.exec(e.text)?.[1];
      assert.equal(verifyUnsubscribeToken(token, SECRET), base.email);
    }
  }
  const demo = renderOutreachEmail({ ...base, demoSlug: "clinica-vea-cdmx" }, 1, { secret: SECRET });
  assert.equal(demo.subject, "Le enseñé a un agente a contestar como Clínica VËA");
  assert.match(demo.text, /utm_content=step1/);
  assert.match(demo.text, /sus pacientes/);
  const noDemo = renderOutreachEmail({ ...base, demoSlug: null, offer: "Spa médico y estética avanzada (Del Valle): tratamientos médico-estéticos desde $1,900 MXN" }, 1, { secret: SECRET });
  assert.match(noDemo.text, /whatsapp-para\/clinicas-esteticas/);
  assert.match(noDemo.text, /Vi en su web lo que ofrecen \(«tratamientos médico-estéticos desde \$1,900 MXN»\)/);
  assert.match(renderOutreachEmail({ ...base, demoSlug: null }, 3, { secret: SECRET }).text, /último correo/);
  assert.throws(() => renderOutreachEmail({ ...base, demoSlug: null }, 4, { secret: SECRET }));
});
