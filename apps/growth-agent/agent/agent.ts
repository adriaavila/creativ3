import { defineAgent } from "eve";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// opencode Go subscription: OpenAI-compatible, Bearer auth, bare model ids.
// NOTE the /go/ path — that's the subscription endpoint; /zen/v1 is pay-as-you-go
// and returns CreditsError. Inlined (not a shared lib/) because eve only compiles
// relative imports reached from tools, not the model module referenced by an agent.
const opencode = createOpenAICompatible({
  name: "opencode",
  // Go subscription endpoint by default; set OPENCODE_BASE_URL=https://opencode.ai/zen/v1
  // (+ a *-free OPENCODE_MODEL) to fall back to free pay-as-you-go when the Go
  // monthly quota is exhausted.
  baseURL: process.env.OPENCODE_BASE_URL ?? "https://opencode.ai/zen/go/v1",
  apiKey: process.env.OPENCODE_API_KEY,
});

export default defineAgent({
  model: opencode(process.env.OPENCODE_MODEL ?? "kimi-k2.7-code"),
  // eve can't look up context-window metadata for custom model ids; supply it.
  modelContextWindowTokens: 128_000,
  compaction: { thresholdPercent: 0.75 },
});
