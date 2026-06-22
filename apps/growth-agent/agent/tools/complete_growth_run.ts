import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

export default defineTool({
  description: "Complete or fail a growth run with a concise operational summary.",
  inputSchema: z.object({
    runId: z.string().uuid(),
    status: z.enum(["completed", "failed"]),
    summary: z.string().min(10).max(1000),
    error: z.string().max(800).optional(),
  }),
  async execute({ runId, status, summary, error }) {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE growth_runs
      SET status = ${status}, summary = ${summary}, error = ${error ?? null},
          completed_at = now(), updated_at = now()
      WHERE id = ${runId}
    `;
    return { runId, status };
  },
});
