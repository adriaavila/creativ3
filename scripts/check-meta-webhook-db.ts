import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { enqueueMetaWebhookEvent } from "../src/lib/meta/webhook-events-db";
import { processMetaWebhookQueue } from "../src/lib/meta/webhook-processor";

if (process.env.WEBHOOK_DB_CHECK !== "1" || !process.env.DATABASE_URL) {
  throw new Error("Run with WEBHOOK_DB_CHECK=1 and DATABASE_URL set against a disposable or empty queue.");
}

const phoneNumberId = "allok-webhook-check-phone";
const contactWaId = "15550009999";
const messageId = "wamid.allok-webhook-check";
const payload = {
  object: "whatsapp_business_account",
  entry: [{
    id: "allok-webhook-check-waba",
    changes: [{
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
    }],
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
      SELECT event.status, count(message.id)::int AS messages
      FROM meta_whatsapp_webhook_events event
      LEFT JOIN wa_messages message ON message.wa_message_id = ${messageId}
      WHERE event.event_key = ${eventKey}
      GROUP BY event.status
    `;
    assert.equal(rows[0]?.status, "processed");
    assert.equal(Number(rows[0]?.messages), 1);
    assert.deepEqual(await processMetaWebhookQueue(1), { claimed: 0, processed: 0, failed: 0 });
    console.log("Meta webhook DB OK: durable enqueue, deduplication, processing, and idempotency checked.");
  } finally {
    await cleanup();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
