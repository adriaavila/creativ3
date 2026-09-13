import { timingSafeEqual } from "node:crypto";

/**
 * Bearer compartido entre Allok y la instancia SaaS de Vocero.
 *
 * Se exige largo mínimo porque un secreto corto en un servidor público es lo
 * mismo que no tener secreto, y la comparación es de tiempo constante para que
 * la latencia no vaya deletreando el valor correcto.
 */
export function bearerMatches(header: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < 16 || !header?.startsWith("Bearer ")) return false;
  const received = Buffer.from(header.slice("Bearer ".length));
  const target = Buffer.from(expected);
  return received.length === target.length && timingSafeEqual(received, target);
}
