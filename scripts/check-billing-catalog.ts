import assert from "node:assert/strict";
import { billingCatalog } from "../src/lib/billing/catalog";

const entries = Object.entries(billingCatalog);
assert(entries.some(([, item]) => item.kind === "one_time"));
assert(entries.some(([, item]) => item.kind === "subscription" && item.prices.length === 2));
assert(entries.every(([, item]) => item.prices.every((env) => env.startsWith("STRIPE_PRICE_"))));

console.log(`Billing catalog OK: ${entries.length} sellable items.`);
