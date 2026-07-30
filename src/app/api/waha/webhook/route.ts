import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { insertMessage, updateMessageStatusByWaId, upsertConversation } from "@/lib/whatsapp-inbox-db";

// HMAC-over-raw-body, same shape as the Meta webhook verifier in
// src/app/api/meta/whatsapp/webhook/route.ts. WAHA signs with the per-session
// `config.webhooks[].hmac.key` (we set it to WAHA_WEBHOOK_HMAC_KEY) and sends the
// digest on `X-Webhook-Hmac`, hex, algorithm sha512 — it advertises the algorithm
// on `X-Webhook-Hmac-Algorithm`, which we deliberately ignore: trusting a
// caller-supplied algorithm name would let anyone downgrade the hash.
function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const received = Buffer.from(header);
  const expectedBuf = Buffer.from(expected);
  return received.length === expectedBuf.length && crypto.timingSafeEqual(received, expectedBuf);
}

type WahaWebhookPayload = {
  event?: string;
  session?: string;
  payload?: {
    id?: string;
    from?: string;
    fromMe?: boolean;
    body?: string;
    type?: string;
    timestamp?: number;
    ack?: number;
    ackName?: string;
    _data?: { notifyName?: string };
    [key: string]: unknown;
  };
};

function waIdFromChatId(chatId: string | undefined): string | null {
  if (!chatId) return null;
  return chatId.replace(/@c\.us$|@s\.whatsapp\.net$/, "");
}

export async function POST(req: NextRequest) {
  const secret = process.env.WAHA_WEBHOOK_HMAC_KEY;
  const rawBody = await req.text();

  if (secret && !verifySignature(rawBody, req.headers.get("x-webhook-hmac"), secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: WahaWebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const sessionId = event.session ?? "default";
  const payload = event.payload;

  try {
    if (event.event === "message" && payload) {
      const contactWaId = waIdFromChatId(payload.from);
      if (contactWaId) {
        const direction = payload.fromMe ? "out" : "in";
        const occurredAt = payload.timestamp ? new Date(payload.timestamp * 1000).toISOString() : undefined;
        const conversation = await upsertConversation({
          channelKind: "waha",
          channelKey: sessionId,
          contactWaId,
          contactName: payload._data?.notifyName ?? null,
          direction,
          occurredAt,
        });
        await insertMessage({
          conversationId: conversation.id,
          waMessageId: payload.id ?? null,
          direction,
          source: direction === "out" ? "phone" : "api",
          msgType: payload.type ?? "text",
          body: payload.body ?? null,
          payload,
        });
      }
    } else if (event.event === "message.ack" && payload?.id) {
      await updateMessageStatusByWaId(payload.id, payload.ackName ?? String(payload.ack ?? ""));
    }
  } catch (error) {
    // Same principle as the Meta webhook: a parse/DB miss must not turn into a
    // 5xx that gets the subscription disabled — log and still ack.
    console.error("WAHA webhook persistence failed", error);
    return NextResponse.json({ ok: true, received: true, error: "persist_failed" });
  }

  return NextResponse.json({ ok: true, received: true });
}
