import { sendTemplateMessage } from "@/lib/meta/server";
import { MetaCloudWhatsAppProvider } from "@/lib/meta/cloud-whatsapp-provider";
import { getWhatsAppProviderConnectionForStoredChannel } from "@/lib/whatsapp-connections-db";
import { assertOutboundRecipientAllowed } from "@/lib/outbound-safety";
import {
  beginOutboundMessage,
  finalizeOutboundMessage,
  getConversationById,
  markOutboundMessageUnknown,
  type WaConversation,
  type WaMessage,
} from "@/lib/whatsapp-inbox-db";
import { isWithinFreeTextWindow } from "@/lib/whatsapp-window";

export { isWithinFreeTextWindow } from "@/lib/whatsapp-window";

export function mayDispatchOutboundAction(action: { created: boolean; status: string | null }) {
  return action.created && action.status === "pending";
}

export function outboundActionOutcome(status: OutboundActionStatus) {
  if (status === "pending" || status === "unknown") return "unknown" as const;
  if (status === "failed") return "failed" as const;
  return "confirmed" as const;
}

type SendToConversationBase = {
  conversationId: number;
  text?: string;
  template?: { name: string; languageCode: string; components?: unknown[] };
  metadata?: Record<string, unknown>;
};

export type SendToConversationInput = SendToConversationBase & (
  | { source: "api"; actionId: string }
  | { source: "ai"; actionId?: string }
);

export type OutboundActionStatus = "pending" | "unknown" | "sent" | "delivered" | "read" | "failed";

export type SendToConversationResult = {
  message: WaMessage;
  status: OutboundActionStatus;
  dispatched: boolean;
};

export class OutsideFreeTextWindowError extends Error {
  constructor() {
    super("Han pasado más de 24h desde el último mensaje entrante — Cloud API exige un template fuera de esa ventana.");
    this.name = "OutsideFreeTextWindowError";
  }
}

/** Routes to the right channel and enforces the Cloud API 24h free-text window. */
export async function sendToConversation(input: SendToConversationInput): Promise<SendToConversationResult> {
  const conversation = await getConversationById(input.conversationId);
  if (!conversation) throw new Error(`Conversación ${input.conversationId} no encontrada.`);
  assertOutboundRecipientAllowed(conversation.contactWaId);
  const actionId = input.actionId ?? crypto.randomUUID();

  // WAHA se retiró: allok sólo envía por Cloud API. La columna `channel_kind`
  // sigue en el esquema por las conversaciones históricas, así que una fila
  // vieja todavía puede decir 'waha' — falla claro en vez de enviar por un
  // canal que ya no existe.
  if (conversation.channelKind !== "cloud_api") {
    throw new Error(
      `La conversación ${conversation.id} es del canal retirado '${conversation.channelKind}'; allok sólo envía por Cloud API.`,
    );
  }
  return sendCloudApi(conversation, input, actionId);
}

async function sendCloudApi(conversation: WaConversation, input: SendToConversationInput, actionId: string) {
  const connection = await getWhatsAppProviderConnectionForStoredChannel(conversation.channelKey);
  if (!connection) {
    throw new Error(`No hay conexión Cloud API activa para phone_number_id ${conversation.channelKey}.`);
  }
  const provider = new MetaCloudWhatsAppProvider(async () => connection);

  const withinWindow = isWithinFreeTextWindow(conversation.lastInboundAt);
  if (!input.template && !withinWindow) throw new OutsideFreeTextWindowError();
  if (!input.template && !input.text) throw new Error("Falta `text` cuando no se envía un template.");

  const action = await beginOutboundMessage({
    conversationId: conversation.id,
    clientActionId: actionId,
    source: input.source,
    msgType: input.template ? "template" : "text",
    body: input.template ? `[template:${input.template.name}]` : input.text!,
    payload: input.metadata,
  });
  if (!mayDispatchOutboundAction({ created: action.created, status: action.message.status })) {
    return resultForExistingAction(action.message);
  }

  try {
    const waMessageId = input.template
      ? extractMessageId(await sendTemplateMessage({
          phoneNumberId: conversation.channelKey,
          businessToken: connection.businessToken,
          to: conversation.contactWaId,
          templateName: input.template.name,
          languageCode: input.template.languageCode,
          components: input.template.components,
        }))
      : (await provider.sendText({
          connectionId: connection.id,
          to: conversation.contactWaId,
          body: input.text!,
        })).messageId;
    return await finalizeAction(action.message, waMessageId ?? null);
  } catch (error) {
    return unknownAction(action.message, error);
  }
}

async function finalizeAction(message: WaMessage, waMessageId: string | null): Promise<SendToConversationResult> {
  const finalized = await finalizeOutboundMessage(message.id, waMessageId);
  if (!finalized) throw new Error("No se pudo confirmar el mensaje outbound persistido.");
  return { message: finalized, status: "sent", dispatched: true };
}

async function unknownAction(message: WaMessage, error: unknown): Promise<SendToConversationResult> {
  const unknown = await markOutboundMessageUnknown(message.id, error);
  if (!unknown) throw error;
  return { message: unknown, status: "unknown", dispatched: true };
}

function resultForExistingAction(message: WaMessage): SendToConversationResult {
  const status = isOutboundActionStatus(message.status) ? message.status : "unknown";
  return { message, status, dispatched: false };
}

function isOutboundActionStatus(status: string | null): status is OutboundActionStatus {
  return status !== null && ["pending", "unknown", "sent", "delivered", "read", "failed"].includes(status);
}

function extractMessageId(result: unknown): string | undefined {
  const messages = (result as { messages?: Array<{ id?: string }> } | undefined)?.messages;
  return messages?.[0]?.id;
}
