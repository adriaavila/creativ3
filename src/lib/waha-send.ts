import { getWahaConfig } from "@/lib/waha";

// WAHA is a self-hosted, unofficial WhatsApp client — surface that in onboarding
// copy (risk of number ban, no structured Meta templates). See waha.ts for the
// shared config/health-check; this file is send + session lifecycle only.

async function wahaFetch(path: string, init?: RequestInit) {
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

  if (!response.ok) {
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

export async function startWahaSession(sessionId: string): Promise<void> {
  await wahaFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ name: sessionId, start: true }),
  });
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
): Promise<{ id?: string }> {
  const response = await wahaFetch("/api/sendText", {
    method: "POST",
    body: JSON.stringify({ session: sessionId, chatId: toWahaChatId(waId), text }),
  });
  const body = await response.json().catch(() => ({}) as Record<string, unknown>);
  return { id: body?.id ? String(body.id) : undefined };
}
