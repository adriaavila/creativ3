import { defineAgent } from "eve";
import { gateway } from "ai";

// Vercel AI Gateway: plain "provider/model" strings, native fallbacks + OTel.
// Needs AI_GATEWAY_API_KEY (or Vercel OIDC in deploy). Replaced opencode Go,
// whose key 401s on billing.
export default defineAgent({
  model: gateway(process.env.GROWTH_MODEL ?? "anthropic/claude-sonnet-4-6"),
  // eve can't look up context-window metadata for gateway model ids; supply it.
  modelContextWindowTokens: 200_000,
  compaction: { thresholdPercent: 0.75 },
});
