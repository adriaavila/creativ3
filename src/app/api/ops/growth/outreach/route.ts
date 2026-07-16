import { createHmac } from "node:crypto";
import { z } from "zod";
import {
  completeGrowthOutreachAttempt,
  createGrowthOutreachAttempt,
  getGrowthLeadById,
  updateLeadFields,
  updateLeadStatus,
} from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";

export const runtime = "nodejs";

const schema = z.object({
  leadId: z.string().uuid(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, "Usa formato internacional, por ejemplo +58412…"),
  message: z.string().trim().min(10).max(1000),
  contactSourceUrl: z.url().max(500).nullable().optional(),
  confirmed: z.literal(true),
});

export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const input = schema.parse(await request.json());
  const lead = await getGrowthLeadById(input.leadId);
  if (!lead) return Response.json({ error: "Lead no encontrado." }, { status: 404 });

  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "N8N_WEBHOOK_SECRET no está configurado." }, { status: 503 });
  }

  const attemptId = await createGrowthOutreachAttempt({
    leadId: input.leadId,
    recipient: input.phone,
    content: input.message,
    sentBy: authorization.userId,
  });
  const payload = {
    requestId: attemptId,
    leadId: input.leadId,
    businessName: lead.businessName,
    to: input.phone.replace(/\D/g, ""),
    message: input.message,
  };
  const serialized = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(serialized).digest("hex");
  const webhookUrl =
    process.env.GROWTH_OUTREACH_WEBHOOK_URL ??
    "https://n8n.servicioscreativos.online/webhook/ops/growth-outreach";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-ops-signature": signature,
      },
      body: serialized,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const result = (await response.json().catch(() => ({}))) as {
      messageId?: string;
      error?: string;
    };
    if (!response.ok || !result.messageId) {
      throw new Error(result.error ?? `El gateway respondió ${response.status}`);
    }

    await Promise.all([
      completeGrowthOutreachAttempt(attemptId, {
        status: "sent",
        providerMessageId: result.messageId,
      }),
      updateLeadFields(input.leadId, {
        businessPhone: input.phone,
        contactSourceUrl: input.contactSourceUrl ?? lead.contactSourceUrl,
      }),
      updateLeadStatus(input.leadId, "contacted"),
    ]);
    return Response.json({ ok: true, messageId: result.messageId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el mensaje.";
    await completeGrowthOutreachAttempt(attemptId, { status: "failed", error: message });
    return Response.json({ error: message }, { status: 502 });
  }
}
