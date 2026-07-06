import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

export default defineTool({
  description:
    "Set the next follow-up action and date for a lead so it surfaces in the human 'Para hoy' queue. Never sends anything.",
  inputSchema: z.object({
    leadId: z.string().uuid(),
    nextAction: z.string().min(5).max(200),
    // ISO date (YYYY-MM-DD); column is `date`.
    nextActionAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  }),
  async execute({ leadId, nextAction, nextActionAt }) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      UPDATE leads
      SET next_action = ${nextAction}, next_action_at = ${nextActionAt}, updated_at = now()
      WHERE id = ${leadId}
      RETURNING id
    `;
    if (rows.length === 0) return { updated: false, reason: "lead not found" };
    return { updated: true, leadId, nextAction, nextActionAt };
  },
});
