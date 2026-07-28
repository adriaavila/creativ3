import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM, node:crypto only — no new dependency. Format: base64(iv).base64(authTag).base64(ciphertext).

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard nonce size

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to store WhatsApp business tokens.");
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (base64 of 256 bits).");
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decryptToken(encrypted: string): string {
  const [ivB64, tagB64, dataB64] = encrypted.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted token — expected iv.authTag.ciphertext.");
  }
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}

/** True if the stored value looks like our iv.tag.ciphertext format, false for legacy plaintext rows. */
export function looksEncrypted(value: string | null | undefined): value is string {
  return typeof value === "string" && value.split(".").length === 3;
}
