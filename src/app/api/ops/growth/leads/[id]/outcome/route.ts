import { z } from "zod";
import { logLeadOutcome } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";
import { localDate, outcomePatch } from "@/lib/sales-queue";

const schema = z.object({
  outcome: z.enum(["talked", "asked", "paid", "not_now"]),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Resultado no válido." }, { status: 400 });
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Lead no válido." }, { status: 400 });

  const patch = outcomePatch(parsed.data.outcome, localDate(new Date()), parsed.data.reason);
  const lastContactedAt = await logLeadOutcome(id, patch);
  if (!lastContactedAt) return Response.json({ error: "Ese lead ya no existe." }, { status: 404 });
  return Response.json({ ok: true, patch, lastContactedAt });
}
