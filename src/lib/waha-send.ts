import { getWahaConfig } from "@/lib/waha";

// WAHA is a self-hosted, unofficial WhatsApp client — surface that in onboarding
// copy (risk of number ban, no structured Meta templates). See waha.ts for the
// shared config/health-check; this file is send + session lifecycle only.

async function wahaFetch(path: string, init?: RequestInit, allowedStatuses: number[] = []) {
  const config = getWahaConfig();
  if (!config) throw new Error("WAHA is not configured (WAHA_URL/WAHA_API_KEY).");

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok && !allowedStatuses.includes(response.status)) {
    const body = await response.text().catch(() => "");
    throw new Error(`WAHA ${path} responded ${response.status}: ${body.slice(0, 200)}`);
  }
  return response;
}

/** Converts a bare WhatsApp id (digits, no '+') to a WAHA chatId. */
export function toWahaChatId(waId: string): string {
  const digits = waId.replace(/\D/g, "");
  return `${digits}@c.us`;
}

/**
 * Webhook config for a session. WAHA delivers inbound messages only to the
 * webhooks attached to the session itself — there is no global webhook setting —
 * so a session started without this is a number that can never reach the inbox.
 * `ignore` matters: without it every contact's status update fires a webhook.
 */
function sessionConfig(workspaceId?: string) {
  const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  if (!appUrl) throw new Error("APP_URL is required to register the WAHA webhook.");

  const hmacKey = process.env.WAHA_WEBHOOK_HMAC_KEY;
  // ponytail: fail loudly rather than silently registering an unsigned webhook —
  // the route rejects unsigned payloads only when the key is set, so a missing key
  // here would quietly open the endpoint to anyone who knows the URL.
  if (!hmacKey) throw new Error("WAHA_WEBHOOK_HMAC_KEY is required to register the WAHA webhook.");

  const webhooks = [
    {
      url: `${appUrl}/api/waha/webhook`,
      events: ["message", "message.ack", "session.status"],
      hmac: { key: hmacKey },
      retries: { policy: "constant", delaySeconds: 2, attempts: 15 },
    },
  ];
  const downstreamUrl = process.env.MISTICA_WAHA_WEBHOOK_URL?.replace(/\/+$/, "");
  const downstreamHmac = process.env.MISTICA_WAHA_WEBHOOK_HMAC_KEY;
  if (workspaceId === "mistica" && downstreamUrl && downstreamHmac) {
    webhooks.push({
      url: downstreamUrl,
      events: ["message", "message.ack", "session.status"],
      hmac: { key: downstreamHmac },
      retries: { policy: "constant", delaySeconds: 2, attempts: 15 },
    });
  }

  return {
    metadata: workspaceId ? { workspaceId } : undefined,
    webhooks,
    ignore: { status: true, groups: true, channels: true },
  };
}

export async function ensureWahaSession(sessionId: string, workspaceId?: string): Promise<void> {
  const encoded = encodeURIComponent(sessionId);
  const current = await wahaFetch(`/api/sessions/${encoded}`, undefined, [404]);
  if (current.status === 404) {
    await wahaFetch("/api/sessions", {
      method: "POST",
      body: JSON.stringify({ name: sessionId, start: true, config: sessionConfig(workspaceId) }),
    });
    return;
  }

  const session = await current.json() as { status?: string };
  await wahaFetch(`/api/sessions/${encoded}`, {
    method: "PUT",
    body: JSON.stringify({ name: sessionId, config: sessionConfig(workspaceId) }),
  });
  if (session.status === "FAILED") await restartWahaSession(sessionId);
  else if (session.status === "STOPPED") await startWahaSession(sessionId);
}

export async function startWahaSession(sessionId: string): Promise<void> {
  await wahaFetch(`/api/sessions/${encodeURIComponent(sessionId)}/start`, { method: "POST" });
}

/**
 * Brings a dead session back to SCAN_QR_CODE. An unscanned session expires after
 * a few minutes and WAHA parks it in FAILED rather than issuing a fresh QR, so
 * without this a customer who walks away from the page comes back to a dead end:
 * no QR, and `request-code` answers 422 "current status is FAILED".
 */
export async function restartWahaSession(sessionId: string): Promise<void> {
  await wahaFetch(`/api/sessions/${encodeURIComponent(sessionId)}/restart`, { method: "POST" });
}

export async function stopWahaSession(sessionId: string): Promise<void> {
  await wahaFetch(`/api/sessions/${encodeURIComponent(sessionId)}/stop`, { method: "POST" });
}

export async function logoutWahaSession(sessionId: string): Promise<void> {
  await wahaFetch(`/api/sessions/${encodeURIComponent(sessionId)}/logout`, { method: "POST" });
}

export async function deleteWahaSession(sessionId: string): Promise<void> {
  await wahaFetch(`/api/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
}

/**
 * Pairing without a camera: WhatsApp shows an 8-character code on the phone
 * ("Link with phone number" in Linked devices) instead of a QR to scan. This is
 * the path that works over a call, where the prospect cannot point a camera at
 * your screen. The session must already be in SCAN_QR_CODE.
 *
 * `phoneNumber` is E.164 digits without '+' — the same shape as a WhatsApp id.
 */
export async function requestWahaPairingCode(sessionId: string, phoneNumber: string): Promise<string | null> {
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 8) throw new Error("El número debe incluir código de país, sin '+'.");

  const response = await wahaFetch(`/api/${encodeURIComponent(sessionId)}/auth/request-code`, {
    method: "POST",
    body: JSON.stringify({ phoneNumber: digits }),
  });
  const body = await response.json().catch(() => null);
  return body?.code ? String(body.code) : null;
}

export type WahaQr = { mimetype: string; data: string };

export async function getWahaQr(sessionId: string): Promise<WahaQr | null> {
  const response = await wahaFetch(`/api/${encodeURIComponent(sessionId)}/auth/qr`);
  const body = await response.json().catch(() => null);
  if (!body?.data) return null;
  return { mimetype: String(body.mimetype ?? "image/png"), data: String(body.data) };
}

export async function sendWahaText(
  sessionId: string,
  waId: string,
  text: string,
  options: { id?: string; replyTo?: string } = {},
): Promise<{ id?: string }> {
  const response = await wahaFetch("/api/sendText", {
    method: "POST",
    body: JSON.stringify({
      session: sessionId,
      chatId: toWahaChatId(waId),
      text,
      id: options.id,
      reply_to: options.replyTo,
    }),
  });
  const body = await response.json().catch(() => ({}) as Record<string, unknown>);
  return { id: body?.id ? String(body.id) : undefined };
}

export async function sendWahaMedia(input: {
  sessionId: string;
  waId: string;
  url: string;
  mimetype: string;
  filename?: string;
  caption?: string;
}): Promise<{ id?: string }> {
  const response = await wahaFetch("/api/sendFile", {
    method: "POST",
    body: JSON.stringify({
      session: input.sessionId,
      chatId: toWahaChatId(input.waId),
      file: { url: input.url, mimetype: input.mimetype, filename: input.filename },
      caption: input.caption,
    }),
  });
  const body = await response.json().catch(() => ({}) as Record<string, unknown>);
  return { id: body?.id ? String(body.id) : undefined };
}

export async function markWahaRead(sessionId: string, waId: string, messageId: string): Promise<void> {
  await wahaFetch("/api/sendSeen", {
    method: "POST",
    body: JSON.stringify({ session: sessionId, chatId: toWahaChatId(waId), messageIds: [messageId] }),
  });
}
