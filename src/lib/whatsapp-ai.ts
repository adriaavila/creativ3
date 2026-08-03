import { gateway, generateText } from "ai";
import { getRecentMessagesForAi, type WaConversation } from "@/lib/whatsapp-inbox-db";
import { composeSystemPrompt, getTenantBotConfig } from "@/lib/tenant-bot-config";

// Vercel AI Gateway, plain "provider/model" strings — same convention as
// apps/growth-agent/agent/agent.ts. Needs AI_GATEWAY_API_KEY (or Vercel OIDC).
const FAQ_MODEL = process.env.WHATSAPP_AI_FAQ_MODEL ?? "anthropic/claude-haiku-4-5";
const QUALIFY_MODEL = process.env.WHATSAPP_AI_QUALIFY_MODEL ?? "anthropic/claude-sonnet-5";

export type ReplyClassification = "faq" | "qualify";

export type SuggestedReply = {
  text: string;
  model: string;
  classification: ReplyClassification;
};

const CLASSIFIER_SYSTEM = `Clasificás el último mensaje de un cliente en una conversación de WhatsApp de un negocio.
Respondé con una sola palabra: "faq" o "qualify".

"faq": saludo, horario, pregunta repetida, duda simple ya respondible con info conocida del negocio.
"qualify": el cliente negocia precio, expresa una necesidad concreta a calificar, pone una objeción, o pide algo fuera de lo estándar.

Ante la duda, respondé "qualify" — es preferible que un modelo más capaz atienda un caso ambiguo a que un FAQ genérico conteste mal.`;

const FAQ_SYSTEM = `Sos el asistente de WhatsApp de un negocio. Respondés preguntas frecuentes de forma breve, cálida y directa, en español, sin inventar precios ni datos que no estén en la conversación. Si no tenés la información, decilo y ofrecé escalar a una persona.`;

const QUALIFY_SYSTEM = `Sos el asistente de WhatsApp de un negocio, ayudando a calificar y avanzar una conversación comercial. Respondés en español, con criterio, sin inventar precios ni compromisos que el negocio no confirmó. El objetivo es entender la necesidad del cliente y darle un siguiente paso claro — nunca cerrás una venta ni confirmás un precio final por tu cuenta.`;

function toModelMessages(messages: Awaited<ReturnType<typeof getRecentMessagesForAi>>) {
  return messages
    .filter((message) => message.body)
    .map((message) => ({
      role: (message.direction === "in" ? "user" : "assistant") as "user" | "assistant",
      content: message.body as string,
    }));
}

async function classify(history: ReturnType<typeof toModelMessages>): Promise<ReplyClassification> {
  const { text } = await generateText({
    model: gateway(FAQ_MODEL),
    system: CLASSIFIER_SYSTEM,
    messages: history,
  });
  return text.trim().toLowerCase().startsWith("faq") ? "faq" : "qualify";
}

/**
 * Suggests a reply for a conversation — never sends it. Fase 3 keeps every
 * conversation in assigned_mode "human": a person reviews and presses send
 * (see src/app/api/ops/inbox/[id]/reply/route.ts). The classifier routes to
 * Haiku 4.5 for FAQ-shaped turns and Sonnet 5 for anything that needs judgment.
 *
 * The persona comes from tenant_bot_config keyed by the conversation's
 * channel_key (= phone_number_id), so each connected client answers with its own
 * voice and its own facts. No row = the shared defaults below.
 */
export async function suggestReply(conversation: WaConversation): Promise<SuggestedReply> {
  const [recent, config] = await Promise.all([
    getRecentMessagesForAi(conversation.id, 20),
    conversation.channelKind === "cloud_api"
      ? getTenantBotConfig(conversation.channelKey).catch(() => null)
      : Promise.resolve(null),
  ]);
  const history = toModelMessages(recent);
  if (history.length === 0) {
    throw new Error("No hay mensajes suficientes en la conversación para sugerir una respuesta.");
  }

  const classification = await classify(history);
  const model = classification === "faq" ? FAQ_MODEL : QUALIFY_MODEL;
  const base = classification === "faq" ? FAQ_SYSTEM : QUALIFY_SYSTEM;

  const { text } = await generateText({
    model: gateway(model),
    system: composeSystemPrompt({ base, config, summary: conversation.summary }),
    messages: history,
  });

  return { text: text.trim(), model, classification };
}
