import { defineAgent } from "eve";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// opencode Zen: OpenAI-compatible surface, Bearer auth, bare model ids.
// Inlined here (not a shared lib/) because eve only compiles relative imports
// reached from tools, not the model module referenced by an agent.
const opencode = createOpenAICompatible({
  name: "opencode",
  baseURL: "https://opencode.ai/zen/v1",
  apiKey: process.env.OPENCODE_API_KEY,
});

export default defineAgent({
  // kimi-k2.6 needs workspace balance; set OPENCODE_MODEL to a free model
  // (e.g. deepseek-v4-flash-free) to run at $0.
  model: opencode(process.env.OPENCODE_MODEL ?? "kimi-k2.6"),
  // eve can't look up context-window metadata for custom model ids; supply it.
  modelContextWindowTokens: 128_000,
  compaction: { thresholdPercent: 0.75 },
});
