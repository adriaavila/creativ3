import {
  type WhatsAppConnectionStatus,
  type WhatsAppMarkAsReadInput,
  type WhatsAppNormalizedEvent,
  type WhatsAppProvider,
  type WhatsAppSendMediaInput,
  type WhatsAppSendResult,
  type WhatsAppSendTextInput,
} from "@/lib/whatsapp-provider";
import { getWahaSnapshot } from "@/lib/waha";
import { normalizeWhatsAppPhone } from "@/lib/phone";
import {
  markWahaRead,
  sendWahaMedia,
  sendWahaText,
  stopWahaSession,
} from "@/lib/waha-send";

type WahaConnection = { connectionId: string; sessionId: string };

export class WahaWhatsAppProvider implements WhatsAppProvider {
  constructor(private readonly resolve: (connectionId: string) => Promise<WahaConnection | null>) {}

  private async connection(connectionId: string) {
    const connection = await this.resolve(connectionId);
    if (!connection) throw new Error("Conexión WAHA no encontrada.");
    return connection;
  }

  async getConnectionStatus(connectionId: string): Promise<WhatsAppConnectionStatus> {
    const connection = await this.connection(connectionId);
    const snapshot = await getWahaSnapshot(connection.sessionId);
    const session = snapshot.sessions[0];
    return {
      connectionId,
      mode: "WAHA",
      state: session?.status === "connected"
        ? "connected"
        : session?.status === "failed"
          ? "error"
          : session ? "disconnected" : "unknown",
      displayPhoneNumber: session?.phone ?? undefined,
    };
  }

  async sendText(input: WhatsAppSendTextInput): Promise<WhatsAppSendResult> {
    const connection = await this.connection(input.connectionId);
    const result = await sendWahaText(connection.sessionId, input.to, input.body, {
      id: input.clientMessageId,
      replyTo: input.replyTo,
    });
    return { messageId: result.id ?? input.clientMessageId ?? null };
  }

  async sendMedia(input: WhatsAppSendMediaInput): Promise<WhatsAppSendResult> {
    if (!input.link) throw new Error("WAHA requiere un enlace de medios accesible.");
    const connection = await this.connection(input.connectionId);
    const result = await sendWahaMedia({
      sessionId: connection.sessionId,
      waId: input.to,
      url: input.link,
      mimetype: input.type === "image" ? "image/jpeg" : "application/octet-stream",
      filename: input.filename,
      caption: input.caption,
    });
    return { messageId: result.id ?? null };
  }

  async markAsRead(input: WhatsAppMarkAsReadInput): Promise<void> {
    if (!input.to) throw new Error("El chat es obligatorio para marcar como leído.");
    const connection = await this.connection(input.connectionId);
    await markWahaRead(connection.sessionId, input.to, input.messageId);
  }

  normalizeWebhook(value: unknown): WhatsAppNormalizedEvent[] {
    const event = record(value);
    const payload = record(event.payload);
    const sessionId = text(event.session);
    const occurredAt = typeof payload.timestamp === "number"
      ? new Date(payload.timestamp * 1000).toISOString()
      : undefined;

    if (event.event === "message" && text(payload.id)) {
      const fromMe = payload.fromMe === true;
      const name = fromMe ? undefined : contactName(payload);
      return [{
        provider: "WAHA",
        sessionId,
        occurredAt,
        type: "message.received",
        message: {
          id: text(payload.id)!,
          from: chatId(fromMe ? payload.to : payload.from),
          to: chatId(fromMe ? payload.from : payload.to),
          direction: fromMe ? "outbound" : "inbound",
          source: fromMe ? "phone" : "waha",
          type: text(payload.type) ?? "text",
          text: text(payload.body),
          ...(name ? { contactName: name } : {}),
        },
      }];
    }
    if (event.event === "message.ack" && text(payload.id)) {
      return [{
        provider: "WAHA",
        sessionId,
        occurredAt,
        type: "message.status.updated",
        messageId: text(payload.id)!,
        status: text(payload.ackName) ?? String(payload.ack ?? "unknown"),
      }];
    }
    if (event.event === "session.status") {
      const status = text(payload.status)?.toUpperCase() ?? "UNKNOWN";
      return [{
        provider: "WAHA",
        sessionId,
        occurredAt,
        type: "connection.updated",
        update: status,
        state: status === "WORKING" ? "connected" : status === "FAILED" ? "error" : "disconnected",
        reason: text(payload.error) ?? text(payload.reason),
      }];
    }
    return [];
  }

  async disconnect(connectionId: string): Promise<void> {
    const connection = await this.connection(connectionId);
    await stopWahaSession(connection.sessionId);
  }
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function chatId(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  return normalizeWhatsAppPhone(raw) ?? raw.replace(/@c\.us$|@s\.whatsapp\.net$/, "");
}

function contactName(payload: Record<string, unknown>): string | undefined {
  const data = record(payload._data);
  return text(payload.notifyName)
    ?? text(payload.pushName)
    ?? text(data.notifyName)
    ?? text(data.pushName);
}
