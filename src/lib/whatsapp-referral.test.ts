import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeMetaWebhook } from "@/lib/meta/cloud-whatsapp-provider";

// El origen de una conversación solo llega una vez, en el primer mensaje. Si el
// normalizador lo tira, no hay forma de saber después si el contacto vino de un
// anuncio pago o escribió por su cuenta.

function inboundPayload(message: Record<string, unknown>) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "102290129340398",
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: { display_phone_number: "584120000000", phone_number_id: "551234567890123" },
          contacts: [{ profile: { name: "Ana" }, wa_id: "584140000000" }],
          messages: [{
            from: "584140000000",
            id: "wamid.TEST1",
            timestamp: "1770000000",
            type: "text",
            text: { body: "Hola me interesan los servicios" },
            ...message,
          }],
        },
      }],
    }],
  };
}

function firstMessage(payload: unknown) {
  const events = normalizeMetaWebhook(payload);
  const received = events.find((event) => event.type === "message.received");
  assert.ok(received, "esperaba un message.received");
  return received.message;
}

test("un click en anuncio conserva de qué anuncio vino", () => {
  const message = firstMessage(inboundPayload({
    referral: {
      source_url: "https://fb.me/2abcXYZ",
      source_id: "120210000000000000",
      source_type: "ad",
      headline: "Automatizá tu WhatsApp",
      body: "Respondé en segundos",
      media_type: "image",
      ctwa_clid: "ARAaBbCcDd1234",
    },
  }));

  assert.deepEqual(message.referral, {
    sourceType: "ad",
    sourceId: "120210000000000000",
    sourceUrl: "https://fb.me/2abcXYZ",
    headline: "Automatizá tu WhatsApp",
    ctwaClid: "ARAaBbCcDd1234",
  });
});

test("un mensaje escrito por el contacto no inventa un origen", () => {
  assert.equal(firstMessage(inboundPayload({})).referral, undefined);
});

test("un referral vacío cuenta como sin origen, no como origen desconocido", () => {
  assert.equal(firstMessage(inboundPayload({ referral: {} })).referral, undefined);
});
