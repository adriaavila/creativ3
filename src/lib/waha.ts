// Server-only, read-only WAHA client used by Growth OS to display channel health.

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

export async function getWahaSnapshot(): Promise<WahaSnapshot> {
  if (!isWahaConfigured()) return { configured: false, error: null, sessions: [] };

  try {
    const response = await fetch(`${WAHA_URL}/api/sessions`, {
      headers: { "X-Api-Key": process.env.WAHA_API_KEY as string },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`WAHA respondió ${response.status}`);

    const raw = await response.json();
    const sessions = (Array.isArray(raw) ? raw : []).map((session: Record<string, unknown>) => ({
      name: String(session.name ?? "default"),
      status: String(session.status ?? "UNKNOWN"),
      engine: session.engine ? String(session.engine) : null,
    }));
    return { configured: true, error: null, sessions };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "No se pudo consultar WAHA",
      sessions: [],
    };
  }
}
