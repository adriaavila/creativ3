import { defineAgent } from "eve";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const opencode = createOpenAICompatible({
  name: "opencode",
  baseURL: "https://opencode.ai/zen/v1",
  apiKey: process.env.OPENCODE_API_KEY,
});

export default defineAgent({
  description: "Researches Venezuelan businesses, verifies public evidence, scores opportunities, and persists at most 10 qualified leads.",
  model: opencode(process.env.OPENCODE_MODEL ?? "kimi-k2.6"),
  modelContextWindowTokens: 128_000,
});
