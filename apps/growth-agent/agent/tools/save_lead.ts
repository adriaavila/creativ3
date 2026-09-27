import { defineTool } from "eve/tools";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";
import { DAILY_LEADS, MIN_SCORE, VERTICALS } from "../../lib/offer.js";

const url = z.string().url().max(500);

export default defineTool({
  description:
    `Persist one researched business that passed the filter: score >= ${MIN_SCORE}, a public WhatsApp verified by ` +
    `contactSourceUrl, and a concrete sign that it sells over WhatsApp. At most ${DAILY_LEADS} per day. ` +
    "Anything below the bar is not saved: say why and move on.",
  inputSchema: z.object({
    runId: z.string().uuid(),
    businessName: z.string().min(2).max(160),
    vertical: z.enum(VERTICALS),
    location: z.string().min(2).max(120),
    websiteUrl: url.optional(),
    instagramUrl: url.optional(),
    /** El WhatsApp público del negocio, en formato internacional. Sin él no se le puede invitar. */
    businessPhone: z.string().regex(/^\+[1-9]\d{7,14}$/),
    /** La página pública donde aparece ese WhatsApp como del negocio. */
    contactSourceUrl: url,
    sourceUrls: z.array(url).min(1).max(5),
    evidence: z.string().min(20).max(1200),
    /** Dónde se ve que vende o atiende por WhatsApp (botón en la bio, "escríbenos al…", catálogo). */
    whatsappSignal: z.string().min(10).max(300),
    problemDetected: z.string().min(10).max(600),
    offerAngle: z.string().min(10).max(600),
    leadScore: z.number().int().min(1).max(10),
  }),
  async execute(input) {
    if (input.leadScore < MIN_SCORE) {
      return { saved: false, reason: `Score ${input.leadScore} < ${MIN_SCORE}: no pasa el filtro. No lo guardes.` };
    }
    const sql = neon(process.env.DATABASE_URL!);
    // El día de Caracas (UTC-4, sin horario de verano), igual que la cola de /ops.
    const [today] = await sql`
      SELECT count(*)::int AS total FROM leads
      WHERE run_id IS NOT NULL AND (created_at AT TIME ZONE 'America/Caracas')::date = (now() AT TIME ZONE 'America/Caracas')::date
    `;
    if (Number(today.total) >= DAILY_LEADS) {
      return { saved: false, reason: `Ya hay ${DAILY_LEADS} leads hoy. Termina el run.` };
    }
    const digits = input.businessPhone.replace(/\D/g, "");
    const [dupe] = await sql`
      SELECT id FROM leads WHERE right(regexp_replace(coalesce(business_phone, ''), '\\D', '', 'g'), 10) = ${digits.slice(-10)} LIMIT 1
    `;
    if (dupe) return { saved: false, reason: "Ese WhatsApp ya está en /ops. No lo dupliques." };

    const [lead] = await sql`
      INSERT INTO leads (
        run_id, business_name, vertical, location, website_url, instagram_url,
        business_phone, contact_source_url,
        evidence, source_urls, problem_detected, offer_angle, lead_score, status
      ) VALUES (
        ${input.runId}, ${input.businessName}, ${input.vertical}, ${input.location},
        ${input.websiteUrl ?? null}, ${input.instagramUrl ?? null},
        ${input.businessPhone}, ${input.contactSourceUrl}, ${`${input.evidence}\nWhatsApp: ${input.whatsappSignal}`},
        ${JSON.stringify(input.sourceUrls)}::jsonb, ${input.problemDetected},
        ${input.offerAngle}, ${input.leadScore}, 'researched'
      )
      RETURNING id
    `;
    return { leadId: String(lead.id), saved: true };
  },
});
