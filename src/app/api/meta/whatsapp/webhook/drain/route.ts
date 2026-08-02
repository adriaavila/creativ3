import { timingSafeEqual } from "node:crypto";
import { processMetaWebhookQueue } from "@/lib/meta/webhook-processor";
import { processWahaWebhookQueue } from "@/lib/waha-webhook-processor";
import { processAutoReplyQueue } from "@/lib/auto-reply";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const n8nSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret && !n8nSecret) {
    return Response.json({ error: "Webhook drain authentication is not configured." }, { status: 503 });
  }
  const cronAuthorized = secret
    ? safeEqual(request.headers.get("authorization"), `Bearer ${secret}`)
    : false;
  const n8nAuthorized = n8nSecret
    ? safeEqual(request.headers.get("x-servicioscreativos-secret"), n8nSecret)
    : false;
  if (!cronAuthorized && !n8nAuthorized) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  const [meta, waha, autoReplies] = await Promise.all([
    processMetaWebhookQueue(25),
    processWahaWebhookQueue(25),
    processAutoReplyQueue(25),
  ]);
  return Response.json({ meta, waha, autoReplies });
}

function safeEqual(value: string | null, expected: string) {
  if (!value) return false;
  const received = Buffer.from(value);
  const target = Buffer.from(expected);
  return received.length === target.length && timingSafeEqual(received, target);
}
