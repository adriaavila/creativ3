export const FREE_TEXT_WINDOW_MS = 24 * 60 * 60 * 1000;

export function freeTextWindow(lastInboundAt: string | null, now = Date.now()): {
  open: boolean;
  expiresAt: string | null;
  msRemaining: number;
} {
  if (!lastInboundAt) {
    return { open: false, expiresAt: null, msRemaining: 0 };
  }

  const inboundAt = Date.parse(lastInboundAt);
  if (!Number.isFinite(inboundAt)) {
    return { open: false, expiresAt: null, msRemaining: 0 };
  }

  const expiresAtMs = inboundAt + FREE_TEXT_WINDOW_MS;
  const msRemaining = Math.max(0, expiresAtMs - now);
  return {
    open: msRemaining > 0,
    expiresAt: new Date(expiresAtMs).toISOString(),
    msRemaining,
  };
}

export function isWithinFreeTextWindow(lastInboundAt: string | null, now = Date.now()) {
  return freeTextWindow(lastInboundAt, now).open;
}
