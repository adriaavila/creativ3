/**
 * Los agentes de allok en Managed Agents (Anthropic): el motor de leads y la
 * auditoría desde afuera. Las instrucciones viven en `agents/`; los IDs, en
 * `agents/ids.json` (no son secretos: sin la API key no sirven).
 *
 *   pnpm agents setup --allow-unrestricted-network   # una vez (y tras editar agents/*.md)
 *   pnpm agents leads --segment mx-co --count 10 --budget 6   # prueba: mide $/lead
 *   pnpm agents leads --segment sur --count 40 --budget 18
 *   pnpm agents leads --segment bo --count 30 --budget 15 --exclude export.csv
 *   pnpm agents audit --budget 8
 *   pnpm agents fetch <session_id>                   # si se cortó la terminal
 *   pnpm agents raise <session_id> --budget 25       # sesión pausada en su tope
 *   pnpm agents cost                                 # lo gastado por estas sesiones
 *   pnpm agents leads --segment bo --count 30 --budget 15 --print   # solo muestra el encargo
 *
 * Los leads salen en `marketing/leads/<fecha>-<segmento>-<sesión>/`
 * (fuera de git): `leads.csv` tal como lo entregó el agente e
 * `importable.csv`, solo las filas que `/ops/outreach` acepta (mismo filtro).
 * Nada se envía desde aquí: el CSV se sube a mano en /ops/outreach.
 *
 * Necesita ANTHROPIC_API_KEY (en `.env.local`).
 */
import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import Anthropic, { toFile } from "@anthropic-ai/sdk";
import { hostOf, outreachLeadsFromCsv } from "../src/lib/outreach";
import { parseCsv } from "../src/lib/demo-profile-build";

const ROOT = join(import.meta.dirname, "..");
const AGENTS_DIR = join(ROOT, "agents");
const IDS_FILE = join(AGENTS_DIR, "ids.json");
const LEADS_DIR = join(ROOT, "marketing", "leads");
const AUDITS_DIR = join(ROOT, "ops", "audits");
const RUNS_FILE = join(LEADS_DIR, "runs.jsonl");

const LEAD_MODEL = "claude-opus-5-5";
const READER_MODEL = "claude-sonnet-5-5";

type Ids = { environment: string; agents: { reader: string; lead: string; auditor: string } };

type Segment = { label: string; countries: string[]; cities: string[]; verticals: string[] };

/** Los tres tercios: lo que ya vende la prospección por correo, el sur donde corren los anuncios, y Bolivia. */
const SEGMENTS: Record<string, Segment> = {
  "mx-co": {
    label: "México y Colombia: clínicas y academias",
    countries: ["México", "Colombia"],
    cities: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Querétaro", "Bogotá", "Medellín", "Cali", "Barranquilla", "Bucaramanga"],
    verticals: ["clínica dental", "clínica estética o dermatología", "academia de idiomas", "academia de danza o música", "instituto de cursos y capacitación"],
  },
  sur: {
    label: "Chile, Uruguay, Venezuela y Paraguay: abogados, estética, clínicas e inmobiliarias",
    countries: ["Chile", "Uruguay", "Venezuela", "Paraguay"],
    cities: ["Santiago", "Viña del Mar", "Concepción", "Montevideo", "Punta del Este", "Caracas", "Valencia", "Maracaibo", "Asunción", "Ciudad del Este"],
    verticals: ["estudio jurídico", "spa o clínica estética", "clínica médica o dental", "inmobiliaria"],
  },
  bo: {
    label: "Bolivia: abogados, estética, clínicas, inmobiliarias y academias",
    countries: ["Bolivia"],
    cities: ["Santa Cruz de la Sierra", "La Paz", "Cochabamba"],
    verticals: ["estudio jurídico", "spa o clínica estética", "clínica médica o dental", "inmobiliaria", "academia de idiomas o cursos"],
  },
};

const client = new Anthropic();

const usd = (cents: string | number | undefined | null) => `$${(Number(cents ?? 0) / 100).toFixed(2)}`;
const cents = (dollars: number) => String(Math.round(dollars * 100));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

