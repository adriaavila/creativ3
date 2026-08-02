import { authorizeOps } from "@/lib/ops-auth";
import { createRealtimeToken, REALTIME_TOKEN_TTL_SECONDS } from "@/lib/realtime-auth";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const secret = process.env.REALTIME_TOKEN_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Realtime no está configurado." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      token: createRealtimeToken(authorization.userId, secret),
      expiresIn: REALTIME_TOKEN_TTL_SECONDS,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
