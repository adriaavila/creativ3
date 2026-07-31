// Server-only WAHA client. Health-check/listing lives here; sending and session
// lifecycle (start/QR) live in waha-send.ts, both sharing getWahaConfig().

export type WahaSession = {
  name: string;
  status: WahaConnectionStatus | null;
  rawStatus: string;
  engine: string | null;
  phone: string | null;
};

export type WahaConnectionStatus =
  | "starting"
  | "scan_qr"
  | "passkey"
  | "connected"
  | "stopped"
  | "failed";

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
    const response = await fetch(`${config.baseUrl}/api/sessions?all=true`, {
      headers: { "X-Api-Key": config.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`WAHA respondió ${response.status}`);

    const raw = await response.json();
    const sessions = (Array.isArray(raw) ? raw : [])
      .map(normalizeWahaSession)
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

export function normalizeWahaStatus(value: unknown): WahaConnectionStatus | null {
  const status = String(value ?? "").toUpperCase();
  if (status === "STARTING") return "starting";
  if (status === "SCAN_QR_CODE" || status === "SCAN_QR") return "scan_qr";
  if (status === "PASSKEY_REQUIRED" || status === "PASSKEY_CONFIRMATION_REQUIRED") return "passkey";
  if (status === "WORKING") return "connected";
  if (status === "STOPPED") return "stopped";
  if (status === "FAILED") return "failed";
  return null;
}

function normalizeWahaSession(value: unknown): WahaSession {
  const session = isRecord(value) ? value : {};
  const rawStatus = String(session.status ?? "UNKNOWN");
  const me = isRecord(session.me) ? session.me : {};
  return {
    name: String(session.name ?? "default"),
    status: normalizeWahaStatus(rawStatus),
    rawStatus,
    engine: normalizeWahaEngine(session.engine),
    phone: normalizeWahaPhone(me.id ?? me._serialized),
  };
}

export function normalizeWahaEngine(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim().toUpperCase();
  if (!isRecord(value)) return null;
  if (typeof value.engine === "string" && value.engine.trim()) return value.engine.trim().toUpperCase();
  for (const engine of ["gows", "noweb", "wpp", "webjs"] as const) {
    if (isRecord(value[engine]) || value[engine] === true) return engine.toUpperCase();
  }
  return null;
}

export function normalizeWahaPhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const local = value.split("@")[0]?.split(":")[0]?.replace(/\D/g, "") ?? "";
  return local.length >= 8 ? local : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