async function readIds(): Promise<Ids> {
  if (!existsSync(IDS_FILE)) throw new Error("No hay agents/ids.json: corre primero `pnpm agents setup --allow-unrestricted-network`.");
  return JSON.parse(await readFile(IDS_FILE, "utf8")) as Ids;
}

const prompt = (path: string) => readFile(join(AGENTS_DIR, path), "utf8");

// ─── setup ─────────────────────────────────────────────────────

async function setup(allowUnrestricted: boolean) {
  if (!allowUnrestricted) {
    throw new Error(
      "El motor de leads lee webs de negocios que no se conocen de antemano, así que el sandbox necesita red sin restricción " +
        "(con red limitada, web_search y web_fetch no devuelven nada). El sandbox no guarda ningún secreto. " +
        "Si estás de acuerdo, repite con --allow-unrestricted-network.",
    );
  }
  const prev = existsSync(IDS_FILE) ? await readIds() : null;

  const envConfig = { name: "allok-research", config: { type: "cloud" as const, networking: { type: "unrestricted" as const } } };
  const environment = prev ? await client.beta.environments.update(prev.environment, envConfig) : await client.beta.environments.create(envConfig);

  const reader = {
    name: "Web researcher",
    description:
      "Low-cost web researcher for ONE cell of a lead list (one city × one vertical). Give it the city, country, vertical, how many candidates to return, the domains to skip, the output .jsonl path and the fields to write. It searches, opens each business's own website, and writes accepted and rejected candidates with source URLs.",
    model: { id: READER_MODEL, effort: "medium" as const },
    system: await prompt("lead-engine/reader.md"),
    tools: [
      {
        type: "agent_toolset_20260401" as const,
        default_config: { enabled: false, permission_policy: { type: "auto" as const } },
        configs: (["web_search", "web_fetch", "read", "write", "bash"] as const).map((name) => ({ name, enabled: true })),
      },
    ],
    metadata: { app: "allok", role: "lead-reader" },
  };
  const readerAgent = prev ? await client.beta.agents.update(prev.agents.reader, reader) : await client.beta.agents.create(reader);

  const lead = {
    name: "Lead engine",
    description: "Plans a lead-list run, delegates each city × vertical cell, verifies a sample itself and writes the final CSV. A copy can own one large sub-segment.",
    model: { id: LEAD_MODEL, effort: "medium" as const },
    system: await prompt("lead-engine/lead.md"),
    tools: [{ type: "agent_toolset_20260401" as const, default_config: { enabled: true, permission_policy: { type: "auto" as const } } }],
    multiagent: {
      type: "multiagent_20261001" as const,
      subagents: { type: "enabled" as const, predefined_agents: [readerAgent.id, { type: "self" as const }], inline_agents: { type: "disabled" as const } },
      workflows: { type: "enabled" as const, predefined_agents: [readerAgent.id], inline_agents: { type: "disabled" as const } },
    },
    metadata: { app: "allok", role: "lead-engine" },
  };
  const leadAgent = prev ? await client.beta.agents.update(prev.agents.lead, lead) : await client.beta.agents.create(lead);

  const auditor = {
    name: "Ops auditor",
    description: "Audits allok.fun and its sending domain from the outside and writes a prioritized fix list.",
    model: { id: LEAD_MODEL, effort: "medium" as const },
    system: await prompt("ops-audit/auditor.md"),
    tools: [{ type: "agent_toolset_20260401" as const, default_config: { enabled: true, permission_policy: { type: "auto" as const } } }],
    metadata: { app: "allok", role: "ops-auditor" },
  };
  const auditorAgent = prev ? await client.beta.agents.update(prev.agents.auditor, auditor) : await client.beta.agents.create(auditor);

  const ids: Ids = { environment: environment.id, agents: { reader: readerAgent.id, lead: leadAgent.id, auditor: auditorAgent.id } };
  await writeFile(IDS_FILE, JSON.stringify(ids, null, 2) + "\n");
  console.log(`${prev ? "Actualizados" : "Creados"}: entorno ${environment.id}`);
  console.log(`  Web researcher ${readerAgent.id} v${readerAgent.version} (${READER_MODEL})`);
  console.log(`  Lead engine    ${leadAgent.id} v${leadAgent.version} (${LEAD_MODEL})`);
  console.log(`  Ops auditor    ${auditorAgent.id} v${auditorAgent.version} (${LEAD_MODEL})`);
  console.log("IDs en agents/ids.json.");
}

