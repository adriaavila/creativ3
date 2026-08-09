export const WHATSAPP_CONNECTION_MODES = ["META_CLOUD_API", "META_COEXISTENCE", "WAHA"] as const;

export type WhatsAppConnectionMode = (typeof WHATSAPP_CONNECTION_MODES)[number];

export type WhatsAppConnectionStatus = {
  connectionId: string;
  mode: WhatsAppConnectionMode;
  state: "connected" | "disconnected" | "error" | "unknown";
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  nameStatus?: string;
};

export type WhatsAppSendTextInput = {
  connectionId: string;
  to: string;
  body: string;
  clientMessageId?: string;
  replyTo?: string;
};

export type WhatsAppMediaType = "audio" | "document" | "image" | "sticker" | "video";

export type WhatsAppSendMediaInput = {
  connectionId: string;
  to: string;
  type: WhatsAppMediaType;
  mediaId?: string;
  link?: string;
  caption?: string;
  filename?: string;
};

export type WhatsAppMarkAsReadInput = {
  connectionId: string;
  messageId: string;
  to?: string;
};

export type WhatsAppSendResult = {
  messageId: string | null;
};

type WhatsAppNormalizedEventBase = {
  provider: "META_CLOUD_API" | "WAHA";
  wabaId?: string;
  phoneNumberId?: string;
  sessionId?: string;
  engine?: string;
  occurredAt?: string;
};

export type WhatsAppMessageReceivedEvent = WhatsAppNormalizedEventBase & {
  type: "message.received";
  message: {
    id: string;
    from?: string;
    to?: string;
    direction: "inbound" | "outbound";
    source: "cloud_api" | "business_app" | "waha" | "phone";
    type: string;
    text?: string;
    status?: string;
    contactName?: string;
    contactPhone?: string;
  };
};

export type WhatsAppContactUpdatedEvent = WhatsAppNormalizedEventBase & {
  type: "contact.updated";
  contactPhone: string;
  contactName?: string;
  action: "add" | "remove";
};

export type WhatsAppMessageStatusUpdatedEvent = WhatsAppNormalizedEventBase & {
  type: "message.status.updated";
  messageId: string;
  status: string;
  recipientId?: string;
};

export type WhatsAppConnectionUpdatedEvent = WhatsAppNormalizedEventBase & {
  type: "connection.updated";
  update: string;
  state?: WhatsAppConnectionStatus["state"];
  reason?: string;
};

export type WhatsAppErrorReceivedEvent = WhatsAppNormalizedEventBase & {
  type: "error.received";
  reason: string;
  code?: number;
  title?: string;
  details?: string;
  unsupportedField?: string;
};

export type WhatsAppNormalizedEvent =
  | WhatsAppMessageReceivedEvent
  | WhatsAppContactUpdatedEvent
  | WhatsAppMessageStatusUpdatedEvent
  | WhatsAppConnectionUpdatedEvent
  | WhatsAppErrorReceivedEvent;

export interface WhatsAppProvider {
  getConnectionStatus(connectionId: string): Promise<WhatsAppConnectionStatus>;
  sendText(input: WhatsAppSendTextInput): Promise<WhatsAppSendResult>;
  sendMedia(input: WhatsAppSendMediaInput): Promise<WhatsAppSendResult>;
  markAsRead(input: WhatsAppMarkAsReadInput): Promise<void>;
  normalizeWebhook(payload: unknown): WhatsAppNormalizedEvent[];
  disconnect(connectionId: string): Promise<void>;
}
