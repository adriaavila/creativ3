import { auth } from "@clerk/nextjs/server";
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
  if (!process.env.CLERK_SECRET_KEY) return Response.json({ error: "Clerk no configurado." }, { status: 503 });
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "No autorizado." }, { status: 401 });
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
