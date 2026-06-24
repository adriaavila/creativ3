import { createGrowthRun, failGrowthRun } from "@/lib/growth-db";

export async function POST() {
  // ponytail: auth gate removed for now — re-add Clerk when locking down.
  const host = process.env.GROWTH_AGENT_URL;
  if (!host) {
    return Response.json({ error: "Configura GROWTH_AGENT_URL." }, { status: 503 });
  }
  const username = process.env.GROWTH_AGENT_USERNAME;
  const password = process.env.GROWTH_AGENT_PASSWORD;

  const runId = await createGrowthRun();
  try {
    const response = await fetch(`${host.replace(/\/$/, "")}/eve/v1/session`, {
      method: "POST",
      headers: {
        // agent runs without auth now; send Basic only if creds are configured
        ...(username && password
          ? { authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }
          : {}),
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

