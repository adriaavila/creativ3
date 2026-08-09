import assert from "node:assert/strict";
import { MetaCloudWhatsAppProvider } from "../src/lib/meta/cloud-whatsapp-provider";
import {
  getWhatsAppPhoneCoexistenceStatus,
  requestBusinessAppDataSync,
} from "../src/lib/meta/server";

const provider = new MetaCloudWhatsAppProvider(async () => {
  throw new Error("The normalization check must not resolve a connection");
});

const events = provider.normalizeWebhook({
  object: "whatsapp_business_account",
  entry: [
    {
      id: "waba-1",
      changes: [
        {
          field: "messages",
          value: {
            metadata: {
              display_phone_number: "+15550001111",
              phone_number_id: "phone-1",
            },
            messages: [
              {
                from: "15550002222",
                id: "wamid.inbound",
                timestamp: "1700000000",
                type: "text",
                text: { body: "Hello from WhatsApp" },
              },
            ],
            statuses: [
              {
                id: "wamid.outbound",
                status: "failed",
                timestamp: "1700000001",
                recipient_id: "15550002222",
                errors: [
                  {
                    code: 131026,
                    title: "Message undeliverable",
                    message: "The message could not be delivered.",
                    error_data: { details: "Recipient unavailable" },
                  },
                ],
              },
            ],
          },
        },
        {
          field: "account_update",
          value: {
            event: "PARTNER_REMOVED",
            phone_number_id: "phone-1",
            reason: "OWNER_ACTION",
          },
        },
        {
          field: "smb_message_echoes",
          value: {
            metadata: { phone_number_id: "phone-1" },
            message_echoes: [
              {
                from: "15550001111",
                to: "15550002222",
                id: "wamid.echo",
                timestamp: "1700000002",
                type: "text",
                text: { body: "Sent from the business app" },
              },
            ],
          },
        },
        { field: "history", value: { opaque: true } },
        { field: "smb_app_state_sync", value: { opaque: true } },
      ],
    },
  ],
});

assert.equal(events.length, 7);

const inbound = events.find((event) => event.type === "message.received" && event.message.direction === "inbound");
assert(inbound && inbound.type === "message.received");
assert.deepEqual(inbound.message, {
  id: "wamid.inbound",
  from: "15550002222",
  to: "+15550001111",
  direction: "inbound",
  source: "cloud_api",
  type: "text",
  text: "Hello from WhatsApp",
  contactPhone: "15550002222",
});

const status = events.find((event) => event.type === "message.status.updated");
assert(status && status.type === "message.status.updated");
assert.equal(status.messageId, "wamid.outbound");
assert.equal(status.status, "failed");

const graphError = events.find(
  (event) => event.type === "error.received" && event.code === 131026,
);
assert(graphError && graphError.type === "error.received");
assert.equal(graphError.details, "Recipient unavailable");

const accountUpdate = events.find((event) => event.type === "connection.updated");
assert(accountUpdate && accountUpdate.type === "connection.updated");
assert.equal(accountUpdate.update, "PARTNER_REMOVED");
assert.equal(accountUpdate.state, "disconnected");

const echo = events.find(
  (event) => event.type === "message.received" && event.message.direction === "outbound",
);
assert(echo && echo.type === "message.received");
assert.equal(echo.message.source, "business_app");
assert.equal(echo.message.text, "Sent from the business app");

assert(events.some((event) => event.type === "error.received" && event.reason === "invalid_history_shape"));
assert(events.some((event) => event.type === "error.received" && event.reason === "invalid_smb_app_state_sync_shape"));

const invalidPayloadEvents = provider.normalizeWebhook("not a webhook object");
assert.deepEqual(invalidPayloadEvents, [
  {
    type: "error.received",
    provider: "META_CLOUD_API",
    reason: "invalid_webhook_payload",
  },
]);

