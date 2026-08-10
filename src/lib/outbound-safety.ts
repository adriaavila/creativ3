import { normalizeWhatsAppId } from "@/lib/phone";

export class PilotRecipientDeniedError extends Error {
  constructor() {
    super("Piloto activo: este número no está en WHATSAPP_PILOT_ALLOWED_WA_IDS.");
    this.name = "PilotRecipientDeniedError";
  }
}

export function pilotAllowedRecipients(value = process.env.WHATSAPP_PILOT_ALLOWED_WA_IDS) {
  return new Set((value ?? "").split(",").map(normalizeWhatsAppId).filter(Boolean));
}

export function assertOutboundRecipientAllowed(
  recipient: string,
  mode = process.env.WHATSAPP_OUTBOUND_MODE,
  allowed = pilotAllowedRecipients(),
) {
  if (mode !== "pilot") return;
  if (!allowed.has(normalizeWhatsAppId(recipient))) throw new PilotRecipientDeniedError();
}
