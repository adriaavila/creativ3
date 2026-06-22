import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

export default defineTool({
  description: "Create a growth run or mark an existing run as running before research starts.",
  inputSchema: z.object({
    runId: z.string().uuid().optional(),
    market: z.string().min(3).max(120).default("Caracas, Venezuela"),
    maxLeads: z.number().int().min(1).max(10).default(10),
  }),
  async execute({ runId, market, maxLeads }) {
    const sql = neon(process.env.DATABASE_URL!);
    if (runId) {
      const [run] = await sql`
        UPDATE growth_runs
        SET status = 'running', started_at = COALESCE(started_at, now()), updated_at = now()
        WHERE id = ${runId}
        RETURNING id
      `;
      if (!run) throw new Error("Growth run not found");
      return { runId: String(run.id), maxLeads };
    }
    const [run] = await sql`
      INSERT INTO growth_runs (status, market, leads_requested, started_at)
      VALUES ('running', ${market}, ${maxLeads}, now())
      RETURNING id
    `;
    return { runId: String(run.id), maxLeads };
  },
});
