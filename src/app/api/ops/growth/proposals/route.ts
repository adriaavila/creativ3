import { z } from "zod";
import { getGrowthLeadById } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";
import { dispatchGrowthAgent } from "@/lib/growth-agent-runtime";

const schema = z.object({ leadId: z.string().uuid() });

export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  const { leadId } = schema.parse(await request.json());

  const lead = await getGrowthLeadById(leadId);
  if (!lead) return Response.json({ error: "Lead no encontrado." }, { status: 404 });

  const context = [
    `Negocio: ${lead.businessName}`,
    `Vertical: ${lead.vertical} · Ciudad: ${lead.location}`,
    `Problema detectado: ${lead.problemDetected}`,
    `Ángulo de oferta: ${lead.offerAngle}`,
    `Evidencia pública: ${lead.evidence}`,
  ].join("\n");

  try {
    await dispatchGrowthAgent({
      correlationId: `proposal-${leadId}`,
      message:
        `Generate a commercial proposal draft (kind=proposal) for lead ${leadId} using create_draft. ` +
        `Use only this stored evidence; do not invent facts. Do not start a research run and do not send anything.\n\n${context}`,
    });
    return Response.json({ ok: true, leadId }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown growth agent error";
    return Response.json({ error: "El Growth Agent no respondió.", detail: message }, { status: 502 });
  }
}
