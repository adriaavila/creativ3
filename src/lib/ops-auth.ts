import { cookies } from "next/headers";

export const OPS_COOKIE_NAME = "creativv_ops_session";

export type OpsAuthorization =
  | { authorized: true; userId: string }
  | { authorized: false; response: Response };

export function isOpsAuthConfigured() {
  return Boolean(process.env.OPS_ACCESS_PASSWORD && process.env.OPS_SESSION_SECRET);
}
export async function authorizeOps(): Promise<OpsAuthorization> {
  const expected = process.env.OPS_SESSION_SECRET;
  const session = (await cookies()).get(OPS_COOKIE_NAME)?.value;
  if (!expected || session !== expected) {
    return {
      authorized: false,
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { authorized: true, userId: "creativv-ops-owner" };
}
