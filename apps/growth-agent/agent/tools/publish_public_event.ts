import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

export default defineTool({
  description: "Publish one anonymous, non-identifying activity event for the public landing workbench.",
  inputSchema: z.object({
    runId: z.string().uuid(),
    agent: z.enum(["Research Agent", "Proposal Agent", "Project Operator"]),
    action: z.string().min(5).max(120),
    detail: z.string().min(5).max(180).refine((value) => !/@|\+\d|https?:\/\//i.test(value), "Detail must be anonymous"),
  }),
  async execute({ runId, agent, action, detail }) {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO public_agent_events (run_id, agent, action, detail, is_public)
      VALUES (${runId}, ${agent}, ${action}, ${detail}, true)
    `;
    return { published: true };
  },
});
