import { defineAgent } from "eve";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const opencode = createOpenAICompatible({
  name: "openrouter",
  baseURL: process.env.OPENCODE_BASE_URL ?? "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENCODE_API_KEY,
  headers: { "HTTP-Referer": "https://creativ3.app", "X-Title": "Creativv Growth Agent" },
});

export default defineAgent({
  description: "Researches Venezuelan businesses, verifies public evidence, scores opportunities, and persists at most 10 qualified leads.",
  model: opencode(process.env.OPENCODE_MODEL ?? "kimi-k2.7-code"),
  modelContextWindowTokens: 128_000,
});
