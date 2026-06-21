import { defineEval } from "eve/evals";

export default defineEval({
  description: "The agent knows its evidence and volume limits.",
  async test(t) {
    await t.send("State the maximum leads per run and the evidence requirement. Do not call tools.");
    t.completed();
    t.messageIncludes(/10/);
    t.messageIncludes(/URL|source|fuente/i);
  },
});
