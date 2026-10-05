/**
 * La prospección en frío por correo, desde hola.allok.fun vía Resend.
 * Guía completa: docs/cold-email.md.
 *
 *   pnpm outreach import --csv leads.csv [--allow-freemail] [--dry-run]
 *   pnpm outreach send --limit 20 --dry-run          # imprime, no envía, sin interruptor
 *   pnpm outreach send --dry-run --fixture leads.csv # sin base: el CSV como si fuera la cola
 *   pnpm outreach send --limit 20                    # envía (OUTREACH_ENABLED=true)
 *   pnpm outreach status
 *   pnpm outreach mark --email hola@clinica.mx --status replied|signed_up
 *
 * Nunca se escribe en frío por la API de WhatsApp: solo correo, y solo a
 * direcciones que el negocio publica en su web.
 */
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { Resend } from "resend";
import {
  BOUNCE_WINDOW_SENDS,
  DEFAULT_DAILY_CAP,
  DEFAULT_REPLY_TO,
  MANUAL_STATUSES,
  MAX_BOUNCE_RATE,
  bounceGuardTripped,
  bounceRate,
  inSendWindow,
  matchDemoSlug,
  nextSendAt,
  outreachLeadsFromCsv,
  readSendConfig,
  type ManualStatus,
} from "../src/lib/outreach";
import { renderOutreachEmail } from "../src/lib/outreach-templates";
import {
  dueContacts,
  ensureOutreachTables,
  getSuppressedEmails,
  listDemoRefs,
  markContact,
  outreachReport,
  recentDeliverability,
  recordSent,
  sendsLast24h,
  upsertContacts,
  type DemoRef,
  type OutreachContactRow,
} from "../src/lib/outreach-db";

const [command, ...rest] = process.argv.slice(2);

const { values } = parseArgs({
  args: rest,
  options: {
    csv: { type: "string" },
    source: { type: "string" },
    "allow-freemail": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    limit: { type: "string", default: "20" },
    fixture: { type: "string" },
    demos: { type: "string" },
    now: { type: "string" },
    email: { type: "string" },
    status: { type: "string" },
  },
});

const DRY_SECRET = "dry-run-secret-los-enlaces-de-baja-no-sirven";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function needDb() {
  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL.");
}

function nowArg(): Date {
  if (!values.now) return new Date();
  const d = new Date(values.now);
  if (Number.isNaN(d.getTime())) throw new Error(`--now no es una fecha: ${values.now}`);
  return d;
}

function limitArg(): number {
  const n = Number(values.limit);
  if (!Number.isInteger(n) || n < 0) throw new Error("--limit tiene que ser un entero ≥ 0");
  return n;
}

async function readLeads(path: string, suppressed?: ReadonlySet<string>) {
  const raw = await readFile(path, "utf8");
  const result = outreachLeadsFromCsv(raw, { allowFreemail: values["allow-freemail"], suppressed });
  const missing = Object.entries(result.columns)
    .filter(([, i]) => i === null)
    .map(([k]) => k);
  if (missing.includes("name") || missing.includes("email")) {
    throw new Error(`El CSV no trae columna de nombre o de correo. Faltan: ${missing.join(", ")}`);
  }
  if (missing.length) console.warn(`Columnas no encontradas (quedan vacías): ${missing.join(", ")}`);
  return result;
}

