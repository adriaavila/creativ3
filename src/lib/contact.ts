export const CONTACT_EMAIL = "contacto@allok.fun";
export const WHATSAPP_NUMBER = "584220023684";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, vengo de allok.fun. Quiero mejorar cómo vende u opera mi negocio con allok.";

export function whatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
