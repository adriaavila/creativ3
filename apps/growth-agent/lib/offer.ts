/**
 * Lo que vende allok hoy, para el Growth Agent. Espejo de `src/lib/plans.ts` de
 * allok-fun: esta app se despliega sola y no puede importarlo. El test
 * `src/lib/growth-agent-offer.test.ts` (allok-fun) falla si los dos se separan.
 */
export const INVITE_PHRASE = "Hola, vengo de allok.fun. Quiero probar el agente en mi WhatsApp.";
/** El link que abre el WhatsApp de allok (…3684) con la frase que despierta al agente. Codificado: un espacio corta el link en WhatsApp. */
export const INVITE_URL = `https://wa.me/584220023684?text=${encodeURIComponent(INVITE_PHRASE)}`;

export const OFFER = {
  product: "Un agente de WhatsApp que contesta, califica y agenda, con el CRM detrás",
  setup: { name: "Puesta en marcha", price: 499 },
  plans: [
    { name: "Esencial", price: 49, period: "mes" },
    { name: "Completo", price: 99, period: "mes" },
    { name: "A tu medida", price: 499, period: "mes", from: true },
  ],
} as const;

/** Donde corren los anuncios (CL-UY-VE-PY) y los rubros que agendaron en septiembre, más inmobiliarias. */
export const MARKETS = ["Chile", "Uruguay", "Venezuela", "Paraguay"] as const;
export const VERTICALS = ["legal", "aesthetics", "clinics", "real_estate"] as const;

/** El filtro propio de la investigación: pocos y buenos. */
export const MIN_SCORE = 7;
export const DAILY_LEADS = 5;
