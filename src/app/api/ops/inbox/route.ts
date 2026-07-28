import { authorizeOps } from "@/lib/ops-auth";
import { listConversations } from "@/lib/whatsapp-inbox-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const conversations = await listConversations();
  return Response.json({ conversations });
}
