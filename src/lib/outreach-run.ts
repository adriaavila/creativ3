import { Resend } from "resend";
import { buildAndSaveDemo } from "@/lib/demo-build-run";
import { demoSlugOwners, ensureDemoAgentTable } from "@/lib/demo-db";
import { isDemoLlmConfigured } from "@/lib/demo-llm";
import { normalizeUrl } from "@/lib/demo-profile-build";
import {
  bounceGuardTripped,
  bounceRate,
  nextSendAt,
  pickSendBatch,
  readSendConfig,
  resolveSendingSwitch,
  type SendConfig,
} from "@/lib/outreach";
import { renderOutreachEmail } from "@/lib/outreach-templates";
import {
  acquireCronLease,
  backfillDemoJobs,
  claimDemoJobs,
  dueContacts,
  ensureOutreachTables,
  failExhaustedDemoJobs,
  finishDemoJob,
  getSendingSetting,
  listDemoJobs,
  outreachDbConfigured,
  recentDeliverability,
  recordResendStatus,
  recordSent,
  releaseCronLease,
  saveLastRun,
  sendsLast24h,
  sentToCheck,
  suppressEmail,
  type OutreachContactRow,
} from "@/lib/outreach-db";

/**
 * La prospección corriendo sola en producción (`/api/cron/outreach`, cada 30
 * minutos), y el envío que comparte con `pnpm outreach send`. Tres etapas,
 * en este orden: armar demos pendientes, preguntarle a Resend por rebotes, y
 * —solo con el interruptor encendido— enviar lo que toca.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Enviar ───────────────────────────────────────────────────

export type SendBatchResult = { sent: number; failed: number; stopped: string | null };

/**
 * Envía el lote, uno por uno y espaciados. Reintentar no duplica (Resend
 * deduplica por `idempotencyKey`, y `recordSent` solo avanza desde el paso
 * anterior). Se detiene con tres fallos seguidos, si el rebote pasa del tope
 * a mitad del lote, o al llegar a `deadline`.
 */
export async function sendOutreachBatch(input: {
  resend: Resend;
  config: SendConfig;
  batch: readonly (OutreachContactRow & { demoSlug: string | null })[];
  spacingMs?: [number, number];
  deadline?: number;
  log?: (line: string) => void;
}): Promise<SendBatchResult> {
  const { resend, config, batch, log = () => {} } = input;
  const [minGap, maxGap] = input.spacingMs ?? [3000, 8000];
  let sent = 0;
  let failed = 0;
  let failuresInRow = 0;
  for (const [i, c] of batch.entries()) {
    if (input.deadline && Date.now() > input.deadline) return { sent, failed, stopped: "sin tiempo en esta corrida" };
    const step = c.step + 1;
    const email = renderOutreachEmail(c, step, { secret: config.secret, replyTo: config.replyTo });
    const { data, error } = await resend.emails.send(
      {
        from: config.from,
        to: c.email,
        replyTo: config.replyTo,
        subject: email.subject,
        text: email.text,
        headers: email.headers,
        tags: [
          { name: "campaign", value: "q4_demo" },
          { name: "step", value: String(step) },
        ],
      },
      { idempotencyKey: `outreach/${c.email}/step${step}` },
    );
    if (error || !data) {
      failed++;
      failuresInRow++;
      log(`✗ ${c.email}: ${error?.message ?? "sin respuesta"}`);
      if (failuresInRow >= 3) return { sent, failed, stopped: "tres fallos seguidos de Resend" };
      continue;
    }
    failuresInRow = 0;
    // El id de Resend queda en el evento: el cron le pregunta después si rebotó.
    await recordSent({ email: c.email, step, resendId: data.id, nextSendAt: nextSendAt(step, new Date()) });
    sent++;
    log(`✓ ${c.email} (paso ${step}${step === 1 ? (c.demoSlug ? ", con demo" : ", sin demo") : ""})`);
    if (sent % 10 === 0) {
      const r = await recentDeliverability();
      if (bounceGuardTripped(r.sent, r.bounced)) return { sent, failed, stopped: `rebote ${r.bounced}/${r.sent}` };
    }
    if (i < batch.length - 1) await sleep(minGap + Math.floor(Math.random() * Math.max(0, maxGap - minGap)));
  }
  return { sent, failed, stopped: null };
}

/** Los vencidos que pueden salir ya: demo resuelta, horario local, sin pasar del presupuesto. */
export async function selectSendBatch(now: Date, budget: number) {
  const [due, jobs] = await Promise.all([dueContacts(now), listDemoJobs()]);
  return pickSendBatch(due, jobs, now, budget);
}

// ─── Demos ────────────────────────────────────────────────────

export type DemoStageResult = { backfilled: number; built: number; failed: number; skipped?: string };

export async function buildPendingDemos(limit: number): Promise<DemoStageResult> {
  const backfilled = await backfillDemoJobs();
  await failExhaustedDemoJobs();
  if (!isDemoLlmConfigured()) return { backfilled, built: 0, failed: 0, skipped: "sin AI Gateway (AI_GATEWAY_API_KEY o VERCEL_OIDC_TOKEN)" };
  const jobs = await claimDemoJobs(limit);
  if (!jobs.length) return { backfilled, built: 0, failed: 0 };
  await ensureDemoAgentTable();
  const owners = await demoSlugOwners();
  let built = 0;
  let failed = 0;
  await Promise.all(
    jobs.map(async (job) => {
      const website = normalizeUrl(job.website);
      let slug: string | null = null;
      let error: string | null = null;
      try {
        if (!website) throw new Error("web inválida");
        const outcome = await buildAndSaveDemo(
          { name: job.businessName, website, sector: job.sector, city: job.city, country: job.country },
          owners,
          { timeoutMs: 45_000 },
        );
        if (outcome.ok) slug = outcome.slug;
        else error = outcome.reason;
      } catch (e) {
        error = (e as Error).message.slice(0, 300);
      }
      await finishDemoJob(job, slug, error);
      if (slug) built++;
      else failed++;
    }),
  );
  return { backfilled, built, failed };
}

