import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { BOUNCE_WINDOW_SENDS, normalizeEmail, type CountryCode, type ManualStatus, type OutreachLead, type OutreachStatus } from "@/lib/outreach";

/**
 * La prospección en frío en Neon (db/migrations/024_outreach.sql):
 * `outreach_contact`, `outreach_suppression` y `outreach_event`. La usan
 * `scripts/outreach.ts` y las rutas `/api/outreach/*`.
 */

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function outreachDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getSql(): NeonQueryFunction<false, false> {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

/** El DDL de la migración 024, idempotente. */
export async function ensureOutreachTables(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_contact (
      email text PRIMARY KEY CHECK (email = lower(email)),
      business_name text NOT NULL,
      website text,
      demo_slug text,
      sector text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      country text NOT NULL CHECK (country IN ('MX', 'CO')),
      offer text NOT NULL DEFAULT '',
      source text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'sent', 'replied', 'bounced', 'complained', 'unsubscribed', 'signed_up')),
      step integer NOT NULL DEFAULT 0 CHECK (step BETWEEN 0 AND 3),
      last_sent_at timestamptz,
      next_send_at timestamptz DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS outreach_contact_due_idx ON outreach_contact (next_send_at) WHERE status IN ('queued', 'sent')`;
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_suppression (
      email text PRIMARY KEY CHECK (email = lower(email)),
      reason text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_event (
      id bigserial PRIMARY KEY,
      email text NOT NULL,
      type text NOT NULL,
      step integer,
      resend_id text,
      detail jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS outreach_event_type_created_idx ON outreach_event (type, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS outreach_event_resend_id_idx ON outreach_event (resend_id) WHERE resend_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS outreach_event_email_idx ON outreach_event (email)`;
}

export async function getSuppressedEmails(): Promise<Set<string>> {
  const rows = await getSql()`SELECT email FROM outreach_suppression`;
  return new Set(rows.map((r) => String(r.email)));
}

export type DemoRef = { slug: string; businessName: string; website: string | null };

/** Las demos ya armadas, para ligar cada contacto con la suya. Sin tabla aún: ninguna. */
export async function listDemoRefs(): Promise<DemoRef[]> {
  try {
    const rows = await getSql()`SELECT slug, business_name, website FROM demo_agent`;
    return rows.map((r) => ({ slug: String(r.slug), businessName: String(r.business_name), website: r.website ? String(r.website) : null }));
  } catch {
    return [];
  }
}

/**
 * Guarda los contactos nuevos. Uno que ya estaba no se toca, salvo para ganar
 * la demo o el gancho que antes no tenía. Devuelve cuántos son nuevos.
 */
export async function upsertContacts(contacts: (OutreachLead & { demoSlug: string | null })[], source: string): Promise<{ inserted: number; existing: number }> {
  const sql = getSql();
  let inserted = 0;
  for (const c of contacts) {
    const rows = await sql`
      INSERT INTO outreach_contact (email, business_name, website, demo_slug, sector, city, country, offer, source)
      VALUES (${c.email}, ${c.businessName}, ${c.website}, ${c.demoSlug}, ${c.sector}, ${c.city}, ${c.country}, ${c.offer}, ${source})
      ON CONFLICT (email) DO UPDATE SET
        demo_slug = COALESCE(outreach_contact.demo_slug, EXCLUDED.demo_slug),
        offer = CASE WHEN outreach_contact.offer = '' THEN EXCLUDED.offer ELSE outreach_contact.offer END,
        updated_at = now()
      RETURNING (xmax = 0) AS inserted
    `;
    if (rows[0]?.inserted) {
      inserted++;
      await sql`INSERT INTO outreach_event (email, type, detail) VALUES (${c.email}, 'imported', jsonb_build_object('source', ${source}::text))`;
    }
  }
  return { inserted, existing: contacts.length - inserted };
}

export type OutreachContactRow = {
  email: string;
  businessName: string;
  demoSlug: string | null;
  sector: string;
  country: CountryCode;
  offer: string;
  status: OutreachStatus;
  step: number;
};

