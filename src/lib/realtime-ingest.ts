import { createHmac, randomUUID } from "node:crypto";
import type { PersistedRealtimeEvent as RealtimeEvent } from "@/lib/realtime-protocol";
import type { WaConversation, WaMessage } from "@/lib/whatsapp-inbox-db";

const REQUEST_TIMEOUT_MS = 2_000;
const MAX_RETRIES = 2;

export type RealtimeConversationChange = "assignedMode" | "outcome" | "leadId" | "lastMessageAt";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function publishRealtimeEvent(event: RealtimeEvent): Promise<void> {
  const url = process.env.REALTIME_INGEST_URL;
  const secret = process.env.REALTIME_INGEST_SECRET;
  if (!url || !secret) return;

  const body = JSON.stringify(event);
  const eventId = event.eventId;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-realtime-event-id": eventId,
          "x-realtime-signature": `sha256=${signature}`,
          "x-realtime-timestamp": timestamp,
        },
        body,
        signal: controller.signal,
      });
      if (response.ok) return;
    } catch {
      // Realtime is a delivery optimization; Neon remains the source of truth.
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < MAX_RETRIES) await sleep(100 * 2 ** attempt);
  }

  console.error(JSON.stringify({ event: "realtime_publish_failed", type: event.type }));
}

export function conversationUpdatedEvent(
  conversation: WaConversation,
  changed: RealtimeConversationChange[],
): RealtimeEvent {
  return {
    v: 1,
    eventId: `conversation.updated:${conversation.id}:${conversation.updatedAt}:${randomUUID()}`,
    type: "conversation.updated",
    occurredAt: new Date().toISOString(),
    conversationId: conversation.id,
    data: { conversation, changed },
  } as RealtimeEvent;
}

export function messageCreatedEvent(conversation: WaConversation, message: WaMessage): RealtimeEvent {
  return {
    v: 1,
    eventId: `message.created:${message.id}`,
    type: "message.created",
    occurredAt: new Date().toISOString(),
    conversationId: conversation.id,
    data: { conversation, message },
  } as RealtimeEvent;
}

export function messageUpdatedEvent(conversation: WaConversation, message: WaMessage): RealtimeEvent {
  return {
    v: 1,
    eventId: `message.updated:${message.id}:${message.status ?? "null"}:${randomUUID()}`,
    type: "message.updated",
    occurredAt: new Date().toISOString(),
    conversationId: conversation.id,
    data: { conversation, message },
  } as RealtimeEvent;
}
