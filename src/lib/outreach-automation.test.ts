import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  OUTREACH_SECRET_LABEL,
  demoJobAfterAttempt,
  outreachSecretCandidates,
  pickSendBatch,
  resolveOutreachSecret,
  resolveSendingSwitch,
  stepReadiness,
  unsubscribeToken,
  verifyUnsubscribeToken,
  type DemoJobState,
} from "./outreach";
import { renderOutreachEmail } from "./outreach-templates";

// ─── El secreto de los enlaces de baja ────────────────────────

test("opt-out secret: OUTREACH_SECRET first, then derived from OPS_SESSION_SECRET, then CRON_SECRET", () => {
  const derive = (base: string) => createHmac("sha256", base).update(OUTREACH_SECRET_LABEL).digest("base64url");
  assert.equal(resolveOutreachSecret({ OUTREACH_SECRET: "explicit-secret-0123456789", OPS_SESSION_SECRET: "ops" }), "explicit-secret-0123456789");
  assert.equal(resolveOutreachSecret({ OPS_SESSION_SECRET: "ops-secret", CRON_SECRET: "cron-secret" }), derive("ops-secret"));
  assert.equal(resolveOutreachSecret({ CRON_SECRET: "cron-secret" }), derive("cron-secret"));
  // Corto o el placeholder de .env.example no cuentan.
  assert.equal(resolveOutreachSecret({ OUTREACH_SECRET: "short", CRON_SECRET: "cron-secret" }), derive("cron-secret"));
  assert.equal(resolveOutreachSecret({ OUTREACH_SECRET: "REEMPLAZA_secreto_aleatorio_de_32_bytes", CRON_SECRET: "c" }), derive("c"));
  assert.throws(() => resolveOutreachSecret({}), /OUTREACH_SECRET/);
  assert.throws(() => resolveOutreachSecret({ OUTREACH_SECRET: "  ", OPS_SESSION_SECRET: "" }));
  // Derivado, nunca el secreto de las sesiones tal cual.
  assert.notEqual(resolveOutreachSecret({ OPS_SESSION_SECRET: "ops-secret" }), "ops-secret");
});

test("links signed with the derived secret still verify after OUTREACH_SECRET is added", () => {
  const before = { OPS_SESSION_SECRET: "ops-secret", CRON_SECRET: "cron-secret" };
  const token = unsubscribeToken("hola@clinica.mx", resolveOutreachSecret(before));
  const after = { ...before, OUTREACH_SECRET: "a-brand-new-secret-0123456789" };
  assert.equal(outreachSecretCandidates(after).length, 3);
  assert.equal(outreachSecretCandidates(after).map((s) => verifyUnsubscribeToken(token, s)).find(Boolean), "hola@clinica.mx");
});

// ─── El interruptor ───────────────────────────────────────────

test("the switch is the DB setting, off by default; OUTREACH_ENABLED=false forces it off", () => {
  assert.equal(resolveSendingSwitch({}, null).on, false);
  assert.equal(resolveSendingSwitch({}, undefined).on, false);
  assert.equal(resolveSendingSwitch({}, false).on, false);
  assert.equal(resolveSendingSwitch({}, true).on, true);
  assert.equal(resolveSendingSwitch({ OUTREACH_ENABLED: "false" }, true).on, false);
  assert.equal(resolveSendingSwitch({ OUTREACH_ENABLED: " FALSE " }, true).on, false);
  // Ninguna variable lo enciende sola.
  assert.equal(resolveSendingSwitch({ OUTREACH_ENABLED: "true" }, false).on, false);
  assert.equal(resolveSendingSwitch({ OUTREACH_ENABLED: "true" }, null).on, false);
  assert.match(resolveSendingSwitch({ OUTREACH_ENABLED: "false" }, true).reason, /OUTREACH_ENABLED=false/);
});

// ─── La demo antes del primer correo ──────────────────────────

const job = (status: DemoJobState["status"], attempts: number, slug: string | null = null): DemoJobState => ({ status, attempts, slug });

