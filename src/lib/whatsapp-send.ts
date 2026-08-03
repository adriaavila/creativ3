import { sendTemplateMessage } from "@/lib/meta/server";
import { MetaCloudWhatsAppProvider } from "@/lib/meta/cloud-whatsapp-provider";
import { getWhatsAppProviderConnectionForStoredChannel } from "@/lib/whatsapp-connections-db";
import { sendWahaText } from "@/lib/waha-send";
import { getConversationById, insertMessage, type WaConversation, type WaMessage } from "@/lib/whatsapp-inbox-db";
import { isWithinFreeTextWindow } from "@/lib/whatsapp-window";

export { isWithinFreeTextWindow } from "@/lib/whatsapp-window";

export type SendToConversationInput = {
  conversationId: number;
  text?: string;
  template?: { name: string; languageCode: string; components?: unknown[] };
  /** Who authored this outbound message: a human via /ops/inbox ("api") or the AI auto-reply ("ai"). */
  source?: "api" | "ai";
  metadata?: Record<string, unknown>;
};

export class OutsideFreeTextWindowError extends Error {
  constructor() {
    super("Han pasado más de 24h desde el último mensaje entrante — Cloud API exige un template fuera de esa ventana.");
    this.name = "OutsideFreeTextWindowError";
  }
}

/** Routes to the right channel and enforces the Cloud API 24h free-text window. */
export async function sendToConversation(input: SendToConversationInput): Promise<WaMessage | null> {
  const conversation = await getConversationById(input.conversationId);
  if (!conversation) throw new Error(`Conversación ${input.conversationId} no encontrada.`);

  return conversation.channelKind === "cloud_api"
    ? sendCloudApi(conversation, input)
    : sendWaha(conversation, input);
}

async function sendCloudApi(conversation: WaConversation, input: SendToConversationInput) {
  const connection = await getWhatsAppProviderConnectionForStoredChannel(conversation.channelKey);
  if (!connection) {
    throw new Error(`No hay conexión Cloud API activa para phone_number_id ${conversation.channelKey}.`);
  }
  const provider = new MetaCloudWhatsAppProvider(async () => connection);

  const withinWindow = isWithinFreeTextWindow(conversation.lastInboundAt);

  let waMessageId: string | undefined;
  let body: string | null;

  if (input.template) {
    const result = await sendTemplateMessage({
      phoneNumberId: conversation.channelKey,
      businessToken: connection.businessToken,
      to: conversation.contactWaId,
      templateName: input.template.name,
      languageCode: input.template.languageCode,
      components: input.template.components,
    });
    waMessageId = extractMessageId(result);
    body = `[template:${input.template.name}]`;
  } else {
    if (!withinWindow) throw new OutsideFreeTextWindowError();
    if (!input.text) throw new Error("Falta `text` cuando no se envía un template.");
    const result = await provider.sendText({
      connectionId: connection.id,
      to: conversation.contactWaId,
      body: input.text,
    });
    waMessageId = result.messageId ?? undefined;
    body = input.text;
  }

  return insertMessage({
    conversationId: conversation.id,
    waMessageId: waMessageId ?? null,
    direction: "out",
    source: input.source ?? "api",
    msgType: input.template ? "template" : "text",
    body,
    payload: input.metadata,
    status: "sent",
  });
}

async function sendWaha(conversation: WaConversation, input: SendToConversationInput) {
  if (!input.text) throw new Error("El envío por WAHA hoy solo soporta texto libre.");
  const result = await sendWahaText(conversation.channelKey, conversation.contactWaId, input.text);
  return insertMessage({
    conversationId: conversation.id,
    waMessageId: result.id ?? null,
    direction: "out",
    source: input.source ?? "api",
    msgType: "text",
    body: input.text,
    payload: input.metadata,
    status: "sent",
  });
}

function extractMessageId(result: unknown): string | undefined {
  const messages = (result as { messages?: Array<{ id?: string }> } | undefined)?.messages;
  return messages?.[0]?.id;
}
