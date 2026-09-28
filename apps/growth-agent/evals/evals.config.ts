import { defineEvalConfig } from "eve/evals";

export default defineEvalConfig({
  // Juez de los t.judge(...): un modelo de evaluación por AI Gateway (id de texto).
  judge: { model: process.env.GROWTH_JUDGE_MODEL ?? "typesafe-ai/jev" },
  maxConcurrency: 2,
  timeoutMs: 120_000,
});
