import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// opencode Zen exposes an OpenAI-compatible surface at /v1 with Bearer auth.
// Verified: GET /models = 200, POST /chat/completions expects `Authorization:
// Bearer <key>` and a bare model id (e.g. "claude-sonnet-4-6").
const opencode = createOpenAICompatible({
  name: "opencode",
  baseURL: "https://opencode.ai/zen/v1",
  apiKey: process.env.OPENCODE_API_KEY,
});

// ponytail: sonnet is the cheap default for high-volume lead research; swap to
// "claude-opus-4-8" if quality demands it. Both are in opencode's /models list.
export const model = opencode("claude-sonnet-4-6");
