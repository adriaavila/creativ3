import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { enqueueMetaWebhookEvent } from "../src/lib/meta/webhook-events-db";
import { processMetaWebhookQueue } from "../src/lib/meta/webhook-processor";
import {
  claimWhatsAppCoexistenceSync,
  recordWhatsAppCoexistenceSync,
  upsertWhatsAppConnection,
} from "../src/lib/whatsapp-connections-db";

if (process.env.WEBHOOK_DB_CHECK !== "1" || !process.env.DATABASE_URL) {
  throw new Error("Run with WEBHOOK_DB_CHECK=1 and DATABASE_URL set against a disposable or empty queue.");
}

const phoneNumberId = "allok-webhook-check-phone";
const contactWaId = "15550009999";
const messageId = "wamid.allok-webhook-check";
const connectionWabaId = "allok-coexistence-claim-check-waba";
const connectionPhoneId = "allok-coexistence-claim-check-phone";
const historyInboundId = "wamid.allok-history-in-check";
const historyOutboundId = "wamid.allok-history-out-check";
const payload = {
  object: "whatsapp_business_account",
  entry: [{
    id: "allok-webhook-check-waba",
    changes: [
      {
        field: "messages",
        value: {
          metadata: { phone_number_id: phoneNumberId },
          messages: [{
            id: messageId,
            from: contactWaId,
            timestamp: "1700000000",
            type: "text",
            text: { body: "webhook durability check" },
          }],
        },
      },
      {
        field: "history",
        value: {
          metadata: {
            phone_number_id: phoneNumberId,
            display_phone_number: "15550001111",
          },
          history: [{
            threads: [{
              id: contactWaId,
              messages: [
                {
                  id: historyInboundId,
                  from: contactWaId,
                  timestamp: "1699999900",
                  type: "text",
                  text: { body: "history inbound check" },
                  history_context: { status: "delivered" },
                },
                {
                  id: historyOutboundId,
                  from: "15550001111",
                  to: contactWaId,
                  timestamp: "1699999950",
                  type: "text",
                  text: { body: "history outbound check" },
                  history_context: { status: "read" },
                },
              ],
            }],
          }],
        },
      },
      {
        field: "smb_app_state_sync",
        value: {
          metadata: { phone_number_id: phoneNumberId },
          state_sync: [{
            type: "contact",
            contact: { full_name: "Allok DB Check", phone_number: contactWaId },
            action: "add",
            metadata: { timestamp: "1700000001" },
          }],
        },
      },
    ],
  }],
};
const rawBody = JSON.stringify(payload);
const eventKey = createHash("sha256").update(rawBody).digest("hex");
const sql = neon(process.env.DATABASE_URL);

async function cleanup() {
  await sql`DELETE FROM meta_whatsapp_webhook_events WHERE event_key = ${eventKey}`;
  await sql`
    DELETE FROM wa_conversations
    WHERE channel_kind = 'cloud_api' AND channel_key = ${phoneNumberId}
      AND contact_wa_id = ${contactWaId}
  `;
  await sql`
    DELETE FROM whatsapp_connections
    WHERE waba_id = ${connectionWabaId} AND phone_number_id = ${connectionPhoneId}
  `;
}

async function main() {
  try {
    await cleanup();
    const first = await enqueueMetaWebhookEvent(rawBody, payload);
    const duplicate = await enqueueMetaWebhookEvent(rawBody, payload);
    assert.equal(first.duplicate, false);
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.id, first.id);

    assert.deepEqual(await processMetaWebhookQueue(1), { claimed: 1, processed: 1, failed: 0 });
    const rows = await sql`
      SELECT event.status, count(message.id)::int AS messages,
        max(conversation.contact_name) AS contact_name,
        array_agg(message.status ORDER BY message.wa_message_id) AS statuses
      FROM meta_whatsapp_webhook_events event
      LEFT JOIN wa_messages message
        ON message.wa_message_id IN (${messageId}, ${historyInboundId}, ${historyOutboundId})
      LEFT JOIN wa_conversations conversation ON conversation.id = message.conversation_id
      WHERE event.event_key = ${eventKey}
      GROUP BY event.status
    `;
    assert.equal(rows[0]?.status, "processed");
    assert.equal(Number(rows[0]?.messages), 3);
    assert.equal(rows[0]?.contact_name, "Allok DB Check");
    assert.deepEqual([...rows[0].statuses].sort(), ["delivered", "read", null].sort());
    assert.deepEqual(await processMetaWebhookQueue(1), { claimed: 0, processed: 0, failed: 0 });
    const connectionInput = {
      payload: {
        code: "db-check-code",
        waba_id: connectionWabaId,
        phone_number_id: connectionPhoneId,
        client: "allok-db-check",
      },
      businessToken: "allok-db-check-token",
      tokenMetadata: { scopes: [] },
      phoneProfile: { id: connectionPhoneId },
      status: "subscribed",
      connectedAt: new Date().toISOString(),
      connectionMode: "META_COEXISTENCE" as const,
      onboardingNonce: "signup-nonce-1",
    };
    await upsertWhatsAppConnection(connectionInput);
    const firstClaim = await claimWhatsAppCoexistenceSync({
      wabaId: connectionWabaId,
      phoneNumberId: connectionPhoneId,
      onboardingNonce: "signup-nonce-1",
      requestedAt: new Date().toISOString(),
    });
    assert.equal(firstClaim.claimed, true);
    await recordWhatsAppCoexistenceSync({
      wabaId: connectionWabaId,
      phoneNumberId: connectionPhoneId,
      status: "coexistence_sync_requested",
      metadata: {
        onboarding_nonce: "signup-nonce-1",
        state: "finished",
        final_status: "coexistence_sync_requested",
      },
    });

    await upsertWhatsAppConnection(connectionInput);
    const duplicateClaim = await claimWhatsAppCoexistenceSync({
      wabaId: connectionWabaId,
      phoneNumberId: connectionPhoneId,
      onboardingNonce: "signup-nonce-1",
      requestedAt: new Date().toISOString(),
    });
    assert.equal(duplicateClaim.claimed, false);
    assert.equal(duplicateClaim.status, "coexistence_sync_requested");
    assert.equal(duplicateClaim.metadata?.onboarding_nonce, "signup-nonce-1");

    await upsertWhatsAppConnection({ ...connectionInput, onboardingNonce: "signup-nonce-2" });
    const freshOnboardingClaim = await claimWhatsAppCoexistenceSync({
      wabaId: connectionWabaId,
      phoneNumberId: connectionPhoneId,
      onboardingNonce: "signup-nonce-2",
      requestedAt: new Date().toISOString(),
    });
    assert.equal(freshOnboardingClaim.claimed, true);
    console.log("Meta webhook DB OK: enqueue, deduplication, history, contacts, processing, and idempotency checked.");
  } finally {
    await cleanup();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
