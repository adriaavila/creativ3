import { ZodError } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { parseTenantAutomationInput } from "@/lib/tenant-automation";
import { upsertTenantBotConfig } from "@/lib/tenant-bot-config";
import { getWhatsAppConnectionByPhoneNumberId } from "@/lib/whatsapp-connections-db";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ phoneNumberId: string }> },
) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const { phoneNumberId } = await params;
  if (!/^\d{5,32}$/.test(phoneNumberId)) {
    return Response.json({ error: "Número de Meta inválido." }, { status: 400 });
  }

  try {
    const connection = await getWhatsAppConnectionByPhoneNumberId(phoneNumberId);
    if (!connection) return Response.json({ error: "Conexión no encontrada." }, { status: 404 });

    const input = parseTenantAutomationInput(await request.json());
    const config = await upsertTenantBotConfig({ phoneNumberId, ...input });
    return Response.json({ config });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return Response.json({ error: "La configuración contiene valores inválidos." }, { status: 400 });
    }
    console.error("Could not update tenant automation", error);
    return Response.json({ error: "No se pudo guardar la automatización." }, { status: 500 });
  }
}
