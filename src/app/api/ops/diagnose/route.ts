import { auth } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getGraphVersion } from "@/lib/meta/server";

export const dynamic = "force-dynamic";

const SERVER_ENV_KEYS = [
  "META_APP_ID",
  "META_APP_SECRET",
  "META_CONFIG_ID",
  "META_GRAPH_VERSION",
  "META_WEBHOOK_VERIFY_TOKEN",
  "META_WEBHOOK_CALLBACK_URL",
  "N8N_WEBHOOK_URL",
  "APP_URL",
  "DATABASE_URL",
  "GROWTH_AGENT_URL",
  "GROWTH_AGENT_USERNAME",
  "GROWTH_AGENT_PASSWORD",
];

const PUBLIC_ENV_KEYS = [
  "NEXT_PUBLIC_META_APP_ID",
  "NEXT_PUBLIC_META_CONFIG_ID",
  "NEXT_PUBLIC_META_GRAPH_VERSION",
  "NEXT_PUBLIC_APP_URL",
];

export async function POST() {
  if (!process.env.CLERK_SECRET_KEY) {
    return Response.json({ error: "Clerk not configured." }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 1. Gather Env Status
  const env: Record<string, boolean> = {};
  for (const key of [...SERVER_ENV_KEYS, ...PUBLIC_ENV_KEYS]) {
    env[key] = Boolean(process.env[key]?.trim());
  }

  // 2. Diagnose Database
  let databaseStatus = { ok: false, error: "Not configured" };
  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      const start = Date.now();
      await sql`SELECT 1`;
      databaseStatus = { ok: true, error: `Connected (${Date.now() - start}ms)` };
    } catch (e) {
      databaseStatus = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // 3. Diagnose Growth Agent
  let growthAgentStatus = { ok: false, error: "Not configured", statusText: "" };
  if (process.env.GROWTH_AGENT_URL) {
    try {
      const start = Date.now();
      // Test endpoint by doing a fast fetch
      const res = await fetch(`${process.env.GROWTH_AGENT_URL.replace(/\/$/, "")}/eve/v1/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.GROWTH_AGENT_USERNAME || ""}:${process.env.GROWTH_AGENT_PASSWORD || ""}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({ message: "PING_TEST_DIAGNOSTIC_DISEABLE_OUTREACH" }),
        signal: AbortSignal.timeout(4000),
      }).catch((err) => err);

      if (res instanceof Response) {
        // We expect either a successful 202/200 or some response showing it responded.
        // Even a bad request (like 400 or 401 if credentials mismatch) proves the server is reachable and active.
        if (res.ok || res.status < 500) {
          growthAgentStatus = {
            ok: true,
            error: "",
            statusText: `Reachable (status ${res.status}, ${Date.now() - start}ms)`,
          };
        } else {
          growthAgentStatus = {
            ok: false,
            error: `Server responded with error status ${res.status}`,
            statusText: `Error status ${res.status}`,
          };
        }
      } else {
        throw res; // Re-throw network error
      }
    } catch (e) {
      growthAgentStatus = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        statusText: "Connection failed",
      };
    }
  }

  // 4. Diagnose n8n Webhook
  let n8nStatus = { ok: false, error: "Not configured", statusText: "" };
  if (process.env.N8N_WEBHOOK_URL) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.N8N_WEBHOOK_SECRET) {
        headers["x-servicioscreativos-secret"] = process.env.N8N_WEBHOOK_SECRET;
      }

      const start = Date.now();
      const res = await fetch(process.env.N8N_WEBHOOK_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event: "meta_embedded_signup_diagnostic",
          diagnostic: true,
          received_at: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        n8nStatus = { ok: true, error: "", statusText: `Responded OK (${Date.now() - start}ms)` };
      } else {
        n8nStatus = {
          ok: false,
          error: `n8n returned status ${res.status}`,
          statusText: `Status ${res.status}`,
        };
      }
    } catch (e) {
      n8nStatus = { ok: false, error: e instanceof Error ? e.message : String(e), statusText: "Offline" };
    }
  }

  // 5. Check Meta Webhook Callback URL
  let callbackUrlStatus = { ok: false, error: "Not configured", statusText: "" };
  if (process.env.META_WEBHOOK_CALLBACK_URL) {
    try {
      const url = process.env.META_WEBHOOK_CALLBACK_URL;
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") {
        callbackUrlStatus = { ok: false, error: "Callback URL must be public HTTPS", statusText: "Insecure" };
      } else {
        const start = Date.now();
        const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(5000) }).catch(() => null);
        if (res) {
          callbackUrlStatus = {
            ok: res.status < 500,
            error: res.status >= 500 ? `Callback returned status ${res.status}` : "",
            statusText: `Reachable (status ${res.status}, ${Date.now() - start}ms)`,
          };
        } else {
          callbackUrlStatus = { ok: false, error: "Could not fetch callback URL", statusText: "Offline" };
        }
      }
    } catch (e) {
      callbackUrlStatus = { ok: false, error: e instanceof Error ? e.message : String(e), statusText: "Invalid URL" };
    }
  }

  return Response.json({
    env,
    database: databaseStatus,
    growthAgent: growthAgentStatus,
    n8n: n8nStatus,
    callbackUrl: callbackUrlStatus,
    metaVersion: getGraphVersion(),
  });
}
