import { z } from "zod";
import { getGrowthLeadById } from "@/lib/growth-db";

const schema = z.object({ leadId: z.string().uuid() });

export async function POST(request: Request) {
  // ponytail: auth gate removed for now — re-add Clerk when locking down.
  const host = process.env.GROWTH_AGENT_URL;
  if (!host) {
    return Response.json({ error: "Configura GROWTH_AGENT_URL." }, { status: 503 });
  }
  const username = process.env.GROWTH_AGENT_USERNAME;
  const password = process.env.GROWTH_AGENT_PASSWORD;

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
    const response = await fetch(`${host.replace(/\/$/, "")}/eve/v1/session`, {
      method: "POST",
      headers: {
        // agent runs without auth now; send Basic only if creds are configured
        ...(username && password
          ? { authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}` }
          : {}),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message:
          `Generate a commercial proposal draft (kind=proposal) for lead ${leadId} using create_draft. ` +
          `Use only this stored evidence; do not invent facts. Do not start a research run and do not send anything.\n\n${context}`,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Growth agent returned ${response.status}`);
    return Response.json({ ok: true, leadId }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown growth agent error";
    return Response.json({ error: "El Growth Agent no respondió.", detail: message }, { status: 502 });
  }
}
