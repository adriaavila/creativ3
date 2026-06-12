export const CONTACT_EMAIL = "contacto@servicioscreativos.online";
export const WHATSAPP_NUMBER = "584220023684";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, vengo de servicioscreativos.online. Quiero cotizar una landing page, automatización o desarrollo web/producto con creativv.";

export function whatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
