import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  insertMessage,
  updateMessageStatusByWaId,
  upsertConversation,
} from "@/lib/whatsapp-inbox-db";

function verifySignature(rawBody: string, header: string | null, appSecret: string) {
  if (!header?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(header.slice("sha256=".length), "hex");
  } catch {
    return false;
  }

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

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

  // Must read the raw body: the HMAC is over the exact bytes Meta sent.
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Persist before acking so /ops/inbox reflects the event immediately. Each change
  // is isolated in its own try/catch — a parse miss on one entry must never sink the
  // whole webhook (Meta disables the subscription after sustained non-2xx replies).
  const inboxResult = await persistWebhookPayload(payload).catch((error) => ({
    ok: false,
    error: error instanceof Error ? error.message : "inbox persistence failed",
  }));

  // n8n is a downstream consumer, not a dependency — fire-and-forget, never blocks the ack.
  const forwarded = await forwardWebhookEvent(payload).catch((error) => ({
    enabled: true,
    ok: false,
    status: 0,
    error: error instanceof Error ? error.message : "n8n forward failed",
  }));

  return NextResponse.json({
    ok: true,
    received: true,
    inbox: inboxResult,
    forwarded,
  });
}

type MetaInboundMessage = {
  id?: string;
  from?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  [key: string]: unknown;
};

type MetaChange = {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string };
    contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
    messages?: MetaInboundMessage[];
    statuses?: Array<{ id?: string; status?: string; recipient_id?: string }>;
    // smb_app_state_sync's exact shape is sparsely documented for coexistence —
    // handled best-effort below, wrapped so a shape mismatch never throws.
    [key: string]: unknown;
  };
};

function extractMessageBody(message: MetaInboundMessage): string | null {
  return message.text?.body ?? null;
}

async function persistWebhookPayload(payload: unknown) {
  const entries = (payload as { entry?: Array<{ changes?: MetaChange[] }> })?.entry ?? [];
  let persisted = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    for (const change of entry.changes ?? []) {
      try {
        persisted += await persistChange(change);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "unknown change error");
      }
    }
  }

  return { ok: errors.length === 0, persisted, errors: errors.length ? errors : undefined };
}

async function persistChange(change: MetaChange): Promise<number> {
  const value = change.value;
  const phoneNumberId = value?.metadata?.phone_number_id;
  if (!phoneNumberId) return 0;

  let count = 0;

  // `messages` (inbound) and `smb_message_echoes` (outbound, sent from the owner's
  // phone under coexistence) share the same `value.messages[]` shape — only
  // direction/source differ. `history` batches are also this shape; ON CONFLICT
  // DO NOTHING on wa_message_id makes replays and history backfill idempotent.
  if (change.field === "messages" || change.field === "smb_message_echoes" || change.field === "history") {
    const direction = change.field === "smb_message_echoes" ? "out" : "in";
    const source = change.field === "smb_message_echoes" ? "phone" : "api";

    for (const message of value?.messages ?? []) {
      const contactWaId = message.from;
      if (!contactWaId) continue;
      const contactName = value?.contacts?.find((c) => c.wa_id === contactWaId)?.profile?.name ?? null;
      const occurredAt = message.timestamp
        ? new Date(Number(message.timestamp) * 1000).toISOString()
        : new Date().toISOString();

      const conversation = await upsertConversation({
        channelKind: "cloud_api",
        channelKey: phoneNumberId,
        contactWaId,
        contactName,
        direction,
        occurredAt,
      });

      const inserted = await insertMessage({
        conversationId: conversation.id,
        waMessageId: message.id ?? null,
        direction,
        source,
        msgType: message.type ?? "text",
        body: extractMessageBody(message),
        payload: message,
      });
      if (inserted) count += 1;
    }
  }

  if (change.field === "messages") {
    for (const status of value?.statuses ?? []) {
      if (!status.id || !status.status) continue;
      await updateMessageStatusByWaId(status.id, status.status);
      count += 1;
    }
  }

  // smb_app_state_sync updates contact display names outside of a message event.
  // Best-effort: Meta's public docs don't pin down this coexistence-only field's
  // shape as precisely as `messages`/`statuses` — verify against a captured
  // payload before depending on it further.
  if (change.field === "smb_app_state_sync") {
    const syncEntries = (value as { state_sync?: Array<{ wa_id?: string; contact_name?: string }> })
      ?.state_sync ?? [];
    for (const entry of syncEntries) {
      if (!entry.wa_id) continue;
      await upsertConversation({
        channelKind: "cloud_api",
        channelKey: phoneNumberId,
        contactWaId: entry.wa_id,
        contactName: entry.contact_name ?? null,
        direction: "out",
      });
      count += 1;
    }
  }

  return count;
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
      ...(process.env.N8N_WEBHOOK_SECRET
        ? { "x-servicioscreativos-secret": process.env.N8N_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify({
      event: "meta_whatsapp_webhook_received",
      payload,
      received_at: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(5000),
  });

  return {
    enabled: true,
    ok: response.ok,
    status: response.status,
  };
}
