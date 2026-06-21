import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { updateDraft } from "@/lib/growth-db";

const schema = z.object({
  content: z.string().min(1).max(3000).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!process.env.CLERK_SECRET_KEY) return Response.json({ error: "Clerk no configurado." }, { status: 503 });
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "No autorizado." }, { status: 401 });
  const input = schema.parse(await request.json());
  const { id } = await context.params;
  await updateDraft(id, { ...input, reviewedBy: userId });
  return Response.json({ ok: true });
}
