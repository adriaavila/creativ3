import { defineAgent } from "eve";
import { gateway } from "ai";

export default defineAgent({
  description: "Turns researched lead evidence into concise, personalized outreach drafts for mandatory human review.",
  model: gateway(process.env.GROWTH_MODEL ?? "anthropic/claude-sonnet-4-6"),
  modelContextWindowTokens: 200_000,
});
