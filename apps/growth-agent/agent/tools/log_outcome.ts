import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

// Records a human-reported pipeline outcome. Null optionals keep existing
// values (COALESCE), so a single field can be updated without clobbering others.
export default defineTool({
  description:
    "Record a lead's pipeline outcome after a human acted (contacted/replied/meeting_booked/won/lost) and optional deal estimates. Never sends anything.",
  inputSchema: z.object({
    leadId: z.string().uuid(),
    status: z.enum(["contacted", "replied", "meeting_booked", "won", "lost"]),
    closeProbability: z.number().int().min(0).max(100).optional(),
    potentialValue: z.number().int().min(0).optional(),
    // When true, stamps last_contacted_at = now().
    markContacted: z.boolean().default(false),
  }),
  async execute({ leadId, status, closeProbability, potentialValue, markContacted }) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      UPDATE leads
      SET status = ${status},
          close_probability = COALESCE(${closeProbability ?? null}, close_probability),
          potential_value = COALESCE(${potentialValue ?? null}, potential_value),
          last_contacted_at = CASE WHEN ${markContacted} THEN now() ELSE last_contacted_at END,
          updated_at = now()
      WHERE id = ${leadId}
      RETURNING id
    `;
    if (rows.length === 0) return { updated: false, reason: "lead not found" };
    return { updated: true, leadId, status };
  },
});
