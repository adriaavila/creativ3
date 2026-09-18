/**
 * Los planes de allok y el costo de mensajería que Meta le factura al cliente.
 *
 * Es un solo producto: dos planes de suscripción que se contratan solos, y una
 * implementación de pago único para quien prefiere que se lo dejemos andando.
 * REI es el mismo CRM con el vocabulario y el pipeline de una inmobiliaria; no
 * tiene precio propio.
 *
 * allok cobra el software; la cuenta de WhatsApp queda a nombre del negocio y
 * Meta le cobra a él directo. Esa separación es deliberada: como Tech Provider
 * no podemos centralizar el pago de los mensajes de todos los clientes (eso
 * está reservado a los Solution Partners), y tampoco queremos — cobrar por
 * conversación es justo lo que nos diferencia de los demás CRM de WhatsApp.
 *
 * **Dónde se cobra.** El checkout de la suscripción NO vive acá: el botón lleva
 * a `CRM_APP_URL/register?plan=…`, y es la app la que crea el negocio y abre
 * Stripe en el mismo paso. Cobrar desde este sitio dejaba al cliente pagando
 * sin que nadie le creara la cuenta (ver `docs/cobros.md`). Las claves
 * `allok-*` del catálogo de Stripe quedan sin uso a propósito.
 *
 * Lo que dice cada plan sale de lo que la app realmente cierra por plan
 * (`hasSaaSPlan(org, "pro")` en vocero-crm): pipeline, agenda, equipo y
 * respuesta fuera de horario son de Pro. No inventar una diferencia que el
 * código no hace.
 */

/** La app del CRM: ahí se registra el negocio y ahí se cobra. */
export const CRM_APP_URL = "https://whatsapp.allok.fun";

export type Plan = {
  key: string;
  /**
   * El plan tal como lo nombra la app (`basic` | `pro`), o `null` cuando no es
   * una suscripción y se conversa por WhatsApp.
   */
  appPlan: "basic" | "pro" | null;
  name: string;
  /** Dólares. Al mes si `period` es "mes"; una sola vez si es `null`. */
  price: number;
  period: "mes" | null;
  featured: boolean;
  line: string;
  features: string[];
  /** Los 7 días de prueba de Pro salen de `trialDaysForPlan` en la app. */
  trialDays?: number;
};

/** A dónde manda el botón de un plan de suscripción. */
export function registerUrl(appPlan: "basic" | "pro"): string {
  return `${CRM_APP_URL}/register?plan=${appPlan}`;
}

export const PLANS: Plan[] = [
  {
    key: "basico",
    appPlan: "basic",
    name: "Básico",
    price: 49,
    period: "mes",
    featured: false,
    line: "Un número que deja de perder mensajes.",
    features: [
      "1 número de WhatsApp",
      "Agente 24/7 con la información de tu negocio",
      "Bandeja compartida y ficha de cliente",
      "Plantillas y ventana de 24 h vigilada",
      "Laboratorio: pruébalo antes de activarlo",
    ],
  },
  {
    key: "pro",
    appPlan: "pro",
    name: "Pro",
    price: 99,
    period: "mes",
    featured: true,
    trialDays: 7,
    line: "Para cuando la consulta ya vale plata.",
    features: [
      "Todo lo de Básico",
      "Pipeline con las etapas de tu rubro",
      "Agenda y confirmación de citas",
      "Tu equipo en la misma bandeja",
      "Responde a toda hora, no solo en tu horario",
    ],
  },
  {
    key: "implementacion",
    appPlan: null,
    name: "Implementación",
    price: 499,
    period: null,
    featured: false,
    line: "Lo dejamos andando nosotros.",
    features: [
      "Cargamos tu agente: precios, servicios, políticas",
      "Armamos tu pipeline y tus etapas contigo",
      "Conectamos WhatsApp con Meta de punta a punta",
      "Una semana de ajustes sobre conversaciones reales",
    ],
  },
];

/**
 * El "desde" de la página. Sale de PLANS a propósito: el número suelto en una
 * frase de copy es exactamente lo que se queda viejo cuando cambia el precio.
 */
export const FROM_PRICE = Math.min(
  ...PLANS.filter((p) => p.period === "mes").map((p) => p.price),
);

/**
 * Tarifas de Meta para la categoría «Rest of Latin America» (incluye
 * Venezuela), vigentes desde octubre de 2026. La categoría la decide el país
 * del número del CLIENTE, no el de la empresa: si se vende a otro mercado hay
 * que revisar esta constante antes de mostrar un número.
 */
export const META_RATES = {
  /** Mensajes de servicio gratis por número de WhatsApp y por mes. */
  freeServiceMessages: 1000,
  /** Respuesta normal del agente dentro de la ventana de 24 h. */
  servicePerMessage: 0.0113,
  /** Plantillas de marketing. Hoy no entran en el cálculo de la calculadora. */
  marketingPerMessage: 0.074,
} as const;

export type MetaCostInput = {
  /** Consultas entrantes al mes. */
  consultas: number;
  /** Respuestas que da el agente por consulta. */
  repliesPerConsulta: number;
  /** Proporción (0..1) que llega desde anuncios Click-to-WhatsApp. */
  adsShare: number;
};

export type MetaCostBreakdown = {
  organicReplies: number;
  adsReplies: number;
  billable: number;
  cost: number;
  /** Lo que el cliente NO paga porque esas conversaciones vienen de un anuncio. */
  avoided: number;
};

/**
 * Costo mensual de mensajería, en dólares.
 *
 * Una conversación que entra por un anuncio Click-to-WhatsApp abre la ventana
 * de entrada gratuita de 72 h: durante esa ventana Meta no cobra la
 * mensajería, así que esos mensajes no cuentan ni contra el tramo gratis ni
 * contra lo facturable. Requiere contestar dentro de las primeras 24 h.
 */
export function metaMonthlyCost({
  consultas,
  repliesPerConsulta,
  adsShare,
}: MetaCostInput): MetaCostBreakdown {
  const share = Math.min(1, Math.max(0, adsShare));
  const organicReplies = consultas * (1 - share) * repliesPerConsulta;
  const adsReplies = consultas * share * repliesPerConsulta;
  const billable = Math.max(0, organicReplies - META_RATES.freeServiceMessages);

  return {
    organicReplies: Math.round(organicReplies),
    adsReplies: Math.round(adsReplies),
    billable: Math.round(billable),
    cost: billable * META_RATES.servicePerMessage,
    avoided: adsReplies * META_RATES.servicePerMessage,
  };
}

/** Dólares para pantalla: centavos cuando importan, enteros cuando no. */
export function usd(n: number): string {
  if (n === 0) return "$0";
  return n < 10 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString("es")}`;
}
