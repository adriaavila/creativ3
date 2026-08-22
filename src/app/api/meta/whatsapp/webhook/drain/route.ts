import { timingSafeEqual } from "node:crypto";
import { processMetaWebhookQueue } from "@/lib/meta/webhook-processor";

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
  // Sólo queda la cola de Meta: WAHA y las auto-respuestas se retiraron con el
  // CRM. El drenado sigue siendo la red de seguridad de los eventos que `after()`
  // no alcanzó a procesar.
  const meta = await processMetaWebhookQueue(25);
  return Response.json({ meta });
}

function safeEqual(value: string | null, expected: string) {
  if (!value) return false;
  const received = Buffer.from(value);
  const target = Buffer.from(expected);
  return received.length === target.length && timingSafeEqual(received, target);
}