/** Los que ya tienen el siguiente paso vencido y no están suprimidos, el más atrasado primero. */
export async function dueContacts(now: Date, limit = 500): Promise<OutreachContactRow[]> {
  const rows = await getSql()`
    SELECT c.email, c.business_name, c.demo_slug, c.sector, c.country, c.offer, c.status, c.step
    FROM outreach_contact c
    WHERE c.status IN ('queued', 'sent')
      AND c.step < 3
      AND c.next_send_at IS NOT NULL
      AND c.next_send_at <= ${now.toISOString()}
      AND NOT EXISTS (SELECT 1 FROM outreach_suppression s WHERE s.email = c.email)
    ORDER BY c.next_send_at ASC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    email: String(r.email),
    businessName: String(r.business_name),
    demoSlug: r.demo_slug ? String(r.demo_slug) : null,
    sector: String(r.sector ?? ""),
    country: String(r.country) as CountryCode,
    offer: String(r.offer ?? ""),
    status: String(r.status) as OutreachStatus,
    step: Number(r.step),
  }));
}

/** Envíos en las últimas 24 horas: el tope diario es móvil, no por fecha de calendario. */
export async function sendsLast24h(): Promise<number> {
  const rows = await getSql()`SELECT count(*)::int AS n FROM outreach_event WHERE type = 'sent' AND created_at > now() - interval '24 hours'`;
  return Number(rows[0]?.n ?? 0);
}

/** De los últimos 100 envíos, cuántos rebotaron y cuántos se quejaron. */
export async function recentDeliverability(): Promise<{ sent: number; bounced: number; complained: number }> {
  const rows = await getSql()`
    WITH recent AS (
      SELECT email FROM outreach_event WHERE type = 'sent' ORDER BY created_at DESC LIMIT ${BOUNCE_WINDOW_SENDS}
    )
    SELECT
      count(*)::int AS sent,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM outreach_event b WHERE b.email = recent.email AND b.type = 'bounced'))::int AS bounced,
      count(*) FILTER (WHERE EXISTS (SELECT 1 FROM outreach_event b WHERE b.email = recent.email AND b.type = 'complained'))::int AS complained
    FROM recent
  `;
  return { sent: Number(rows[0]?.sent ?? 0), bounced: Number(rows[0]?.bounced ?? 0), complained: Number(rows[0]?.complained ?? 0) };
}

/**
 * Anota que salió el paso `step`. Solo avanza si el contacto seguía en el paso
 * anterior y sin suprimir: si una baja llegó mientras se enviaba, gana la baja.
 */
export async function recordSent(input: { email: string; step: number; resendId: string | null; nextSendAt: Date | null }): Promise<void> {
  const sql = getSql();
  await sql.transaction([
    sql`
      UPDATE outreach_contact SET
        step = ${input.step},
        status = CASE WHEN status = 'queued' THEN 'sent' ELSE status END,
        last_sent_at = now(),
        next_send_at = CASE WHEN status IN ('queued', 'sent') THEN ${input.nextSendAt?.toISOString() ?? null}::timestamptz ELSE NULL END,
        updated_at = now()
      WHERE email = ${input.email} AND step = ${input.step - 1}
    `,
    sql`INSERT INTO outreach_event (email, type, step, resend_id) VALUES (${input.email}, 'sent', ${input.step}, ${input.resendId})`,
  ]);
}

export type SuppressionReason = "unsubscribed" | "bounced" | "complained";

/**
 * A la lista de supresión, para siempre, y la secuencia se detiene. Un
 * contacto que ya se registró conserva `signed_up` (es el dato que importa),
 * pero tampoco recibe más correos en frío.
 */
export async function suppressEmail(input: { email: string; reason: SuppressionReason; resendId?: string | null; detail?: Record<string, unknown> }): Promise<void> {
  const email = normalizeEmail(input.email);
  const sql = getSql();
  await sql.transaction([
    sql`INSERT INTO outreach_suppression (email, reason) VALUES (${email}, ${input.reason}) ON CONFLICT (email) DO NOTHING`,
    sql`
      UPDATE outreach_contact SET
        status = CASE WHEN status = 'signed_up' THEN status ELSE ${input.reason} END,
        next_send_at = NULL,
        updated_at = now()
      WHERE email = ${email}
    `,
    sql`
      INSERT INTO outreach_event (email, type, resend_id, detail)
      VALUES (${email}, ${input.reason}, ${input.resendId ?? null}, ${JSON.stringify(input.detail ?? {})}::jsonb)
    `,
  ]);
}

/** Marca a mano (respondió, se registró). `false` si ese correo no está en la lista. */
export async function markContact(emailRaw: string, status: ManualStatus): Promise<boolean> {
  const email = normalizeEmail(emailRaw);
  const sql = getSql();
  const [updated] = await sql.transaction([
    sql`UPDATE outreach_contact SET status = ${status}, next_send_at = NULL, updated_at = now() WHERE email = ${email} RETURNING email`,
    sql`
      INSERT INTO outreach_event (email, type, detail)
      SELECT ${email}, 'marked', jsonb_build_object('status', ${status}::text)
      WHERE EXISTS (SELECT 1 FROM outreach_contact WHERE email = ${email})
    `,
  ]);
  return updated.length > 0;
}

export type OutreachReport = {
  byStatus: Record<string, number>;
  sendsByDay: { day: string; sent: number }[];
  recent: { sent: number; bounced: number; complained: number };
  suppressed: Record<string, number>;
  dueNow: number;
};

export async function outreachReport(): Promise<OutreachReport> {
  const sql = getSql();
  const [statusRows, dayRows, suppRows, dueRows] = await Promise.all([
    sql`SELECT status, count(*)::int AS n FROM outreach_contact GROUP BY status ORDER BY status`,
    sql`
      SELECT to_char((created_at AT TIME ZONE 'America/Mexico_City')::date, 'YYYY-MM-DD') AS day, count(*)::int AS n
      FROM outreach_event WHERE type = 'sent' AND created_at > now() - interval '7 days'
      GROUP BY 1 ORDER BY 1
    `,
    sql`SELECT reason, count(*)::int AS n FROM outreach_suppression GROUP BY reason ORDER BY reason`,
    sql`
      SELECT count(*)::int AS n FROM outreach_contact c
      WHERE c.status IN ('queued', 'sent') AND c.step < 3 AND c.next_send_at <= now()
        AND NOT EXISTS (SELECT 1 FROM outreach_suppression s WHERE s.email = c.email)
    `,
  ]);
  return {
    byStatus: Object.fromEntries(statusRows.map((r) => [String(r.status), Number(r.n)])),
    sendsByDay: dayRows.map((r) => ({ day: String(r.day), sent: Number(r.n) })),
    recent: await recentDeliverability(),
    suppressed: Object.fromEntries(suppRows.map((r) => [String(r.reason), Number(r.n)])),
    dueNow: Number(dueRows[0]?.n ?? 0),
  };
}
