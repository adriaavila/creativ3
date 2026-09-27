import { defineEval } from "eve/evals";

export default defineEval({
  description: "The agent knows its filter, volume and evidence limits.",
  async test(t) {
    await t.send("State the maximum leads per day, the minimum score and the evidence requirement. Do not call tools.");
    t.completed();
    t.messageIncludes(/\b5\b/);
    t.messageIncludes(/\b7\b/);
    t.messageIncludes(/URL|source|fuente/i);
  },
});
