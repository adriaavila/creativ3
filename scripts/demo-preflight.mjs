import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import postgres from "postgres";

if (existsSync(".env.local")) loadEnvFile(".env.local");

const results = [];

await check("CRM", async () => {
  const sql = postgres(required("DATABASE_URL"), { max: 1, prepare: false });
  const [state] = await sql`
    SELECT
      to_regclass('public.wa_conversations') IS NOT NULL AS has_conversations,
      to_regclass('public.wa_messages') IS NOT NULL AS has_messages,
      to_regclass('public.waha_connections') IS NOT NULL AS has_connections,
      (SELECT count(*)::int FROM leads) AS leads
  `;
  await sql.end();
  if (!state.has_conversations || !state.has_messages || !state.has_connections) {
    throw new Error("faltan migraciones de WhatsApp");
  }
  if (Number(state.leads) === 0) throw new Error("el pipeline no tiene oportunidades");
  return `${state.leads} oportunidades y tablas de WhatsApp listas`;
});

let connectedSessions = [];
await check("WhatsApp", async () => {
  const response = await fetch(`${required("WAHA_URL").replace(/\/+$/, "")}/api/sessions?all=true`, {
    headers: { "X-Api-Key": required("WAHA_API_KEY") },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`WAHA respondió ${response.status}`);
  const sessions = await response.json();
  connectedSessions = Array.isArray(sessions)
    ? sessions.filter((session) => session?.status === "WORKING")
    : [];
  if (connectedSessions.length === 0) throw new Error("no hay una sesión conectada");
  return `${connectedSessions.length} sesión${connectedSessions.length === 1 ? "" : "es"} conectada${connectedSessions.length === 1 ? "" : "s"}`;
});

await check("Cerrojo de prueba", () => {
  if (process.env.WHATSAPP_OUTBOUND_MODE !== "pilot") {
    throw new Error("WHATSAPP_OUTBOUND_MODE debe ser pilot");
  }
  const allowed = (process.env.WHATSAPP_PILOT_ALLOWED_WA_IDS ?? "")
    .split(",")
    .map((value) => value.replace(/\D/g, ""))
    .filter(Boolean);
  if (allowed.length === 0) throw new Error("falta el número permitido para la prueba");
  return `${allowed.length} destinatario${allowed.length === 1 ? "" : "s"} autorizado${allowed.length === 1 ? "" : "s"}`;
});

await check("Webhook", async () => {
  const body = JSON.stringify({
    event: "session.status",
    session: connectedSessions[0]?.name ?? process.env.WAHA_SESSION ?? "demo",
    payload: { status: "WORKING" },
  });
  const response = await fetch(`${required("APP_URL").replace(/\/+$/, "")}/api/waha/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Hmac": createHmac("sha512", required("WAHA_WEBHOOK_HMAC_KEY")).update(body).digest("hex"),
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`producción respondió ${response.status}`);
  return `producción aceptó el evento (${response.status})`;
});

for (const result of results) {
  console.log(`${result.ok ? "✓" : "✗"} ${result.label}: ${result.detail}`);
}

const ready = results.every((result) => result.ok);
console.log(`\n${ready ? "GO — demo en vivo lista" : "NO-GO — usa la grabación y corrige los puntos marcados"}`);
process.exitCode = ready ? 0 : 1;

async function check(label, run) {
  try {
    results.push({ label, ok: true, detail: await run() });
  } catch (error) {
    results.push({ label, ok: false, detail: friendlyError(error) });
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`falta ${name}`);
  return value;
}

function friendlyError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("compute time quota")) return "Neon excedió la cuota de cómputo";
  return message.replace(/\s+/g, " ").slice(0, 180);
}
