import assert from "node:assert/strict";
import test from "node:test";
import { growthOutreachSchema, growthTemplateComponents } from "@/app/api/ops/growth/outreach/route";
import { formatWhatsAppPhone, normalizeWhatsAppId, normalizeWhatsAppPhone, isWhatsAppId } from "@/lib/phone";
import { isWithinFreeTextWindow, mayDispatchOutboundAction, outboundActionOutcome } from "@/lib/whatsapp-send";
import { FREE_TEXT_WINDOW_MS, freeTextWindow } from "@/lib/whatsapp-window";
import { matchAutoReply } from "@/lib/auto-reply";
import { statusOutranks } from "@/lib/whatsapp-inbox-db";
import { composeSystemPrompt, resolveAutoReplyText } from "@/lib/tenant-bot-config";
import {
  assertOutboundRecipientAllowed,
  PilotRecipientDeniedError,
  pilotAllowedRecipients,
} from "@/lib/outbound-safety";
import { buildOnboardingUrl, toWorkspaceSlug } from "@/lib/meta/onboarding-link";
import { normalizeMetaWebhook } from "@/lib/meta/cloud-whatsapp-provider";
import { crmChannelNextStep, crmChannelStatusLabel, crmQualityLabel, isCrmChannelActive } from "@/lib/crm-channels";
import {
  createMetaOnboardingInvite,
  createMetaSignupState,
  listMessageTemplates,
  resolveMetaSignupConnection,
  verifyMetaOnboardingInvite,
  verifyMetaSignupState,
} from "@/lib/meta/server";

test("normalizes a WhatsApp number to the CRM contact id", () => {
  assert.equal(normalizeWhatsAppId("+58 (412) 555-0198"), "584125550198");
  assert.equal(isWhatsAppId("+584125550198"), true);
  assert.equal(isWhatsAppId("123"), false);
});

test("treats a confirmed Coexistence sync request as an operational CRM channel", () => {
  assert.equal(isCrmChannelActive({ status: "coexistence_sync_requested" }), true);
  assert.equal(
    crmChannelStatusLabel({ status: "coexistence_sync_requested", official: true }),
    "Operativo",
  );
  assert.equal(
    crmChannelStatusLabel({ status: "coexistence_sync_action_required", official: true }),
    "Requiere atención",
  );
  assert.equal(crmQualityLabel("GREEN"), "Saludable");
});

test("each WhatsApp connection exposes one clear next step", () => {
  assert.equal(crmChannelNextStep({ status: "error" }).action, "Revisar conexión");
  assert.equal(crmChannelNextStep({ status: "connected", businessTokenStored: false }).action, "Completar onboarding");
  assert.equal(crmChannelNextStep({ status: "connected", businessTokenStored: true, crmConnectedAt: "2026-08-11", crmOrganizationName: "Vocero" }).label, "En Vocero");
  assert.equal(crmChannelNextStep({ status: "connected", businessTokenStored: true, automationEnabled: true, operatingMode: "approval" }).action, "Probar automatización");
});

test("binds public Embedded Signup state to its workspace and mode", () => {
  const previousSecret = process.env.META_APP_SECRET;
  process.env.META_APP_SECRET = "test-meta-secret";

  try {
    const state = createMetaSignupState("optica-central", "META_COEXISTENCE");
    assert(state);
    const verified = verifyMetaSignupState(state);
    assert(verified);
    assert.equal(verified.workspace, "optica-central");
    assert.equal(verified.connection_mode, "META_COEXISTENCE");
    assert.equal(typeof verified.issued_at, "number");
    assert.equal(typeof verified.expires_at, "number");
    assert.equal(typeof verified.nonce, "string");
    assert.equal(verifyMetaSignupState(`${state}tampered`), null);
  } finally {
    if (previousSecret === undefined) delete process.env.META_APP_SECRET;
    else process.env.META_APP_SECRET = previousSecret;
  }
});

