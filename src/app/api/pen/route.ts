import { createTextStreamResponse, Output, streamText, toTextStream, type LanguageModel } from "ai";
import { isDemoLlmConfigured } from "@/lib/demo-llm";
import { clientIp, createWindowLimiter } from "@/lib/demo-rate-limit";
import { DEFAULT_PEN_MODEL, SKETCH_INSTRUCTIONS, sketchPrompt, sketchRequestSchema, sketchSchema } from "@/lib/pen-sketch";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Nadie escribe a mano más de cuatro problemas por minuto. */
const perMinute = createWindowLimiter(4, 60 * 1000);
/** Una visita: doce fichas cada seis horas. */
const perVisit = createWindowLimiter(12, 6 * 60 * 60 * 1000);

/** El cuerpo de un error es una palabra: `useObject` la entrega tal cual en `error.message`. */
function refuse(status: number, code: "invalid" | "limited" | "unavailable") {
  return new Response(code, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}

/** En local, `PEN_MOCK` cambia el modelo por uno de mentira (ver pen-mock.ts). En producción no existe. */
async function penModel(text: string): Promise<LanguageModel | null> {
  if (process.env.NODE_ENV !== "production" && process.env.PEN_MOCK) {
    const { mockPenModel } = await import("@/lib/pen-mock");
    return mockPenModel(text, process.env.PEN_MOCK);
  }
  // La misma credencial que las demos: `AI_GATEWAY_API_KEY` o el token OIDC de Vercel.
  if (!isDemoLlmConfigured()) return null;
  return process.env.PEN_MODEL?.trim() || DEFAULT_PEN_MODEL;
}

/**
 * «Your turn» de /pen: recibe lo que le quita tiempo a quien visita y
 * devuelve, en streaming, la ficha que la línea dibuja (AI SDK de Vercel por
 * el AI Gateway). El JSON sale a medio escribir y `useObject` lo va pintando.
 *
 * Nunca deja a la página esperando: si no hay credencial, si se pasa el
 * límite o si el modelo falla antes de escribir, contesta un error corto y
 * la página ofrece WhatsApp con lo que la persona ya escribió.
 */
export async function POST(request: Request) {
  const parsed = sketchRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return refuse(400, "invalid");

  const ip = clientIp(request.headers);
  if (!perMinute.take(ip) || !perVisit.take(ip)) return refuse(429, "limited");

  const model = await penModel(parsed.data.text);
  if (!model) {
    console.warn("Pen sketch: AI Gateway credential missing");
    return refuse(503, "unavailable");
  }

  let failed = false;
  const result = streamText({
    model,
    instructions: SKETCH_INSTRUCTIONS,
    prompt: sketchPrompt(parsed.data.text),
    output: Output.object({ schema: sketchSchema }),
    maxOutputTokens: 400,
    temperature: 0.5,
    maxRetries: 1,
    abortSignal: AbortSignal.timeout(20_000),
    onError: ({ error }) => {
      failed = true;
      console.error("Pen sketch: the model failed", error);
    },
  });

  // Espera el primer trozo: un fallo del modelo antes de escribir es un 503, no una ficha vacía.
  const reader = toTextStream({ stream: result.stream }).getReader();
  const first = await reader.read().catch(() => ({ done: true as const, value: undefined }));
  if (first.done || failed) {
    reader.cancel().catch(() => {});
    return refuse(503, "unavailable");
  }

  const stream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue(first.value);
    },
    async pull(controller) {
      try {
        const next = await reader.read();
        if (next.done) controller.close();
        else controller.enqueue(next.value);
      } catch {
        // Se cortó a medias: la página se queda con lo escrito y `useObject` avisa que no validó.
        controller.close();
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });

  return createTextStreamResponse({ stream, headers: { "cache-control": "no-store" } });
}
