import { defineAgent } from "eve";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const opencode = createOpenAICompatible({
  name: "opencode",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey: process.env.OPENCODE_API_KEY,
});

export default defineAgent({
  description: "Turns researched lead evidence into concise, personalized outreach drafts for mandatory human review.",
  model: opencode(process.env.OPENCODE_MODEL ?? "kimi-k2.7-code"),
  modelContextWindowTokens: 128_000,
});
