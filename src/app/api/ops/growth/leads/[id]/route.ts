import { z } from "zod";
import { updateLeadFields, updateLeadStatus } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";
import { waDigits } from "@/lib/sales-queue";

const schema = z.object({
  status: z
    .enum(["new", "researched", "drafted", "approved", "contacted", "replied", "meeting_booked", "won", "lost"])
    .optional(),
  nextAction: z.string().max(400).nullable().optional(),
  nextActionAt: z.iso.date().nullable().optional(),
  closeProbability: z.number().int().min(0).max(100).nullable().optional(),
  potentialValue: z.number().int().min(0).max(1_000_000).nullable().optional(),
  businessPhone: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .optional()
    .refine((phone) => !phone || waDigits(phone) !== null, "Teléfono no válido."),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  const input = schema.parse(await request.json());
  const { id } = await context.params;

  if (input.status) await updateLeadStatus(id, input.status);
  if ("nextAction" in input || "nextActionAt" in input || "closeProbability" in input || "potentialValue" in input || "businessPhone" in input) {
    await updateLeadFields(id, {
      nextAction: input.nextAction,
      nextActionAt: input.nextActionAt,
      closeProbability: input.closeProbability,
      potentialValue: input.potentialValue,
      businessPhone: input.businessPhone,
    });
  }
  return Response.json({ ok: true });
}