async function checkGraphOperations() {
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    method: string;
    body?: Record<string, unknown>;
  }> = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    requests.push({ url, method: init?.method ?? "GET", body });

    if (url.includes("/phone-1?") && (init?.method ?? "GET") === "GET") {
      return Response.json({
        id: "phone-1",
        display_phone_number: "+15550001111",
        verified_name: "Example Business",
        quality_rating: "GREEN",
        name_status: "APPROVED",
        is_on_biz_app: true,
        platform_type: "CLOUD_API",
      });
    }

    if (body?.type === "text") return Response.json({ messages: [{ id: "wamid.text" }] });
    if (body?.type === "image") return Response.json({ messages: [{ id: "wamid.image" }] });
    return Response.json({ success: true });
  };

  try {
    const connection = {
      id: "connection-1",
      mode: "META_CLOUD_API" as const,
      wabaId: "waba-1",
      phoneNumberId: "phone-1",
      businessToken: "test-token",
    };
    const cloudProvider = new MetaCloudWhatsAppProvider(async () => connection, "v25.0");

    const status = await cloudProvider.getConnectionStatus(connection.id);
    assert.equal(status.state, "connected");
    assert.equal(status.displayPhoneNumber, "+15550001111");

    const coexistenceStatus = await getWhatsAppPhoneCoexistenceStatus({
      phoneNumberId: connection.phoneNumberId,
      businessToken: connection.businessToken,
      graphVersion: "v25.0",
    });
    assert.equal(coexistenceStatus.is_on_biz_app, true);
    await requestBusinessAppDataSync({
      phoneNumberId: connection.phoneNumberId,
      businessToken: connection.businessToken,
      syncType: "smb_app_state_sync",
      graphVersion: "v25.0",
    });
    await requestBusinessAppDataSync({
      phoneNumberId: connection.phoneNumberId,
      businessToken: connection.businessToken,
      syncType: "history",
      graphVersion: "v25.0",
    });

    assert.deepEqual(
      await cloudProvider.sendText({
        connectionId: connection.id,
        to: "15550002222",
        body: "Hello",
      }),
      { messageId: "wamid.text" },
    );
    assert.deepEqual(
      await cloudProvider.sendMedia({
        connectionId: connection.id,
        to: "15550002222",
        type: "image",
        mediaId: "media-1",
        caption: "An image",
      }),
      { messageId: "wamid.image" },
    );
    await cloudProvider.markAsRead({
      connectionId: connection.id,
      messageId: "wamid.inbound",
    });
    await cloudProvider.disconnect(connection.id);

    assert(
      requests.some(
        (request) =>
          request.body?.status === "read" && request.body.message_id === "wamid.inbound",
      ),
    );
    assert(
      requests.some(
        (request) => request.body?.sync_type === "smb_app_state_sync" && request.body.messaging_product === "whatsapp"),
    );
    assert(
      requests.some(
        (request) => request.body?.sync_type === "history" && request.body.messaging_product === "whatsapp"),
    );
    assert(
      requests.some(
        (request) => request.method === "POST" && request.url.endsWith("/phone-1/deregister"),
      ),
    );
    assert(
      requests.some(
        (request) =>
          request.method === "DELETE" && request.url.endsWith("/waba-1/subscribed_apps"),
      ),
    );

    requests.length = 0;
    const coexistenceProvider = new MetaCloudWhatsAppProvider(
      async () => ({ ...connection, mode: "META_COEXISTENCE" }),
      "v25.0",
    );
    await coexistenceProvider.disconnect(connection.id);
    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.method, "DELETE");
    assert(requests[0]?.url.endsWith("/waba-1/subscribed_apps"));

    await assert.rejects(
      () =>
        cloudProvider.sendMedia({
          connectionId: connection.id,
          to: "15550002222",
          type: "image",
          mediaId: "media-1",
          link: "https://example.com/image.jpg",
        }),
      /Exactly one of mediaId or link is required/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

checkGraphOperations()
  .then(() => {
    console.log(`Meta provider OK: ${events.length} normalized events and Graph operations checked.`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
