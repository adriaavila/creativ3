import { createHash } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import {
  getWahaConnection,
  recordWahaWebhookEvent,
} from "@/lib/whatsapp-inbox-db";
import { processWahaWebhookQueue } from "@/lib/waha-webhook-processor";
import { verifyHexHmac } from "@/lib/webhook-signature";

export const runtime = "nodejs";
export const maxDuration = 30;

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
  after(() => processWahaWebhookQueue(5));

  return new NextResponse(null, { status: inserted ? 202 : 200 });
}
