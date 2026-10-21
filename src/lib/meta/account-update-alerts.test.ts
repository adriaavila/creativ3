import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMetaWebhook } from "@/lib/meta/cloud-whatsapp-provider";
import {
  accountUpdateAlertText,
  classifyAccountUpdate,
  deferUntil,
  hasPartnerAdded,
  PARTNER_ADDED_GRACE_MS,
  type WabaOwner,
} from "@/lib/meta/account-update-alerts";
import { sendTelegramAlert } from "@/lib/telegram-alert";

// La forma exacta de los account_update que guardó Neon (2026-10-17 y 2026-10-20),
// con ids inventados. El entry.id es el negocio socio, no el WABA.
function accountUpdate(value: Record<string, unknown>) {
  return {
    object: "whatsapp_business_account",
    entry: [{ id: "900000000000001", time: 1792260292, changes: [{ field: "account_update", value }] }],
  };
}

/** payload → texto del aviso (null = no se avisa), con lo que allok.fun sepa del WABA. */
function alertFor(payload: unknown, known: WabaOwner = null) {
  const alerts = normalizeMetaWebhook(payload).map(classifyAccountUpdate).filter((alert) => alert !== null);
  assert.ok(alerts.length <= 1);
  return alerts[0] ? accountUpdateAlertText(alerts[0], known) : null;
}

const PARTNER_REMOVED = accountUpdate({
  event: "PARTNER_REMOVED",
  waba_info: { waba_id: "100000000000001", owner_business_id: "200000000000001" },
  disconnection_info: { reason: "BUSINESS_DOWNGRADE", initiated_by: "USER" },
});
const PARTNER_APP_UNINSTALLED = accountUpdate({
  event: "PARTNER_APP_UNINSTALLED",
  waba_info: { waba_id: "100000000000001", partner_app_id: "300000000000001", owner_business_id: "200000000000001" },
});
const PARTNER_ADDED = accountUpdate({
  event: "PARTNER_ADDED",
  waba_info: { waba_id: "100000000000002", owner_business_id: "200000000000002" },
});

test("PARTNER_REMOVED avisa con el WABA de waba_info, el motivo y el CRM dueño", () => {
  assert.equal(
    alertFor(PARTNER_REMOVED, { owner: "vocero" }),
    "Meta desconectó el WABA 100000000000001 (BUSINESS_DOWNGRADE, lo inició USER). CRM: vocero.",
  );
  assert.equal(
    alertFor(PARTNER_REMOVED),
    "Meta desconectó el WABA 100000000000001 (BUSINESS_DOWNGRADE, lo inició USER). allok.fun no sabe qué CRM lo tiene.",
  );
});

test("PARTNER_APP_UNINSTALLED avisa aunque Meta no mande motivo", () => {
  assert.equal(
    alertFor(PARTNER_APP_UNINSTALLED),
    "Meta desconectó el WABA 100000000000001 (PARTNER_APP_UNINSTALLED). allok.fun no sabe qué CRM lo tiene.",
  );
});

test("PARTNER_ADDED avisa sólo si ningún CRM que allok.fun conoce guardó el número", () => {
  const text = alertFor(PARTNER_ADDED);
  assert.ok(text?.startsWith("Alguien terminó la coexistencia del WABA 100000000000002 pero ningún CRM recibió el código"));
  assert.equal(alertFor(PARTNER_ADDED, { owner: "mistica" }), null);
  assert.equal(alertFor(PARTNER_ADDED, { owner: null }), null);
});

test("el resto de account_update y los mensajes no avisan", () => {
  for (const event of ["MM_LITE_TERMS_SIGNED", "PARTNER_APP_INSTALLED", "ACCOUNT_VIOLATION"]) {
    assert.equal(alertFor(accountUpdate({ event, waba_info: { waba_id: "100000000000002" } })), null, event);
  }
  assert.equal(alertFor(accountUpdate({ waba_info: { waba_id: "100000000000002" } })), null);
  assert.equal(alertFor({
    object: "whatsapp_business_account",
    entry: [{ id: "100000000000002", changes: [{ field: "messages", value: {
      metadata: { phone_number_id: "phone-1" },
      messages: [{ id: "wamid.1", from: "15550001111", timestamp: "1700000000", type: "text", text: { body: "hola" } }],
    } }] }],
  }), null);
  assert.equal(alertFor({ object: "page" }), null);
});

test("un PARTNER_ADDED espera su plazo en la cola; lo demás se procesa ya", () => {
  const classify = (payload: unknown) =>
    normalizeMetaWebhook(payload).map(classifyAccountUpdate).filter((alert) => alert !== null);
  const receivedAt = new Date("2026-10-20T01:39:46Z");
  const due = new Date(receivedAt.getTime() + PARTNER_ADDED_GRACE_MS);

  assert.deepEqual(deferUntil(classify(PARTNER_ADDED), receivedAt, receivedAt.getTime() + 300), due);
  assert.equal(deferUntil(classify(PARTNER_ADDED), receivedAt, due.getTime()), null);
  assert.equal(deferUntil(classify(PARTNER_REMOVED), receivedAt, receivedAt.getTime()), null);

  assert.equal(hasPartnerAdded(normalizeMetaWebhook(PARTNER_ADDED)), true);
  assert.equal(hasPartnerAdded(normalizeMetaWebhook(PARTNER_REMOVED)), false);
});

test("PARTNER_REMOVED marca la conexión por el WABA real, no por el entry.id", () => {
  const [event] = normalizeMetaWebhook(PARTNER_REMOVED);
  assert.equal(event.type, "connection.updated");
  assert.equal(event.wabaId, "100000000000001");
  assert.equal(event.type === "connection.updated" && event.state, "disconnected");
});

test("el aviso a Telegram no manda nada sin variables y lanza si Telegram falla", async (t) => {
  const calls: { url: string; body: unknown }[] = [];
  let status = 200;
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    return new Response("{}", { status });
  });
  const env = { token: process.env.TELEGRAM_BOT_TOKEN, chat: process.env.TELEGRAM_HOME_CHANNEL };
  t.after(() => {
    process.env.TELEGRAM_BOT_TOKEN = env.token;
    process.env.TELEGRAM_HOME_CHANNEL = env.chat;
    if (env.token === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    if (env.chat === undefined) delete process.env.TELEGRAM_HOME_CHANNEL;
  });

  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_HOME_CHANNEL;
  assert.equal(await sendTelegramAlert("hola"), false);
  assert.equal(calls.length, 0);

  process.env.TELEGRAM_BOT_TOKEN = "123:abc";
  process.env.TELEGRAM_HOME_CHANNEL = "42";
  assert.equal(await sendTelegramAlert("hola"), true);
  assert.deepEqual(calls[0], {
    url: "https://api.telegram.org/bot123:abc/sendMessage",
    body: { chat_id: "42", text: "hola", disable_web_page_preview: true },
  });

  status = 429;
  await assert.rejects(sendTelegramAlert("hola"), /telegram_send_failed_429/);
});
