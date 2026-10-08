import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { ensureOutreachTables, outreachDbConfigured, suppressEmail } from "@/lib/outreach-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.email().max(320) });

/** «Excluir»: a la lista de supresión, para siempre; no recibe ningún paso más. */
export async function POST(request: Request) {
  const auth = await authorizeOps();
  if (!auth.authorized) return auth.response;
  if (!outreachDbConfigured()) return Response.json({ error: "Falta DATABASE_URL." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Correo inválido." }, { status: 400 });
  await ensureOutreachTables();
  await suppressEmail({ email: parsed.data.email, reason: "excluded", detail: { via: "ops" } });
  return Response.json({ ok: true });
}
