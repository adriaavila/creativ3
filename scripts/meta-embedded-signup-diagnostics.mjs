import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

loadLocalEnv();

const SERVER_ENV_CHECKS = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_CONFIG_ID",
  "META_GRAPH_VERSION",
  "META_WEBHOOK_VERIFY_TOKEN",
  "META_WEBHOOK_CALLBACK_URL",
  "N8N_WEBHOOK_URL",
  "N8N_WEBHOOK_SECRET",
  "APP_URL",
];

const PUBLIC_ENV_CHECKS = [
  "NEXT_PUBLIC_META_APP_ID",
  "NEXT_PUBLIC_META_CONFIG_ID",
  "NEXT_PUBLIC_META_GRAPH_VERSION",
  "NEXT_PUBLIC_APP_URL",
];

const OPTIONAL_ENV_CHECKS = [
  "DATABASE_URL",
  "N8N_WHATSAPP_EVENTS_WEBHOOK_URL",
];

const missingServer = SERVER_ENV_CHECKS.filter((key) => !process.env[key]?.trim());
const missingPublic = PUBLIC_ENV_CHECKS.filter((key) => !process.env[key]?.trim());
const missingOptional = OPTIONAL_ENV_CHECKS.filter((key) => !process.env[key]?.trim());
const shouldTestN8n = process.argv.includes("--test-n8n");

console.log("Meta Embedded Signup diagnostics");
console.log(`Missing server env vars: ${missingServer.length ? missingServer.join(", ") : "none"}`);
console.log(`Missing public env vars: ${missingPublic.length ? missingPublic.join(", ") : "none"}`);
console.log(`Missing optional env vars: ${missingOptional.length ? missingOptional.join(", ") : "none"}`);
console.log(`Graph API version configured: ${process.env.META_GRAPH_VERSION ? "yes" : "no"}`);
console.log(`Meta App Secret server-side only: ${process.env.META_APP_SECRET ? "yes" : "missing"}`);
console.log("Runtime token permissions: whatsapp_business_management, whatsapp_business_messaging");

await checkMetaAppCredentials();
await checkWebhookUrl();
await checkN8n();

console.log("Dashboard checks still required manually: Meta allowed domains, Valid OAuth redirect URIs, Business Login configuration ID, app publication, App Review, and WhatsApp webhook field subscriptions.");

async function checkMetaAppCredentials() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    console.log("Meta App ID/Secret pair valid: not checked (credentials missing)");
    return;
  }

  const url = new URL(`https://graph.facebook.com/${normalizedGraphVersion()}/app`);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);

  if (!response) {
    console.log("Meta App ID/Secret pair valid: no (Graph API unreachable)");
    return;
  }

  const body = await response.json().catch(() => ({}));
  const idMatches = response.ok && body?.id === appId;
  const appName = response.ok && typeof body?.name === "string" ? ` (${body.name})` : "";
  console.log(
    `Meta App ID/Secret pair valid: ${idMatches ? "yes" : "no"}${appName}${formatStatus(response.status)}`,
  );
}

async function checkWebhookUrl() {
  const url = process.env.META_WEBHOOK_CALLBACK_URL;
  if (!url) {
    console.log("Webhook URL reachable: not checked (META_WEBHOOK_CALLBACK_URL missing)");
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    console.log("Webhook URL reachable: no (META_WEBHOOK_CALLBACK_URL is not a valid URL)");
    return;
  }

  if (parsed.protocol !== "https:") {
    console.log("Webhook URL reachable: no (callback URL must be public HTTPS)");
    return;
  }

  const result = await fetchWithFallback(url);
  console.log(`Webhook URL reachable: ${result.reachable ? "yes" : "no"}${formatStatus(result.status)}`);
}

async function checkN8n() {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    console.log("n8n workflow activation: not checked (N8N_WEBHOOK_URL missing)");
    console.log("Test payload reached n8n: no");
    return;
  }

  if (!shouldTestN8n) {
    console.log("n8n workflow activation: configured, not pinged (rerun with --test-n8n)");
    console.log("Test payload reached n8n: not sent");
    return;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: n8nHeaders(),
    body: JSON.stringify({
      event: "meta_embedded_signup_diagnostic",
      diagnostic: true,
      received_at: new Date().toISOString(),
    }),
  }).catch((error) => ({
    ok: false,
    status: undefined,
    error,
  }));

  if ("error" in response) {
    console.log("n8n workflow activation: request failed");
    console.log("Test payload reached n8n: no");
    return;
  }

  console.log(`n8n workflow activation: ${response.ok ? "responded ok" : "responded with error"}${formatStatus(response.status)}`);
  console.log(`Test payload reached n8n: ${response.ok ? "yes" : "unknown"}`);
}

async function fetchWithFallback(url) {
  const head = await fetch(url, {
    method: "HEAD",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);

  if (head?.ok || (head && head.status < 500 && head.status !== 405)) {
    return { reachable: true, status: head.status };
  }

  const get = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);

  if (!get) return { reachable: false };
  return { reachable: get.status < 500, status: get.status };
}

function n8nHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  if (process.env.N8N_WEBHOOK_SECRET) {
    headers["x-servicioscreativos-secret"] = process.env.N8N_WEBHOOK_SECRET;
  }

  return headers;
}

function formatStatus(status) {
  return typeof status === "number" ? ` (status ${status})` : "";
}

function normalizedGraphVersion() {
  const value = process.env.META_GRAPH_VERSION?.trim() || "v25.0";
  return value.startsWith("v") ? value : `v${value}`;
}

function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    const path = join(process.cwd(), filename);
    if (!existsSync(path)) continue;

    for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;

      const [, key, rawValue] = match;
      if (process.env[key]) continue;

      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}
