import { simulateReadableStream, type LanguageModel } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { Sketch } from "./pen-sketch";

/**
 * El modelo de mentira de /pen, solo para probar en local sin credencial:
 * `PEN_MOCK=ok pnpm dev` contesta una ficha fija en trozos, como el modelo de
 * verdad; `PEN_MOCK=fail` falla antes de escribir, para ver el camino infeliz.
 * La ruta solo lo importa fuera de producción.
 */
export function mockPenModel(text: string, mode: string): LanguageModel {
  const sketch: Sketch = {
    problem: /whatsapp/i.test(text)
      ? "You answer the same questions on WhatsApp all day, one by one."
      : "Something in your day takes more of your time than it should.",
    glyph: /whatsapp|message/i.test(text) ? "bubble" : "bolt",
    result: /whatsapp/i.test(text) ? "The common questions, answered before you look." : "The repeated part, running on its own.",
    steps: [
      "Read a week of your real conversations with you.",
      "Write down the answers you already give, in your words.",
      "Let the agent answer those, and hand you the rest.",
    ],
  };
  const json = JSON.stringify(sketch);
  const pieces = json.match(/[\s\S]{1,14}/g) ?? [json];
  const usage = {
    inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: 1, text: 1, reasoning: undefined },
  };
  return new MockLanguageModelV4({
    doStream: async () => {
      if (mode === "fail") throw new Error("mock failure");
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 250,
          chunkDelayInMs: 45,
          chunks: [
            { type: "text-start" as const, id: "t" },
            ...pieces.map((delta) => ({ type: "text-delta" as const, id: "t", delta })),
            { type: "text-end" as const, id: "t" },
            { type: "finish" as const, finishReason: { unified: "stop" as const, raw: undefined }, logprobs: undefined, usage },
          ],
        }),
      };
    },
  });
}
