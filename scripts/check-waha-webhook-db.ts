import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";
import { processWahaWebhookQueue } from "../src/lib/waha-webhook-processor";
import { recordWahaWebhookEvent, upsertWahaConnection } from "../src/lib/whatsapp-inbox-db";

if (process.env.WAHA_WEBHOOK_DB_CHECK !== "1") {
  throw new Error("Set WAHA_WEBHOOK_DB_CHECK=1 to run the real database round trip.");
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const suffix = Date.now().toString(36);
  const sessionId = `codex-waha-${suffix}`;
  const eventId = `codex-waha-event-${suffix}`;

  try {
  const connection = await upsertWahaConnection({
    id: sessionId,
    workspaceId: `probe:${suffix}`,
    wahaBaseUrl: "https://probe.invalid",
  });
  assert.equal(await recordWahaWebhookEvent({
    eventId,
    connectionId: connection.connectionId,
    sessionId,
    eventType: "codex.probe",
    payload: { event: "codex.probe", session: sessionId, payload: {} },
  }), true);
  assert.equal(await recordWahaWebhookEvent({
    eventId,
    connectionId: connection.connectionId,
    sessionId,
    eventType: "codex.probe",
    payload: { event: "codex.probe", session: sessionId, payload: {} },
  }), false);

  const result = await processWahaWebhookQueue(1);
  assert.deepEqual(result, { claimed: 1, processed: 1, failed: 0 });
  const [row] = await sql`
    SELECT status, attempts, processed_at IS NOT NULL AS processed
    FROM waha_webhook_events WHERE event_id = ${eventId}
  `;
  assert.deepEqual(
    { status: row.status, attempts: Number(row.attempts), processed: row.processed },
    { status: "processed", attempts: 1, processed: true },
  );
  console.log("WAHA webhook DB OK: durable enqueue, dedup, claim, process, cleanup.");
  } finally {
    await sql`DELETE FROM waha_webhook_events WHERE event_id = ${eventId}`;
    await sql`DELETE FROM waha_connections WHERE id = ${sessionId}`;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
