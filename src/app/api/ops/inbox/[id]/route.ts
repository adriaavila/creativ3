import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { getConversationById, listMessages, setConversationAssignedMode } from "@/lib/whatsapp-inbox-db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const conversationId = Number((await params).id);
  if (!Number.isFinite(conversationId)) {
    return Response.json({ error: "id inválido." }, { status: 400 });
  }

  const conversation = await getConversationById(conversationId);
  if (!conversation) return Response.json({ error: "Conversación no encontrada." }, { status: 404 });

  const messages = await listMessages(conversationId);
  return Response.json({ conversation, messages });
}

const patchSchema = z.object({ assignedMode: z.enum(["human", "ai"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const conversationId = Number((await params).id);
  if (!Number.isFinite(conversationId)) {
    return Response.json({ error: "id inválido." }, { status: 400 });
  }

  const input = patchSchema.parse(await request.json());
  await setConversationAssignedMode(conversationId, input.assignedMode);
  return Response.json({ ok: true });
}
