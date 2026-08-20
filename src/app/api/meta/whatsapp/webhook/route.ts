import { after, NextRequest, NextResponse } from "next/server";
import { enqueueMetaWebhookEvent } from "@/lib/meta/webhook-events-db";
import { processMetaWebhookQueue } from "@/lib/meta/webhook-processor";
import { verifyHexHmac } from "@/lib/webhook-signature";

export async function GET(req: NextRequest) {
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (!verifyToken) {
    return NextResponse.json(
      { error: "META_WEBHOOK_VERIFY_TOKEN is not configured." },
      { status: 500 },
    );
  }
  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "Webhook verification failed." }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "META_APP_SECRET is not configured." }, { status: 500 });
  }

  if (Number(req.headers.get("content-length") ?? 0) > 2_000_000) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const rawBody = await req.text();
  if (rawBody.length > 2_000_000) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }
  if (!verifyHexHmac({
    rawBody,
    header: req.headers.get("x-hub-signature-256"),
    secret: appSecret,
    algorithm: "sha256",
    prefix: "sha256=",
  })) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  try {
    const queued = await enqueueMetaWebhookEvent(rawBody, payload);
    after(() => processMetaWebhookQueue(5));
    return NextResponse.json({
      ok: true,
      received: true,
      event_id: queued.id,
      duplicate: queued.duplicate,
    });
  } catch {
    console.error(JSON.stringify({ event: "meta_webhook_enqueue_failed" }));
    return NextResponse.json({ error: "Webhook storage is temporarily unavailable." }, { status: 503 });
  }
}
