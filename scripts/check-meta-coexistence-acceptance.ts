import { neon } from "@neondatabase/serverless";

const phoneNumberId = process.argv[2];
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Load the server environment before running this check.");
}
if (!phoneNumberId || !/^[0-9]{5,30}$/.test(phoneNumberId)) {
  throw new Error("Usage: tsx scripts/check-meta-coexistence-acceptance.ts <PHONE_NUMBER_ID>");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const [connections, webhooks, messages] = await Promise.all([
    sql`
    SELECT waba_id, phone_number_id, client, connection_mode, status,
      connected_at, last_synced_at,
      token_metadata #>> '{coexistence,state}' AS sync_state,
      token_metadata #>> '{coexistence,final_status}' AS sync_final_status,
      token_metadata #>> '{coexistence,confirmed}' AS coexistence_confirmed,
      token_metadata #>> '{coexistence,contact_sync,ok}' AS contact_sync_accepted,
      token_metadata #>> '{coexistence,history_sync,ok}' AS history_sync_accepted
    FROM whatsapp_connections
    WHERE phone_number_id = ${phoneNumberId}
    ORDER BY updated_at DESC
    LIMIT 1
    `,
    sql`
    WITH changes AS (
      SELECT event.status AS queue_status, event.received_at, event.processed_at,
        change ->> 'field' AS field,
        change -> 'value' AS value
      FROM meta_whatsapp_webhook_events AS event
      CROSS JOIN LATERAL jsonb_array_elements(event.payload -> 'entry') AS entry
      CROSS JOIN LATERAL jsonb_array_elements(entry -> 'changes') AS change
      WHERE change -> 'value' -> 'metadata' ->> 'phone_number_id' = ${phoneNumberId}
    )
    SELECT field, queue_status, count(*)::int AS events,
      count(*) FILTER (WHERE value::text LIKE '%2593109%')::int AS history_declined,
      max(received_at) AS last_received_at,
      max(processed_at) AS last_processed_at
    FROM changes
    GROUP BY field, queue_status
    ORDER BY field, queue_status
    `,
    sql`
    SELECT message.direction, message.source, count(*)::int AS messages,
      max(message.created_at) AS last_message_at
    FROM wa_messages AS message
    JOIN wa_conversations AS conversation ON conversation.id = message.conversation_id
    WHERE conversation.channel_kind = 'cloud_api'
      AND conversation.channel_key = ${phoneNumberId}
    GROUP BY message.direction, message.source
    ORDER BY message.direction, message.source
    `,
  ]);

  if (!connections[0]) {
    throw new Error(`No stored WhatsApp connection exists for Phone Number ID ${phoneNumberId}.`);
  }

  console.log(JSON.stringify({ connection: connections[0], webhooks, messages }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
