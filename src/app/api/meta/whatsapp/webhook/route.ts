import { NextRequest, NextResponse } from "next/server";

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
  let payload: unknown;

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const forwarded = await forwardWebhookEvent(payload);

  return NextResponse.json({
    ok: true,
    received: true,
    forwarded,
  });
}

async function forwardWebhookEvent(payload: unknown) {
  const url = process.env.N8N_WHATSAPP_EVENTS_WEBHOOK_URL;
  if (!url) {
    return {
      enabled: false,
      status: "not_configured",
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      event: "meta_whatsapp_webhook_received",
      payload,
      received_at: new Date().toISOString(),
    }),
  });

  return {
    enabled: true,
    ok: response.ok,
    status: response.status,
  };
}
