// Proves the WAHA webhook signature layer end-to-end against a running deployment.
// Uses a `session.status` event on purpose: the route acks it without touching the
// DB, so this can be run against production without inserting junk conversations.
//
// Usage: node scripts/waha-webhook-check.mjs [base-url]
//   base-url defaults to APP_URL, then http://localhost:3000
// Requires WAHA_WEBHOOK_HMAC_KEY — the same value configured on the WAHA session.
import crypto from "node:crypto";
import assert from "node:assert/strict";

const base = (process.argv[2] ?? process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const key = process.env.WAHA_WEBHOOK_HMAC_KEY;
if (!key) throw new Error("WAHA_WEBHOOK_HMAC_KEY is required");

const url = `${base}/api/waha/webhook`;
const body = JSON.stringify({
  event: "session.status",
  session: process.env.WAHA_SESSION ?? "default",
  payload: { status: "WORKING" },
});

// WAHA signs the raw body with sha512 and sends it hex on X-Webhook-Hmac.
const sign = (raw) => crypto.createHmac("sha512", key).update(raw).digest("hex");

const post = (hmac) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(hmac ? { "X-Webhook-Hmac": hmac } : {}) },
    body,
    signal: AbortSignal.timeout(10_000),
  });

const good = await post(sign(body));
const tampered = await post(sign(body).replace(/.$/, (c) => (c === "0" ? "1" : "0")));
const missing = await post(null);

console.log(`valid=${good.status} tampered=${tampered.status} missing=${missing.status}  ${url}`);

assert.ok(good.status >= 200 && good.status < 300, "a correctly signed sha512 webhook must be accepted");
assert.equal(tampered.status, 401, "a tampered signature must be rejected");
assert.equal(missing.status, 401, "a missing signature must be rejected");
console.log("waha webhook signature ok");
