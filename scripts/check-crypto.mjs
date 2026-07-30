// Self-check for the two security primitives added in Fase 0: the HMAC-signed
// ops session token and the AES-256-GCM token cipher. Run: node scripts/check-crypto.mjs
// No test framework — these are pure functions with no I/O, so asserts are enough.
import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// --- mirrors src/lib/ops-session.ts ---
const sign = (payload, secret) => createHmac("sha256", secret).update(payload).digest("base64url");

function createToken(userId, secret, ttlSeconds = 43200) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

function verifyToken(token, secret) {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!payload || !signature) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload, secret));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed.userId !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// --- mirrors src/lib/crypto/token-cipher.ts ---
function encrypt(plaintext, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), ct.toString("base64")].join(".");
}

function decrypt(encrypted, key) {
  const [ivB64, tagB64, dataB64] = encrypted.split(".");
  const d = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  d.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([d.update(Buffer.from(dataB64, "base64")), d.final()]).toString("utf8");
}

const SECRET = "test-ops-secret";
const KEY = randomBytes(32);

// Session: round-trip, wrong secret, tampered payload, expiry.
const token = createToken("allok-ops-owner", SECRET);
assert.equal(verifyToken(token, SECRET)?.userId, "allok-ops-owner", "valid token should verify");
assert.equal(verifyToken(token, "wrong-secret"), null, "wrong secret must not verify");
assert.equal(verifyToken("garbage", SECRET), null, "malformed token must not verify");
assert.equal(verifyToken(undefined, SECRET), null, "missing token must not verify");

const [payloadPart, sigPart] = token.split(".");
const tampered = Buffer.from(JSON.stringify({ userId: "attacker", exp: 9999999999 })).toString("base64url");
assert.equal(verifyToken(`${tampered}.${sigPart}`, SECRET), null, "tampered payload must not verify");
assert.equal(verifyToken(`${payloadPart}.${sign(payloadPart, "other")}`, SECRET), null, "forged sig must not verify");
assert.equal(verifyToken(createToken("x", SECRET, -1), SECRET), null, "expired token must not verify");

// The whole point of the change: a raw secret is no longer a valid cookie.
assert.equal(verifyToken(SECRET, SECRET), null, "raw secret must not be accepted as a session");

// Cipher: round-trip, ciphertext isn't plaintext, tampering is detected.
const plaintext = "EAAG...meta-business-token";
const encrypted = encrypt(plaintext, KEY);
assert.equal(decrypt(encrypted, KEY), plaintext, "cipher round-trip must match");
assert.ok(!encrypted.includes(plaintext), "ciphertext must not contain plaintext");
assert.equal(encrypted.split(".").length, 3, "format is iv.tag.ciphertext");
assert.notEqual(encrypt(plaintext, KEY), encrypted, "random IV means no repeated ciphertext");
assert.throws(() => decrypt(encrypted, randomBytes(32)), "wrong key must throw");

const [iv, tag, ct] = encrypted.split(".");
const flipped = Buffer.from(ct, "base64");
flipped[0] ^= 0xff;
assert.throws(() => decrypt(`${iv}.${tag}.${flipped.toString("base64")}`, KEY), "GCM must reject tampered ciphertext");

console.log("ok: ops session token + AES-256-GCM cipher checks passed");
