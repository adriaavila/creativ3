import {
  claimWahaWebhookEvents,
  getWahaConnection,
  insertMessage,
  markWahaWebhookEventFailed,
  markWahaWebhookEventProcessed,
  noteWahaConnectionActivity,
  updateMessageStatusByWaId,
  updateWahaConnectionStatus,
  upsertConversation,
  type WahaConnectionRecord,
} from "@/lib/whatsapp-inbox-db";
import { enqueueAutoReplyJob } from "@/lib/auto-reply";
import { normalizeWhatsAppPhone } from "@/lib/phone";
import { getWahaContact, getWahaSnapshot } from "@/lib/waha";
import { WahaWhatsAppProvider } from "@/lib/waha-provider";

const provider = new WahaWhatsAppProvider(async (connectionId) => {
  const connection = await getWahaConnection(connectionId);
  return connection ? { connectionId: connection.connectionId, sessionId: connection.wahaSessionId } : null;
});

export async function processWahaWebhookQueue(limit = 10) {
  const events = await claimWahaWebhookEvents(limit);
  let processed = 0;
  let failed = 0;

  for (const event of events) {
    try {
      const connection = await getWahaConnection(event.connectionId ?? event.sessionId);
      if (!connection) throw new Error("waha_connection_not_found");
      for (const item of provider.normalizeWebhook(event.payload)) {
        await persistEvent(connection, item, event.payload);
      }
      await markWahaWebhookEventProcessed(event.eventId);
      processed += 1;
    } catch (error) {
      await markWahaWebhookEventFailed(event.eventId, event.attempts, error);
      failed += 1;
    }
  }

  return { claimed: events.length, processed, failed };
}

async function persistEvent(
  connection: WahaConnectionRecord,
  event: ReturnType<WahaWhatsAppProvider["normalizeWebhook"]>[number],
  payload: Record<string, unknown>,
) {
  if (event.type === "message.received") {
    const contactWaId = event.message.from;
    if (!contactWaId) throw new Error("waha_message_missing_contact_id");
    const direction = event.message.direction === "outbound" ? "out" : "in";
    const contact = direction === "in"
      ? await getWahaContact(connection.wahaSessionId, contactWaId)
      : null;
    const conversation = await upsertConversation({
      connectionId: connection.connectionId,
      channelKind: "waha",
      channelKey: connection.wahaSessionId,
      contactWaId,
      contactPhone: contact?.phone ?? normalizeWhatsAppPhone(contactWaId),
      contactName: contact?.name ?? event.message.contactName,
      direction,
      occurredAt: event.occurredAt,
    });
    const inserted = await insertMessage({
      conversationId: conversation.id,
      waMessageId: event.message.id,
      direction,
      source: direction === "out" ? "phone" : "api",
      msgType: event.message.type,
      body: event.message.text ?? null,
      payload,
      occurredAt: event.occurredAt,
    });
    if (inserted && direction === "in") await enqueueAutoReplyJob(conversation.id, inserted.id);
    await noteWahaConnectionActivity(connection.connectionId, direction);
    return;
  }
  if (event.type === "message.status.updated") {
    await updateMessageStatusByWaId(event.messageId, event.status);
    return;
  }
  if (event.type === "connection.updated") {
    const status = event.update === "WORKING"
      ? "connected"
      : event.update === "STARTING"
        ? "starting"
        : event.update === "SCAN_QR_CODE"
          ? "scan_qr"
          : event.update.startsWith("PASSKEY")
            ? "passkey"
            : event.update === "STOPPED"
              ? "stopped"
              : "failed";
    const snapshot = await getWahaSnapshot(connection.wahaSessionId);
    await updateWahaConnectionStatus(
      connection.wahaSessionId,
      status,
      snapshot.sessions[0]?.phone,
      event.reason ?? null,
    );
  }
}
