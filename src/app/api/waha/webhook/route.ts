import { createHash } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import {
  finishWahaWebhookEvent,
  getWahaConnection,
  insertMessage,
  noteWahaConnectionActivity,
  recordWahaWebhookEvent,
  updateMessageStatusByWaId,
  updateWahaConnectionStatus,
  upsertConversation,
} from "@/lib/whatsapp-inbox-db";
import { getWahaSnapshot } from "@/lib/waha";
import { WahaWhatsAppProvider } from "@/lib/waha-provider";
import { verifyHexHmac } from "@/lib/webhook-signature";

export const runtime = "nodejs";
export const maxDuration = 30;

const provider = new WahaWhatsAppProvider(async (connectionId) => {
  const connection = await getWahaConnection(connectionId);
  return connection ? { connectionId: connection.connectionId, sessionId: connection.wahaSessionId } : null;
});

async function processEvent(
  eventId: string,
  connection: NonNullable<Awaited<ReturnType<typeof getWahaConnection>>>,
  body: Record<string, unknown>,
) {
  try {
    for (const event of provider.normalizeWebhook(body)) {
      if (event.type === "message.received") {
        const contactWaId = event.message.from;
        if (!contactWaId) continue;
        const direction = event.message.direction === "outbound" ? "out" : "in";
        const conversation = await upsertConversation({
          connectionId: connection.connectionId,
          channelKind: "waha",
          channelKey: connection.wahaSessionId,
          contactWaId,
          direction,
          occurredAt: event.occurredAt,
        });
        await insertMessage({
          conversationId: conversation.id,
          waMessageId: event.message.id,
          direction,
          source: direction === "out" ? "phone" : "api",
          msgType: event.message.type,
          body: event.message.text ?? null,
          payload: body,
        });
        await noteWahaConnectionActivity(connection.connectionId, direction);
      } else if (event.type === "message.status.updated") {
        await updateMessageStatusByWaId(event.messageId, event.status);
      } else if (event.type === "connection.updated") {
        const status = event.update === "WORKING"
          ? "connected"
          : event.update === "STARTING"
            ? "starting"
            : event.update === "SCAN_QR_CODE"
              ? "scan_qr"
              : event.update.startsWith("PASSKEY")
                ? "passkey"
                : event.update === "STOPPED"
                  ? "stopped"
                  : "failed";
        const snapshot = await getWahaSnapshot(connection.wahaSessionId);
        await updateWahaConnectionStatus(
          connection.wahaSessionId,
          status,
          snapshot.sessions[0]?.phone,
          event.reason ?? null,
        );
      }
    }
    await finishWahaWebhookEvent(eventId);
  } catch (error) {
    await finishWahaWebhookEvent(
      eventId,
      error instanceof Error ? error.message.slice(0, 500) : "Processing failed",
    );
  }
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

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const sessionId = typeof body.session === "string" ? body.session : "";
  const eventType = typeof body.event === "string" ? body.event : "";
  if (!sessionId || !eventType) return NextResponse.json({ error: "Invalid event." }, { status: 400 });

  const connection = await getWahaConnection(sessionId);
  if (!connection) return new NextResponse(null, { status: 204 });

  const requestId = req.headers.get("x-webhook-request-id") ?? req.headers.get("x-request-id");
  const eventId = requestId ?? createHash("sha256").update(rawBody).digest("hex");
  const inserted = await recordWahaWebhookEvent({
    eventId,
    connectionId: connection.connectionId,
    sessionId,
    eventType,
    payload: body,
  });
  if (inserted) after(() => processEvent(eventId, connection, body));

  return new NextResponse(null, { status: inserted ? 202 : 200 });
}
