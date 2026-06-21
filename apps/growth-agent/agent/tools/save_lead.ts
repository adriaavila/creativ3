import { defineTool } from "eve/tools";
import { z } from "zod";
import { database } from "../lib/db.js";

const url = z.string().url().max(500);

export default defineTool({
  description: "Persist one researched business lead with public evidence. Refuses runs that already contain 10 leads.",
  inputSchema: z.object({
    runId: z.string().uuid(),
    businessName: z.string().min(2).max(160),
    vertical: z.enum(["clinics", "real_estate", "ecommerce", "academies"]),
    location: z.string().min(2).max(120),
    websiteUrl: url.optional(),
    instagramUrl: url.optional(),
    sourceUrls: z.array(url).min(1).max(5),
    evidence: z.string().min(20).max(1200),
    problemDetected: z.string().min(10).max(600),
    offerAngle: z.string().min(10).max(600),
    leadScore: z.number().int().min(1).max(10),
  }),
  async execute(input) {
    const sql = database();
    const [count] = await sql`SELECT count(*)::int AS total FROM leads WHERE run_id = ${input.runId}`;
    if (Number(count.total) >= 10) throw new Error("This run already has the maximum of 10 leads");

    const [lead] = await sql`
      INSERT INTO leads (
        run_id, business_name, vertical, location, website_url, instagram_url,
        evidence, source_urls, problem_detected, offer_angle, lead_score, status
      ) VALUES (
        ${input.runId}, ${input.businessName}, ${input.vertical}, ${input.location},
        ${input.websiteUrl ?? null}, ${input.instagramUrl ?? null}, ${input.evidence},
        ${JSON.stringify(input.sourceUrls)}::jsonb, ${input.problemDetected},
        ${input.offerAngle}, ${input.leadScore}, 'researched'
      )
      RETURNING id
    `;
    return { leadId: String(lead.id), saved: true };
  },
});
