import assert from "node:assert/strict";
import {
  isActiveWahaEntitlement,
  ownsWahaConnection,
  wahaSessionIdForPurchase,
} from "../src/lib/waha-access";

const purchaseA = "11111111-1111-4111-8111-111111111111";
const purchaseB = "22222222-2222-4222-8222-222222222222";

assert.equal(wahaSessionIdForPurchase(purchaseA), "cli-p-11111111111141118111111111111111");
assert.notEqual(wahaSessionIdForPurchase(purchaseA), wahaSessionIdForPurchase(purchaseB));
assert.equal(ownsWahaConnection(purchaseA, { stripePurchaseId: purchaseA }), true);
assert.equal(ownsWahaConnection(purchaseA, { stripePurchaseId: purchaseB }), false);
assert.equal(isActiveWahaEntitlement("paid", "active"), true);
assert.equal(isActiveWahaEntitlement("paid", "trialing"), true);
assert.equal(isActiveWahaEntitlement("paid", "canceled"), false);
assert.equal(isActiveWahaEntitlement("unpaid", "active"), false);
assert.equal(isActiveWahaEntitlement("paid", null), false);

console.log("WAHA access OK: immutable session ownership and active subscription required.");
