import { z } from "zod";
import { authorizeOps } from "@/lib/ops-auth";
import { getConversationById } from "@/lib/whatsapp-inbox-db";
import { OutsideFreeTextWindowError, sendToConversation } from "@/lib/whatsapp-send";
import { suggestReply } from "@/lib/whatsapp-ai";

export const runtime = "nodejs";

// Every conversation starts (and stays, unless flipped via PATCH .../inbox/[id])
// in assigned_mode "human" — this route only ever sends what a person approved.
// "suggest" never touches Meta/WAHA; it just proposes text for the operator to
// edit or accept before hitting "send".
const bodySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("suggest") }),
  z.object({
    mode: z.literal("send"),
    text: z.string().trim().min(1).max(4096).optional(),
    template: z
      .object({
        name: z.string().min(1),
        languageCode: z.string().min(2),
        components: z.array(z.unknown()).optional(),
      })
      .optional(),
  }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeOps();
  if (!authorization.authorized) return authorization.response;

  const conversationId = Number((await params).id);
  if (!Number.isFinite(conversationId)) {
    return Response.json({ error: "id inválido." }, { status: 400 });
  }

  const input = bodySchema.parse(await request.json());
  const conversation = await getConversationById(conversationId);
  if (!conversation) return Response.json({ error: "Conversación no encontrada." }, { status: 404 });

  if (input.mode === "suggest") {
    try {
      const suggestion = await suggestReply(conversation);
      return Response.json({ suggestion });
    } catch (error) {
      return Response.json(
        { error: error instanceof Error ? error.message : "No se pudo generar una sugerencia." },
        { status: 502 },
      );
    }
  }

  if (!input.text && !input.template) {
    return Response.json({ error: "Enviá `text` o `template`." }, { status: 400 });
  }

  try {
    const message = await sendToConversation({
      conversationId,
      text: input.text,
      template: input.template,
      source: "api",
    });
    return Response.json({ ok: true, message });
  } catch (error) {
    if (error instanceof OutsideFreeTextWindowError) {
      return Response.json({ error: error.message, requiresTemplate: true }, { status: 409 });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "No se pudo enviar el mensaje." },
      { status: 502 },
    );
  }
}
