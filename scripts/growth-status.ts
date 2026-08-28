/**
 * Seguimiento del Growth Agent sin abrir el panel ni iniciar sesión.
 * Lee la misma base que /ops/growth y responde: ¿corrió?, ¿encontró?, ¿escribimos?, ¿contestaron?
 *
 *   pnpm growth:status            # últimos 7 días
 *   pnpm growth:status 30         # últimos 30 días
 */
import { neon } from "../src/lib/db";

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
const days = Number(process.argv[2] ?? 7);
if (!Number.isInteger(days) || days < 1 || days > 90) {
  throw new Error("Uso: pnpm growth:status [días 1-90]");
}
if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL (está en .env.local).");
const sql = neon(process.env.DATABASE_URL);

const since = `${days} days`;

const [runs, leadsByStatus, drafts, outreach, replied, lastRuns] = await Promise.all([
  sql`
    SELECT status, count(*)::int AS total, max(created_at) AS last_at
    FROM growth_runs WHERE created_at >= now() - ${since}::interval
    GROUP BY status ORDER BY total DESC
  `,
  sql`
    SELECT status, count(*)::int AS total
    FROM leads WHERE created_at >= now() - ${since}::interval
    GROUP BY status ORDER BY total DESC
  `,
  sql`
    SELECT status, count(*)::int AS total
    FROM outreach_drafts WHERE updated_at >= now() - ${since}::interval
    GROUP BY status ORDER BY total DESC
  `,
  sql`
    SELECT status, count(*)::int AS total, max(sent_at) AS last_sent_at
    FROM growth_outreach_messages WHERE created_at >= now() - ${since}::interval
    GROUP BY status ORDER BY total DESC
  `,
  sql`
    SELECT business_name, status, last_contacted_at
    FROM leads
    WHERE status IN ('replied', 'meeting_booked', 'won')
      AND updated_at >= now() - ${since}::interval
    ORDER BY updated_at DESC LIMIT 10
  `,
  sql`
    SELECT status, created_at, completed_at, summary, error
    FROM growth_runs ORDER BY created_at DESC LIMIT 3
  `,
]);

const total = (rows: Record<string, unknown>[]) => rows.reduce((sum, row) => sum + Number(row.total), 0);
const stale = lastRuns[0] && Date.now() - new Date(String(lastRuns[0].created_at)).getTime() > 3 * 86_400_000;

console.log(`\n📊 Growth · últimos ${days} días\n`);
console.log(`Runs:        ${total(runs)}  ${runs.map((r) => `${r.status}=${r.total}`).join(" ") || "(ninguno)"}`);
console.log(`Leads:       ${total(leadsByStatus)}  ${leadsByStatus.map((r) => `${r.status}=${r.total}`).join(" ") || "(ninguno)"}`);
console.log(`Borradores:  ${total(drafts)}  ${drafts.map((r) => `${r.status}=${r.total}`).join(" ") || "(ninguno)"}`);
console.log(`Enviados:    ${total(outreach)}  ${outreach.map((r) => `${r.status}=${r.total}`).join(" ") || "(ninguno)"}`);

if (replied.length > 0) {
  console.log(`\n💬 Respondieron / avanzaron:`);
  for (const lead of replied) console.log(`  · ${lead.business_name} → ${lead.status}`);
} else {
  console.log(`\n💬 Nadie respondió todavía. Sin respuesta no hay pipeline real.`);
}

console.log(`\n🕒 Últimos runs:`);
for (const run of lastRuns) {
  const when = new Date(String(run.created_at)).toLocaleString("es-VE");
  console.log(`  · ${when} · ${run.status} · ${String(run.summary ?? run.error ?? "sin resumen").slice(0, 120)}`);
}
if (lastRuns.length === 0) console.log("  · nunca corrió. Revisa los schedules de Eve en apps/growth-agent.");
else if (stale) console.log("  ⚠️  el último run tiene +3 días: el schedule de Eve puede estar caído.");

const pending = Number(drafts.find((row) => row.status === "pending")?.total ?? 0);
if (pending > 0) console.log(`\n👉 ${pending} borradores esperando tu aprobación en /ops/growth (pestaña Hoy).`);
console.log("");
}
