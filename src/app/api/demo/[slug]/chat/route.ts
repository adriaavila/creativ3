import { CHAT_SESSION_TURNS, FALLBACK_REPLY, LIMIT_REPLY, buildSystemPrompt, chatRequestSchema } from "@/lib/demo-agent";
import { getDemoAgent, recordChatTurn } from "@/lib/demo-db";
import { chatCompletion, cleanReply, isDemoLlmConfigured } from "@/lib/demo-llm";
import { clientIp, createWindowLimiter } from "@/lib/demo-rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Una charla: 30 turnos por visitante y demo cada 6 horas. */
const perSession = createWindowLimiter(CHAT_SESSION_TURNS, 6 * 60 * 60 * 1000);
/** Ráfagas: nadie escribe más de 12 mensajes por minuto a mano. */
const perMinute = createWindowLimiter(12, 60 * 1000);

/**
 * El chat de `/demo/<slug>`. Siempre contesta 200 con `{ reply }` cuando la
 * demo existe y el cuerpo es válido: un fallo del modelo, un límite o la falta
 * de credencial se vuelven una línea amable en la burbuja, nunca un error en
 * la pantalla del prospecto.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/demo/[slug]/chat">) {
  const { slug } = await ctx.params;
  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Mensaje no válido." }, { status: 400 });
  }

  const agent = await getDemoAgent(slug);
  if (!agent) return Response.json({ error: "Demo no encontrada." }, { status: 404 });

  const ip = clientIp(request.headers);
  if (!perMinute.take(ip) || !perSession.take(`${ip}:${slug}`)) {
    return Response.json({ reply: LIMIT_REPLY, limited: true });
  }
  const { allowed } = await recordChatTurn(slug);
  if (!allowed) return Response.json({ reply: LIMIT_REPLY, limited: true });

  if (!isDemoLlmConfigured()) {
    console.warn("Demo chat: AI Gateway credential missing, answering with the fallback line");
    return Response.json({ reply: FALLBACK_REPLY, fallback: true });
  }

  const messages = [{ role: "system" as const, content: buildSystemPrompt(agent) }, ...parsed.data.messages];
  // Un reintento corto: un hipo del gateway no debe sentirse en la demo.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await chatCompletion(messages, { maxTokens: 220, temperature: 0.4, timeoutMs: attempt === 0 ? 12_000 : 9_000 });
      const reply = cleanReply(raw);
      if (reply) return Response.json({ reply });
    } catch (error) {
      console.error(`Demo chat attempt ${attempt + 1} failed`, error);
    }
  }
  return Response.json({ reply: FALLBACK_REPLY, fallback: true });
}
