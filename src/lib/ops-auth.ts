import { cookies } from "next/headers";
import { createOpsSessionToken, OPS_COOKIE_NAME, verifyOpsSessionToken } from "@/lib/ops-session";

export { OPS_COOKIE_NAME };

export type OpsAuthorization =
  | { authorized: true; userId: string }
  | { authorized: false; response: Response };

export function isOpsAuthConfigured() {
  return Boolean(process.env.OPS_ACCESS_PASSWORD && process.env.OPS_SESSION_SECRET);
}

export async function authorizeOps(): Promise<OpsAuthorization> {
  const secret = process.env.OPS_SESSION_SECRET;
  const token = (await cookies()).get(OPS_COOKIE_NAME)?.value;
  const session = secret ? verifyOpsSessionToken(token, secret) : null;
  if (!session) {
    return {
      authorized: false,
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { authorized: true, userId: session.userId };
}

/**
 * Resolves which workspace an ops request acts on. A request may name one, but the
 * signed session is the fallback, so a missing or malformed value can never widen
 * scope. ponytail: charset check only — every ops user shares one gate today.
 * Swap for a real membership lookup before onboarding unrelated customers.
 */
export function resolveOpsWorkspace(requested: string | null | undefined, userId: string) {
  const value = typeof requested === "string" ? requested.trim() : "";
  return value && /^[a-zA-Z0-9._-]{1,80}$/.test(value) ? value : userId;
}

/** Signs a fresh session token. Throws if OPS_SESSION_SECRET is unset — callers already gate on isOpsAuthConfigured(). */
export function issueOpsSessionToken(userId = "allok-ops-owner") {
  const secret = process.env.OPS_SESSION_SECRET;
  if (!secret) throw new Error("OPS_SESSION_SECRET is not configured.");
  return createOpsSessionToken(userId, secret);
}
