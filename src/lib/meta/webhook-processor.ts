import {
  insertMessage,
  updateMessageStatusByWaId,
  upsertConversation,
} from "@/lib/whatsapp-inbox-db";
import { enqueueAutoReplyJob } from "@/lib/auto-reply";
import { normalizeWhatsAppPhone } from "@/lib/phone";
import { markWhatsAppConnectionStatusByWaba } from "@/lib/whatsapp-connections-db";
import { normalizeMetaWebhook } from "@/lib/meta/cloud-whatsapp-provider";
import type { WhatsAppNormalizedEvent } from "@/lib/whatsapp-provider";
import {
  claimMetaWebhookEvents,
  markMetaWebhookEventFailed,
  markMetaWebhookEventProcessed,
} from "@/lib/meta/webhook-events-db";

export async function processMetaWebhookQueue(limit = 10) {
  const events = await claimMetaWebhookEvents(limit);
  let processed = 0;
  let failed = 0;

  for (const event of events) {
    try {
      const normalized = normalizeMetaWebhook(event.payload);
      let persisted = 0;
      for (const item of normalized) persisted += await persistNormalizedEvent(item);
      await markMetaWebhookEventProcessed(event.id);
      processed += 1;
      console.info(JSON.stringify({
        event: "meta_webhook_processed",
        event_id: event.id,
        event_key: event.eventKey.slice(0, 12),
        attempts: event.attempts,
        normalized_events: normalized.length,
        persisted,
      }));
    } catch (error) {
      failed += 1;
      await markMetaWebhookEventFailed(event.id, event.attempts, error);
      console.error(JSON.stringify({
        event: "meta_webhook_processing_failed",
        event_id: event.id,
        event_key: event.eventKey.slice(0, 12),
        attempts: event.attempts,
      }));
    }
  }

  return { claimed: events.length, processed, failed };
}

async function persistNormalizedEvent(event: WhatsAppNormalizedEvent): Promise<number> {
  if (event.type === "error.received") throw new Error(event.reason);

  if (event.type === "message.status.updated") {
    return (await updateMessageStatusByWaId(event.messageId, event.status)) ? 1 : 0;
  }

  if (event.type === "connection.updated") {
    if (event.wabaId && event.state === "disconnected") {
      await markWhatsAppConnectionStatusByWaba(event.wabaId, "disconnected");
      return 1;
    }
    return 0;
  }

  if (!event.phoneNumberId) throw new Error("message_missing_phone_number_id");
  const direction = event.message.direction === "inbound" ? "in" : "out";
  const contactWaId = direction === "in" ? event.message.from : event.message.to;
  if (!contactWaId) throw new Error("message_missing_contact_id");
  const conversation = await upsertConversation({
    channelKind: "cloud_api",
    channelKey: event.phoneNumberId,
    contactWaId,
    contactPhone: normalizeWhatsAppPhone(event.message.contactPhone),
    contactName: event.message.contactName,
    direction,
    occurredAt: event.occurredAt,
  });
  const inserted = await insertMessage({
    conversationId: conversation.id,
    waMessageId: event.message.id,
    direction,
    source: event.message.source === "business_app" ? "phone" : "api",
    msgType: event.message.type,
    body: event.message.text ?? null,
    payload: event,
    occurredAt: event.occurredAt,
  });
  if (inserted && direction === "in") await enqueueAutoReplyJob(conversation.id, inserted.id);
  return inserted ? 1 : 0;
}
