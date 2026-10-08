import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { outreachDbConfigured } from "@/lib/outreach-db";
import { OutreachImportError, importOutreachCsv } from "@/lib/outreach-import";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  csv: z.string().min(1).max(2_000_000),
  fileName: z.string().trim().max(200).optional(),
  allowFreemail: z.boolean().optional(),
});

/** La subida de leads de /ops/outreach: los mismos filtros que `pnpm outreach import`. */
export async function POST(request: Request) {
  const auth = await authorizeOps();
  if (!auth.authorized) return auth.response;
  if (!outreachDbConfigured()) return Response.json({ error: "Falta DATABASE_URL." }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Sube un archivo CSV de menos de 2 MB." }, { status: 400 });
  const { csv, fileName, allowFreemail } = parsed.data;
  try {
    const result = await importOutreachCsv(csv, { allowFreemail, source: fileName || "ops-upload.csv" });
    return Response.json(result);
  } catch (error) {
    if (error instanceof OutreachImportError) return Response.json({ error: error.message }, { status: 400 });
    console.error("Outreach import failed", error);
    return Response.json({ error: "No se pudo importar. Revisa los logs." }, { status: 500 });
  }
}
