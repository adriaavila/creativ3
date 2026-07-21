import { createGrowthRun, failGrowthRun } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";
import { dispatchGrowthAgent } from "@/lib/growth-agent-runtime";

export async function POST() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  const runId = await createGrowthRun();
  try {
    await dispatchGrowthAgent({
      correlationId: `growth-run-${runId}`,
      message: `Run the daily acquisition workflow now. Persist all results under growth run ${runId}. Use the active 14-day campaign and do not mix intents, verticals, or offers. Research at most 10 leads in Caracas, Venezuela. Do not send outreach.`,
    });
    return Response.json({ ok: true, runId }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown growth agent error";
    await failGrowthRun(runId, message);
    return Response.json({ error: "El Growth Agent no respondió.", runId }, { status: 502 });
  }
}
