import { randomUUID } from "node:crypto";
import { normalizeWhatsAppId } from "../src/lib/phone";
import { getWahaConfig, getWahaSnapshot } from "../src/lib/waha";
import { sendWahaText, toWahaChatId } from "../src/lib/waha-send";

const session = required("WAHA_CRM_TESTER_SESSION");
const target = requiredWhatsAppId("WAHA_CRM_TEST_TARGET");
if (process.env.WAHA_CRM_TEST_CONFIRM !== "send-live-test") {
  throw new Error("Set WAHA_CRM_TEST_CONFIRM=send-live-test to send one real WhatsApp message.");
}

const snapshot = await getWahaSnapshot(session);
if (snapshot.sessions[0]?.status !== "connected") {
  throw new Error(`WAHA tester session ${session} is not connected.`);
}

const marker = `allok-${randomUUID().slice(0, 8)}`;
const startedAt = Math.floor(Date.now() / 1000);
await sendWahaText(session, target, `Hola, prueba de CRM ${marker}`);

const reply = await waitForReply(session, target, startedAt, marker);
console.log(JSON.stringify({ ok: true, marker, reply: reply.body }, null, 2));

async function waitForReply(sessionId: string, waId: string, since: number, marker: string) {
  const config = getWahaConfig();
  if (!config) throw new Error("WAHA_URL/WAHA_API_KEY are required.");
  const chatId = encodeURIComponent(toWahaChatId(waId));
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    const url = new URL(`${config.baseUrl}/api/${encodeURIComponent(sessionId)}/chats/${chatId}/messages`);
    url.searchParams.set("limit", "30");
    url.searchParams.set("downloadMedia", "false");
    url.searchParams.set("filter.timestamp.gte", String(since));
    const response = await fetch(url, {
      headers: { "X-Api-Key": config.apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`WAHA message history responded ${response.status}.`);
    const messages = await response.json() as Array<{ fromMe?: boolean; body?: string; timestamp?: number }>;
    const incoming = messages.find((message) => message.fromMe === false && message.timestamp! >= since);
    if (incoming?.body && !incoming.body.includes(marker)) return incoming;
    await new Promise((resolve) => setTimeout(resolve, 3_000));
  }

  throw new Error("The CRM did not answer through WhatsApp within 90 seconds.");
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function requiredWhatsAppId(name: string) {
  const value = normalizeWhatsAppId(required(name));
  if (!/^\d{8,15}$/.test(value)) throw new Error(`${name} must be an E.164 number without '+'.`);
  return value;
}
