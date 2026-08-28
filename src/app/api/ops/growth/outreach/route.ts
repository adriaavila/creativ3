import { authorizeOps } from "@/lib/ops-auth";
import { growthOutreachSchema, sendGrowthOutreach } from "@/lib/growth-outreach";

export const runtime = "nodejs";

// Re-exported: the outreach contract lives in @/lib/growth-outreach and is shared
// with the one-tap approve-and-send route.
export { growthOutreachSchema, growthTemplateComponents } from "@/lib/growth-outreach";

export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const input = growthOutreachSchema.parse(await request.json());
  const result = await sendGrowthOutreach(input, authorization.userId);
  if (result.ok) return Response.json(result);
  return Response.json(
    { ok: false, error: result.error },
    { status: result.status, headers: result.headers },
  );
}
