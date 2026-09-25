import { z } from "zod";
import { createManualLead } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";
import { localDate, waDigits } from "@/lib/sales-queue";

const schema = z.object({
  id: z.uuid(),
  businessName: z.string().trim().min(1).max(120),
  businessPhone: z
    .string()
    .trim()
    .max(40)
    .nullable()
    .refine((phone) => !phone || waDigits(phone) !== null),
  source: z.enum(["aliado", "referido", "reunión", "growth", "otro"]),
  offer: z.enum(["vocero", "rei", "agencia"]),
  note: z.string().trim().max(400).default(""),
});

export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Revisa el nombre y el teléfono." }, { status: 400 });

  const today = localDate(new Date());
  await createManualLead({ ...parsed.data, businessPhone: parsed.data.businessPhone || null, today });
  return Response.json({ ok: true, today });
}
