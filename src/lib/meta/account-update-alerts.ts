import type { WhatsAppNormalizedEvent } from "@/lib/whatsapp-provider";

/**
 * Los account_update que le importan a Adrian. Todos los CRM comparten la app
 * de Meta de allok y su único webhook a nivel de app es allok.fun, así que acá
 * llegan las desconexiones y altas de números que ningún CRM ve.
 */
export type AccountUpdateAlert =
  | { kind: "disconnected"; wabaId: string; reason: string }
  | { kind: "partner_added"; wabaId: string };

/** Lo que allok.fun sabe del WABA: quién lo tiene (CRM o cliente), si lo tiene. */
export type WabaOwner = { owner: string | null } | null;

/**
 * Cuánto espera un PARTNER_ADDED antes de concluir que nadie guardó el número.
 * ponytail: 4 min caben en una sola invocación de Vercel (300 s), y el código
 * de Embedded Signup se canjea en segundos. Si un CRM llega a tardar más, subir
 * esto exige un reloj afuera (el drenado de n8n está estacionado).
 */
export const PARTNER_ADDED_GRACE_MS = 4 * 60_000;

const DISCONNECTS = new Set(["PARTNER_REMOVED", "PARTNER_APP_UNINSTALLED"]);

export function classifyAccountUpdate(event: WhatsAppNormalizedEvent): AccountUpdateAlert | null {
  if (event.type !== "connection.updated" || !event.wabaId) return null;
  if (DISCONNECTS.has(event.update)) {
    const reason = event.reason
      ? [event.reason, event.initiatedBy && `lo inició ${event.initiatedBy}`].filter(Boolean).join(", ")
      : event.update;
    return { kind: "disconnected", wabaId: event.wabaId, reason };
  }
  if (event.update === "PARTNER_ADDED") return { kind: "partner_added", wabaId: event.wabaId };
  return null;
}

/** El texto del aviso, o null si no hay nada que avisar. */
export function accountUpdateAlertText(alert: AccountUpdateAlert, known: WabaOwner): string | null {
  if (alert.kind === "disconnected") {
    const owner = known?.owner ? `CRM: ${known.owner}.` : "allok.fun no sabe qué CRM lo tiene.";
    return `Meta desconectó el WABA ${alert.wabaId} (${alert.reason}). ${owner}`;
  }
  // allok.fun guardó el número: el alta terminó bien.
  if (known) return null;
  return [
    `Alguien terminó la coexistencia del WABA ${alert.wabaId} pero ningún CRM recibió el código; que repita la conexión desde el CRM.`,
    "allok.fun sólo ve sus propias conexiones: si el número ya aparece en el CRM, ignora este aviso.",
  ].join("\n");
}
