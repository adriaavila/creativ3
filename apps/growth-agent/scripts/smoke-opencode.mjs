// One-shot check that the opencode Zen gateway answers inference with our key.
// Run: OPENCODE_API_KEY=sk-... node scripts/smoke-opencode.mjs
// Note: requires billing/credits enabled on the opencode Zen account — without
// it, /models returns 200 but /chat/completions returns 401 "Invalid API key".
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const opencode = createOpenAICompatible({
  name: "opencode",
  baseURL: "https://opencode.ai/zen/go/v1",
  apiKey: process.env.OPENCODE_API_KEY,
});

try {
  const { text } = await generateText({
    model: opencode("kimi-k2.7-code"),
    prompt: "Reply with exactly: OK",
  });
  console.log("SUCCESS opencode replied:", JSON.stringify(text));
} catch (e) {
  console.log("FAIL:", e?.data?.error?.message ?? e?.message ?? String(e));
}
