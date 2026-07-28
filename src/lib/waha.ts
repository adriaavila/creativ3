// Server-only WAHA client. Health-check/listing lives here; sending and session
// lifecycle (start/QR) live in waha-send.ts, both sharing getWahaConfig().

export type WahaSession = {
  name: string;
  status: string;
  engine: string | null;
};

export type WahaSnapshot = {
  configured: boolean;
  error: string | null;
  sessions: WahaSession[];
};

const WAHA_URL = process.env.WAHA_URL?.replace(/\/+$/, "");

export function isWahaConfigured() {
  return Boolean(WAHA_URL && process.env.WAHA_API_KEY);
}

/** Shared base URL + API key for any WAHA REST call. */
export function getWahaConfig(): { baseUrl: string; apiKey: string } | null {
  if (!WAHA_URL || !process.env.WAHA_API_KEY) return null;
  return { baseUrl: WAHA_URL, apiKey: process.env.WAHA_API_KEY };
}

/** Lists all sessions, or filters to one by name — WAHA's /api/sessions already returns every session. */
export async function getWahaSnapshot(sessionId?: string): Promise<WahaSnapshot> {
  const config = getWahaConfig();
  if (!config) return { configured: false, error: null, sessions: [] };

  try {
    const response = await fetch(`${config.baseUrl}/api/sessions`, {
      headers: { "X-Api-Key": config.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`WAHA respondió ${response.status}`);

    const raw = await response.json();
    const sessions = (Array.isArray(raw) ? raw : [])
      .map((session: Record<string, unknown>) => ({
        name: String(session.name ?? "default"),
        status: String(session.status ?? "UNKNOWN"),
        engine: session.engine ? String(session.engine) : null,
      }))
      .filter((session) => !sessionId || session.name === sessionId);
    return { configured: true, error: null, sessions };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "No se pudo consultar WAHA",
      sessions: [],
    };
  }
}
