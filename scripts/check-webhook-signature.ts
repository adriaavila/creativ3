import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyHexHmac } from "../src/lib/webhook-signature";

const rawBody = JSON.stringify({ object: "whatsapp_business_account" });
const secret = "check-only-secret";
const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
const verify = (header: string | null, body = rawBody) => verifyHexHmac({
  rawBody: body,
  header,
  secret,
  algorithm: "sha256",
  prefix: "sha256=",
});

assert.equal(verify(`sha256=${digest}`), true);
assert.equal(verify(`sha256=${digest}`, `${rawBody} `), false);
assert.equal(verify(null), false);
assert.equal(verify("sha256=00"), false);
assert.equal(verify(`sha1=${digest}`), false);
console.log("Webhook HMAC OK: valid, tampered, missing, short, and wrong-prefix cases checked.");
