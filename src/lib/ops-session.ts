import { createHmac, timingSafeEqual } from "node:crypto";

// ponytail: HMAC-signed session token, not JWT — one secret, one claim (userId + exp),
// no library needed. Upgrade to a real JWT lib only if scopes/claims grow.

export const OPS_COOKIE_NAME = "allok_ops_session";
export const OPS_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12h, matches prior cookie maxAge

export type OpsSessionPayload = { userId: string; exp: number };

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Builds `<payload>.<signature>` — payload is base64url JSON, signature is HMAC-SHA256 over it. */
export function createOpsSessionToken(
  userId: string,
  secret: string,
  ttlSeconds: number = OPS_SESSION_TTL_SECONDS,
): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = Buffer.from(
    JSON.stringify({ userId, exp } satisfies OpsSessionPayload),
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Verifies signature (timing-safe) and expiry. Returns the payload or null. */
export function verifyOpsSessionToken(
  token: string | undefined | null,
  secret: string,
): OpsSessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<OpsSessionPayload>;
    if (typeof parsed.userId !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: parsed.userId, exp: parsed.exp };
  } catch {
    return null;
  }
}
