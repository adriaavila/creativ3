import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

export default defineTool({
  description: "List researched leads for a growth run so personalized drafts can be created.",
  inputSchema: z.object({ runId: z.string().uuid() }),
  async execute({ runId }) {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, business_name, vertical, evidence, problem_detected, offer_angle, lead_score
      FROM leads
      WHERE run_id = ${runId}
      ORDER BY lead_score DESC, created_at ASC
      LIMIT 10
    `;
    return rows.map((row) => ({
      leadId: String(row.id),
      businessName: String(row.business_name),
      vertical: String(row.vertical),
      evidence: String(row.evidence),
      problemDetected: String(row.problem_detected),
      offerAngle: String(row.offer_angle),
      leadScore: Number(row.lead_score),
    }));
  },
});
