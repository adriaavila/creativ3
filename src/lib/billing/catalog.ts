/**
 * Lo que se cobra DESDE ESTE SITIO: la agencia.
 *
 * allok cobra por dos caminos, en dos cuentas de Stripe distintas, y no se
 * tocan:
 *
 * | | Agencia | CRM |
 * |---|---|---|
 * | Qué | proyectos y entregables a medida | la suscripción de allok |
 * | Cuánto | importe cerrado por entregable | US$49 · US$99 al mes |
 * | Modo | `payment` (pago único) | `subscription` |
 * | Dónde vive el código | este archivo, `/api/stripe/*` | `vocero-crm`, `src/server/saas/billing.ts` |
 * | Qué cuenta de Stripe | la de agencia | la del SaaS |
 *
 * **Por qué separadas.** La suscripción del CRM tiene que crear el negocio
 * ANTES de cobrar: el checkout vive dentro de la app, donde existe la
 * organización. Cobrarla desde este sitio dejaba al cliente pagando sin que
 * nadie le creara la cuenta — está contado en `docs/cobros.md`. Y en cuentas
 * separadas porque los ingresos recurrentes del producto y los proyectos de
 * agencia son dos negocios con dos contabilidades.
 *
 * Aquí ya no hay ninguna entrada `subscription` del CRM: las que había
 * (`allok-starter`, `allok-growth`, `allok-pro`) apuntaban a variables que
 * nunca existieron, así que eran botones que devolvían 500. `assertNotCrmPlan`
 * existe para que no vuelvan por descuido.
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

/**
 * La suscripción del CRM no se cobra desde acá. Si una clave con pinta de plan
 * del producto llega a este checkout, es que alguien volvió a cablear el
 * camino que ya falló una vez: mejor un error con nombre que un cobro en la
 * cuenta equivocada.
 */
export function assertNotCrmPlan(key: string): void {
  if (/^allok-(starter|growth|pro|basic|basico|esencial|completo)$/i.test(key)) {
    throw new Error(
      `${key} es un plan del CRM: se cobra en la app (whatsapp.allok.fun/register?plan=…), ` +
        "no en el checkout de agencia. Ver docs/cobros.md.",
    );
  }
}
