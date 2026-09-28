import { z } from "zod";
import { DAILY_INVITE_CAP, countInvitesToday, getGrowthLeadById, getOutreachDraftById, inviteAlreadyLogged, logInvite } from "@/lib/growth-db";
import { authorizeOps } from "@/lib/ops-auth";
import { localDate, waDigits } from "@/lib/sales-queue";

const schema = z.object({ content: z.string().trim().min(1).max(3000) });

/**
 * «Invitar por WhatsApp» / «Enviar seguimiento»: el link ya abrió WhatsApp en el
 * teléfono de Adrian y él manda el mensaje. Aquí sólo se anota y se agenda el
 * siguiente seguimiento. Nada sale por la API de WhatsApp.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "Borrador no válido." }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Falta el mensaje." }, { status: 400 });

  const draft = await getOutreachDraftById(id);
  if (!draft) return Response.json({ error: "Ese borrador ya no existe." }, { status: 404 });
  if (draft.channel !== "whatsapp" || !["dm", "followup_1", "followup_2"].includes(draft.kind)) {
    return Response.json({ error: "Sólo los mensajes de WhatsApp se invitan desde aquí." }, { status: 400 });
  }
  const lead = await getGrowthLeadById(draft.leadId);
  const recipient = waDigits(lead?.businessPhone);
  if (!lead || !recipient) return Response.json({ error: "Ese negocio no tiene WhatsApp." }, { status: 400 });

  // Un reintento del mismo borrador no cuenta contra el tope (lo resuelve la llave única).
  const repeat = await inviteAlreadyLogged(draft.id);
  if (!repeat && (await countInvitesToday()) >= DAILY_INVITE_CAP) {
    return Response.json(
      { error: `Ya van ${DAILY_INVITE_CAP} mensajes en frío hoy. Sigue mañana para cuidar el número.` },
      { status: 429 },
    );
  }

  const next = await logInvite({
    draftId: draft.id,
    leadId: lead.id,
    kind: draft.kind as "dm" | "followup_1" | "followup_2",
    recipient,
    content: parsed.data.content,
    sentBy: authorization.userId,
    today: localDate(new Date()),
  });
  return Response.json({ ok: true, repeat, ...next });
}