// ─── esperar a la sesión ──────────────────────────────────────

type StopReason = { type: string };

/** Rechaza las llamadas que el modo `auto` dejó esperando: nadie está mirando para aprobarlas. */
async function denyPending(sessionId: string, eventIds: string[]) {
  if (!eventIds.length) return;
  console.log(`  ⚠ ${eventIds.length} llamada(s) pidieron aprobación; se rechazan (corrida desatendida).`);
  await client.beta.sessions.events.send(sessionId, {
    events: eventIds.map((id) => ({ type: "user.tool_confirmation" as const, tool_use_id: id, result: "deny" as const })),
  });
}

/** El último `session.status_idle`, o null si la sesión nunca quedó en espera. */
async function lastIdle(sessionId: string) {
  for await (const event of client.beta.sessions.events.list(sessionId, { order: "desc", types: ["session.status_idle"] })) {
    if (event.type === "session.status_idle") return event;
  }
  return null;
}

/**
 * Sigue la sesión hasta que termina su trabajo. El stream no repite eventos al
 * reconectar, así que tras cada (re)conexión se mira el estado real antes de
 * seguir escuchando.
 */
async function waitForSession(sessionId: string): Promise<StopReason> {
  let lastCost = "";
  for (let attempt = 0; ; attempt++) {
    try {
      const stream = await client.beta.sessions.events.stream(sessionId);
      const now = await client.beta.sessions.retrieve(sessionId);
      if (now.status === "terminated") return { type: "terminated" };
      if (now.status === "idle") {
        const idle = await lastIdle(sessionId);
        if (idle && idle.stop_reason.type !== "requires_action") return idle.stop_reason;
        if (idle?.stop_reason.type === "requires_action") await denyPending(sessionId, idle.stop_reason.event_ids);
      }
      for await (const event of stream) {
        switch (event.type) {
          case "agent.message": {
            const text = event.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
            if (text) console.log(`  · ${text.replace(/\s+/g, " ").slice(0, 220)}`);
            break;
          }
          case "session.thread_created":
            console.log("  → nuevo hilo de investigación");
            break;
          case "workflow_run.created":
            console.log("  → corrida en paralelo (workflow) iniciada");
            break;
          case "span.outcome_evaluation_end":
            console.log(`  ✓ evaluación ${event.iteration + 1}: ${event.result} — ${String(event.explanation ?? "").slice(0, 300)}`);
            break;
          case "session.usage": {
            const cost = usd(event.usage?.list_cost?.amount);
            if (cost !== lastCost) {
              lastCost = cost;
              console.log(`  $ ${cost} hasta ahora`);
            }
            break;
          }
          case "session.status_idle":
            if (event.stop_reason.type === "requires_action") {
              await denyPending(sessionId, event.stop_reason.event_ids);
              break;
            }
            return event.stop_reason;
          case "session.status_terminated":
            return { type: "terminated" };
        }
      }
    } catch (error) {
      console.warn(`  (stream cortado: ${(error as Error).message}; reconectando)`);
    }
    await sleep(Math.min(30_000, 2_000 * (attempt + 1)));
  }
}

// ─── resultados ───────────────────────────────────────────────

