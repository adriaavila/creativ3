import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import {
  getConversationById,
  listMessages,
  setConversationAssignedMode,
  setConversationLeadId,
  setConversationOutcome,
  setConversationStatus,
} from "@/lib/whatsapp-inbox-db";

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

// Both fields optional so the inbox can patch either one alone. `outcome: null`
// un-marks a conversation — distinct from omitting the key, which leaves it be.
const patchSchema = z.object({
  assignedMode: z.enum(["human", "ai"]).optional(),
  status: z.enum(["open", "snoozed", "closed"]).optional(),
  outcome: z.enum(["cita", "cotizacion", "descarte"]).nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const conversationId = Number((await params).id);
  if (!Number.isFinite(conversationId)) {
    return Response.json({ error: "id inválido." }, { status: 400 });
  }

  const input = patchSchema.parse(await request.json());
  if (input.assignedMode) await setConversationAssignedMode(conversationId, input.assignedMode);
  if (input.status) await setConversationStatus(conversationId, input.status);
  if (input.outcome !== undefined) await setConversationOutcome(conversationId, input.outcome);
  if (input.leadId !== undefined) await setConversationLeadId(conversationId, input.leadId);
  return Response.json({ ok: true });
}
