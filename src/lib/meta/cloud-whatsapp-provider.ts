import type {
  WhatsAppConnectionMode,
  WhatsAppConnectionStatus,
  WhatsAppErrorReceivedEvent,
  WhatsAppMarkAsReadInput,
  WhatsAppNormalizedEvent,
  WhatsAppProvider,
  WhatsAppReferral,
  WhatsAppSendMediaInput,
  WhatsAppSendResult,
  WhatsAppSendTextInput,
} from "../whatsapp-provider";
import {
  deregisterPhoneNumber,
  getGraphVersion,
  getWhatsAppPhoneProfile,
  markWhatsAppMessageAsRead,
  sendMediaMessage,
  sendPreparedTextMessage,
  unsubscribeWabaFromApp,
  type MetaMessageResponse,
} from "./server";

export type MetaCloudConnection = {
  id: string;
  mode: WhatsAppConnectionMode;
  wabaId: string;
  phoneNumberId: string;
  businessToken: string;
};

export type MetaConnectionResolver = (
  connectionId: string,
) => MetaCloudConnection | Promise<MetaCloudConnection>;

export class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  constructor(
    private readonly resolveConnection: MetaConnectionResolver,
    private readonly graphVersion = getGraphVersion(),
  ) {}

  async getConnectionStatus(connectionId: string): Promise<WhatsAppConnectionStatus> {
    const connection = await this.getConnection(connectionId);
    const profile = await getWhatsAppPhoneProfile(
      connection.phoneNumberId,
      connection.businessToken,
      this.graphVersion,
    );

    return {
      connectionId: connection.id,
      mode: connection.mode,
      state: "connected",
      phoneNumberId: profile.id ?? connection.phoneNumberId,
      displayPhoneNumber: profile.display_phone_number,
      verifiedName: profile.verified_name,
      qualityRating: profile.quality_rating,
      nameStatus: profile.name_status,
    };
  }

  async sendText(input: WhatsAppSendTextInput): Promise<WhatsAppSendResult> {
    const connection = await this.getConnection(input.connectionId);
    const to = requireString(input.to, "to");
    const body = requireString(input.body, "body");
    const response = await sendPreparedTextMessage({
      phoneNumberId: connection.phoneNumberId,
      businessToken: connection.businessToken,
      to,
      body,
      graphVersion: this.graphVersion,
    });

    return messageResult(response);
  }

  async sendMedia(input: WhatsAppSendMediaInput): Promise<WhatsAppSendResult> {
    const connection = await this.getConnection(input.connectionId);
    const to = requireString(input.to, "to");
    const mediaId = optionalString(input.mediaId);
    const link = optionalString(input.link);

    if (Boolean(mediaId) === Boolean(link)) {
      throw new TypeError("Exactly one of mediaId or link is required");
    }

    if (input.caption && !["document", "image", "video"].includes(input.type)) {
      throw new TypeError(`caption is not supported for ${input.type} messages`);
    }

    if (input.filename && input.type !== "document") {
      throw new TypeError(`filename is not supported for ${input.type} messages`);
    }

    const response = await sendMediaMessage({
      phoneNumberId: connection.phoneNumberId,
      businessToken: connection.businessToken,
      to,
      type: input.type,
      mediaId,
      link,
      caption: optionalString(input.caption),
      filename: optionalString(input.filename),
      graphVersion: this.graphVersion,
    });

    return messageResult(response);
  }

  async markAsRead(input: WhatsAppMarkAsReadInput): Promise<void> {
    const connection = await this.getConnection(input.connectionId);
    await markWhatsAppMessageAsRead({
      phoneNumberId: connection.phoneNumberId,
      businessToken: connection.businessToken,
      messageId: requireString(input.messageId, "messageId"),
      graphVersion: this.graphVersion,
    });
  }

  normalizeWebhook(payload: unknown): WhatsAppNormalizedEvent[] {
    return normalizeMetaWebhook(payload);
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = await this.getConnection(connectionId);

    if (connection.mode === "META_CLOUD_API") {
      await deregisterPhoneNumber({
        phoneNumberId: connection.phoneNumberId,
        businessToken: connection.businessToken,
        graphVersion: this.graphVersion,
      });
    }

    await unsubscribeWabaFromApp({
      wabaId: connection.wabaId,
      businessToken: connection.businessToken,
      graphVersion: this.graphVersion,
    });
  }

  private async getConnection(connectionId: string) {
    const requestedId = requireString(connectionId, "connectionId");
    const connection = await this.resolveConnection(requestedId);

    if (!connection || connection.id !== requestedId) {
      throw new Error(`Connection resolver returned no match for ${requestedId}`);
    }

    if (connection.mode !== "META_CLOUD_API" && connection.mode !== "META_COEXISTENCE") {
      throw new TypeError(`Unsupported WhatsApp connection mode: ${String(connection.mode)}`);
    }

    requireString(connection.wabaId, "connection.wabaId");
    requireString(connection.phoneNumberId, "connection.phoneNumberId");
    requireString(connection.businessToken, "connection.businessToken");
    return connection;
  }
}

