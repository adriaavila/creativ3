import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import {
  BOUNCE_WINDOW_SENDS,
  MAX_DEMO_ATTEMPTS,
  demoJobAfterAttempt,
  hostOf,
  normalizeEmail,
  type CountryCode,
  type DemoJobState,
  type DemoJobStatus,
  type ManualStatus,
  type OutreachLead,
  type OutreachStatus,
} from "@/lib/outreach";

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

let ensured: Promise<void> | null = null;

/**
 * El DDL de las migraciones 024 y 025, idempotente. Corre una vez por proceso
 * (la primera ruta, el cron o el script que toca las tablas): en producción no
 * hace falta aplicar las migraciones a mano.
 */
export function ensureOutreachTables(): Promise<void> {
  ensured ??= createOutreachTables().catch((error) => {
    ensured = null;
    throw error;
  });
  return ensured;
}

async function createOutreachTables(): Promise<void> {
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
  // 025: el estado que Resend reporta de cada envío (el cron lo consulta sin webhook).
  await sql`ALTER TABLE outreach_event ADD COLUMN IF NOT EXISTS resend_last_event text`;
  await sql`ALTER TABLE outreach_event ADD COLUMN IF NOT EXISTS resend_checked_at timestamptz`;
  // 025: «Excluir» desde /ops/outreach es un estado más.
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'outreach_contact_status_check' AND pg_get_constraintdef(oid) LIKE '%excluded%'
      ) THEN
        ALTER TABLE outreach_contact DROP CONSTRAINT IF EXISTS outreach_contact_status_check;
        ALTER TABLE outreach_contact ADD CONSTRAINT outreach_contact_status_check CHECK (status IN
          ('queued', 'sent', 'replied', 'bounced', 'complained', 'unsubscribed', 'signed_up', 'excluded'));
      END IF;
    END $$
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_setting (
      key text PRIMARY KEY,
      value jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS outreach_demo_job (
      host text PRIMARY KEY,
      website text NOT NULL,
      business_name text NOT NULL,
      sector text NOT NULL DEFAULT '',
      city text NOT NULL DEFAULT '',
      country text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
      attempts integer NOT NULL DEFAULT 0,
      slug text,
      last_error text,
      started_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS outreach_demo_job_pending_idx ON outreach_demo_job (created_at) WHERE status = 'pending'`;
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
  website: string | null;
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
    SELECT c.email, c.business_name, c.website, c.demo_slug, c.sector, c.country, c.offer, c.status, c.step
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
    website: r.website ? String(r.website) : null,
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

/** `excluded`: alguien lo sacó a mano desde /ops/outreach. */
export type SuppressionReason = "unsubscribed" | "bounced" | "complained" | "excluded";

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

// ─── Ajustes: el interruptor, el turno del cron y su último resumen ──

async function getSetting(key: string): Promise<Record<string, unknown> | null> {
  const rows = await getSql()`SELECT value FROM outreach_setting WHERE key = ${key}`;
  const value = rows[0]?.value;
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

async function setSetting(key: string, value: Record<string, unknown>): Promise<void> {
  await getSql()`
    INSERT INTO outreach_setting (key, value) VALUES (${key}, ${JSON.stringify(value)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

export type SendingSetting = { enabled: boolean; changedAt: string | null };

/** El interruptor de la base. Si nunca se tocó: apagado. */
export async function getSendingSetting(): Promise<SendingSetting> {
  const v = await getSetting("sending");
  return { enabled: v?.enabled === true, changedAt: typeof v?.changedAt === "string" ? v.changedAt : null };
}

export async function setSendingEnabled(enabled: boolean): Promise<SendingSetting> {
  const changedAt = new Date().toISOString();
  await setSetting("sending", { enabled, changedAt });
  await getSql()`INSERT INTO outreach_event (email, type, detail) VALUES ('', 'switch', jsonb_build_object('enabled', ${enabled}::boolean))`;
  return { enabled, changedAt };
}

/**
 * El turno del cron: una sola corrida a la vez (Vercel puede repetir una
 * invocación). Vence solo a los `ttlSeconds` por si una corrida muere sin soltarlo.
 */
export async function acquireCronLease(ttlSeconds: number): Promise<boolean> {
  const until = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const rows = await getSql()`
    INSERT INTO outreach_setting (key, value) VALUES ('cron_lease', jsonb_build_object('until', ${until}::text))
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
      WHERE (outreach_setting.value->>'until')::timestamptz < now()
    RETURNING key
  `;
  return rows.length > 0;
}

export async function releaseCronLease(): Promise<void> {
  await getSql()`DELETE FROM outreach_setting WHERE key = 'cron_lease'`;
}

export async function saveLastRun(summary: Record<string, unknown>): Promise<void> {
  await setSetting("last_run", summary);
}

export async function getLastRun(): Promise<Record<string, unknown> | null> {
  return getSetting("last_run");
}

// ─── Las demos por armar ──────────────────────────────────────

export type DemoJobInput = { website: string; businessName: string; sector: string; city: string; country: string };

export type DemoJobRow = DemoJobInput & DemoJobState & { host: string; lastError: string | null };

/**
 * Pone en cola la demo de cada negocio con web. La que ya existe (misma web
 * en `demo_agent`) entra lista; un trabajo que ya estaba no se toca.
 */
export async function enqueueDemoJobs(jobs: (DemoJobInput & { existingSlug: string | null })[]): Promise<{ queued: number; ready: number; existing: number }> {
  const sql = getSql();
  let queued = 0;
  let ready = 0;
  const seen = new Set<string>();
  for (const job of jobs) {
    const host = hostOf(job.website);
    if (!host || seen.has(host)) continue;
    seen.add(host);
    const status: DemoJobStatus = job.existingSlug ? "ready" : "pending";
    const rows = await sql`
      INSERT INTO outreach_demo_job (host, website, business_name, sector, city, country, status, slug)
      VALUES (${host}, ${job.website}, ${job.businessName}, ${job.sector}, ${job.city}, ${job.country}, ${status}, ${job.existingSlug})
      ON CONFLICT (host) DO NOTHING
      RETURNING host
    `;
    if (rows.length) {
      if (status === "ready") ready++;
      else queued++;
    }
  }
  return { queued, ready, existing: seen.size - queued - ready };
}

/**
 * Contactos con web, sin demo y sin trabajo (importados por `pnpm outreach
 * import` antes de que existiera la cola): se les encola su demo.
 */
export async function backfillDemoJobs(): Promise<number> {
  const sql = getSql();
  const [contacts, jobs] = await Promise.all([
    sql`SELECT business_name, website, sector, city, country FROM outreach_contact WHERE website IS NOT NULL AND demo_slug IS NULL AND step = 0`,
    sql`SELECT host FROM outreach_demo_job`,
  ]);
  const have = new Set(jobs.map((j) => String(j.host)));
  const missing = contacts.filter((c) => {
    const host = hostOf(String(c.website));
    return host && !have.has(host);
  });
  if (!missing.length) return 0;
  const { queued } = await enqueueDemoJobs(
    missing.map((c) => ({
      website: String(c.website),
      businessName: String(c.business_name),
      sector: String(c.sector ?? ""),
      city: String(c.city ?? ""),
      country: c.country === "CO" ? "Colombia" : c.country === "MX" ? "México" : String(c.country ?? ""),
      existingSlug: null,
    })),
  );
  return queued;
}

function mapJob(r: Record<string, unknown>): DemoJobRow {
  return {
    host: String(r.host),
    website: String(r.website),
    businessName: String(r.business_name),
    sector: String(r.sector ?? ""),
    city: String(r.city ?? ""),
    country: String(r.country ?? ""),
    status: String(r.status) as DemoJobStatus,
    attempts: Number(r.attempts ?? 0),
    slug: r.slug ? String(r.slug) : null,
    lastError: r.last_error ? String(r.last_error) : null,
  };
}

export async function listDemoJobs(): Promise<Map<string, DemoJobRow>> {
  const rows = await getSql()`SELECT * FROM outreach_demo_job`;
  return new Map(rows.map((r) => [String(r.host), mapJob(r)]));
}

/**
 * Toma hasta `limit` demos pendientes y cuenta el intento ANTES de armarlas:
 * si la corrida muere a la mitad, ese intento cuenta igual y nunca hay más de
 * `MAX_DEMO_ATTEMPTS`. Una demo tomada hace menos de 10 minutos no se vuelve a tomar.
 */
export async function claimDemoJobs(limit: number): Promise<DemoJobRow[]> {
  if (limit <= 0) return [];
  const rows = await getSql()`
    UPDATE outreach_demo_job SET attempts = attempts + 1, started_at = now(), updated_at = now()
    WHERE host IN (
      SELECT host FROM outreach_demo_job
      WHERE status = 'pending' AND attempts < ${MAX_DEMO_ATTEMPTS}
        AND (started_at IS NULL OR started_at < now() - interval '10 minutes')
      ORDER BY created_at ASC
      LIMIT ${limit}
    )
    RETURNING *
  `;
  return rows.map(mapJob);
}

/** Pendientes que agotaron sus intentos sin terminar (la corrida murió): fallidas. */
export async function failExhaustedDemoJobs(): Promise<number> {
  const rows = await getSql()`
    UPDATE outreach_demo_job SET status = 'failed', updated_at = now(),
      last_error = COALESCE(last_error, 'la corrida terminó antes de armarla')
    WHERE status = 'pending' AND attempts >= ${MAX_DEMO_ATTEMPTS} AND started_at < now() - interval '10 minutes'
    RETURNING host
  `;
  return rows.length;
}

/** Cierra un intento. Si quedó lista, la demo se liga a los contactos de esa web que no tenían. */
export async function finishDemoJob(job: DemoJobRow, slug: string | null, error: string | null): Promise<DemoJobState> {
  const sql = getSql();
  const next = demoJobAfterAttempt(job.attempts, slug);
  await sql`
    UPDATE outreach_demo_job SET status = ${next.status}, slug = ${next.slug}, last_error = ${error}, updated_at = now()
    WHERE host = ${job.host}
  `;
  if (slug) {
    const contacts = await sql`SELECT email, website FROM outreach_contact WHERE demo_slug IS NULL AND website IS NOT NULL`;
    for (const c of contacts) {
      if (hostOf(String(c.website)) !== job.host) continue;
      await sql`UPDATE outreach_contact SET demo_slug = ${slug}, updated_at = now() WHERE email = ${String(c.email)} AND demo_slug IS NULL`;
    }
  }
  return next;
}

// ─── Rebotes sin webhook: preguntarle a Resend ────────────────

export type SentToCheck = { email: string; resendId: string; step: number | null };

/**
 * Los envíos de las últimas `hours` horas cuyo destino no está suprimido: los
 * que todavía pueden rebotar o quejarse. El más reciente primero.
 */
export async function sentToCheck(hours: number, limit = 200): Promise<SentToCheck[]> {
  const rows = await getSql()`
    SELECT e.email, e.resend_id, e.step FROM outreach_event e
    WHERE e.type = 'sent' AND e.resend_id IS NOT NULL
      AND e.created_at > now() - make_interval(hours => ${hours})
      AND NOT EXISTS (SELECT 1 FROM outreach_suppression s WHERE s.email = e.email)
    ORDER BY e.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ email: String(r.email), resendId: String(r.resend_id), step: r.step === null ? null : Number(r.step) }));
}

export async function recordResendStatus(resendId: string, lastEvent: string): Promise<void> {
  await getSql()`
    UPDATE outreach_event SET resend_last_event = ${lastEvent}, resend_checked_at = now()
    WHERE resend_id = ${resendId} AND type = 'sent'
  `;
}

// ─── /ops/outreach ────────────────────────────────────────────

export type OpsContactRow = {
  email: string;
  businessName: string;
  city: string;
  website: string | null;
  demoSlug: string | null;
  sector: string;
  country: CountryCode;
  offer: string;
  status: OutreachStatus;
  step: number;
  lastSentAt: string | null;
  nextSendAt: string | null;
};

export async function listOpsContacts(limit = 1000): Promise<OpsContactRow[]> {
  const rows = await getSql()`
    SELECT email, business_name, city, website, demo_slug, sector, country, offer, status, step, last_sent_at, next_send_at
    FROM outreach_contact ORDER BY created_at ASC, email ASC LIMIT ${limit}
  `;
  const iso = (v: unknown) => (v ? new Date(String(v)).toISOString() : null);
  return rows.map((r) => ({
    email: String(r.email),
    businessName: String(r.business_name),
    city: String(r.city ?? ""),
    website: r.website ? String(r.website) : null,
    demoSlug: r.demo_slug ? String(r.demo_slug) : null,
    sector: String(r.sector ?? ""),
    country: String(r.country) as CountryCode,
    offer: String(r.offer ?? ""),
    status: String(r.status) as OutreachStatus,
    step: Number(r.step),
    lastSentAt: iso(r.last_sent_at),
    nextSendAt: iso(r.next_send_at),
  }));
}

export type OpsCounters = {
  sentToday: number;
  sent7d: number;
  recent: { sent: number; bounced: number; complained: number };
  unsubscribes: number;
  demoChats: number;
  demoClicks: number;
};

/** «Hoy» es el día de CDMX, como en `pnpm outreach status`. */
export async function opsCounters(): Promise<OpsCounters> {
  const sql = getSql();
  const [sentRows, unsubRows, recent] = await Promise.all([
    sql`
      SELECT
        count(*) FILTER (WHERE (created_at AT TIME ZONE 'America/Mexico_City')::date = (now() AT TIME ZONE 'America/Mexico_City')::date)::int AS today,
        count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week
      FROM outreach_event WHERE type = 'sent'
    `,
    sql`SELECT count(*)::int AS n FROM outreach_suppression WHERE reason = 'unsubscribed'`,
    recentDeliverability(),
  ]);
  let demoChats = 0;
  let demoClicks = 0;
  try {
    const demoRows = await sql`
      SELECT COALESCE(sum(chat_count), 0)::int AS chats, COALESCE(sum(signup_clicks), 0)::int AS clicks
      FROM demo_agent WHERE slug IN (SELECT demo_slug FROM outreach_contact WHERE demo_slug IS NOT NULL)
    `;
    demoChats = Number(demoRows[0]?.chats ?? 0);
    demoClicks = Number(demoRows[0]?.clicks ?? 0);
  } catch {
    // Sin `demo_agent` todavía: ninguna demo, ningún chat.
  }
  return {
    sentToday: Number(sentRows[0]?.today ?? 0),
    sent7d: Number(sentRows[0]?.week ?? 0),
    recent,
    unsubscribes: Number(unsubRows[0]?.n ?? 0),
    demoChats,
    demoClicks,
  };
}
