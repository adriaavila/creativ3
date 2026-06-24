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
  // ponytail: auth gate removed for now — re-add Clerk when locking down.
  const input = schema.parse(await request.json());
  const { id } = await context.params;
  await updateDraft(id, { ...input, reviewedBy: "ops" });
  return Response.json({ ok: true });
}
