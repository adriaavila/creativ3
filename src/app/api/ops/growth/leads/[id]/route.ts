import { z } from "zod";
import { updateLeadFields, updateLeadStatus } from "@/lib/growth-db";

const schema = z.object({
  status: z
    .enum(["new", "researched", "drafted", "approved", "contacted", "replied", "meeting_booked", "won", "lost"])
    .optional(),
  nextAction: z.string().max(400).nullable().optional(),
  closeProbability: z.number().int().min(0).max(100).nullable().optional(),
  potentialValue: z.number().int().min(0).max(1_000_000).nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  // ponytail: auth gate removed for now — re-add Clerk when locking down.
  const input = schema.parse(await request.json());
  const { id } = await context.params;

  if (input.status) await updateLeadStatus(id, input.status);
  if ("nextAction" in input || "closeProbability" in input || "potentialValue" in input) {
    await updateLeadFields(id, {
      nextAction: input.nextAction,
      closeProbability: input.closeProbability,
      potentialValue: input.potentialValue,
    });
  }
  return Response.json({ ok: true });
}
