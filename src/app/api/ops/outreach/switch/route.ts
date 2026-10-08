import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { resolveSendingSwitch } from "@/lib/outreach";
import { ensureOutreachTables, outreachDbConfigured, setSendingEnabled } from "@/lib/outreach-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ enabled: z.boolean() });

/** «Envíos activos»: el interruptor de la base que lee el cron. */
export async function POST(request: Request) {
  const auth = await authorizeOps();
  if (!auth.authorized) return auth.response;
  if (!outreachDbConfigured()) return Response.json({ error: "Falta DATABASE_URL." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Petición inválida." }, { status: 400 });
  await ensureOutreachTables();
  const setting = await setSendingEnabled(parsed.data.enabled);
  return Response.json({ setting, effective: resolveSendingSwitch(process.env, setting.enabled) });
}
