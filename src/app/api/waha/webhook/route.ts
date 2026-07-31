import { NextRequest, NextResponse } from "next/server";
import { insertMessage, updateMessageStatusByWaId, upsertConversation } from "@/lib/whatsapp-inbox-db";
import { verifyHexHmac } from "@/lib/webhook-signature";

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
  if (!secret) {
    return NextResponse.json({ error: "WAHA_WEBHOOK_HMAC_KEY is not configured." }, { status: 503 });
  }
  const rawBody = await req.text();

  if (!verifyHexHmac({
    rawBody,
    header: req.headers.get("x-webhook-hmac"),
    secret,
    algorithm: "sha512",
  })) {
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
