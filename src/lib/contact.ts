export const CONTACT_EMAIL = "contacto@servicios.frontia.app";
export const WHATSAPP_NUMBER = "584220023684";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, vengo de servicios.frontia.app. Quiero cotizar una landing page, automatización o desarrollo web/producto con Releva.";

export function whatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