// ─── Rebotes ──────────────────────────────────────────────────

export type BounceStageResult = { checked: number; bounced: number; complained: number; errors: number; skipped?: string };

/**
 * Sin webhook también hay supresión: a cada envío de las últimas 72 h se le
 * pregunta a Resend su `last_event`; rebotado o con queja, a la lista de
 * supresión. Espaciado para no pasar del límite de la API.
 */
export async function pollBounces(resend: Resend, opts: { hours?: number; deadline?: number; gapMs?: number } = {}): Promise<BounceStageResult> {
  const toCheck = await sentToCheck(opts.hours ?? 72);
  const result: BounceStageResult = { checked: 0, bounced: 0, complained: 0, errors: 0 };
  for (const item of toCheck) {
    if (opts.deadline && Date.now() > opts.deadline) break;
    const { data, error } = await resend.emails.get(item.resendId);
    if (error || !data) {
      result.errors++;
      if (result.errors >= 5) break;
    } else {
      result.checked++;
      const last = data.last_event;
      await recordResendStatus(item.resendId, last);
      if (last === "bounced" || last === "complained") {
        await suppressEmail({ email: item.email, reason: last, resendId: item.resendId, detail: { via: "poll" } });
        result[last]++;
      }
    }
    await sleep(opts.gapMs ?? 600);
  }
  return result;
}

// ─── La corrida del cron ──────────────────────────────────────

export type CronSummary = {
  at: string;
  ok: boolean;
  skipped?: string;
  demos?: DemoStageResult;
  bounces?: BounceStageResult;
  send?: {
    switchOn: boolean;
    skipped?: string;
    due?: number;
    waitingDemo?: number;
    outsideWindow?: number;
    budget?: number;
    sent?: number;
    failed?: number;
    stopped?: string | null;
  };
  error?: string;
  ms?: number;
};

export const CRON_DEMOS_PER_RUN = 3;
/** Pocos por corrida: con una corrida cada 30 min, 20 al día se reparten en la mañana, no salen en ráfaga. */
export const CRON_SENDS_PER_RUN = 3;

export async function runOutreachCron(options: { now?: Date; env?: Record<string, string | undefined>; budgetMs?: number } = {}): Promise<CronSummary> {
  const started = Date.now();
  const now = options.now ?? new Date();
  const env = options.env ?? process.env;
  const deadline = started + (options.budgetMs ?? 240_000);
  const summary: CronSummary = { at: now.toISOString(), ok: true };

  if (!outreachDbConfigured()) return { ...summary, skipped: "sin DATABASE_URL" };
  await ensureOutreachTables();
  if (!(await acquireCronLease(330))) return { ...summary, skipped: "otra corrida en curso" };

  try {
    // 1. Demos pendientes.
    summary.demos = await buildPendingDemos(CRON_DEMOS_PER_RUN);

    // 2. Rebotes, preguntándole a Resend.
    const apiKey = env.RESEND_API_KEY?.trim();
    const resend = apiKey ? new Resend(apiKey) : null;
    summary.bounces = resend
      ? await pollBounces(resend, { deadline: started + 150_000 })
      : { checked: 0, bounced: 0, complained: 0, errors: 0, skipped: "sin RESEND_API_KEY" };

    // 3. Enviar, solo con el interruptor encendido.
    const sending = resolveSendingSwitch(env, (await getSendingSetting()).enabled);
    const send: NonNullable<CronSummary["send"]> = { switchOn: sending.on };
    summary.send = send;
    const { config, problems } = readSendConfig(env, sending);
    if (!config || !resend) {
      send.skipped = problems.join("; ") || "sin RESEND_API_KEY";
    } else {
      const recent = await recentDeliverability();
      if (bounceGuardTripped(recent.sent, recent.bounced)) {
        send.skipped = `detenido por rebote: ${recent.bounced}/${recent.sent} (${(bounceRate(recent.sent, recent.bounced) * 100).toFixed(1)} %)`;
      } else {
        const already = await sendsLast24h();
        const budget = Math.max(0, Math.min(CRON_SENDS_PER_RUN, config.dailyCap - already));
        const picked = await selectSendBatch(now, budget);
        Object.assign(send, { budget, waitingDemo: picked.waitingDemo, outsideWindow: picked.outsideWindow, due: picked.due });
        if (budget === 0) send.skipped = `tope diario: ${already}/${config.dailyCap} en 24 h`;
        else {
          const r = await sendOutreachBatch({ resend, config, batch: picked.batch, deadline });
          Object.assign(send, r);
        }
      }
    }
  } catch (error) {
    summary.ok = false;
    summary.error = (error as Error).message.slice(0, 500);
  } finally {
    summary.ms = Date.now() - started;
    await saveLastRun(summary).catch(() => {});
    await releaseCronLease().catch(() => {});
  }
  return summary;
}
