import { auth } from "@clerk/nextjs/server";
import { createGrowthRun, failGrowthRun } from "@/lib/growth-db";

export async function POST() {
  if (!process.env.CLERK_SECRET_KEY) return Response.json({ error: "Clerk no configurado." }, { status: 503 });
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "No autorizado." }, { status: 401 });
  const host = process.env.GROWTH_AGENT_URL;
  const username = process.env.GROWTH_AGENT_USERNAME;
  const password = process.env.GROWTH_AGENT_PASSWORD;
  if (!host || !username || !password) {
    return Response.json({ error: "Configura GROWTH_AGENT_URL y sus credenciales privadas." }, { status: 503 });
  }

  const runId = await createGrowthRun();
  try {
    const response = await fetch(`${host.replace(/\/$/, "")}/eve/v1/session`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: `Run the daily acquisition workflow now. Persist all results under growth run ${runId}. Research at most 10 leads in Caracas, Venezuela. Do not send outreach.`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Growth agent returned ${response.status}`);
    return Response.json({ ok: true, runId }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown growth agent error";
    await failGrowthRun(runId, message);
    return Response.json({ error: "El Growth Agent no respondió.", runId }, { status: 502 });
  }
}