test("step 1 never goes out to a business with a website while its demo is pending", () => {
  const c = { step: 0, website: "https://clinica.mx/", demoSlug: null };
  assert.deepEqual(stepReadiness(c, job("pending", 0)), { ready: false, reason: "demo pendiente" });
  assert.deepEqual(stepReadiness(c, job("pending", 1)), { ready: false, reason: "demo pendiente" });
  // Dos intentos pero aún sin cerrar (puede estar armándose): sigue esperando.
  assert.equal(stepReadiness(c, job("pending", 2)).ready, false);
  // Sin trabajo todavía (el cron lo encola): espera.
  assert.equal(stepReadiness(c, null).ready, false);
  assert.deepEqual(stepReadiness(c, job("ready", 1, "clinica-cdmx")), { ready: true, demoSlug: "clinica-cdmx" });
  // Tras dos fallos: la variante sin demo.
  assert.deepEqual(stepReadiness(c, job("failed", 2)), { ready: true, demoSlug: null });
  // Sin web no hay demo que esperar; con demo ya ligada, sale con ella.
  assert.deepEqual(stepReadiness({ ...c, website: null }, null), { ready: true, demoSlug: null });
  assert.deepEqual(stepReadiness({ ...c, demoSlug: "ya-ligada" }, job("pending", 0)), { ready: true, demoSlug: "ya-ligada" });
  // Los pasos 2 y 3 no esperan: llevan lo que llevó el 1.
  assert.deepEqual(stepReadiness({ ...c, step: 1 }, job("pending", 1)), { ready: true, demoSlug: null });
});

test("a demo job fails after the second failed build", () => {
  assert.deepEqual(demoJobAfterAttempt(1, null), { status: "pending", attempts: 1, slug: null });
  assert.deepEqual(demoJobAfterAttempt(2, null), { status: "failed", attempts: 2, slug: null });
  assert.deepEqual(demoJobAfterAttempt(2, "x"), { status: "ready", attempts: 2, slug: "x" });
});

test("the batch skips pending demos and contacts outside their local hours, within budget", () => {
  // Martes 2026-10-06 16:00 UTC = 10:00 CDMX, 11:00 Bogotá.
  const tuesday = new Date("2026-10-06T16:00:00Z");
  const due = [
    { email: "a@uno.mx", country: "MX" as const, step: 0, website: "https://uno.mx/", demoSlug: null },
    { email: "b@dos.mx", country: "MX" as const, step: 0, website: "https://www.dos.mx/contacto", demoSlug: null },
    { email: "c@tres.co", country: "CO" as const, step: 0, website: "https://tres.co/", demoSlug: null },
    { email: "d@cuatro.mx", country: "MX" as const, step: 1, website: "https://cuatro.mx/", demoSlug: "cuatro" },
  ];
  const jobs = new Map<string, DemoJobState>([
    ["uno.mx", job("pending", 1)],
    ["dos.mx", job("ready", 1, "dos-cdmx")],
    ["tres.co", job("failed", 2)],
  ]);
  const r = pickSendBatch(due, jobs, tuesday, 10);
  assert.equal(r.waitingDemo, 1);
  assert.equal(r.outsideWindow, 0);
  assert.deepEqual(r.batch.map((c) => [c.email, c.demoSlug]), [["b@dos.mx", "dos-cdmx"], ["c@tres.co", null], ["d@cuatro.mx", "cuatro"]]);
  assert.equal(pickSendBatch(due, jobs, tuesday, 1).batch.length, 1);
  assert.equal(pickSendBatch(due, jobs, tuesday, 0).batch.length, 0);
  // Sábado: nada sale.
  const saturday = pickSendBatch(due, jobs, new Date("2026-10-10T16:00:00Z"), 10);
  assert.equal(saturday.batch.length, 0);
  assert.equal(saturday.outsideWindow, 3);
});

// ─── Ningún correo lleva a la portada ─────────────────────────

test("no outreach email links to the home page", () => {
  const sectors = ["clinica_estetica_dermatologia_dental (dental)", "academia_cursos (idiomas)", "Ferretería", ""];
  for (const sector of sectors) {
    for (const demoSlug of ["clinica-x-cdmx", null]) {
      for (const step of [1, 2, 3]) {
        const e = renderOutreachEmail({ email: "hola@clinica.mx", businessName: "Clínica X", sector, demoSlug, offer: "" }, step, { secret: "s".repeat(32) });
        const urls = [...(e.text.match(/https?:\/\/[^\s)»]+/g) ?? []), e.link];
        for (const raw of urls) {
          const u = new URL(raw);
          assert.equal(u.hostname, "allok.fun");
          assert.notEqual(u.pathname, "/", `home link in step ${step} (${sector || "sin sector"}, demo ${demoSlug}): ${raw}`);
        }
        if (!demoSlug) assert.match(e.link, /^https:\/\/allok\.fun\/(whatsapp-para\/[a-z-]+|agente-whatsapp)\?/);
      }
    }
  }
});