test("requires a signed, expiring invitation for public onboarding", () => {
  const previousSecret = process.env.META_APP_SECRET;
  process.env.META_APP_SECRET = "test-meta-secret";

  try {
    const invite = createMetaOnboardingInvite("optica-central", "META_COEXISTENCE");
    assert(invite);
    const verified = verifyMetaOnboardingInvite(invite);
    assert(verified);
    assert.equal(verified.purpose, "meta_onboarding_invite");
    assert.equal(verified.workspace, "optica-central");
    assert.equal(verified.connection_mode, "META_COEXISTENCE");
    assert.equal(typeof verified.issued_at, "number");
    assert.equal(typeof verified.expires_at, "number");
    assert.equal(typeof verified.nonce, "string");
    assert.equal(verifyMetaOnboardingInvite(`${invite}tampered`), null);
  } finally {
    if (previousSecret === undefined) delete process.env.META_APP_SECRET;
    else process.env.META_APP_SECRET = previousSecret;
  }
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
  assert.deepEqual(matchAutoReply("Hola, quiero agendar una cita"), {
    key: "cita",
    handoffAfterReply: true,
  });
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

test("normalizes official Coexistence history without guessing its direction", () => {
  const events = normalizeMetaWebhook({
    object: "whatsapp_business_account",
    entry: [{
      id: "waba",
      changes: [{
        field: "history",
        value: {
          metadata: { display_phone_number: "15550783881", phone_number_id: "business" },
          history: [{
            metadata: { phase: 0, chunk_order: 1, progress: 25 },
            threads: [{
              id: "16505551234",
              messages: [
                {
                  from: "16505551234",
                  id: "history-in",
                  timestamp: "1738796547",
                  type: "text",
                  text: { body: "Hola" },
                  history_context: { status: "delivered" },
                },
                {
                  from: "15550783881",
                  to: "16505551234",
                  id: "history-out",
                  timestamp: "1738796550",
                  type: "text",
                  text: { body: "Hola, ¿cómo te ayudo?" },
                  history_context: { status: "read" },
                },
              ],
            }],
          }],
        },
      }],
    }],
  });

  assert.equal(events.length, 2);
  assert.equal(events[0]?.type, "message.received");
  assert.equal(events[1]?.type, "message.received");
  if (events[0]?.type === "message.received" && events[1]?.type === "message.received") {
    assert.equal(events[0].message.direction, "inbound");
    assert.equal(events[0].message.source, "cloud_api");
    assert.equal(events[0].message.contactPhone, "16505551234");
    assert.equal(events[0].message.status, "delivered");
    assert.equal(events[1].message.direction, "outbound");
    assert.equal(events[1].message.source, "business_app");
    assert.equal(events[1].message.status, "read");
  }
});

test("normalizes official Coexistence contact sync events", () => {
  const [event] = normalizeMetaWebhook({
    object: "whatsapp_business_account",
    entry: [{
      id: "waba",
      changes: [{
        field: "smb_app_state_sync",
        value: {
          metadata: { phone_number_id: "business" },
          state_sync: [{
            type: "contact",
            contact: {
              full_name: "Pablo Morales",
              first_name: "Pablo",
              phone_number: "16505551234",
            },
            action: "add",
            metadata: { timestamp: "1738346006" },
          }],
        },
      }],
    }],
  });

  assert(event?.type === "contact.updated");
  if (event?.type === "contact.updated") {
    assert.equal(event.contactPhone, "16505551234");
    assert.equal(event.contactName, "Pablo Morales");
    assert.equal(event.action, "add");
  }
});

test("accepts a browser phone id only when it belongs to the supplied WABA", async () => {
  const originalFetch = globalThis.fetch;
  let listedPhoneId = "different-phone";
  globalThis.fetch = async (input) => {
    assert.match(String(input), /\/waba-1\/phone_numbers/);
    return Response.json({
      data: [{ id: listedPhoneId, display_phone_number: "+15550001111" }],
    });
  };

  const input = {
    payload: {
      code: "one-time-code",
      waba_id: "waba-1",
      phone_number_id: "phone-1",
      connection_mode: "META_COEXISTENCE" as const,
    },
    debugData: {},
    businessToken: "business-token",
    graphVersion: "v25.0",
  };

  try {
    assert.equal(await resolveMetaSignupConnection(input), null);
    listedPhoneId = "phone-1";
    const resolved = await resolveMetaSignupConnection(input);
    assert.equal(resolved?.payload.waba_id, "waba-1");
    assert.equal(resolved?.phoneProfile.id, "phone-1");
  } finally {
    globalThis.fetch = originalFetch;
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
    actionId: "00000000-0000-4000-8000-000000000001",
    leadId: "00000000-0000-4000-8000-000000000000",
    connectionId: "allok-main",
    channel: "waha",
    phone: "+584125550198",
    message: "Hola, vimos una oportunidad concreta para tu negocio.",
    confirmed: true,
    consentConfirmed: true,
  });
  const rejected = growthOutreachSchema.safeParse({
    actionId: "00000000-0000-4000-8000-000000000001",
    leadId: "00000000-0000-4000-8000-000000000000",
    connectionId: "allok-main",
    channel: "waha",
    phone: "+584125550198",
    message: "Hola, vimos una oportunidad concreta para tu negocio.",
    confirmed: false,
    consentConfirmed: true,
  });

  assert.equal(valid.success, true);
  assert.equal(rejected.success, false);
  assert.equal(valid.success ? growthOutreachSchema.safeParse({ ...valid.data, consentConfirmed: false }).success : true, false);
  assert.deepEqual(growthTemplateComponents("Mensaje revisado"), [
    { type: "body", parameters: [{ type: "text", text: "Mensaje revisado" }] },
  ]);
});

test("human outreach requires one durable action UUID", () => {
  const base = {
    leadId: "00000000-0000-4000-8000-000000000000",
    connectionId: "allok-main",
    channel: "waha",
    phone: "+584125550198",
    message: "Hola, vimos una oportunidad concreta para tu negocio.",
    confirmed: true,
    consentConfirmed: true,
  };

  assert.equal(growthOutreachSchema.safeParse(base).success, false);
  assert.equal(growthOutreachSchema.safeParse({ ...base, actionId: "retry-me" }).success, false);
  assert.equal(
    growthOutreachSchema.safeParse({ ...base, actionId: "00000000-0000-4000-8000-000000000001" }).success,
    true,
  );
});

test("only a newly persisted outbound action may reach the provider", () => {
  assert.equal(mayDispatchOutboundAction({ created: true, status: "pending" }), true);
  assert.equal(mayDispatchOutboundAction({ created: false, status: "pending" }), false);
  assert.equal(mayDispatchOutboundAction({ created: false, status: "unknown" }), false);
  assert.equal(mayDispatchOutboundAction({ created: false, status: "sent" }), false);
});

test("an unknown delivery is ambiguous, not a confirmed failure", () => {
  assert.equal(outboundActionOutcome("pending"), "unknown");
  assert.equal(outboundActionOutcome("unknown"), "unknown");
  assert.equal(outboundActionOutcome("failed"), "failed");
  assert.equal(outboundActionOutcome("sent"), "confirmed");
});

test("delivery status never moves backwards", () => {
  // Meta delivers status webhooks out of order: a late `delivered` must not
  // overwrite a `read`, and nothing overwrites a `failed`.
  assert.equal(statusOutranks("sent", "delivered"), true);
  assert.equal(statusOutranks("delivered", "read"), true);
  assert.equal(statusOutranks("read", "delivered"), false);
  assert.equal(statusOutranks("read", "sent"), false);
  assert.equal(statusOutranks("read", "read"), false);
  assert.equal(statusOutranks(null, "sent"), true);
  assert.equal(statusOutranks("delivered", "failed"), true);
  assert.equal(statusOutranks("failed", "read"), false);
});

test("each tenant answers with its own persona and facts", () => {
  const shared = composeSystemPrompt({ base: "PERSONA COMPARTIDA", config: null });
  assert.equal(shared, "PERSONA COMPARTIDA");

  const scoped = composeSystemPrompt({
    base: "PERSONA COMPARTIDA",
    config: {
      phoneNumberId: "123",
      systemPrompt: "Sos el asistente de Panadería Rosa.",
      businessFacts: "Abrimos 7am-7pm. Torta desde 25$.",
      handoffNote: "Te paso con Rosa.",
      autoReplies: {},
      enabled: true,
      operatingMode: "approval",
      modelTier: "balanced",
    },
    summary: "El cliente pidió una torta para el sábado.",
  });

  assert.match(scoped, /Panadería Rosa/);
  assert.match(scoped, /7am-7pm/);
  assert.match(scoped, /Te paso con Rosa/);
  assert.match(scoped, /torta para el sábado/);
  assert.doesNotMatch(scoped, /PERSONA COMPARTIDA/);
});

test("auto reply copy belongs to the tenant, never to allok", () => {
  const rosa = {
    phoneNumberId: "123",
    systemPrompt: null,
    businessFacts: null,
    handoffNote: null,
    autoReplies: { saludo: "¡Hola! Panadería Rosa por aquí." },
    enabled: true,
    operatingMode: "automatic" as const,
    modelTier: "balanced" as const,
  };

  assert.equal(resolveAutoReplyText(rosa, "saludo"), "¡Hola! Panadería Rosa por aquí.");
  // No copy for this rule -> stay silent, do not borrow someone else's words.
  assert.equal(resolveAutoReplyText(rosa, "precio"), null);
  // No config at all -> silent.
  assert.equal(resolveAutoReplyText(null, "saludo"), null);
  // Disabled tenant -> silent even with copy present.
  assert.equal(resolveAutoReplyText({ ...rosa, enabled: false }, "saludo"), null);
  // Blank string is not copy.
  assert.equal(resolveAutoReplyText({ ...rosa, autoReplies: { saludo: "   " } }, "saludo"), null);
});

test("pilot mode only sends to explicitly allowed WhatsApp ids", () => {
  const allowed = pilotAllowedRecipients("+58 412 000 0001,59170000002");
  assert.doesNotThrow(() => assertOutboundRecipientAllowed("584120000001", "pilot", allowed));
  assert.throws(
    () => assertOutboundRecipientAllowed("584120000099", "pilot", allowed),
    PilotRecipientDeniedError,
  );
  assert.doesNotThrow(() => assertOutboundRecipientAllowed("584120000099", "production", allowed));
});

test("onboarding links carry a safe workspace slug and the right mode", () => {
  assert.equal(toWorkspaceSlug("Panadería Rosa"), "panaderia-rosa");
  assert.equal(toWorkspaceSlug("  Café  &  Té!! "), "cafe-te");
  assert.equal(toWorkspaceSlug("!!!"), "");
  // The slug must satisfy the server-side check in /embedded-whatsapp.
  assert.match(toWorkspaceSlug("Ñandú S.A."), /^[a-zA-Z0-9._-]{1,80}$/);
  assert.ok(toWorkspaceSlug("x".repeat(200)).length <= 80);

  assert.equal(
    buildOnboardingUrl("https://allok.fun", "panaderia-rosa", false, "signed-invite"),
    "https://allok.fun/embedded-whatsapp?client=panaderia-rosa&invite=signed-invite",
  );
  assert.equal(
    buildOnboardingUrl("https://allok.fun", "panaderia-rosa", true, "signed-invite"),
    "https://allok.fun/embedded-whatsapp?client=panaderia-rosa&mode=cloud_api&invite=signed-invite",
  );
});
