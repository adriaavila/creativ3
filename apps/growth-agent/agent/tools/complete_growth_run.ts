import { defineTool } from "eve/tools";
import { z } from "zod";
import { database } from "../lib/db.js";

export default defineTool({
  description: "Complete or fail a growth run with a concise operational summary.",
  inputSchema: z.object({
    runId: z.string().uuid(),
    status: z.enum(["completed", "failed"]),
    summary: z.string().min(10).max(1000),
    error: z.string().max(800).optional(),
  }),
  async execute({ runId, status, summary, error }) {
    const sql = database();
    await sql`
      UPDATE growth_runs
      SET status = ${status}, summary = ${summary}, error = ${error ?? null},
          completed_at = now(), updated_at = now()
      WHERE id = ${runId}
    `;
    return { runId, status };
  },
});
