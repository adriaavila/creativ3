import { createHash, timingSafeEqual } from "node:crypto";
import { upsertCapturedLead } from "@/lib/growth-db";
import { passesFilter } from "@/lib/ops-capture";
import { captureBatchSchema } from "@/lib/ops-capture-server";

export const dynamic = "force-dynamic";

/**
 * Fuera de `/api/ops` a propósito: el proxy exige ahí la cookie de Ops, y esto
 * lo llama una máquina con su propio secreto (igual que el drain de Meta).
 * La rutina del VPS `ops-capture.sh` manda aquí, cada 15 min y sólo si algo
 * cambió, los leads de Vocero (`principal`) que ya pasaron el filtro del agente.
 * ponytail: acepta `CRON_SECRET` si no hay `OPS_CAPTURE_SECRET`, para no exigir
 * una variable nueva; una propia el día que la rutina viva en otra máquina.
 */
export async function POST(request: Request) {
  const secret = process.env.OPS_CAPTURE_SECRET || process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Capture authentication is not configured." }, { status: 503 });
  if (!safeEqual(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = captureBatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid batch.", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  }

  const now = new Date();
  const results = { created: 0, updated: 0, skipped: 0 };
  for (const row of parsed.data.rows) {
    // El filtro vive también en el SQL de la rutina; aquí se vuelve a aplicar por ser la frontera.
    if (!passesFilter(row)) {
      results.skipped += 1;
      continue;
    }
    const { created } = await upsertCapturedLead(row, now);
    results[created ? "created" : "updated"] += 1;
  }
  return Response.json({ ok: true, ...results });
}

/** Compara digests de igual largo: no filtra el largo del secreto ni corta antes por tiempo. */
function safeEqual(value: string | null, expected: string) {
  if (!value) return false;
  const a = createHash("sha256").update(value).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}
