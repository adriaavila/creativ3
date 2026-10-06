/**
 * Un límite por ventana, en memoria. Vale por instancia: en Vercel cada
 * función tiene la suya, así que es un freno al abuso de un solo visitante, no
 * una cuota exacta. El techo duro de gasto por demo vive en la base
 * (`recordChatTurn`, por día).
 */
export type WindowLimiter = {
  /** `true` si cabe un uso más (y lo cuenta); `false` si se pasó. */
  take(key: string, now?: number): boolean;
};

export function createWindowLimiter(limit: number, windowMs: number, maxKeys = 5000): WindowLimiter {
  const hits = new Map<string, number[]>();
  return {
    take(key, now = Date.now()) {
      const since = now - windowMs;
      const recent = (hits.get(key) ?? []).filter((t) => t > since);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.delete(key);
      hits.set(key, recent);
      // El Map recuerda el orden de inserción: lo más viejo sale primero.
      while (hits.size > maxKeys) {
        const oldest = hits.keys().next().value;
        if (oldest === undefined) break;
        hits.delete(oldest);
      }
      return true;
    },
  };
}

/** La IP del visitante detrás del proxy de Vercel (o de Caddy en el VPS). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
