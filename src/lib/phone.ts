/** WhatsApp ids are stored as country-code digits without a leading plus. */
export function normalizeWhatsAppId(value: string): string {
  return value.replace(/\D/g, "");
}

/** Returns a real phone number, not a provider id such as a BSUID or chat id. */
export function normalizeWhatsAppPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/@lid(?:$|\?)/i.test(value)) return null;
  const candidate = value.split("@")[0]?.split(":")[0] ?? "";
  const digits = candidate.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function formatWhatsAppPhone(value: string | null | undefined): string | null {
  const phone = normalizeWhatsAppPhone(value);
  return phone ? `+${phone}` : null;
}

export function isWhatsAppId(value: string): boolean {
  const normalized = normalizeWhatsAppId(value);
  return normalized.length >= 8 && normalized.length <= 15;
}
