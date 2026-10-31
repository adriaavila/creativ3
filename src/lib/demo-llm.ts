/**
 * El modelo de las demos, por el Vercel AI Gateway (su API compatible con
 * OpenAI). Fetch a secas, sin SDK: el sitio no tenía ninguna llamada a un
 * modelo y una dependencia para un POST no se justifica.
 *
 * Credencial: `AI_GATEWAY_API_KEY`, o el token OIDC de Vercel. En una función
 * de Vercel ese token NO está en `process.env`: llega en la cabecera
 * `x-vercel-oidc-token` de cada petición, y `getVercelOidcTokenSync()` lo lee de
 * ahí (o de `VERCEL_OIDC_TOKEN` en local, tras `vercel env pull`). Sin
 * ninguna, `isDemoLlmConfigured()` es false y la ruta del chat contesta la
 * línea de respaldo.
 */

import { getVercelOidcTokenSync } from "@vercel/oidc";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

/** `AI_GATEWAY_BASE_URL` solo para apuntar a un mock en pruebas locales. */
function gatewayUrl(): string {
  const base = process.env.AI_GATEWAY_BASE_URL?.trim().replace(/\/+$/, "") || DEFAULT_GATEWAY_BASE_URL;
  return `${base}/chat/completions`;
}

/** Barato y rápido: contesta en español corto y sigue reglas. Se cambia con `DEMO_MODEL`. */
export const DEFAULT_DEMO_MODEL = "openai/gpt-4.1-mini";

export type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

function credential(): string | null {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (key) return key;
  try {
    return getVercelOidcTokenSync().trim() || null;
  } catch {
    // Ni cabecera ni `VERCEL_OIDC_TOKEN`: fuera de Vercel, o OIDC apagado en el proyecto.
    return null;
  }
}

/** Se pregunta dentro de la petición: en Vercel el token OIDC vive en sus cabeceras. */
export function isDemoLlmConfigured(): boolean {
  return credential() !== null;
}

export function demoModel(): string {
  return process.env.DEMO_MODEL?.trim() || DEFAULT_DEMO_MODEL;
}

/**
 * Una llamada al modelo. Lanza si no hay credencial, si el gateway contesta
 * con error, si se pasa del tiempo o si la respuesta viene vacía: quien llama
 * decide el respaldo.
 */
export async function chatCompletion(
  messages: LlmMessage[],
  options: { maxTokens?: number; temperature?: number; timeoutMs?: number; json?: boolean; model?: string } = {},
): Promise<string> {
  const key = credential();
  if (!key) throw new Error("AI Gateway credential is not configured");
  const response = await fetch(gatewayUrl(), {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: options.model ?? demoModel(),
      messages,
      max_tokens: options.maxTokens ?? 300,
      temperature: options.temperature ?? 0.4,
      ...(options.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
  });
  if (!response.ok) {
    throw new Error(`AI Gateway returned ${response.status}`);
  }
  const data = (await response.json().catch(() => null)) as { choices?: { message?: { content?: unknown } }[] } | null;
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("AI Gateway returned an empty reply");
  return content.trim();
}

/**
 * La respuesta del chat lista para la burbuja: sin markdown que WhatsApp no
 * pinta, sin prefijos de rol y con un techo de largo.
 */
export function cleanReply(text: string, max = 700): string {
  const cleaned = text
    .replace(/^\s*(asistente|assistant)\s*:\s*/i, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : cut).trim();
}
