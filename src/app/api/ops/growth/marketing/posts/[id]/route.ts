import { getPostAnalytics, isPostizConfigured } from "@/lib/postiz";
import { authorizeOps } from "@/lib/ops-auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  if (!isPostizConfigured()) {
    return Response.json({ error: "POSTIZ_API_KEY no configurada" }, { status: 503 });
  }
  const { id } = await context.params;
  try {
    return Response.json(await getPostAnalytics(id));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Error consultando Postiz" },
      { status: 502 },
    );
  }
}
