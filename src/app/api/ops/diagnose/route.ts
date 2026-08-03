import { neon } from "@neondatabase/serverless";
import { getGraphVersion } from "@/lib/meta/server";
import { getGrowthAgentRuntime } from "@/lib/growth-agent-runtime";
import { authorizeOps } from "@/lib/ops-auth";
import { getMetaWebhookEventStats } from "@/lib/meta/webhook-events-db";
import { getWahaWebhookEventStats } from "@/lib/whatsapp-inbox-db";

export const dynamic = "force-dynamic";

type HealthStatus = "healthy" | "unhealthy" | "unknown";
type HealthCheck = { status: HealthStatus; detail: string };

const SERVER_ENV_KEYS = [
  "META_APP_ID", "META_APP_SECRET", "META_CONFIG_ID", "META_GRAPH_VERSION",
  "META_WEBHOOK_VERIFY_TOKEN", "META_WEBHOOK_CALLBACK_URL", "N8N_WEBHOOK_URL",
  "N8N_WEBHOOK_SECRET", "APP_URL", "DATABASE_URL", "GROWTH_AGENT_URL",
  "GROWTH_AGENT_RUNTIME", "HERMES_API_URL", "HERMES_API_KEY", "WAHA_URL",
  "WAHA_API_KEY", "TOKEN_ENCRYPTION_KEY",
];

export async function POST() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const env = Object.fromEntries(SERVER_ENV_KEYS.map((key) => [key, Boolean(process.env[key]?.trim())]));
  const database = await databaseHealth();
  const growthAgent = await growthAgentHealth();
  const n8n: HealthCheck = process.env.N8N_WEBHOOK_URL
    ? { status: "unknown", detail: "Configurado; sin endpoint pasivo de salud." }
    : { status: "unknown", detail: "No configurado." };
  const callbackUrl = await callbackHealth();
  const webhookEvents = await getMetaWebhookEventStats().catch(() => ({ unavailable: 1 }));
  const wahaWebhookEvents = await getWahaWebhookEventStats().catch(() => ({ unavailable: 1 }));

  return Response.json({
    env,
    database,
    growthAgent,
    n8n,
    callbackUrl,
    webhookEvents,
    wahaWebhookEvents,
    metaVersion: getGraphVersion(),
  });
}

async function databaseHealth(): Promise<HealthCheck> {
  if (!process.env.DATABASE_URL) return { status: "unknown", detail: "No configurada." };
  try {
    const startedAt = Date.now();
    await neon(process.env.DATABASE_URL)`SELECT 1`;
    return { status: "healthy", detail: `Conectada (${Date.now() - startedAt}ms).` };
  } catch {
    return { status: "unhealthy", detail: "No se pudo conectar." };
  }
}

async function growthAgentHealth(): Promise<HealthCheck> {
  const runtime = getGrowthAgentRuntime();
  const host = runtime === "hermes" ? process.env.HERMES_API_URL : process.env.GROWTH_AGENT_URL;
  if (!host) return { status: "unknown", detail: `${runtime} no configurado.` };
  if (runtime !== "hermes") {
    return { status: "unknown", detail: "Eve configurado; no expone un health check pasivo documentado." };
  }
  try {
    const response = await fetch(`${host.replace(/\/$/, "")}/v1/capabilities`, {
      headers: { Authorization: `Bearer ${process.env.HERMES_API_KEY ?? ""}` },
      signal: AbortSignal.timeout(4_000),
    });
    return response.ok
      ? { status: "healthy", detail: `Hermes respondió ${response.status}.` }
      : { status: "unhealthy", detail: `Hermes respondió ${response.status}.` };
  } catch {
    return { status: "unhealthy", detail: "Hermes no respondió." };
  }
}

async function callbackHealth(): Promise<HealthCheck> {
  const value = process.env.META_WEBHOOK_CALLBACK_URL;
  if (!value) return { status: "unknown", detail: "No configurado." };
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return { status: "unhealthy", detail: "Debe usar HTTPS público." };
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    return response.status < 500
      ? { status: "healthy", detail: `Accesible (${response.status}).` }
      : { status: "unhealthy", detail: `Respondió ${response.status}.` };
  } catch {
    return { status: "unhealthy", detail: "No accesible." };
  }
}
