export const billingCatalog = {
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
} as const;

export type BillingKey = keyof typeof billingCatalog;
export type BillingChannel = "waha" | "cloud_api";

export const isBillingKey = (value: string): value is BillingKey =>
  value in billingCatalog;

export function getBillingItem(key: BillingKey) {
  const item = billingCatalog[key];
  const prices = item.prices.map((env) => process.env[env]);
  const productId = process.env[item.productEnv];

  if (!productId || prices.some((price) => !price)) {
    throw new Error(`Billing item ${key} is not configured.`);
  }

  return { ...item, productId, prices: prices as string[] };
}
