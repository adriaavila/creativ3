import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type {
  DraftStatus,
  GrowthLead,
  GrowthRun,
  LeadStatus,
  OutreachDraft,
  PublicAgentEvent,
} from "@/lib/growth-types";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function isGrowthDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

const DEMO_EVENTS: PublicAgentEvent[] = [
  {
    id: "demo-research",
    agent: "Research Agent",
    action: "Analizó señales comerciales",
    detail: "Clínicas y servicios con WhatsApp visible en Caracas",
    createdAt: new Date().toISOString(),
    isDemo: true,
  },
  {
    id: "demo-proposal",
    agent: "Proposal Agent",
    action: "Preparó una ruta de mejora",
    detail: "Landing de captación + seguimiento asistido",
    createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    isDemo: true,
  },
  {
    id: "demo-operator",
    agent: "Project Operator",
    action: "Priorizó un cuello de botella",
    detail: "Eliminar doble carga entre formularios y hojas de cálculo",
    createdAt: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    isDemo: true,
  },
];

export async function getPublicAgentEvents(limit = 5): Promise<PublicAgentEvent[]> {
  const sql = getSql();
  if (!sql) return DEMO_EVENTS.slice(0, limit);

  try {
    const rows = await sql`
      SELECT id, agent, action, detail, created_at
      FROM public_agent_events
      WHERE is_public = true
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    if (rows.length === 0) return DEMO_EVENTS.slice(0, limit);

    return rows.map((row) => ({
      id: String(row.id),
      agent: row.agent as PublicAgentEvent["agent"],
      action: String(row.action),
      detail: String(row.detail),
      createdAt: new Date(String(row.created_at)).toISOString(),
      isDemo: false,
    }));
  } catch (error) {
    console.error("Could not load public agent events", error);
    return DEMO_EVENTS.slice(0, limit);
  }
}

export async function getGrowthLeads(limit = 50): Promise<GrowthLead[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, business_name, vertical, location, website_url, instagram_url,
      evidence, source_urls, problem_detected, offer_angle, lead_score, status,
      next_action, next_action_at, close_probability, potential_value, last_contacted_at,
      created_at
    FROM leads
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: String(row.id),
    businessName: String(row.business_name),
    vertical: String(row.vertical),
    location: String(row.location),
    websiteUrl: row.website_url ? String(row.website_url) : null,
    instagramUrl: row.instagram_url ? String(row.instagram_url) : null,
    evidence: String(row.evidence),
    sourceUrls: Array.isArray(row.source_urls) ? row.source_urls.map(String) : [],
    problemDetected: String(row.problem_detected),
    offerAngle: String(row.offer_angle),
    leadScore: Number(row.lead_score),
    status: row.status as LeadStatus,
    nextAction: row.next_action ? String(row.next_action) : null,
    nextActionAt: row.next_action_at ? new Date(String(row.next_action_at)).toISOString() : null,
    closeProbability: row.close_probability === null ? null : Number(row.close_probability),
    potentialValue: row.potential_value === null ? null : Number(row.potential_value),
    lastContactedAt: row.last_contacted_at ? new Date(String(row.last_contacted_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function getGrowthLeadById(id: string): Promise<GrowthLead | null> {
  const leads = await getGrowthLeads(200);
  return leads.find((lead) => lead.id === id) ?? null;
}

export async function getGrowthRuns(limit = 20): Promise<GrowthRun[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, status, market, summary, error, leads_requested, created_at
    FROM growth_runs
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({
    id: String(row.id),
    status: row.status as GrowthRun["status"],
    market: String(row.market),
    summary: row.summary ? String(row.summary) : null,
    error: row.error ? String(row.error) : null,
    leadsRequested: Number(row.leads_requested),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function createGrowthRun() {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const [run] = await sql`
    INSERT INTO growth_runs (status, market, leads_requested)
    VALUES ('queued', 'Caracas, Venezuela', 10)
    RETURNING id
  `;
  return String(run.id);
}

export async function failGrowthRun(id: string, error: string) {
  const sql = getSql();
  if (!sql) return;
  await sql`
    UPDATE growth_runs
    SET status = 'failed', error = ${error.slice(0, 800)}, completed_at = now(), updated_at = now()
    WHERE id = ${id}
  `;
}

export async function getOutreachDrafts(limit = 50): Promise<OutreachDraft[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, lead_id, channel, kind, content, status, updated_at
    FROM outreach_drafts
    ORDER BY updated_at DESC
    LIMIT ${limit}
  `;

  return rows.map((row) => ({
    id: String(row.id),
    leadId: String(row.lead_id),
    channel: row.channel as OutreachDraft["channel"],
    kind: (row.kind as OutreachDraft["kind"]) ?? "dm",
    content: String(row.content),
    status: row.status as DraftStatus,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  }));
}

export async function updateDraft(
  id: string,
  input: { content?: string; status?: DraftStatus; reviewedBy?: string },
) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const content = input.content ?? null;
  const status = input.status ?? null;
  const reviewedBy = input.reviewedBy ?? null;
  await sql`
    UPDATE outreach_drafts
    SET content = COALESCE(${content}, content),
        status = COALESCE(${status}, status),
        reviewed_by = COALESCE(${reviewedBy}, reviewed_by),
        reviewed_at = CASE WHEN ${status} IS NULL THEN reviewed_at ELSE now() END,
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  await sql`
    UPDATE leads
    SET status = ${status},
        last_contacted_at = CASE WHEN ${status} = 'contacted' THEN now() ELSE last_contacted_at END,
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function updateLeadFields(
  id: string,
  input: { nextAction?: string | null; closeProbability?: number | null; potentialValue?: number | null },
) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const nextAction = input.nextAction === undefined ? null : input.nextAction;
  const closeProbability = input.closeProbability === undefined ? null : input.closeProbability;
  const potentialValue = input.potentialValue === undefined ? null : input.potentialValue;
  await sql`
    UPDATE leads
    SET next_action = CASE WHEN ${input.nextAction === undefined} THEN next_action ELSE ${nextAction} END,
        close_probability = CASE WHEN ${input.closeProbability === undefined} THEN close_probability ELSE ${closeProbability} END,
        potential_value = CASE WHEN ${input.potentialValue === undefined} THEN potential_value ELSE ${potentialValue} END,
        updated_at = now()
    WHERE id = ${id}
  `;
}