export function normalizeMetaWebhook(payload: unknown): WhatsAppNormalizedEvent[] {
  if (!isRecord(payload) || payload.object !== "whatsapp_business_account") {
    return [webhookError("invalid_webhook_payload")];
  }

  const events: WhatsAppNormalizedEvent[] = [];

  for (const entry of records(payload.entry)) {
    const wabaId = optionalString(entry.id);
    const entryTimestamp = normalizeTimestamp(entry.time);

    for (const change of records(entry.changes)) {
      const field = optionalString(change.field);
      const value = isRecord(change.value) ? change.value : undefined;
      const metadata = value && isRecord(value.metadata) ? value.metadata : undefined;
      const phoneNumberId = optionalString(metadata?.phone_number_id ?? value?.phone_number_id);
      const base = { provider: "META_CLOUD_API" as const, wabaId, phoneNumberId };

      if (!field || !value) {
        events.push({ ...base, ...webhookError("invalid_webhook_change") });
        continue;
      }

      if (field === "messages") {
        for (const message of records(value.messages)) {
          const id = optionalString(message.id);
          if (!id) {
            events.push({ ...base, ...webhookError("invalid_message_shape") });
            continue;
          }

          const contact = findMetaContact(message, records(value.contacts));
          const contactName = isRecord(contact?.profile)
            ? optionalString(contact.profile.name)
            : undefined;
          const contactPhone = optionalString(message.from ?? contact?.wa_id);
          const referral = referralOf(message);

          events.push({
            ...base,
            type: "message.received",
            occurredAt: normalizeTimestamp(message.timestamp) ?? entryTimestamp,
            message: {
              id,
              from: optionalString(message.from ?? contact?.wa_id ?? message.from_user_id),
              to: optionalString(metadata?.display_phone_number),
              direction: "inbound",
              source: "cloud_api",
              type: optionalString(message.type) ?? "unknown",
              text: textBody(message),
              ...(contactName ? { contactName } : {}),
              ...(contactPhone ? { contactPhone } : {}),
              ...(referral ? { referral } : {}),
            },
          });
        }

        for (const status of records(value.statuses)) {
          const messageId = optionalString(status.id);
          const statusName = optionalString(status.status);
          const occurredAt = normalizeTimestamp(status.timestamp) ?? entryTimestamp;

          if (messageId && statusName) {
            events.push({
              ...base,
              type: "message.status.updated",
              occurredAt,
              messageId,
              status: statusName,
              recipientId: optionalString(status.recipient_id),
            });
          } else {
            events.push({ ...base, ...webhookError("invalid_message_status_shape") });
          }

          for (const error of records(status.errors)) {
            events.push({ ...base, occurredAt, ...normalizeGraphWebhookError(error) });
          }
        }

        for (const error of records(value.errors)) {
          events.push({ ...base, ...normalizeGraphWebhookError(error) });
        }
        continue;
      }

      if (field === "account_update") {
        const update = optionalString(value.event);
        if (!update) {
          events.push({ ...base, ...webhookError("invalid_account_update_shape") });
          continue;
        }

        events.push({
          ...base,
          type: "connection.updated",
          occurredAt: normalizeTimestamp(value.timestamp) ?? entryTimestamp,
          update,
          state: update === "PARTNER_REMOVED" ? "disconnected" : undefined,
          reason: optionalString(value.reason),
        });
        continue;
      }

      if (field === "smb_message_echoes") {
        const echoes = records(value.message_echoes);
        if (echoes.length === 0) {
          events.push({ ...base, ...webhookError("invalid_smb_message_echoes_shape") });
          continue;
        }

        for (const echo of echoes) {
          const id = optionalString(echo.id);
          if (!id) {
            events.push({ ...base, ...webhookError("invalid_smb_message_echo_shape") });
            continue;
          }

          events.push({
            ...base,
            type: "message.received",
            occurredAt: normalizeTimestamp(echo.timestamp) ?? entryTimestamp,
            message: {
              id,
              from: optionalString(echo.from),
              to: optionalString(echo.to),
              direction: "outbound",
              source: "business_app",
              type: optionalString(echo.type) ?? "unknown",
              text: textBody(echo),
            },
          });
        }
        continue;
      }

      if (field === "history") {
        const historyChunks = records(value.history);
        if (historyChunks.length === 0) {
          for (const error of records(value.errors)) {
            events.push({ ...base, ...normalizeHistoryError(error) });
          }
          if (records(value.errors).length === 0) {
            events.push({ ...base, ...webhookError("invalid_history_shape") });
          }
          continue;
        }

        const businessPhone = digitsOnly(metadata?.display_phone_number);
        for (const history of historyChunks) {
          for (const thread of records(history.threads)) {
            const threadId = optionalString(thread.id);
            for (const message of records(thread.messages)) {
              const id = optionalString(message.id);
              const from = optionalString(message.from);
              const to = optionalString(message.to);
              if (!id || !from || !threadId) {
                events.push({ ...base, ...webhookError("invalid_history_message_shape") });
                continue;
              }

              // Meta only includes `to` for messages sent from the Business App.
              // Comparing the sender with the business number also preserves the
              // correct direction if a fixture omits `to`.
              const outbound = Boolean(to) || (businessPhone && digitsOnly(from) === businessPhone);
              const historyContext = isRecord(message.history_context)
                ? message.history_context
                : undefined;
              events.push({
                ...base,
                type: "message.received",
                occurredAt: normalizeTimestamp(message.timestamp) ?? entryTimestamp,
                message: {
                  id,
                  from,
                  ...(to ? { to } : {}),
                  direction: outbound ? "outbound" : "inbound",
                  source: to ? "business_app" : "cloud_api",
                  type: optionalString(message.type) ?? "unknown",
                  text: textBody(message),
                  status: optionalString(historyContext?.status),
                  contactPhone: threadId,
                },
              });
            }
          }

          for (const error of records(history.errors)) {
            events.push({ ...base, ...normalizeHistoryError(error) });
          }
        }
        continue;
      }

      if (field === "smb_app_state_sync") {
        const stateChanges = records(value.state_sync);
        if (stateChanges.length === 0) {
          events.push({ ...base, ...webhookError("invalid_smb_app_state_sync_shape") });
          continue;
        }

        for (const stateChange of stateChanges) {
          if (stateChange.type !== "contact" || !isRecord(stateChange.contact)) continue;
          const action = optionalString(stateChange.action);
          const contactPhone = optionalString(stateChange.contact.phone_number);
          if (!contactPhone || (action !== "add" && action !== "remove")) {
            events.push({ ...base, ...webhookError("invalid_contact_sync_shape") });
            continue;
          }
          const stateMetadata = isRecord(stateChange.metadata) ? stateChange.metadata : undefined;
          events.push({
            ...base,
            type: "contact.updated",
            occurredAt: normalizeTimestamp(stateMetadata?.timestamp) ?? entryTimestamp,
            contactPhone,
            contactName: optionalString(
              stateChange.contact.full_name ?? stateChange.contact.first_name,
            ),
            action,
          });
        }
        continue;
      }

      events.push({
        ...base,
        ...webhookError("unsupported_webhook_shape", { unsupportedField: field }),
      });
    }
  }

  return events;
}

