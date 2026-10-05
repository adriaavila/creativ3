import { normalizeEmail, verifySvixSignature } from "@/lib/outreach";
import { outreachDbConfigured, suppressEmail, type SuppressionReason } from "@/lib/outreach-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Webhook de Resend para la prospección: `email.bounced` y `email.complained`
 * mandan la dirección a la lista de supresión. Lo demás se ignora con 200.
 * Firmado con Svix (`svix-id`, `svix-timestamp`, `svix-signature`) y el secreto
 * `RESEND_WEBHOOK_SECRET` (`whsec_…`, en Resend → Webhooks).
 */

const SUPPRESS: Record<string, SuppressionReason> = {
  "email.bounced": "bounced",
  "email.complained": "complained",
};

type ResendEvent = {
  type?: string;
  data?: { email_id?: string; to?: string[] | string; bounce?: { type?: string; subType?: string; message?: string } };
};

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  const rawBody = await request.text();
  const ok = verifySvixSignature({
    rawBody,
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
    secret,
  });
  if (!ok) return new Response("Invalid signature", { status: 401 });

  let event: ResendEvent;
  try {
    event = JSON.parse(rawBody) as ResendEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const reason = event.type ? SUPPRESS[event.type] : undefined;
  if (!reason) return Response.json({ ignored: event.type ?? null });

  const recipients = (Array.isArray(event.data?.to) ? event.data.to : [event.data?.to]).filter((x): x is string => typeof x === "string");
  if (!recipients.length) return Response.json({ ignored: "no recipient" });
  if (!outreachDbConfigured()) return new Response("Database not configured", { status: 503 });
  try {
    for (const to of recipients) {
      // Puede venir como «Nombre <correo>».
      const email = normalizeEmail(/<([^>]+)>/.exec(to)?.[1] ?? to);
      await suppressEmail({
        email,
        reason,
        resendId: event.data?.email_id ?? null,
        detail: event.data?.bounce ? { bounce: { type: event.data.bounce.type, subType: event.data.bounce.subType } } : {},
      });
    }
  } catch (error) {
    // 500: Resend reintenta. La supresión es idempotente.
    console.error("Outreach webhook failed", error);
    return new Response("Could not record", { status: 500 });
  }
  return Response.json({ suppressed: recipients.length, reason });
}
