import { createHash } from "node:crypto";
import { z } from "zod";
import type { CapturedRow } from "./ops-capture";

const iso = z.iso.datetime({ offset: true });
/** Recorta en vez de rechazar: SQL cuenta caracteres y zod unidades UTF-16 (un emoji vale 2). */
const text = (n: number) => z.string().transform((s) => Array.from(s).slice(0, n).join(""));

/** La frontera de confianza: lo que manda la rutina del VPS, tal cual se acepta. */
export const capturedRowSchema = z.object({
  conversationId: z.string().min(1).max(80),
  phone: z.string().regex(/^\d{8,15}$/),
  name: text(120).nullable(),
  crmUrl: z.string().max(300).startsWith("https://crm.allok.fun/"),
  source: z.enum(["anuncio", "web", "invitacion", "whatsapp"]),
  adHeadline: text(200).nullable(),
  firstMessage: text(400).nullable(),
  rubro: text(160).nullable(),
  dolor: text(400).nullable(),
  calificado: z.boolean().nullable(),
  resultado: z.string().max(40).nullable(),
  askedPrice: z.boolean(),
  handoffAt: iso.nullable(),
  handoffReason: z.string().max(40).nullable(),
  booking: z
    .object({
      at: iso,
      status: z.enum(["agendada", "realizada", "no_show", "cancelada"]),
      meetLink: text(300).nullable(),
    })
    .nullable(),
  lastInboundAt: iso.nullable(),
  lastAiAt: iso.nullable(),
  lastManualAt: iso.nullable(),
}) satisfies z.ZodType<CapturedRow>;

/** El lote se valida fila por fila en la ruta: una fila mala no frena a las demás. */
export const captureBatchSchema = z.object({ rows: z.array(z.unknown()).max(200) });

/**
 * El id del lead sale de la conversación de Vocero (UUID v5): la misma
 * conversación siempre cae en la misma fila, sin tabla de mapeo.
 */
const NAMESPACE = "6f1c2a8e-3b7d-5e4a-9c21-0d8f7b6a5e43";
export function capturedLeadId(conversationId: string): string {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ""), "hex");
  const hash = createHash("sha1").update(ns).update(conversationId).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
