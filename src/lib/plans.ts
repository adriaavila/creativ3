/**
 * Los planes de allok y el costo de mensajería que Meta le factura al cliente.
 *
 * Tres planes y una sola idea: que nadie se quede sin respuesta. Dos se
 * contratan solos desde la web cuando el autoservicio está encendido
 * (`isSelfServe`); el tercero se conversa, porque es a medida.
 *
 * **Los nombres son comerciales a propósito.** Nada de "básico", "headless" ni
 * "tier": quien compra esto tiene un taller, una clínica o una academia, y
 * compra dejar de perder clientes, no una categoría de producto.
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
 * sin que nadie le creara la cuenta (ver `docs/cobros.md`). El catálogo de
 * Stripe de este repo es el de **agencia** — pagos únicos de proyecto — y sigue
 * vivo para eso; la suscripción del CRM tiene su propia cuenta y su propio
 * código dentro de la app.
 *
 * Lo que dice cada plan sale de lo que la app realmente cierra por plan
 * (`hasSaaSPlan(org, "pro")` en vocero-crm): pipeline, agenda, equipo y
 * respuesta todo el día son de Completo. Esencial contesta solo fuera del
 * horario del negocio (`responseMode: "outside_hours"`; atender a cualquier
 * hora exige Completo, ver `api/agent/profile` en la app). No inventar una
 * diferencia que el código no hace.
 */

/** La app del CRM: ahí se registra el negocio y ahí se cobra. */

import { whatsappUrl } from "@/lib/contact";
export const CRM_APP_URL = "https://whatsapp.allok.fun";

export type Plan = {
  key: string;
  /**
   * El plan tal como lo nombra la app (`basic` | `pro`), o `null` cuando no es
   * una suscripción de autoservicio y se conversa por WhatsApp.
   */
  appPlan: "basic" | "pro" | null;
  name: string;
  /** Lo que se lee bajo el nombre, en una línea. */
  kicker: string;
  /** Dólares. Al mes si `period` es "mes"; una sola vez si es `null`. */
  price: number;
  period: "mes" | null;
  /**
   * `true` cuando el precio es un piso y no una tarifa: la página escribe
   * "desde US$499". Un plan a medida con precio cerrado es una promesa que se
   * rompe en la primera llamada.
   */
  from?: boolean;
  featured: boolean;
  line: string;
  features: string[];
  /** Los 7 días de prueba de Completo salen de `trialDaysForPlan` en la app. */
  trialDays?: number;
  /** Adónde va el botón cuando no hay autoservicio. */
  talkTo?: string;
};

/**
 * Autoservicio: decisión de Adrian, 2026-10-03 («abrir autoservicio»; estuvo
 * apagado desde el 2026-09-24). Lo controla la variable de entorno
 * `NEXT_PUBLIC_SELF_SERVE`, **apagada por defecto**: fusionar este código no
 * cambia nada del sitio.
 *
 * Encendida (`"true"`), los dos planes de suscripción de `/` llevan a
 * `CRM_APP_URL/register`, donde cualquiera crea su cuenta y arranca la misma
 * prueba: 7 días del plan Completo, sin tarjeta, y después elige plan. `/rei`
 * y el plan a medida siguen en una conversación por WhatsApp.
 *
 * Encender = poner `NEXT_PUBLIC_SELF_SERVE=true` en el proyecto y volver a
 * desplegar (Next la lee en el build); volver atrás = quitarla y redesplegar.
 * Solo después de que el CRM tenga `SAAS_SELF_SERVE=true` (ver
 * `docs/autoservicio.md` en vocero-crm): con el CRM aún cerrado, estos botones
 * llevarían a una pantalla de «el alta la hacemos contigo».
 */
export function isSelfServe(): boolean {
  return process.env.NEXT_PUBLIC_SELF_SERVE === "true";
}

/**
 * La nota bajo el botón de un plan de suscripción. Con autoservicio, los dos
 * botones abren la misma prueba de Completo, así que las dos tarjetas dicen lo
 * mismo y ninguna promete una prueba del plan Esencial. Sin autoservicio solo
 * Completo lleva su prueba, como antes.
 */
export function trialNote(plan: Plan): string | null {
  if (isSelfServe() && plan.appPlan) {
    // Lo que el CRM da a quien se registra solo, sin importar el plan del
    // botón (`startSelfServeTrial` en vocero-crm). Sale del plan Completo para
    // que los días vivan en un solo lugar de este repo.
    const trial = PLANS.find((p) => p.appPlan === "pro");
    if (trial?.trialDays) {
      return `${trial.trialDays} días gratis del plan ${trial.name}. Después eliges tu plan.`;
    }
  }
  return plan.trialDays ? `${plan.trialDays} días de prueba` : null;
}

/**
 * El botón de un plan: registro si hay autoservicio, WhatsApp si no. El texto
 * del WhatsApp es una frase completa porque el agente de allok solo arranca
 * cuando el mensaje coincide exacto con una frase de activación.
 */
export function planCta(plan: Plan): { href: string; label: string } {
  if (isSelfServe() && plan.appPlan) {
    return { href: registerUrl(plan.appPlan), label: "Crear mi cuenta" };
  }
  return {
    href: whatsappUrl(plan.talkTo ?? `Hola, vengo de allok.fun. Quiero el plan ${plan.name}.`),
    label: "Hablemos",
  };
}

/**
 * El cierre de la home. Con autoservicio ofrece crear la cuenta y deja el
 * WhatsApp como segunda opción; sin él, es la frase de siempre: nos cuentas tu
 * negocio y lo dejamos andando. `talkHref` es la conversación de WhatsApp.
 */
