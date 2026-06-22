import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

export default defineTool({
  description: "Save a personalized outreach draft for human review. This tool never sends messages.",
  inputSchema: z.object({
    leadId: z.string().uuid(),
    channel: z.enum(["instagram", "email", "whatsapp"]),
    kind: z
      .enum(["dm", "followup_1", "followup_2", "audio_script", "proposal"])
      .default("dm"),
    content: z.string().min(40).max(3500),
  }),
  async execute({ leadId, channel, kind, content }) {
    const sql = neon(process.env.DATABASE_URL!);
    const [draft] = await sql`
      INSERT INTO outreach_drafts (lead_id, channel, kind, content, status)
      VALUES (${leadId}, ${channel}, ${kind}, ${content}, 'pending')
      RETURNING id
    `;
    await sql`UPDATE leads SET status = 'drafted', updated_at = now() WHERE id = ${leadId}`;
    return { draftId: String(draft.id), status: "pending", sent: false };
  },
});
