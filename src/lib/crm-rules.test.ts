import assert from "node:assert/strict";
import test from "node:test";
import { growthOutreachSchema, growthTemplateComponents } from "@/app/api/ops/growth/outreach/route";
import { formatWhatsAppPhone, normalizeWhatsAppId, normalizeWhatsAppPhone, isWhatsAppId } from "@/lib/phone";
import { isWithinFreeTextWindow } from "@/lib/whatsapp-send";
import { FREE_TEXT_WINDOW_MS, freeTextWindow } from "@/lib/whatsapp-window";
import { matchAutoReply } from "@/lib/auto-reply";
import { normalizeMetaWebhook } from "@/lib/meta/cloud-whatsapp-provider";
import { listMessageTemplates } from "@/lib/meta/server";

test("normalizes a WhatsApp number to the CRM contact id", () => {
  assert.equal(normalizeWhatsAppId("+58 (412) 555-0198"), "584125550198");
  assert.equal(isWhatsAppId("+584125550198"), true);
  assert.equal(isWhatsAppId("123"), false);
});

test("shows a real phone and hides provider ids", () => {
  assert.equal(normalizeWhatsAppPhone("59170000000@c.us"), "59170000000");
  assert.equal(normalizeWhatsAppPhone("150826970542141@lid"), null);
  assert.equal(formatWhatsAppPhone(null), null);
  assert.equal(formatWhatsAppPhone("59170000000:1@c.us"), "+59170000000");
  assert.equal(normalizeWhatsAppPhone("bsuid:abc123"), null);
});

test("auto replies only on safe predefined matches", () => {
  assert.equal(matchAutoReply("Hola, necesito información")?.key, "saludo");
  assert.equal(matchAutoReply("¿Cuánto cuesta?")?.key, "precio");
  assert.equal(matchAutoReply("quiero hablar con una persona")?.handoff, true);
  assert.equal(matchAutoReply("Necesito algo muy específico"), null);
});

test("keeps the profile name and phone from Meta contacts", () => {
  const [event] = normalizeMetaWebhook({
    object: "whatsapp_business_account",
    entry: [{
      id: "waba",
      changes: [{
        field: "messages",
        value: {
          metadata: { phone_number_id: "business" },
          contacts: [{ wa_id: "584125550198", profile: { name: "Ana" } }],
          messages: [{ id: "m1", timestamp: "1700000000", type: "text", text: { body: "Hola" } }],
        },
      }],
    }],
  });
  assert(event?.type === "message.received");
  if (event?.type === "message.received") {
    assert.equal(event.message.from, "584125550198");
    assert.equal(event.message.contactName, "Ana");
  }
});

test("the Cloud API free-text window lasts less than 24 hours", () => {
  const now = Date.parse("2026-08-01T12:00:00.000Z");
  assert.equal(isWithinFreeTextWindow("2026-08-01T00:01:00.000Z", now), true);
  assert.equal(isWithinFreeTextWindow("2026-07-31T12:00:00.000Z", now), false);
  assert.equal(isWithinFreeTextWindow(null, now), false);
});

test("freeTextWindow handles the exact 24-hour boundaries", () => {
  const inboundAt = Date.parse("2026-08-01T00:00:00.000Z");
  const expiresAt = "2026-08-02T00:00:00.000Z";

  assert.deepEqual(
    freeTextWindow("2026-08-01T00:00:00.000Z", inboundAt + FREE_TEXT_WINDOW_MS - 1),
    { open: true, expiresAt, msRemaining: 1 },
  );
  assert.deepEqual(
    freeTextWindow("2026-08-01T00:00:00.000Z", inboundAt + FREE_TEXT_WINDOW_MS),
    { open: false, expiresAt, msRemaining: 0 },
  );
  assert.deepEqual(freeTextWindow(null, inboundAt), {
    open: false,
    expiresAt: null,
    msRemaining: 0,
  });
});

test("maps approved Meta templates to the narrow catalog contract", async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = "";
  globalThis.fetch = async (input) => {
    requestedUrl = String(input);
    return new Response(JSON.stringify({
      data: [
        {
          name: "follow_up",
          language: "es_MX",
          status: "APPROVED",
          category: "UTILITY",
          components: [
            { type: "HEADER", format: "TEXT", text: "Hola" },
            { type: "BODY", text: "Hola {{1}}, tu cita es el {{2}}." },
          ],
        },
        { name: "pending", language: "es_MX", status: "PENDING", category: "UTILITY" },
      ],
    }));
  };

  try {
    const templates = await listMessageTemplates({
      wabaId: "waba-1",
      businessToken: "token-not-logged",
      graphVersion: "v25.0",
    });

    assert.deepEqual(templates, [{
      name: "follow_up",
      language: "es_MX",
      category: "UTILITY",
      bodyText: "Hola {{1}}, tu cita es el {{2}}.",
      variableCount: 2,
      headerText: "Hola",
    }]);
    assert.match(requestedUrl, /\/v25\.0\/waba-1\/message_templates/);
    assert.match(requestedUrl, /status=APPROVED/);
    assert.match(requestedUrl, /limit=100/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("outreach requires explicit approval and builds a reviewed template body", () => {
  const valid = growthOutreachSchema.safeParse({
    leadId: "00000000-0000-4000-8000-000000000000",
    connectionId: "allok-main",
    channel: "waha",
    phone: "+584125550198",
    message: "Hola, vimos una oportunidad concreta para tu negocio.",
    confirmed: true,
  });
  const rejected = growthOutreachSchema.safeParse({
    leadId: "00000000-0000-4000-8000-000000000000",
    connectionId: "allok-main",
    channel: "waha",
    phone: "+584125550198",
    message: "Hola, vimos una oportunidad concreta para tu negocio.",
    confirmed: false,
  });

  assert.equal(valid.success, true);
  assert.equal(rejected.success, false);
  assert.deepEqual(growthTemplateComponents("Mensaje revisado"), [
    { type: "body", parameters: [{ type: "text", text: "Mensaje revisado" }] },
  ]);
});
