import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyHexHmac(input: {
  rawBody: string;
  header: string | null;
  secret: string;
  algorithm: "sha256" | "sha512";
  prefix?: string;
}) {
  if (!input.header?.startsWith(input.prefix ?? "")) return false;
  const hex = input.header.slice(input.prefix?.length ?? 0);
  const expected = createHmac(input.algorithm, input.secret).update(input.rawBody).digest();
  if (!new RegExp(`^[0-9a-f]{${expected.length * 2}}$`, "i").test(hex)) return false;
  const received = Buffer.from(hex, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
