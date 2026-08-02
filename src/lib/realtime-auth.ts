import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const REALTIME_TOKEN_TTL_SECONDS = 45;

export type RealtimeTokenPayload = {
  v: 1;
  sub: string;
  iat: number;
  exp: number;
  jti: string;
};

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createRealtimeToken(
  userId: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): string {
  const payload = Buffer.from(JSON.stringify({
    v: 1,
    sub: userId,
    iat: now,
    exp: now + REALTIME_TOKEN_TTL_SECONDS,
    jti: randomUUID(),
  } satisfies RealtimeTokenPayload)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyRealtimeToken(
  token: string | undefined | null,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): RealtimeTokenPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<RealtimeTokenPayload>;
    if (
      parsed.v !== 1 ||
      typeof parsed.sub !== "string" ||
      !parsed.sub ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.jti !== "string" ||
      !parsed.jti ||
      parsed.exp <= now ||
      parsed.exp - parsed.iat > 60
    ) return null;
    return parsed as RealtimeTokenPayload;
  } catch {
    return null;
  }
}
