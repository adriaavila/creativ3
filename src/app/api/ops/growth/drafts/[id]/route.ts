import { z } from "zod";
import { updateDraft } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";

const schema = z.object({
  content: z.string().min(1).max(3000).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  const input = schema.parse(await request.json());
  const { id } = await context.params;
  await updateDraft(id, { ...input, reviewedBy: authorization.userId });
  return Response.json({ ok: true });
}
