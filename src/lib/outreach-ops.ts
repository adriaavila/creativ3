import {
  DEFAULT_DAILY_CAP,
  DEMO_STATUS_LABEL,
  bounceGuardTripped,
  hostOf,
  resolveOutreachSecret,
  resolveSendingSwitch,
  stepReadiness,
  type DemoJobState,
  type OutreachStatus,
} from "@/lib/outreach";
import { renderOutreachEmail } from "@/lib/outreach-templates";
import {
  ensureOutreachTables,
  getLastRun,
  getSendingSetting,
  listDemoJobs,
  listOpsContacts,
  opsCounters,
  outreachDbConfigured,
  type OpsContactRow,
  type OpsCounters,
} from "@/lib/outreach-db";

/** Lo que pinta `/ops/outreach`. Se arma en el servidor; el cliente solo lo muestra. */

export type OutreachOpsContact = {
  email: string;
  businessName: string;
  city: string;
  country: string;
  demoPath: string | null;
  demoStatus: "pendiente" | "listo" | "falló" | null;
  demoError: string | null;
  step: number;
  status: OutreachStatus;
  statusLabel: string;
  waiting: string | null;
  lastSentAt: string | null;
  suppressed: boolean;
  preview: { subject: string; text: string; note: string | null };
};

export type OutreachOpsData = {
  mode: "live" | "fixture" | "no-db";
  warnings: string[];
  switch: { dbEnabled: boolean; effectiveOn: boolean; reason: string; forcedOff: boolean; changedAt: string | null };
  resendConfigured: boolean;
  dailyCap: number;
  counters: OpsCounters | null;
  bounceStopped: boolean;
  lastRun: Record<string, unknown> | null;
  contacts: OutreachOpsContact[];
  error?: string;
};

export const STATUS_LABEL: Record<OutreachStatus, string> = {
  queued: "en cola",
  sent: "en secuencia",
  replied: "respondió",
  bounced: "rebotó",
  complained: "se quejó",
  unsubscribed: "se dio de baja",
  signed_up: "se registró",
  excluded: "excluido",
};

const STOPPED: ReadonlySet<OutreachStatus> = new Set(["replied", "bounced", "complained", "unsubscribed", "signed_up", "excluded"]);

function configWarnings(env: Record<string, string | undefined>): { warnings: string[]; secret: string | null } {
  const warnings: string[] = [];
  if (!env.RESEND_API_KEY?.trim()) warnings.push("Falta RESEND_API_KEY en Vercel: el cron no envía ni revisa rebotes hasta que la agregues.");
  if (!env.CRON_SECRET?.trim()) warnings.push("Falta CRON_SECRET: Vercel no puede autenticar el cron y no corre nada.");
  let secret: string | null = null;
  try {
    secret = resolveOutreachSecret(env);
  } catch {
    warnings.push("No hay secreto para los enlaces de baja (OUTREACH_SECRET, OPS_SESSION_SECRET o CRON_SECRET): no sale nada.");
  }
  return { warnings, secret };
}

export function toOpsContact(row: OpsContactRow, job: DemoJobState & { lastError?: string | null } | undefined, secret: string): OutreachOpsContact {
  const readiness = stepReadiness({ step: 0, website: row.website, demoSlug: row.demoSlug }, job);
  const slug = row.demoSlug ?? (job?.status === "ready" ? job.slug : null);
  const demoStatus: OutreachOpsContact["demoStatus"] = row.demoSlug ? "listo" : job ? DEMO_STATUS_LABEL[job.status] : row.website ? "pendiente" : null;
  const previewSlug = readiness.ready ? readiness.demoSlug : "demo-pendiente";
  const email = renderOutreachEmail({ ...row, demoSlug: previewSlug }, 1, { secret });
  const suppressed = STOPPED.has(row.status);
  return {
    email: row.email,
    businessName: row.businessName,
    city: row.city,
    country: row.country,
    demoPath: slug ? `/demo/${slug}` : null,
    demoStatus,
    demoError: job?.status === "failed" ? (job.lastError ?? null) : null,
    step: row.step,
    status: row.status,
    statusLabel: STATUS_LABEL[row.status] ?? row.status,
    waiting: !suppressed && row.step === 0 && !readiness.ready ? "espera su demo" : null,
    lastSentAt: row.lastSentAt,
    suppressed,
    preview: {
      subject: email.subject,
      text: email.text,
      note: readiness.ready
        ? readiness.demoSlug
          ? null
          : row.website
            ? "La demo falló dos veces: sale la versión sin demo."
            : "Sin web: sale la versión sin demo."
        : "La demo aún no está: el paso 1 no sale hasta que esté lista (el enlace final será el de su demo).",
    },
  };
}

