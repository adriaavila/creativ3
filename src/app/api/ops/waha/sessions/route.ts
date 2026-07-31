import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { getWahaConfig } from "@/lib/waha";
import { ensureWahaSession, getWahaQr } from "@/lib/waha-send";
import { listWahaConnections, updateWahaConnectionStatus, upsertWahaConnection } from "@/lib/whatsapp-inbox-db";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const connections = await listWahaConnections();
  return Response.json({ connections });
}

const createSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Usa minúsculas, números y guiones."),
  client: z.string().trim().max(200).nullable().optional(),
});

export async function POST(request: Request) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const config = getWahaConfig();
  if (!config) {
    return Response.json({ error: "WAHA no está configurado (WAHA_URL/WAHA_API_KEY)." }, { status: 503 });
  }

  const input = createSchema.parse(await request.json());

  await upsertWahaConnection({
    id: input.id,
    workspaceId: input.client ?? input.id,
    client: input.client ?? null,
    wahaBaseUrl: config.baseUrl,
    status: "pending",
  });

  try {
    await ensureWahaSession(input.id, input.client ?? input.id);
    await updateWahaConnectionStatus(input.id, "scan_qr");
    const qr = await getWahaQr(input.id);
    return Response.json({ ok: true, session: input.id, qr });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar la sesión WAHA." },
      { status: 502 },
    );
  }
}
