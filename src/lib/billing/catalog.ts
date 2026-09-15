/**
 * Todo lo que allok puede cobrar, en un solo sitio.
 *
 * Hay dos negocios con dos formas de cobrar, y conviven a propósito:
 *
 * - **Suscripción** — el CRM. Precio mensual recurrente en Stripe, el cliente
 *   se da de alta solo y se administra desde el portal de facturación.
 * - **Pago único** — la agencia y los proyectos a medida. Un importe cerrado
 *   por entregable, a veces en euros, a veces con el nombre del cliente.
 *
 * Los dos pasan por el mismo `POST /api/stripe/checkout`, que elige el `mode`
 * de Stripe según el `kind` de esta tabla. Nada más distingue los dos caminos.
 *
 * Los ids de precio viven en variables de entorno, nunca en el repo: el mismo
 * código corre contra la cuenta de prueba y la real cambiando el entorno.
 */

export type BillingChannel = "waha" | "cloud_api";

type CatalogItem = {
  kind: "subscription" | "one_time";
  productEnv: string;
  /** Variables de entorno con los ids de precio, en el orden en que se cobran. */
  prices: string[];
  defaultChannel?: BillingChannel;
};

export const billingCatalog = {
  // ── El CRM. Mensual, sin implementación: el alta es automática. ──────────
  "allok-starter": {
    kind: "subscription",
    productEnv: "STRIPE_PRODUCT_ALLOK",
    prices: ["STRIPE_PRICE_ALLOK_STARTER_MONTHLY"],
    defaultChannel: "cloud_api",
  },
  "allok-growth": {
    kind: "subscription",
    productEnv: "STRIPE_PRODUCT_ALLOK",
    prices: ["STRIPE_PRICE_ALLOK_GROWTH_MONTHLY"],
    defaultChannel: "cloud_api",
  },
  "allok-pro": {
    kind: "subscription",
    productEnv: "STRIPE_PRODUCT_ALLOK",
    prices: ["STRIPE_PRICE_ALLOK_PRO_MONTHLY"],
    defaultChannel: "cloud_api",
  },

  // ── La agencia. Pago único por entregable. ───────────────────────────────
  "allok-launch": {
    kind: "one_time",
    productEnv: "STRIPE_PRODUCT_LAUNCH",
    prices: ["STRIPE_PRICE_LAUNCH"],
  },
  "allok-automate": {
    kind: "one_time",
    productEnv: "STRIPE_PRODUCT_AUTOMATE",
    prices: ["STRIPE_PRICE_AUTOMATE"],
  },

  // ── Desk: la oferta anterior al CRM. Se conserva para que una suscripción
  //    viva siga renovando y su dueño pueda entrar al portal. No se vende. ──
  "desk-cohort": {
    kind: "subscription",
    productEnv: "STRIPE_PRODUCT_DESK",
    prices: ["STRIPE_PRICE_DESK_COHORT_MONTHLY", "STRIPE_PRICE_DESK_COHORT_SETUP"],
    defaultChannel: "waha",
  },
  desk: {
    kind: "subscription",
    productEnv: "STRIPE_PRODUCT_DESK",
    prices: ["STRIPE_PRICE_DESK_MONTHLY", "STRIPE_PRICE_DESK_SETUP"],
    defaultChannel: "waha",
  },
  "desk-scale": {
    kind: "subscription",
    productEnv: "STRIPE_PRODUCT_DESK",
    prices: ["STRIPE_PRICE_DESK_SCALE_MONTHLY", "STRIPE_PRICE_DESK_SCALE_SETUP"],
    defaultChannel: "cloud_api",
  },
} as const satisfies Record<string, CatalogItem>;

export type BillingKey = keyof typeof billingCatalog;

/** Lo que se puede comprar hoy. Desk queda fuera: renueva, no se vende. */
export const RETIRED_KEYS = new Set<BillingKey>(["desk", "desk-cohort", "desk-scale"]);

export const isBillingKey = (value: string): value is BillingKey =>
  value in billingCatalog;

export const isSellable = (key: BillingKey): boolean => !RETIRED_KEYS.has(key);

export function getBillingItem(key: BillingKey) {
  const item: CatalogItem = billingCatalog[key];
  const prices = item.prices.map((env) => process.env[env]);
  const productId = process.env[item.productEnv];

  // Un plan sin ids configurados es un botón que devuelve 500 en producción.
  // Falla acá, con el nombre de la variable que falta, en vez de en Stripe.
  const missing = [
    ...(productId ? [] : [item.productEnv]),
    ...item.prices.filter((env) => !process.env[env]),
  ];
  if (missing.length > 0) {
    throw new Error(`Billing item ${key} is not configured: missing ${missing.join(", ")}.`);
  }

  return { ...item, productId: productId as string, prices: prices as string[] };
}

/** `true` si el plan tiene sus ids de precio puestos en este entorno. */
export function isConfigured(key: BillingKey): boolean {
  try {
    getBillingItem(key);
    return true;
  } catch {
    return false;
  }
}