async function download(sessionId: string, outDir: string): Promise<string[]> {
  await mkdir(outDir, { recursive: true });
  for (let attempt = 0; attempt < 5; attempt++) {
    const names: string[] = [];
    for await (const f of client.beta.files.list({ scope_id: sessionId, betas: ["managed-agents-2026-04-01"] })) {
      // Lo que subimos nosotros (exclude.txt) también aparece aquí y la API no deja bajarlo.
      if (f.downloadable === false || f.filename === "exclude.txt") continue;
      const res = await client.beta.files.download(f.id);
      await writeFile(join(outDir, f.filename), Buffer.from(await res.arrayBuffer()));
      names.push(f.filename);
    }
    if (names.length) return names;
    await sleep(3_000);
  }
  return [];
}

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Pasa `leads.csv` por el mismo filtro que /ops/outreach y escribe `importable.csv`. */
async function checkLeads(outDir: string): Promise<number> {
  const file = join(outDir, "leads.csv");
  if (!existsSync(file)) {
    console.log("No llegó leads.csv.");
    return 0;
  }
  const raw = await readFile(file, "utf8");
  const [header, ...rows] = parseCsv(raw);
  const { leads, skipped } = outreachLeadsFromCsv(raw);
  const ok = new Set(leads.map((l) => l.email));
  const emailCol = (header ?? []).findIndex((h) => h.trim().toLowerCase() === "email");
  const keep = rows.filter((r) => emailCol >= 0 && ok.has((r[emailCol] ?? "").trim().toLowerCase()));
  await writeFile(join(outDir, "importable.csv"), [header ?? [], ...keep].map((r) => r.map(csvCell).join(",")).join("\n") + "\n");

  console.log(`\n${rows.length} filas entregadas, ${keep.length} pasan el filtro de /ops/outreach.`);
  const reasons = new Map<string, number>();
  for (const s of skipped) reasons.set(s.reason, (reasons.get(s.reason) ?? 0) + 1);
  for (const [reason, n] of reasons) console.log(`  - ${n} fuera: ${reason}`);
  return keep.length;
}

async function logRun(entry: Record<string, unknown>) {
  await mkdir(LEADS_DIR, { recursive: true });
  await appendFile(RUNS_FILE, JSON.stringify({ at: new Date().toISOString(), ...entry }) + "\n");
}

async function finish(sessionId: string, kind: string, outDir: string, stop: StopReason) {
  const session = await client.beta.sessions.retrieve(sessionId);
  const spent = session.usage.list_cost?.amount;
  if (stop.type === "budget_reached") {
    console.log(`\nLa sesión llegó a su tope (${usd(session.budget?.max_list_cost.amount)}) y quedó en pausa con su trabajo intacto.`);
    console.log(`Para que termine: pnpm agents raise ${sessionId} --budget <nuevo tope en USD>`);
  } else if (stop.type !== "end_turn") {
    console.log(`\nLa sesión se detuvo: ${stop.type}.`);
  }
  const files = await download(sessionId, outDir);
  console.log(`\nArchivos en ${outDir}: ${files.join(", ") || "(ninguno todavía)"}`);
  const importable = kind === "leads" ? await checkLeads(outDir) : 0;
  console.log(`Costo de la sesión (precio de lista): ${usd(spent)}${importable ? ` · ${usd(Number(spent ?? 0) / importable)} por lead importable` : ""}`);
  console.log(`Transcripción: https://platform.claude.com/workspaces/default/sessions/${sessionId}`);
  await logRun({ session: sessionId, kind, stop: stop.type, cost_cents: Number(spent ?? 0), importable, outDir });
}

// ─── leads ────────────────────────────────────────────────────

/** Los dominios ya trabajados: corridas anteriores y, si se da, un CSV exportado de /ops/outreach. */
async function excludedDomains(extraCsv?: string): Promise<string[]> {
  const domains = new Set<string>();
  const addFromCsv = (raw: string) => {
    const [header, ...rows] = parseCsv(raw);
    const col = (header ?? []).findIndex((h) => /^(website|web|sitio|url|dominio|domain)$/i.test(h.trim()));
    if (col < 0) return;
    for (const r of rows) {
      const host = hostOf(r[col] ?? "");
      if (host) domains.add(host);
    }
  };
  if (existsSync(LEADS_DIR)) {
    for (const dir of await readdir(LEADS_DIR, { withFileTypes: true })) {
      const file = join(LEADS_DIR, dir.name, "leads.csv");
      if (dir.isDirectory() && existsSync(file)) addFromCsv(await readFile(file, "utf8"));
    }
  }
  if (extraCsv) addFromCsv(await readFile(extraCsv, "utf8"));
  return [...domains].sort();
}

