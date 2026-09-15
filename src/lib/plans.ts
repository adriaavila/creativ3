/**
 * Planes de REI y el costo de mensajería que Meta le factura al cliente.
 *
 * REI cobra el software; la cuenta de WhatsApp queda a nombre del negocio y
 * Meta le cobra a él directo. Esa separación es deliberada: como Tech Provider
 * no podemos centralizar el pago de los mensajes de todos los clientes (eso
 * está reservado a los Solution Partners), y tampoco queremos — cobrar por
 * conversación es justo lo que nos diferencia de los demás CRM de WhatsApp.
 */

export type Plan = {
  key: string;
  name: string;
  price: number;
  featured: boolean;
  line: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: 29,
    featured: false,
    line: "Un número que deja de perder mensajes.",
    features: [
      "1 número de WhatsApp",
      "Agente 24/7 con la información de tu negocio",
      "Bandeja compartida y ficha de cliente",
      "Respuestas fuera de horario",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: 59,
    featured: true,
    line: "Para cuando la consulta ya vale plata.",
    features: [
      "Todo lo de Starter",
      "Pipeline con las etapas de tu rubro",
      "Agenda y confirmación de citas",
      "Atribución de anuncios Click-to-WhatsApp",
      "Documentos e imágenes en la conversación",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 99,
    featured: false,
    line: "Varios números, varios asesores.",
    features: [
      "Todo lo de Growth",
      "2 a 3 números",
      "Reparto automático por asesor",
      "Integraciones y API",
      "Reportes por equipo",
    ],
  },
];

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
