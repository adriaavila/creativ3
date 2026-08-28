import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { getGrowthLeadById, getOutreachDraftById, updateDraft } from "@/lib/growth-db";
import { growthOutreachSchema, resolveDefaultGrowthSender, sendGrowthOutreach } from "@/lib/growth-outreach";

export const runtime = "nodejs";

/**
 * One tap from the phone: approve this draft and send it on the default WhatsApp
 * sender. Approval is persisted before the send so a provider failure still shows
 * what the human signed off on.
 */
const schema = z.object({
  actionId: z.string().uuid(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, "Usa formato internacional, por ejemplo +58412…").optional(),
  content: z.string().trim().min(10).max(1000).optional(),
  confirmed: z.literal(true),
  consentConfirmed: z.literal(true),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Solicitud inválida.", field: parsed.error.issues[0]?.path.join(".") },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const { id } = await context.params;

  const draft = await getOutreachDraftById(id);
  if (!draft) return Response.json({ error: "Borrador no encontrado." }, { status: 404 });
  if (draft.channel !== "whatsapp") {
    return Response.json({ error: "Solo los borradores de WhatsApp se envían desde aquí." }, { status: 400 });
  }

  const lead = await getGrowthLeadById(draft.leadId);
  if (!lead) return Response.json({ error: "Lead no encontrado." }, { status: 404 });

  const phone = input.phone ?? lead.businessPhone;
  if (!phone) {
    return Response.json(
      { error: "Falta el WhatsApp público del negocio.", field: "phone" },
      { status: 400 },
    );
  }

  const message = input.content ?? draft.content;
  if (message.length > 1000) {
    return Response.json({ error: "El mensaje supera los 1000 caracteres de WhatsApp." }, { status: 400 });
  }

  const sender = await resolveDefaultGrowthSender();
  if (!sender) {
    return Response.json(
      {
        error:
          "No hay remitente de WhatsApp listo. Conecta una sesión WAHA, o configura GROWTH_OUTREACH_TEMPLATE con una plantilla aprobada.",
      },
      { status: 409 },
    );
  }

  await updateDraft(draft.id, { content: message, status: "approved", reviewedBy: authorization.userId });

  const outreach = growthOutreachSchema.safeParse({
    actionId: input.actionId,
    leadId: draft.leadId,
    connectionId: sender.connectionId,
    channel: sender.channel,
    templateName: sender.templateName,
    templateLanguage: sender.templateLanguage,
    phone,
    message,
    confirmed: true,
    consentConfirmed: true,
  });
  if (!outreach.success) {
    return Response.json({ error: outreach.error.issues[0]?.message ?? "Mensaje inválido." }, { status: 400 });
  }

  const result = await sendGrowthOutreach(outreach.data, authorization.userId);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: result.status, headers: result.headers });
  }
  return Response.json({ ...result, sentFrom: sender.label, phone });
}
