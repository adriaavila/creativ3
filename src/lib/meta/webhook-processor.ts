import {
  insertMessage,
  syncMetaContact,
  updateMessageStatusByWaId,
  upsertConversation,
} from "@/lib/whatsapp-inbox-db";
import { normalizeWhatsAppPhone } from "@/lib/phone";
import { findWabaOwner, markWhatsAppConnectionStatusByWaba } from "@/lib/whatsapp-connections-db";
import { normalizeMetaWebhook } from "@/lib/meta/cloud-whatsapp-provider";
import type { WhatsAppNormalizedEvent } from "@/lib/whatsapp-provider";
import {
  claimMetaWebhookEvents,
  deferMetaWebhookEvent,
  markMetaWebhookEventFailed,
  markMetaWebhookEventProcessed,
} from "@/lib/meta/webhook-events-db";
import {
  accountUpdateAlertText,
  classifyAccountUpdate,
  deferUntil,
  PARTNER_ADDED_MATCH_MS,
  type AccountUpdateAlert,
} from "@/lib/meta/account-update-alerts";
import { sendTelegramAlert } from "@/lib/telegram-alert";

export async function processMetaWebhookQueue(limit = 10) {
  const events = await claimMetaWebhookEvents(limit);
  let processed = 0;
  let failed = 0;

  for (const event of events) {
    try {
      const normalized = normalizeMetaWebhook(event.payload);
      const alerts = normalized.map(classifyAccountUpdate).filter((alert) => alert !== null);
      const until = deferUntil(alerts, event.receivedAt);
      if (until) {
        await deferMetaWebhookEvent(event.id, until);
        continue;
      }
      let persisted = 0;
      for (const item of normalized) persisted += await persistNormalizedEvent(item);
      for (const alert of alerts) await alertAccountUpdate(alert, event.receivedAt);
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

async function alertAccountUpdate(alert: AccountUpdateAlert, receivedAt: Date) {
  const since = alert.kind === "partner_added" ? new Date(receivedAt.getTime() - PARTNER_ADDED_MATCH_MS) : undefined;
  const text = accountUpdateAlertText(alert, await findWabaOwner(alert.wabaId, since));
  if (!text) return;
  const sent = await sendTelegramAlert(text);
  console.warn(JSON.stringify({ event: "whatsapp_account_alert", kind: alert.kind, waba_id: alert.wabaId, sent }));
}

async function persistNormalizedEvent(event: WhatsAppNormalizedEvent): Promise<number> {
  if (event.type === "error.received") {
    // The customer may decline history sharing during Embedded Signup. Meta
    // reports that valid choice as 2593109; it must not poison the durable queue.
    if (event.code === 2593109 || event.reason === "history_sync_not_shared") return 0;
    throw new Error(event.reason);
  }

  if (event.type === "contact.updated") {
    if (!event.phoneNumberId) throw new Error("contact_missing_phone_number_id");
    await syncMetaContact({
      phoneNumberId: event.phoneNumberId,
      contactPhone: normalizeWhatsAppPhone(event.contactPhone) ?? event.contactPhone,
      contactName: event.contactName,
      action: event.action,
    });
    return 1;
  }

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
  const contactWaId =
    (direction === "in" ? event.message.from : event.message.to) ?? event.message.contactPhone;
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
    status: event.message.status ?? null,
    occurredAt: event.occurredAt,
  });
  return inserted ? 1 : 0;
}
