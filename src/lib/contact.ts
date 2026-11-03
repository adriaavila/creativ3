export const CONTACT_EMAIL = "hi@allok.fun";
export const WHATSAPP_NUMBER = "13479745199";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, vengo de allok.fun. Quiero mejorar cómo vende u opera mi negocio con allok.";

/** «Probarlo como cliente»: la frase que despierta al agente de allok. La usan la home y las invitaciones de Growth. */
export const TRY_AGENT_MESSAGE = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

/**
 * La única salida de la portada y de /trabajo. Le escriben a Adrián, no al
 * agente, y la frase queda abierta para que el dueño solo complete lo suyo.
 */
export const HOME_WHATSAPP_MESSAGE = "Hola, Adrián. Vengo de allok.fun. Lo que más tiempo me quita en el negocio es: ";

export function whatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
