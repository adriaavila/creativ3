import { z } from "zod";
import { authorizeOps, resolveOpsWorkspace } from "@/lib/ops-auth";
import { listMessageTemplates, type MetaMessageTemplate } from "@/lib/meta/server";
import {
  completeGrowthOutreachAttempt,
  createGrowthOutreachAttempt,
  getGrowthLeadById,
  hasRecentSentGrowthOutreach,
  updateLeadFields,
  updateLeadStatus,
} from "@/lib/growth-db";
import {
  getWhatsAppProviderConnection,
  getWhatsAppProviderConnectionForStoredChannel,
} from "@/lib/whatsapp-connections-db";
import {
  getWahaConnection,
  upsertConversation,
} from "@/lib/whatsapp-inbox-db";
import { normalizeWhatsAppId } from "@/lib/phone";
import { OutsideFreeTextWindowError, outboundActionOutcome, sendToConversation } from "@/lib/whatsapp-send";

export const runtime = "nodejs";

export const growthOutreachSchema = z.object({
  actionId: z.string().uuid(),
  leadId: z.string().uuid(),
  connectionId: z.string().trim().min(2).max(200),
  channel: z.enum(["cloud_api", "waha"]),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, "Usa formato internacional, por ejemplo +58412…"),
  message: z.string().trim().min(10).max(1000),
  templateName: z.string().trim().min(1).max(100).optional(),
  templateLanguage: z.string().trim().min(2).max(20).optional(),
  /** Owning workspace of the connection. Omitted = session-wide lookup (shared ops gate). */
  workspace: z.string().trim().max(80).optional(),
  contactSourceUrl: z.url().max(500).nullable().optional(),
  confirmed: z.literal(true),
  consentConfirmed: z.literal(true),
});

export function growthTemplateComponents(message: string) {
  return [
    {
      type: "body",
      parameters: [{ type: "text", text: message }],
    },
  ];
}

export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const input = growthOutreachSchema.parse(await request.json());
  const lead = await getGrowthLeadById(input.leadId);
  if (!lead) return Response.json({ error: "Lead no encontrado." }, { status: 404 });

  const phone = normalizeWhatsAppId(input.phone);
  if (await hasRecentSentGrowthOutreach(phone)) {
    return Response.json(
      { error: "Este número ya recibió un outreach en las últimas 24 horas." },
      { status: 429, headers: { "Retry-After": "86400" } },
    );
  }
  const connection = await resolveConnection(
    input.channel,
    input.connectionId,
    input.workspace ? resolveOpsWorkspace(input.workspace, authorization.userId) : null,
  );
  let selectedTemplate: MetaMessageTemplate | null = null;
  if (input.channel === "cloud_api") {
    if (!input.templateName || !input.templateLanguage) {
      return Response.json({ error: "Selecciona una plantilla aprobada y su idioma." }, { status: 400 });
    }
    try {
      selectedTemplate = await findApprovedTemplate(
        connection.providerConnection,
        input.templateName,
        input.templateLanguage,
      );
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "No se pudo validar la plantilla de WhatsApp." },
        { status: 400 },
      );
    }
  }
  const conversation = await upsertConversation({
    channelKind: input.channel,
    channelKey: connection.channelKey,
    contactWaId: phone,
    direction: "out",
    connectionId: connection.connectionId,
  });
  const attempt = await createGrowthOutreachAttempt({
    actionId: input.actionId,
    leadId: input.leadId,
    recipient: input.phone,
    content: input.message,
    sentBy: authorization.userId,
    channelKind: input.channel,
  });

  try {
    const message = await sendToConversation({
      conversationId: conversation.id,
      actionId: input.actionId,
      text: input.channel === "waha" ? input.message : undefined,
      template:
        input.channel === "cloud_api"
          ? {
              name: selectedTemplate!.name,
              languageCode: selectedTemplate!.language,
              components: growthTemplateComponents(input.message),
            }
          : undefined,
      source: "api",
    });

    const outcome = outboundActionOutcome(message.status);
    if (outcome === "unknown") {
      await completeGrowthOutreachAttempt(attempt.id, {
        status: "unknown",
        conversationId: conversation.id,
        channelKind: input.channel,
        error: "Entrega no confirmada; no reintentar sin reconciliar con el proveedor.",
      });
      return Response.json(
        { ok: false, status: message.status, error: "Entrega no confirmada; no reintentes este mensaje." },
        { status: 202 },
      );
    }
    if (outcome === "failed") {
      await completeGrowthOutreachAttempt(attempt.id, {
        status: "failed",
        conversationId: conversation.id,
        channelKind: input.channel,
        error: "El proveedor confirmó que el mensaje falló.",
      });
      return Response.json({ error: "El proveedor confirmó que el mensaje falló." }, { status: 409 });
    }

    await Promise.all([
      completeGrowthOutreachAttempt(attempt.id, {
        status: "sent",
        providerMessageId: message.message.waMessageId ?? undefined,
        conversationId: conversation.id,
        channelKind: input.channel,
      }),
      updateLeadFields(input.leadId, {
        businessPhone: input.phone,
        contactSourceUrl: input.contactSourceUrl ?? lead.contactSourceUrl,
      }),
      updateLeadStatus(input.leadId, "contacted"),
    ]);

    return Response.json({
      ok: true,
      messageId: message.message.waMessageId ?? String(message.message.id),
      conversationId: conversation.id,
      channelKind: input.channel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el mensaje.";
    await completeGrowthOutreachAttempt(attempt.id, {
      status: "failed",
      conversationId: conversation.id,
      channelKind: input.channel,
      error: message,
    });
    return Response.json(
      {
        error:
          error instanceof OutsideFreeTextWindowError
            ? error.message
            : input.channel === "cloud_api"
              ? `${message} Verifica que la plantilla seleccionada esté aprobada en Meta.`
              : message,
      },
      { status: 502 },
    );
  }
}

async function resolveConnection(
  channel: "cloud_api" | "waha",
  connectionId: string,
  workspace: string | null,
) {
  if (channel === "cloud_api") {
    const connection = workspace
      ? await getWhatsAppProviderConnection(connectionId, workspace)
      : await getWhatsAppProviderConnectionForStoredChannel(connectionId);
    if (!connection) throw new Error("La conexión oficial no está disponible.");
    return {
      channelKey: connection.phoneNumberId,
      connectionId: null,
      providerConnection: connection,
    };
  }

  const connection = await getWahaConnection(connectionId);
  if (!connection) throw new Error("La sesión WAHA no existe.");
  if (connection.status !== "connected") {
    throw new Error(`La sesión WAHA no está conectada (${connection.status}).`);
  }
  return {
    channelKey: connection.wahaSessionId,
    connectionId: connection.connectionId,
    providerConnection: null,
  };
}

async function findApprovedTemplate(
  connection: Awaited<ReturnType<typeof getWhatsAppProviderConnection>>,
  name: string,
  language: string,
) {
  if (!connection) throw new Error("La conexión oficial no está disponible.");
  const templates = await listMessageTemplates({
    wabaId: connection.wabaId,
    businessToken: connection.businessToken,
  });
  const template = templates.find((item) => item.name === name && item.language === language);
  if (!template) throw new Error("La plantilla seleccionada no está aprobada para esta conexión.");
  return template;
}