function findMetaContact(message: Record<string, unknown>, contacts: Record<string, unknown>[]) {
  const from = optionalString(message.from);
  const fromUserId = optionalString(message.from_user_id);
  const match = contacts.find((contact) => {
    const waId = optionalString(contact.wa_id);
    const userId = optionalString(contact.user_id);
    return (from && waId === from) || (fromUserId && userId === fromUserId);
  });
  return match ?? (contacts.length === 1 ? contacts[0] : undefined);
}

function messageResult(response: MetaMessageResponse): WhatsAppSendResult {
  return { messageId: optionalString(response.messages?.[0]?.id) ?? null };
}

function normalizeGraphWebhookError(error: Record<string, unknown>): WhatsAppErrorReceivedEvent {
  const errorData = isRecord(error.error_data) ? error.error_data : undefined;
  return webhookError("meta_webhook_error", {
    code: finiteNumber(error.code),
    title: optionalString(error.title),
    details: optionalString(errorData?.details ?? error.message),
  });
}

function normalizeHistoryError(error: Record<string, unknown>): WhatsAppErrorReceivedEvent {
  const normalized = normalizeGraphWebhookError(error);
  if (normalized.code === 2593109) {
    return { ...normalized, reason: "history_sync_not_shared" };
  }
  return normalized;
}

function webhookError(
  reason: string,
  details: Omit<WhatsAppErrorReceivedEvent, "provider" | "reason" | "type"> = {},
): WhatsAppErrorReceivedEvent {
  return {
    type: "error.received",
    provider: "META_CLOUD_API",
    reason,
    ...details,
  };
}

function textBody(message: Record<string, unknown>) {
  const text = isRecord(message.text) ? message.text : undefined;
  return optionalString(text?.body);
}

/**
 * Meta manda `referral` solo en el primer mensaje de una conversación que
 * arrancó en un anuncio o un post. Se conserva entero porque distingue "vino
 * del anuncio X" de "escribió por su cuenta", y eso no se puede recuperar
 * después.
 */
function referralOf(message: Record<string, unknown>): WhatsAppReferral | undefined {
  const raw = isRecord(message.referral) ? message.referral : undefined;
  if (!raw) return undefined;
  const referral: WhatsAppReferral = {
    sourceType: optionalString(raw.source_type),
    sourceId: optionalString(raw.source_id),
    sourceUrl: optionalString(raw.source_url),
    headline: optionalString(raw.headline),
    ctwaClid: optionalString(raw.ctwa_clid),
  };
  return Object.values(referral).some(Boolean) ? referral : undefined;
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, name: string) {
  const normalized = optionalString(value);
  if (!normalized) throw new TypeError(`${name} is required`);
  return normalized;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function digitsOnly(value: unknown) {
  return optionalString(value)?.replace(/\D/g, "");
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeTimestamp(value: unknown) {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : undefined;
  if (numeric !== undefined && Number.isFinite(numeric)) {
    return new Date(numeric * 1000).toISOString();
  }

  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed.toISOString();
}
