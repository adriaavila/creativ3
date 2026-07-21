type DispatchInput = {
  message: string;
  correlationId: string;
};

export type GrowthAgentRuntime = "eve" | "hermes";

export function getGrowthAgentRuntime(): GrowthAgentRuntime {
  return process.env.GROWTH_AGENT_RUNTIME === "hermes" ? "hermes" : "eve";
}

export async function dispatchGrowthAgent({ message, correlationId }: DispatchInput) {
  const runtime = getGrowthAgentRuntime();

  if (runtime === "hermes") {
    const host = process.env.HERMES_API_URL?.replace(/\/+$/, "");
    const key = process.env.HERMES_API_KEY;
    if (!host || !key) throw new Error("Hermes runtime is not configured");

    const response = await fetch(`${host}/v1/runs`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
        "idempotency-key": correlationId,
        "x-hermes-session-key": "creativv:growth:ops",
      },
      body: JSON.stringify({ input: message, session_id: correlationId }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Hermes returned ${response.status}`);
    return { runtime, accepted: true as const };
  }

  const host = process.env.GROWTH_AGENT_URL?.replace(/\/+$/, "");
  const username = process.env.GROWTH_AGENT_USERNAME;
  const password = process.env.GROWTH_AGENT_PASSWORD;
  if (!host || !username || !password) throw new Error("Eve runtime is not configured");

  const response = await fetch(`${host}/eve/v1/session`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Eve returned ${response.status}`);
  return { runtime, accepted: true as const };
}
