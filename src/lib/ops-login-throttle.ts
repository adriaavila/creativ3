import { createHmac } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** 5 intentos fallidos por IP o 30 en total en 15 minutos: después, esperar. */
export const PER_IP_LIMIT = 5;
export const GLOBAL_LIMIT = 30;

export function loginBlocked(counts: { ip: number; all: number }): boolean {
  return counts.ip >= PER_IP_LIMIT || counts.all >= GLOBAL_LIMIT;
}

let sqlClient: NeonQueryFunction<false, false> | null = null;
function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export function ipHash(request: Request, secret: string): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHmac("sha256", secret).update(`ops-login:${ip}`).digest("base64url");
}

/**
 * ponytail: si la tabla no existe (migración 022 sin aplicar) o la base falla,
 * el login sigue abierto: no dejar a Adrian fuera pesa más que frenar intentos.
 */
export async function recentFailures(hash: string): Promise<{ ip: number; all: number }> {
  const sql = getSql();
  if (!sql) return { ip: 0, all: 0 };
  try {
    const [row] = await sql`
      SELECT count(*) FILTER (WHERE ip_hash = ${hash})::int AS ip, count(*)::int AS all_count
      FROM ops_login_failures WHERE at > now() - interval '15 minutes'
    `;
    return { ip: Number(row?.ip ?? 0), all: Number(row?.all_count ?? 0) };
  } catch {
    return { ip: 0, all: 0 };
  }
}

export async function recordFailure(hash: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql.transaction([
      sql`INSERT INTO ops_login_failures (ip_hash) VALUES (${hash})`,
      sql`DELETE FROM ops_login_failures WHERE at < now() - interval '1 day'`,
    ]);
  } catch {
    // Sin tabla todavía: no se anota.
  }
}