async function leads(opts: { segment: string; count: number; budget: number; exclude?: string; print: boolean }) {
  const seg = SEGMENTS[opts.segment];
  if (!seg) throw new Error(`Segmento desconocido. Usa: ${Object.keys(SEGMENTS).join(", ")}`);
  if (!(opts.count > 0 && opts.count <= 150)) throw new Error("--count entre 1 y 150.");
  if (!(opts.budget > 0 && opts.budget <= 60)) throw new Error("--budget en USD, entre 0 y 60.");

  const domains = await excludedDomains(opts.exclude);
  const rubric = (await prompt("lead-engine/rubric.md"))
    .replaceAll("{{SEGMENT}}", seg.label)
    .replaceAll("{{COUNT}}", String(opts.count))
    .replaceAll("{{MIN}}", String(Math.ceil(opts.count * 0.8)))
    .replaceAll("{{MAX}}", String(opts.count + 5))
    .replaceAll("{{COUNTRIES}}", seg.countries.join(", "))
    .replaceAll("{{MIN_VERTICALS}}", String(Math.min(3, seg.verticals.length)));
  const description = [
    `Build a verified lead list for allok: ${opts.count} businesses, segment "${seg.label}".`,
    `Countries: ${seg.countries.join(", ")}.`,
    `Cities: ${seg.cities.join(", ")}.`,
    `Verticals: ${seg.verticals.join("; ")}.`,
    domains.length
      ? `Skip the ${domains.length} domains listed in /mnt/session/uploads/exclude.txt (already worked).`
      : "There is no exclusion list for this run.",
    "Write the deliverables to /mnt/session/outputs/ exactly as your system prompt describes.",
  ].join("\n");

  if (opts.print) {
    console.log(`${description}\n\n${rubric}\nTope: $${opts.budget}. Dominios excluidos: ${domains.length}.`);
    return;
  }

  const ids = await readIds();
  const resources = [];
  if (domains.length) {
    const file = await client.beta.files.upload({ file: await toFile(Buffer.from(domains.join("\n") + "\n"), "exclude.txt") });
    resources.push({ type: "file" as const, file_id: file.id, mount_path: "/exclude.txt" });
  }
  const session = await client.beta.sessions.create({
    agent: ids.agents.lead,
    environment_id: ids.environment,
    title: `Leads ${opts.segment} ×${opts.count}`,
    metadata: { app: "allok", kind: "leads", segment: opts.segment },
    budget: { type: "limit", max_list_cost: { amount: cents(opts.budget), currency: "USD" } },
    resources,
    initial_events: [{ type: "user.define_outcome", description, rubric: { type: "text", content: rubric }, max_iterations: 3 }],
  });
  console.log(`Sesión ${session.id}: ${opts.count} leads de «${seg.label}», tope $${opts.budget}.`);
  console.log(`Mírala en vivo: https://platform.claude.com/workspaces/default/sessions/${session.id}\n`);
  await logRun({ session: session.id, kind: "leads", segment: opts.segment, count: opts.count, budget: opts.budget, started: true });

  const stop = await waitForSession(session.id);
  await finish(session.id, "leads", join(LEADS_DIR, `${today()}-${opts.segment}-${session.id.slice(-8)}`), stop);
}

// ─── auditoría ────────────────────────────────────────────────

async function audit(budget: number) {
  const ids = await readIds();
  const session = await client.beta.sessions.create({
    agent: ids.agents.auditor,
    environment_id: ids.environment,
    title: "Auditoría externa allok.fun",
    metadata: { app: "allok", kind: "audit" },
    budget: { type: "limit", max_list_cost: { amount: cents(budget), currency: "USD" } },
    initial_events: [
      {
        type: "user.define_outcome",
        description: "Audit allok.fun and hola.allok.fun from the outside as your system prompt describes and write /mnt/session/outputs/audit.md.",
        rubric: { type: "text", content: await prompt("ops-audit/rubric.md") },
        max_iterations: 2,
      },
    ],
  });
  console.log(`Sesión ${session.id}: auditoría, tope $${budget}.`);
  await logRun({ session: session.id, kind: "audit", budget, started: true });
  const stop = await waitForSession(session.id);
  await finish(session.id, "audit", join(AUDITS_DIR, today()), stop);
}

