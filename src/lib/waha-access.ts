const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

export function wahaSessionIdForPurchase(purchaseId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(purchaseId)) {
    throw new Error("Invalid purchase id.");
  }
  return `cli-p-${purchaseId.replaceAll("-", "").toLowerCase()}`;
}

export function ownsWahaConnection(
  purchaseId: string,
  connection: { stripePurchaseId: string | null } | null,
) {
  return !connection || connection.stripePurchaseId === purchaseId;
}

export function isActiveWahaEntitlement(
  paymentStatus: string | null,
  subscriptionStatus: string | null,
) {
  return paymentStatus === "paid" && ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus ?? "");
}
