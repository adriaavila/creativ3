import { auth } from "@clerk/nextjs/server";

export type OpsAuthorization =
  | { authorized: true; userId: string }
  | { authorized: false; response: Response };

export function isOpsAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export async function authorizeOps(): Promise<OpsAuthorization> {
  if (!isOpsAuthConfigured()) {
    return {
      authorized: true,
      userId: "ops-without-clerk",
    };
  }

  const { userId } = await auth();
  if (!userId) {
    return {
      authorized: false,
      response: Response.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }
  return { authorized: true, userId };
}