function printSkips(skipped: { row: number; name: string; email: string; reason: string }[]) {
  const byReason = new Map<string, number>();
  for (const s of skipped) byReason.set(s.reason, (byReason.get(s.reason) ?? 0) + 1);
  if (byReason.size) {
    console.log("Saltados:");
    for (const [reason, n] of [...byReason].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${reason}`);
  }
}

// ─── import ───────────────────────────────────────────────────

async function cmdImport() {
  if (!values.csv) throw new Error("Usa: pnpm outreach import --csv <archivo> [--allow-freemail] [--dry-run]");
  const dryRun = values["dry-run"];
  if (!dryRun) {
    needDb();
    await ensureOutreachTables();
  }
  const suppressed = dryRun || !process.env.DATABASE_URL ? new Set<string>() : await getSuppressedEmails();
  const { leads, skipped } = await readLeads(values.csv, suppressed);
  const demos = process.env.DATABASE_URL ? await listDemoRefs() : await fixtureDemos();
  const contacts = leads.map((l) => ({ ...l, demoSlug: matchDemoSlug(l, demos) }));
  const withDemo = contacts.filter((c) => c.demoSlug).length;
  console.log(`${contacts.length} contactos escribibles (${withDemo} con demo), ${skipped.length} saltados.`);
  printSkips(skipped);
  if (dryRun) {
    for (const c of contacts) console.log(`  ${c.email}\t${c.businessName}\t${c.country}\t${c.demoSlug ?? "(sin demo)"}`);
    console.log("dry-run: no se guardó nada.");
    return;
  }
  const source = values.source ?? basename(values.csv);
  const { inserted, existing } = await upsertContacts(contacts, source);
  console.log(`Guardados: ${inserted} nuevos, ${existing} ya estaban.`);
}

// ─── send ─────────────────────────────────────────────────────

async function fixtureDemos(): Promise<DemoRef[]> {
  const path = values.demos ?? join(process.cwd(), "src/data/demo-agents.dev.json");
  const raw = await readFile(path, "utf8").catch(() => "[]");
  const rows = JSON.parse(raw) as { slug: string; business_name?: string; businessName?: string; website?: string | null }[];
  return rows.map((r) => ({ slug: r.slug, businessName: r.business_name ?? r.businessName ?? "", website: r.website ?? null }));
}

/** `--fixture`: el CSV como si todos acabaran de importarse (paso 0, vencidos). Sin base. */
async function fixtureQueue(path: string): Promise<OutreachContactRow[]> {
  const { leads, skipped } = await readLeads(path);
  const demos = await fixtureDemos();
  console.log(`fixture: ${leads.length} contactos escribibles, ${skipped.length} saltados.`);
  printSkips(skipped);
  return leads.map((l) => ({
    email: l.email,
    businessName: l.businessName,
    demoSlug: matchDemoSlug(l, demos),
    sector: l.sector,
    country: l.country,
    offer: l.offer,
    status: "queued",
    step: 0,
  }));
}

async function cmdSend() {
  const dryRun = values["dry-run"];
  const now = nowArg();
  const limit = limitArg();

  if (values.fixture && !dryRun) throw new Error("--fixture solo sirve con --dry-run.");

  if (dryRun) {
    const secret = process.env.OUTREACH_SECRET?.trim() || DRY_SECRET;
    if (secret === DRY_SECRET) console.warn("(sin OUTREACH_SECRET: los enlaces de baja de este dry-run no son válidos)");
    const replyTo = process.env.OUTREACH_REPLY_TO?.trim() || DEFAULT_REPLY_TO;
    const cap = Number(process.env.OUTREACH_DAILY_CAP || DEFAULT_DAILY_CAP);
    let queue: OutreachContactRow[];
    let alreadyToday = 0;
    if (values.fixture) {
      queue = await fixtureQueue(values.fixture);
    } else {
      needDb();
      queue = await dueContacts(now);
      alreadyToday = await sendsLast24h();
      const recent = await recentDeliverability();
      if (bounceGuardTripped(recent.sent, recent.bounced)) {
        console.warn(`OJO: el envío real se detendría: rebote ${(bounceRate(recent.sent, recent.bounced) * 100).toFixed(1)} % en los últimos ${recent.sent} envíos.`);
      }
    }
    const budget = Math.max(0, Math.min(limit, cap - alreadyToday));
    const inWindow = queue.filter((c) => inSendWindow(now, c.country));
    const outside = queue.length - inWindow.length;
    const batch = inWindow.slice(0, budget);
    console.log(
      `dry-run ${now.toISOString()}: ${queue.length} vencidos, ${outside} fuera de horario (L–V 9–17 local), tope ${cap}/24 h (ya van ${alreadyToday}), --limit ${limit} → saldrían ${batch.length}.\n`,
    );
    for (const c of batch) {
      const step = c.step + 1;
      const email = renderOutreachEmail(c, step, { secret, replyTo });
      console.log("=".repeat(72));
      console.log(`To: ${c.email}\nReply-To: ${replyTo}\nPaso: ${step} · País: ${c.country} · Demo: ${c.demoSlug ?? "(no)"}`);
      for (const [k, v] of Object.entries(email.headers)) console.log(`${k}: ${v}`);
      console.log(`Subject: ${email.subject}\n\n${email.text}`);
    }
    console.log("dry-run: no se envió nada ni se escribió en la base.");
    return;
  }

  const { config, problems } = readSendConfig(process.env);
  if (!config) throw new Error(`No se envía nada:\n  - ${problems.join("\n  - ")}`);
  needDb();

  const recent = await recentDeliverability();
  if (bounceGuardTripped(recent.sent, recent.bounced)) {
    throw new Error(
      `Detenido: ${recent.bounced}/${recent.sent} rebotes en los últimos envíos (${(bounceRate(recent.sent, recent.bounced) * 100).toFixed(1)} % > ${MAX_BOUNCE_RATE * 100} %). Revisa la lista antes de seguir.`,
    );
  }
  const already = await sendsLast24h();
  const budget = Math.max(0, Math.min(limit, config.dailyCap - already));
  if (budget === 0) {
    console.log(`Tope alcanzado: ${already} envíos en 24 h (OUTREACH_DAILY_CAP=${config.dailyCap}).`);
    return;
  }
  const queue = (await dueContacts(now)).filter((c) => inSendWindow(now, c.country));
  const batch = queue.slice(0, budget);
  console.log(`${batch.length} por enviar (tope restante ${budget}).`);

  const resend = new Resend(config.apiKey);
  let sent = 0;
  let failuresInRow = 0;
  for (const c of batch) {
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
      // Reintentar el script no duplica: Resend devuelve el mismo envío.
      { idempotencyKey: `outreach/${c.email}/step${step}` },
    );
    if (error || !data) {
      failuresInRow++;
      console.error(`  ✗ ${c.email}: ${error?.message ?? "sin respuesta"}`);
      if (failuresInRow >= 3) throw new Error("Tres fallos seguidos de Resend: se detiene el envío.");
      continue;
    }
    failuresInRow = 0;
    await recordSent({ email: c.email, step, resendId: data.id, nextSendAt: nextSendAt(step, new Date()) });
    sent++;
    console.log(`  ✓ ${c.email} (paso ${step})`);
    // Los rebotes llegan por webhook mientras se envía: se revisa cada 10.
    if (sent % 10 === 0) {
      const r = await recentDeliverability();
      if (bounceGuardTripped(r.sent, r.bounced)) throw new Error(`Detenido a mitad: ${r.bounced}/${r.sent} rebotes.`);
    }
    // Espaciados, no en ráfaga.
    await sleep(3000 + Math.floor(Math.random() * 5000));
  }
  console.log(`Listo: ${sent} enviados.`);
}

// ─── status / mark ────────────────────────────────────────────

async function cmdStatus() {
  needDb();
  await ensureOutreachTables();
  const r = await outreachReport();
  const pct = (n: number, d: number) => `${d ? ((n / d) * 100).toFixed(1) : "0.0"} %`;
  console.log("Contactos por estado:");
  for (const [status, n] of Object.entries(r.byStatus)) console.log(`  ${status.padEnd(13)} ${n}`);
  console.log(`Vencidos ahora: ${r.dueNow}`);
  console.log("Envíos, últimos 7 días (hora de CDMX):");
  if (!r.sendsByDay.length) console.log("  (ninguno)");
  for (const d of r.sendsByDay) console.log(`  ${d.day}  ${d.sent}`);
  console.log(`Últimos ${r.recent.sent} envíos (ventana ${BOUNCE_WINDOW_SENDS}): rebote ${pct(r.recent.bounced, r.recent.sent)}, quejas ${pct(r.recent.complained, r.recent.sent)}`);
  console.log(`Supresión: ${Object.entries(r.suppressed).map(([k, v]) => `${k} ${v}`).join(", ") || "vacía"}`);
  console.log(`Bajas: ${r.suppressed.unsubscribed ?? 0}`);
}

async function cmdMark() {
  const status = values.status as ManualStatus | undefined;
  if (!values.email || !status || !MANUAL_STATUSES.includes(status)) {
    throw new Error(`Usa: pnpm outreach mark --email <correo> --status ${MANUAL_STATUSES.join("|")}`);
  }
  needDb();
  await ensureOutreachTables();
  const found = await markContact(values.email, status);
  if (!found) throw new Error(`${values.email} no está en outreach_contact.`);
  console.log(`${values.email} → ${status}. Ya no recibe más pasos.`);
}

const COMMANDS: Record<string, () => Promise<void>> = { import: cmdImport, send: cmdSend, status: cmdStatus, mark: cmdMark };

const run = command ? COMMANDS[command] : undefined;
if (!run) {
  console.error("Usa: pnpm outreach <import|send|status|mark> …  (ver docs/cold-email.md)");
  process.exit(1);
}
run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