export async function loadOutreachOps(env: Record<string, string | undefined> = process.env): Promise<OutreachOpsData> {
  const { warnings, secret } = configWarnings(env);
  const capRaw = Number(env.OUTREACH_DAILY_CAP || DEFAULT_DAILY_CAP);
  const dailyCap = Number.isInteger(capRaw) && capRaw >= 0 ? capRaw : DEFAULT_DAILY_CAP;
  const base = {
    warnings,
    resendConfigured: Boolean(env.RESEND_API_KEY?.trim()),
    dailyCap,
  };
  if (!outreachDbConfigured()) {
    if (env.NODE_ENV === "development") return outreachOpsFixture(base);
    const sw = resolveSendingSwitch(env, false);
    return {
      ...base,
      mode: "no-db",
      warnings: ["Falta DATABASE_URL: sin base no hay contactos, ni cola, ni interruptor.", ...warnings],
      switch: { dbEnabled: false, effectiveOn: false, reason: sw.reason, forcedOff: env.OUTREACH_ENABLED?.trim().toLowerCase() === "false", changedAt: null },
      counters: null,
      bounceStopped: false,
      lastRun: null,
      contacts: [],
    };
  }

  await ensureOutreachTables();
  const [setting, counters, lastRun, rows, jobs] = await Promise.all([getSendingSetting(), opsCounters(), getLastRun(), listOpsContacts(), listDemoJobs()]);
  const sw = resolveSendingSwitch(env, setting.enabled);
  const bounceStopped = bounceGuardTripped(counters.recent.sent, counters.recent.bounced);
  const previewSecret = secret ?? "vista-previa-sin-secreto";
  return {
    ...base,
    mode: "live",
    switch: { dbEnabled: setting.enabled, effectiveOn: sw.on, reason: sw.reason, forcedOff: env.OUTREACH_ENABLED?.trim().toLowerCase() === "false", changedAt: setting.changedAt },
    counters,
    bounceStopped,
    lastRun,
    contacts: rows.map((row) => toOpsContact(row, row.website ? jobs.get(hostOf(row.website)) : undefined, previewSecret)),
  };
}

// ─── `next dev` sin base: datos de ejemplo ────────────────────

/** Negocios inventados, solo para ver la página en desarrollo sin base. */
function outreachOpsFixture(base: Pick<OutreachOpsData, "warnings" | "resendConfigured" | "dailyCap">): OutreachOpsData {
  const at = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const rows: (OpsContactRow & { job?: DemoJobState & { lastError?: string } })[] = [
    { email: "hola@clinicaejemplo.mx", businessName: "Clínica Dental Ejemplo", city: "CDMX", website: "https://clinicaejemplo.mx/", demoSlug: "clinica-dental-ejemplo-cdmx", sector: "clinica_estetica_dermatologia_dental (dental)", country: "MX", offer: "Ortodoncia, limpieza y blanqueamiento dental con especialistas certificados", status: "sent", step: 1, lastSentAt: at(20), nextSendAt: at(-52) },
    { email: "contacto@academiamuestra.co", businessName: "Academia de Idiomas Muestra", city: "Bogotá", website: "https://academiamuestra.co/", demoSlug: null, sector: "academia_cursos (idiomas)", country: "CO", offer: "", status: "queued", step: 0, lastSentAt: null, nextSendAt: at(1), job: { status: "pending", attempts: 1, slug: null } },
    { email: "info@esteticaprueba.com.mx", businessName: "Estética Prueba Spa", city: "Guadalajara", website: "https://esteticaprueba.com.mx/", demoSlug: null, sector: "clinica_estetica_dermatologia_dental (estética)", country: "MX", offer: "", status: "queued", step: 0, lastSentAt: null, nextSendAt: at(1), job: { status: "failed", attempts: 2, slug: null, lastError: "no se pudo leer la web" } },
    { email: "citas@dermaficticia.co", businessName: "Derma Ficticia", city: "Medellín", website: "https://dermaficticia.co/", demoSlug: "derma-ficticia-medellin", sector: "clinica_estetica_dermatologia_dental (dermatología)", country: "CO", offer: "", status: "unsubscribed", step: 1, lastSentAt: at(70), nextSendAt: null },
  ];
  const contacts = rows.map(({ job, ...row }) => toOpsContact(row, job, "vista-previa-dev"));
  return {
    ...base,
    mode: "fixture",
    switch: { dbEnabled: false, effectiveOn: false, reason: "apagado en /ops/outreach", forcedOff: false, changedAt: null },
    counters: { sentToday: 1, sent7d: 2, recent: { sent: 2, bounced: 0, complained: 0 }, unsubscribes: 1, demoChats: 7, demoClicks: 1 },
    bounceStopped: false,
    lastRun: { at: at(0.3), ok: true, demos: { backfilled: 0, built: 0, failed: 1 }, bounces: { checked: 2, bounced: 0, complained: 0, errors: 0 }, send: { switchOn: false, skipped: "interruptor apagado (apagado en /ops/outreach)" } },
    contacts,
  };
}
