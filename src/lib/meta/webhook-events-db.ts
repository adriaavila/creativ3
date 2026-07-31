import { createHash } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type MetaWebhookEventRecord = {
  id: number;
  eventKey: string;
  payload: unknown;
  status: "pending" | "processing" | "processed" | "failed";
  attempts: number;
};

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for Meta webhooks.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function enqueueMetaWebhookEvent(rawBody: string, payload: unknown) {
  const sql = getSql();
  const eventKey = createHash("sha256").update(rawBody).digest("hex");
  const inserted = await sql`
    INSERT INTO meta_whatsapp_webhook_events (event_key, payload)
    VALUES (${eventKey}, ${JSON.stringify(payload)}::jsonb)
    ON CONFLICT (event_key) DO NOTHING
    RETURNING id, status
  `;
  if (inserted[0]) {
    return { id: Number(inserted[0].id), eventKey, duplicate: false };
  }
  const existing = await sql`
    SELECT id FROM meta_whatsapp_webhook_events WHERE event_key = ${eventKey}
  `;
  if (!existing[0]) throw new Error("Webhook event disappeared after enqueue conflict.");
  return { id: Number(existing[0].id), eventKey, duplicate: true };
}

export async function claimMetaWebhookEvents(limit = 10): Promise<MetaWebhookEventRecord[]> {
  const sql = getSql();
  const rows = await sql`
    WITH candidates AS (
      SELECT id
      FROM meta_whatsapp_webhook_events
      WHERE (
          (status IN ('pending', 'failed') AND next_attempt_at <= now())
          OR (status = 'processing' AND processing_started_at < now() - interval '5 minutes')
        )
        AND attempts < 10
      ORDER BY received_at
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    )
    UPDATE meta_whatsapp_webhook_events AS event
    SET status = 'processing',
        attempts = event.attempts + 1,
        processing_started_at = now(),
        last_error = null,
        updated_at = now()
    FROM candidates
    WHERE event.id = candidates.id
    RETURNING event.id, event.event_key, event.payload, event.status, event.attempts
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    eventKey: String(row.event_key),
    payload: row.payload,
    status: row.status as MetaWebhookEventRecord["status"],
    attempts: Number(row.attempts),
  }));
}

export async function markMetaWebhookEventProcessed(id: number) {
  const sql = getSql();
  await sql`
    UPDATE meta_whatsapp_webhook_events
    SET status = 'processed', processed_at = now(), updated_at = now()
    WHERE id = ${id}
  `;
}

export async function markMetaWebhookEventFailed(id: number, attempts: number, error: unknown) {
  const sql = getSql();
  const retryAt = new Date(
    Date.now() + Math.min(3600, 2 ** Math.max(0, attempts - 1)) * 1000,
  ).toISOString();
  const safeError = error instanceof Error ? error.message.slice(0, 500) : "Webhook processing failed";
  await sql`
    UPDATE meta_whatsapp_webhook_events
    SET status = 'failed', last_error = ${safeError}, next_attempt_at = ${retryAt}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function getMetaWebhookEventStats() {
  const sql = getSql();
  const rows = await sql`
    SELECT status, count(*)::int AS count
    FROM meta_whatsapp_webhook_events
    GROUP BY status
  `;
  return Object.fromEntries(rows.map((row) => [String(row.status), Number(row.count)]));
}
