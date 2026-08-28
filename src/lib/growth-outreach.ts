import { z } from "zod";
import { resolveOpsWorkspace } from "@/lib/ops-auth";
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
  listWhatsAppConnections,
  type WhatsAppConnectionView,
} from "@/lib/whatsapp-connections-db";
import {
  getWahaConnection,
  listWahaConnections,
  upsertConversation,
  type WahaConnectionRecord,
} from "@/lib/whatsapp-inbox-db";
import { normalizeWhatsAppId } from "@/lib/phone";
import { OutsideFreeTextWindowError, outboundActionOutcome, sendToConversation } from "@/lib/whatsapp-send";

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

export type GrowthOutreachInput = z.infer<typeof growthOutreachSchema>;

export type GrowthSendResult =
  | { ok: true; messageId: string; conversationId: number; channelKind: "cloud_api" | "waha" }
  | { ok: false; status: number; error: string; headers?: Record<string, string> };

/** The WhatsApp number Growth sends from when the operator does not pick one (mobile: one tap). */
export type GrowthSender = {
  channel: "cloud_api" | "waha";
  connectionId: string;
  label: string;
  templateName?: string;
  templateLanguage?: string;
};

export function growthTemplateComponents(message: string) {
  return [
    {
      type: "body",
      parameters: [{ type: "text", text: message }],
    },
  ];
}

const CLOUD_ACTIVE_STATUSES = new Set(["connected", "subscribed", "coexistence_sync_requested"]);

/**
 * Pure sender choice so the mobile queue never asks which number to use.
 * WAHA first: it sends reviewed free text. Cloud API can only cold-open with an
 * approved template, so it needs GROWTH_OUTREACH_TEMPLATE configured.
 */
export function pickGrowthSender(
  waha: Pick<WahaConnectionRecord, "wahaSessionId" | "status" | "phoneDisplay">[],
  cloud: Pick<WhatsAppConnectionView, "phoneNumberId" | "status" | "businessTokenStored" | "displayPhoneNumber" | "verifiedName">[],
  templateName = process.env.GROWTH_OUTREACH_TEMPLATE,
  templateLanguage = process.env.GROWTH_OUTREACH_TEMPLATE_LANGUAGE ?? "es",
): GrowthSender | null {
  const session = waha.find((connection) => connection.status === "connected");
  if (session) {
    return {
      channel: "waha",
      connectionId: session.wahaSessionId,
      label: session.phoneDisplay ?? session.wahaSessionId,
    };
  }

  if (!templateName) return null;
  const official = cloud.find(
    (connection) => CLOUD_ACTIVE_STATUSES.has(connection.status.toLowerCase()) && connection.businessTokenStored,
  );
  if (!official) return null;
  return {
    channel: "cloud_api",
    connectionId: official.phoneNumberId,
    label: official.displayPhoneNumber ?? official.verifiedName ?? official.phoneNumberId,
    templateName,
    templateLanguage,
  };
}

export async function resolveDefaultGrowthSender(): Promise<GrowthSender | null> {
  const [waha, cloud] = await Promise.all([
    listWahaConnections().catch(() => []),
    listWhatsAppConnections().catch(() => []),
  ]);
  return pickGrowthSender(waha, cloud);
}

export async function sendGrowthOutreach(input: GrowthOutreachInput, userId: string): Promise<GrowthSendResult> {
  const lead = await getGrowthLeadById(input.leadId);
  if (!lead) return { ok: false, status: 404, error: "Lead no encontrado." };

  const phone = normalizeWhatsAppId(input.phone);
  if (await hasRecentSentGrowthOutreach(phone)) {
    return {
      ok: false,
      status: 429,
      error: "Este número ya recibió un outreach en las últimas 24 horas.",
      headers: { "Retry-After": "86400" },
    };
  }

  let connection: Awaited<ReturnType<typeof resolveConnection>>;
  try {
    connection = await resolveConnection(
      input.channel,
      input.connectionId,
      input.workspace ? resolveOpsWorkspace(input.workspace, userId) : null,
    );
  } catch (error) {
    return {
      ok: false,
      status: 409,
      error: error instanceof Error ? error.message : "La conexión de WhatsApp no está disponible.",
    };
  }

  let selectedTemplate: MetaMessageTemplate | null = null;
  if (input.channel === "cloud_api") {
    if (!input.templateName || !input.templateLanguage) {
      return { ok: false, status: 400, error: "Selecciona una plantilla aprobada y su idioma." };
    }
    try {
      selectedTemplate = await findApprovedTemplate(
        connection.providerConnection,
        input.templateName,
        input.templateLanguage,
      );
    } catch (error) {
      return {
        ok: false,
        status: 400,
        error: error instanceof Error ? error.message : "No se pudo validar la plantilla de WhatsApp.",
      };
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
    sentBy: userId,
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
      return { ok: false, status: 202, error: "Entrega no confirmada; no reintentes este mensaje." };
    }
    if (outcome === "failed") {
      await completeGrowthOutreachAttempt(attempt.id, {
        status: "failed",
        conversationId: conversation.id,
        channelKind: input.channel,
        error: "El proveedor confirmó que el mensaje falló.",
      });
      return { ok: false, status: 409, error: "El proveedor confirmó que el mensaje falló." };
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

    return {
      ok: true,
      messageId: message.message.waMessageId ?? String(message.message.id),
      conversationId: conversation.id,
      channelKind: input.channel,
    };
  } catch (error) {
    const failure = error instanceof Error ? error.message : "No se pudo enviar el mensaje.";
    await completeGrowthOutreachAttempt(attempt.id, {
      status: "failed",
      conversationId: conversation.id,
      channelKind: input.channel,
      error: failure,
    });
    return {
      ok: false,
      status: 502,
      error:
        error instanceof OutsideFreeTextWindowError
          ? failure
          : input.channel === "cloud_api"
            ? `${failure} Verifica que la plantilla seleccionada esté aprobada en Meta.`
            : failure,
    };
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
