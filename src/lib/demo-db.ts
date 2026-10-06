import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { CHAT_SLUG_DAILY_TURNS, SLUG_PATTERN, demoProfileSchema, type DemoAgent, type DemoProfile } from "@/lib/demo-agent";

/**
 * Las demos en Neon (`demo_agent`, db/migrations/023_demo_agent.sql).
 *
 * Sin `DATABASE_URL` y SOLO en `next dev`, las demos salen de
 * `src/data/demo-agents.dev.json` para poder ver la página sin base; los
 * contadores quedan en memoria. En producción, sin base no hay demos (404).
 */

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

function fromDevFixture(): boolean {
  return !process.env.DATABASE_URL && process.env.NODE_ENV === "development";
}

/** El DDL, idempotente. Lo corre la carga (`scripts/demo-build.ts`) antes de escribir. */
export async function ensureDemoAgentTable(): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is required to write demos.");
  await sql`
    CREATE TABLE IF NOT EXISTS demo_agent (
      slug text PRIMARY KEY,
      business_name text NOT NULL,
      sector text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      country text NOT NULL DEFAULT '',
      website text,
      profile jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      chat_count integer NOT NULL DEFAULT 0,
      last_chat_at timestamptz,
      signup_clicks integer NOT NULL DEFAULT 0,
      chat_day date,
      chat_day_count integer NOT NULL DEFAULT 0
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS demo_agent_website_idx ON demo_agent (website)`;
}

function mapRow(row: Record<string, unknown>): DemoAgent | null {
  const profile = demoProfileSchema.safeParse(row.profile ?? {});
  if (!profile.success) return null;
  return {
    slug: String(row.slug),
    businessName: String(row.business_name),
    sector: String(row.sector ?? ""),
    city: String(row.city ?? ""),
    country: String(row.country ?? ""),
    website: row.website ? String(row.website) : null,
    profile: profile.data,
    createdAt: new Date(String(row.created_at ?? Date.now())).toISOString(),
    chatCount: Number(row.chat_count ?? 0),
    lastChatAt: row.last_chat_at ? new Date(String(row.last_chat_at)).toISOString() : null,
    signupClicks: Number(row.signup_clicks ?? 0),
  };
}

let fixtureCache: Record<string, unknown>[] | null = null;

async function readFixture(): Promise<Record<string, unknown>[]> {
  if (!fixtureCache) {
    const raw = await readFile(join(process.cwd(), "src/data/demo-agents.dev.json"), "utf8").catch(() => "[]");
    fixtureCache = JSON.parse(raw) as Record<string, unknown>[];
  }
  return fixtureCache;
}

/** La demo de ese slug, o `null` (slug malformado, inexistente, o la base caída). */
export async function getDemoAgent(slug: string): Promise<DemoAgent | null> {
  if (!SLUG_PATTERN.test(slug) || slug.length > 80) return null;
  if (fromDevFixture()) {
    const row = (await readFixture()).find((r) => r.slug === slug);
    return row ? mapRow(row) : null;
  }
  const sql = getSql();
  if (!sql) return null;
  try {
    const rows = await sql`
      SELECT slug, business_name, sector, city, country, website, profile,
        created_at, chat_count, last_chat_at, signup_clicks
      FROM demo_agent WHERE slug = ${slug} LIMIT 1
    `;
    return rows[0] ? mapRow(rows[0]) : null;
  } catch (error) {
    // Tabla aún sin crear o la base caída: la página da 404, no un 500.
    console.error("Could not load demo agent", error);
    return null;
  }
}

/** Slug → sitio web, para numerar slugs repetidos sin pisar a otro negocio. */
export async function getDemoSlugOwners(): Promise<Map<string, string | null>> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is required to write demos.");
  const rows = await sql`SELECT slug, website FROM demo_agent`;
  return new Map(rows.map((r) => [String(r.slug), r.website ? String(r.website) : null]));
}

export async function upsertDemoAgent(input: {
  slug: string;
  businessName: string;
  sector: string;
  city: string;
  country: string;
  website: string | null;
  profile: DemoProfile;
}): Promise<void> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is required to write demos.");
  // Re-cargar actualiza lo que se sabe del negocio; los contadores se quedan.
  await sql`
    INSERT INTO demo_agent (slug, business_name, sector, city, country, website, profile)
    VALUES (${input.slug}, ${input.businessName}, ${input.sector}, ${input.city}, ${input.country},
      ${input.website}, ${JSON.stringify(input.profile)}::jsonb)
    ON CONFLICT (slug) DO UPDATE SET
      business_name = EXCLUDED.business_name,
      sector = EXCLUDED.sector,
      city = EXCLUDED.city,
      country = EXCLUDED.country,
      website = EXCLUDED.website,
      profile = EXCLUDED.profile,
      updated_at = now()
  `;
}

const devDayCounts = new Map<string, { day: string; count: number }>();

/**
 * Cuenta un turno del chat y dice si cabe en el techo del día. El conteo y la
 * decisión van en el mismo UPDATE: dos visitantes a la vez no se cuelan los
 * dos por el último turno. Si la base falla, deja pasar (el límite por IP
 * sigue puesto) para que una caída de Neon no apague todas las demos.
 */
export async function recordChatTurn(slug: string): Promise<{ allowed: boolean }> {
  if (fromDevFixture()) {
    const day = new Date().toISOString().slice(0, 10);
    const prev = devDayCounts.get(slug);
    const count = prev?.day === day ? prev.count + 1 : 1;
    devDayCounts.set(slug, { day, count });
    return { allowed: count <= CHAT_SLUG_DAILY_TURNS };
  }
  const sql = getSql();
  if (!sql) return { allowed: false };
  try {
    const rows = await sql`
      UPDATE demo_agent SET
        chat_day_count = CASE WHEN chat_day = current_date THEN chat_day_count + 1 ELSE 1 END,
        chat_day = current_date,
        chat_count = chat_count + 1,
        last_chat_at = now()
      WHERE slug = ${slug}
        AND (chat_day IS DISTINCT FROM current_date OR chat_day_count < ${CHAT_SLUG_DAILY_TURNS})
      RETURNING chat_day_count
    `;
    return { allowed: rows.length > 0 };
  } catch (error) {
    console.error("Could not record demo chat turn", error);
    return { allowed: true };
  }
}

export async function recordSignupClick(slug: string): Promise<void> {
  if (!SLUG_PATTERN.test(slug)) return;
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`UPDATE demo_agent SET signup_clicks = signup_clicks + 1 WHERE slug = ${slug}`;
  } catch (error) {
    console.error("Could not record demo signup click", error);
  }
}
