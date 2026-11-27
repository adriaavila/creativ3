export const CONTACT_EMAIL = "hi@allok.fun";
export const WHATSAPP_NUMBER = "13479745199";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Hola, vengo de allok.fun. Quiero mejorar cómo vende u opera mi negocio con allok.";

/** «Probarlo como cliente»: la frase que despierta al agente de allok. La usan la home y las invitaciones de Growth. */
export const TRY_AGENT_MESSAGE = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";

/**
 * La única salida de la portada y de /work. Le escriben a Adrián, no al
 * agente, y la frase queda abierta para que el dueño solo complete lo suyo.
 */
export const HOME_WHATSAPP_MESSAGE = "Hi Adrián, I found you on allok.fun. What eats most of my time in the business is: ";

/** La misma frase en español, para las páginas que siguen en español (/casos). */
export const HOME_WHATSAPP_MESSAGE_ES = "Hola, Adrián. Vengo de allok.fun. Lo que más tiempo me quita en el negocio es: ";

/** De dónde sale un mensaje: cada botón le dice a Adrián qué estaba mirando quien le escribe. */
export type Origen = "portada" | "cierre" | "agente" | "pieza";

/**
 * La primera frase según lo que la persona estaba mirando. Así el primer
 * mensaje ya dice qué trabajo la convenció, aunque no haya analítica. Todas
 * contestan al «Hi, I'm Adrián.» de la portada y quedan abiertas para que
 * el dueño solo complete lo suyo.
 */
export function prefill(origen: Origen = "portada", pieza?: { nombre: string }): string {
  if (origen === "pieza" && pieza?.nombre) return `Hi Adrián, I saw ${pieza.nombre} on allok.fun and I want something like it. Here's my case: `;
  if (origen === "agente") return "Hi Adrián, I saw the WhatsApp agent on allok.fun. Here's my case: ";
  return HOME_WHATSAPP_MESSAGE;
}

export function whatsappUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
