import { defineEvalConfig } from "eve/evals";
import { gateway } from "ai";

export default defineEvalConfig({
  // LLM-as-judge for t.judge.* assertions. String id routes through AI Gateway.
  judge: { model: gateway(process.env.GROWTH_JUDGE_MODEL ?? "anthropic/claude-sonnet-4-6") },
  maxConcurrency: 2,
  timeoutMs: 120_000,
});
