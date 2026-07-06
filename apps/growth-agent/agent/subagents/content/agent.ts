import { defineAgent } from "eve";
import { gateway } from "ai";

export default defineAgent({
  description: "Turns growth wins, theses and case signals into short social posts, queued to Postiz for human review before publishing.",
  model: gateway(process.env.GROWTH_MODEL ?? "anthropic/claude-sonnet-4-6"),
  modelContextWindowTokens: 200_000,
});