export function closingOffer(talkHref: string): {
  line: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string } | null;
} {
  if (isSelfServe()) {
    const trial = trialNote(PLANS.find((p) => p.appPlan === "pro")!);
    return {
      line: `Desde US$${FROM_PRICE} al mes. Creas tu cuenta y conectas tu WhatsApp tú mismo.${trial ? ` ${trial}` : ""}`,
      primary: { href: registerUrl(), label: "Crear mi cuenta" },
      secondary: { href: talkHref, label: "Prefiero hablarlo por WhatsApp" },
    };
  }
  return {
    line: `Desde US$${FROM_PRICE} al mes. Nos cuentas tu negocio por WhatsApp y nosotros lo dejamos andando.`,
    primary: { href: talkHref, label: "Quiero mi agente" },
    secondary: null,
  };
}

/** A dónde manda el botón de un plan de suscripción (sin plan: el registro a secas). */
export function registerUrl(appPlan?: "basic" | "pro"): string {
  return appPlan ? `${CRM_APP_URL}/register?plan=${appPlan}` : `${CRM_APP_URL}/register`;
}

export const PLANS: Plan[] = [
  {
    key: "esencial",
    appPlan: "basic",
    name: "Esencial",
    kicker: "Para empezar hoy",
    price: 49,
    period: "mes",
    featured: false,
    line: "Que nadie se quede sin respuesta.",
    features: [
      "Tu número de siempre, sin cambiar nada",
      "Contesta fuera de tu horario con lo que de verdad vendes",
      "Una bandeja donde queda toda la conversación",
      "Ficha del cliente y su historial",
      "Pruébalo antes de soltarlo con clientes reales",
    ],
  },
  {
    key: "completo",
    appPlan: "pro",
    name: "Completo",
    kicker: "El que elige casi todo el mundo",
    price: 99,
    period: "mes",
    featured: true,
    trialDays: 7,
    line: "Cuando la consulta ya vale plata.",
    features: [
      "Todo lo de Esencial",
      "Tus ventas en etapas, de la consulta al cliente",
      "Agenda citas y las confirma solo",
      "Tu equipo entero en la misma bandeja",
      "Responde todo el día, también dentro de tu horario",
    ],
  },
  {
    key: "a-medida",
    appPlan: null,
    name: "A tu medida",
    kicker: "Tu propio servidor",
    price: 499,
    period: "mes",
    from: true,
    featured: false,
    line: "Tu instalación, tu dominio, tus reglas.",
    features: [
      "allok corriendo en el servidor de tu empresa",
      "Tu dominio y tu marca de punta a punta",
      "Integramos con lo que ya usas",
      "Flujos y herramientas hechos para tu operación",
      "Canal directo con quien lo construyó",
    ],
    talkTo:
      "Hola, vengo de allok.fun. Quiero allok a medida, en el servidor de mi empresa.",
  },
];

/**
 * La puesta en marcha se suma a cualquier plan; no es un cuarto bloque.
 * Ponerla como plan hacía elegir entre "pagar la mensualidad" y "que me lo
 * dejen andando", que no son alternativas: son dos cosas distintas.
 */
export const SETUP_SERVICE = {
  name: "Puesta en marcha",
  price: 499,
  line: "Lo dejamos andando nosotros, sobre cualquier plan.",
  features: [
    "Cargamos tu agente: precios, servicios, políticas",
    "Armamos tus etapas de venta contigo",
    "Conectamos WhatsApp con Meta de punta a punta",
    "Una semana de ajustes sobre conversaciones reales",
  ],
  talkTo:
    "Hola, vengo de allok.fun. Quiero la puesta en marcha de allok (US$499).",
  /** Payment Link live de `allok LLC` (creado el 2026-09-24). Pide teléfono. */
  paymentUrl: "https://buy.stripe.com/14A3cx3JpcpobG55qdeEo00",
  /** Su id: el webhook lo reconoce por esto (la otra cuenta tiene más links sin metadata). */
  paymentLinkId: "plink_1UJLejQssTDjutCko2emNKF9",
} as const;

/**
 * El plan Esencial por Payment Link live de `allok LLC` (2026-09-27): US$49 al mes, 7 días de
 * prueba, acepta códigos de descuento y pide teléfono. La puesta en marcha se cotiza aparte.
 *
 * Solo para mensajes de venta uno a uno (`sales-queue`). Las tarjetas de plan NO lo usan: un
 * pago aquí no crea la cuenta del CRM, y el registro ya da la prueba de Completo.
 */
export const ESENCIAL_LINK = {
  url: "https://buy.stripe.com/cNieVf1BhgFE6lLg4ReEo01",
  id: "plink_1UKTJrQssTDjutCksAOMT5hr",
  trialDays: 7,
} as const;

/**
 * El "desde" de la página. Sale de PLANS a propósito: el número suelto en una
 * frase de copy es exactamente lo que se queda viejo cuando cambia el precio.
 */
export const FROM_PRICE = Math.min(
  ...PLANS.filter((p) => p.appPlan !== null && p.period === "mes").map((p) => p.price),
);

/** El texto del precio, ya resuelto. La página no decide formato. */
export function priceLabel(plan: Plan): { amount: string; unit: string } {
  return {
    amount: `${plan.from ? "desde " : ""}$${plan.price}`,
    unit: plan.period ? "USD al mes" : "USD una vez",
  };
}

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
