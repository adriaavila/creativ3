import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { INVITE_URL } from "../../lib/offer.js";

export default defineTool({
  description:
    "Save a personalized outreach draft for human review. This tool never sends messages. " +
    `A WhatsApp first message (kind dm) must include the link to try the agent: ${INVITE_URL}`,
  inputSchema: z.object({
    leadId: z.string().uuid(),
    channel: z.enum(["instagram", "email", "whatsapp"]),
    kind: z.enum(["dm", "followup_1", "followup_2", "proposal"]).default("dm"),
    content: z.string().min(40).max(3500),
  }),
  async execute({ leadId, channel, kind, content }) {
    // La voz de Adrian no usa rayas largas; el borrador sale ya limpio.
    if (/[—–]/.test(content)) {
      return { saved: false, reason: "Sin rayas largas (— o –). Reescribe con punto, coma o dos puntos." };
    }
    if (channel === "whatsapp" && kind === "dm" && !content.includes(INVITE_URL)) {
      return { saved: false, reason: `El primer mensaje tiene que llevar el link para probar el agente, tal cual: ${INVITE_URL}` };
    }
    const sql = neon(process.env.DATABASE_URL!);
    const [draft] = await sql`
      INSERT INTO outreach_drafts (lead_id, channel, kind, content, status)
      VALUES (${leadId}, ${channel}, ${kind}, ${content}, 'pending')
      RETURNING id
    `;
    await sql`UPDATE leads SET status = 'drafted', updated_at = now() WHERE id = ${leadId} AND status IN ('new', 'researched')`;
    return { draftId: String(draft.id), status: "pending", sent: false };
  },
});
