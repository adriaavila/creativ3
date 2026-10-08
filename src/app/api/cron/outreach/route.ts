import { timingSafeEqual } from "node:crypto";
import { runOutreachCron } from "@/lib/outreach-run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Armar 3 demos (~1 min), revisar rebotes y enviar 3 correos espaciados caben de sobra; 300 s es el techo. */
export const maxDuration = 300;

/**
 * La prospección en frío corriendo sola (vercel.json: cada 30 minutos). Vercel
 * manda `Authorization: Bearer ${CRON_SECRET}`; sin ese encabezado, 401. Nada
 * sale si el interruptor de /ops/outreach está apagado (y empieza apagado).
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  try {
    const summary = await runOutreachCron();
    console.log(JSON.stringify({ outreachCron: summary }));
    return Response.json(summary, { status: summary.ok ? 200 : 500 });
  } catch (error) {
    const summary = { ok: false, error: (error as Error).message.slice(0, 500) };
    console.log(JSON.stringify({ outreachCron: summary }));
    return Response.json(summary, { status: 500 });
  }
}