// ─── fetch / raise / cost ─────────────────────────────────────

async function fetchSession(sessionId: string) {
  const session = await client.beta.sessions.retrieve(sessionId);
  const kind = String(session.metadata?.kind ?? "leads");
  const segment = String(session.metadata?.segment ?? "manual");
  const stop = await waitForSession(sessionId);
  const outDir = kind === "audit" ? join(AUDITS_DIR, today()) : join(LEADS_DIR, `${today()}-${segment}-${sessionId.slice(-8)}`);
  await finish(sessionId, kind, outDir, stop);
}

async function raise(sessionId: string, budget: number) {
  await client.beta.sessions.update(sessionId, { budget: { type: "limit", max_list_cost: { amount: cents(budget), currency: "USD" } } });
  console.log(`Tope de ${sessionId} subido a $${budget}; la sesión sigue sola. Síguela con: pnpm agents fetch ${sessionId}`);
}

/** Sesión pausada en su tope con trabajo verificado adentro: corta la búsqueda y pide los archivos con lo que hay. */
async function wrap(sessionId: string, budget: number) {
  // Con la sesión en su tope solo se acepta el interrupt; el mensaje va después de subir el tope.
  await client.beta.sessions.events.send(sessionId, { events: [{ type: "user.interrupt" }] });
  await raise(sessionId, budget);
  await client.beta.sessions.events.send(sessionId, {
    events: [
      {
        type: "user.message",
        content: [
          {
            type: "text",
            text: "The budget is almost spent. Stop all research now: do not start new threads or workflows. Write the deliverables to /mnt/session/outputs/ exactly as your system prompt describes, using only the rows you have already verified, even if that is below the target count. Say the shortfall in summary.md.",
          },
        ],
      },
    ],
  });
}

async function cost() {
  if (!existsSync(RUNS_FILE)) return console.log("Todavía no hay corridas.");
  const sessions = new Set(
    (await readFile(RUNS_FILE, "utf8"))
      .split("\n")
      .filter(Boolean)
      .map((l) => (JSON.parse(l) as { session: string }).session),
  );
  let total = 0;
  for (const id of sessions) {
    const s = await client.beta.sessions.retrieve(id);
    const c = Number(s.usage.list_cost?.amount ?? 0);
    total += c;
    console.log(`${id}  ${s.title ?? ""}  ${s.status}  ${usd(c)}`);
  }
  console.log(`Total (precio de lista, sin contar los batches de contenido): ${usd(total)}`);
}

// ─── main ─────────────────────────────────────────────────────

const [command, ...rest] = process.argv.slice(2);
const { values, positionals } = parseArgs({
  args: rest,
  allowPositionals: true,
  options: {
    segment: { type: "string" },
    count: { type: "string", default: "10" },
    budget: { type: "string" },
    exclude: { type: "string" },
    print: { type: "boolean", default: false },
    "allow-unrestricted-network": { type: "boolean", default: false },
  },
});

async function main() {
  const budget = Number(values.budget);
  switch (command) {
    case "setup":
      return setup(values["allow-unrestricted-network"] ?? false);
    case "leads":
      if (!values.segment) throw new Error(`Falta --segment (${Object.keys(SEGMENTS).join(", ")}).`);
      return leads({ segment: values.segment, count: Number(values.count), budget: values.budget ? budget : 6, exclude: values.exclude, print: values.print ?? false });
    case "audit":
      return audit(values.budget ? budget : 8);
    case "fetch":
      if (!positionals[0]) throw new Error("Uso: pnpm agents fetch <session_id>");
      return fetchSession(positionals[0]);
    case "raise":
      if (!positionals[0] || !values.budget) throw new Error("Uso: pnpm agents raise <session_id> --budget <USD>");
      return raise(positionals[0], budget);
    case "wrap":
      if (!positionals[0] || !values.budget) throw new Error("Uso: pnpm agents wrap <session_id> --budget <USD>");
      return wrap(positionals[0], budget);
    case "cost":
      return cost();
    default:
      throw new Error("Comandos: setup, leads, audit, fetch, raise, cost. Ver el encabezado de scripts/agents.ts.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
