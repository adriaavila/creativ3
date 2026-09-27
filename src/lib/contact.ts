export const CONTACT_EMAIL = "hi@allok.fun";
export const WHATSAPP_NUMBER = "584220023684";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, vengo de allok.fun. Quiero mejorar cómo vende u opera mi negocio con allok.";

/** «Probarlo como cliente»: la frase que despierta al agente de allok. La usan la home y las invitaciones de Growth. */
export const TRY_AGENT_MESSAGE = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

export function whatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
