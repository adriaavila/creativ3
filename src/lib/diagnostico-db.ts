import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Diagnostico } from "./diagnostico";

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

let ensured = false;

/** El DDL es idempotente y corre con la primera solicitud: no hace falta migrar a mano. */
async function ensureTable(sql: NeonQueryFunction<false, false>) {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS diagnostico_request (
      id bigserial PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      name text NOT NULL,
      company text NOT NULL,
      email text NOT NULL,
      phone text NOT NULL DEFAULT '',
      website text NOT NULL DEFAULT '',
      areas text[] NOT NULL DEFAULT '{}',
      budget text,
      message text NOT NULL DEFAULT '',
      source text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'nuevo'
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS diagnostico_request_created_idx ON diagnostico_request (created_at DESC)`;
  ensured = true;
}

/** `false` si no hay base: la ruta lo cuenta como no guardado, no como error. */
export async function saveDiagnostico(d: Diagnostico): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureTable(sql);
  await sql`
    INSERT INTO diagnostico_request (name, company, email, phone, website, areas, budget, message, source)
    VALUES (${d.name}, ${d.company}, ${d.email}, ${d.phone}, ${d.website}, ${d.areas}, ${d.budget ?? null}, ${d.message}, ${d.source})
  `;
  return true;
}
