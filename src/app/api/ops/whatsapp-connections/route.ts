import { authorizeOps } from "@/lib/ops-auth";
import { listWhatsAppConnections } from "@/lib/whatsapp-connections-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  try {
    const connections = await listWhatsAppConnections();
    return Response.json({ connections });
  } catch (error) {
    console.error("Could not list WhatsApp connections", error);
    return Response.json(
      { error: "Could not load WhatsApp connections." },
      { status: 500 },
    );
  }
}
