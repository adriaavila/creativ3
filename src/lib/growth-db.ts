import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type {
  DraftStatus,
  GrowthLead,
  GrowthRun,
  LeadStatus,
  OutreachDraft,
  PublicAgentEvent,
} from "@/lib/growth-types";
import { type AgentState, type CaptureStage, type CapturedRow, followupFor } from "@/lib/ops-capture";
import { capturedLeadId } from "@/lib/ops-capture-server";
import { addDays, waDigits } from "@/lib/sales-queue";
export { DAILY_INVITE_CAP } from "@/lib/sales-queue";

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
      business_phone, contact_source_url,
      evidence, source_urls, problem_detected, offer_angle, lead_score, status,
      next_action, next_action_at, close_probability, potential_value, last_contacted_at,
      created_at, run_id, to_jsonb(leads) -> 'agent_state' AS agent_state
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
    businessPhone: row.business_phone ? String(row.business_phone) : null,
    contactSourceUrl: row.contact_source_url ? String(row.contact_source_url) : null,
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
    runId: row.run_id ? String(row.run_id) : null,
    agentState: (row.agent_state as AgentState | null) ?? null,
  }));
}

export async function getGrowthLeadById(id: string): Promise<GrowthLead | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = await sql`
    SELECT id, business_name, vertical, location, website_url, instagram_url,
      business_phone, contact_source_url,
      evidence, source_urls, problem_detected, offer_angle, lead_score, status,
      next_action, next_action_at, close_probability, potential_value, last_contacted_at,
      created_at, run_id, to_jsonb(leads) -> 'agent_state' AS agent_state
    FROM leads
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    businessName: String(row.business_name),
    vertical: String(row.vertical),
    location: String(row.location),
    websiteUrl: row.website_url ? String(row.website_url) : null,
    instagramUrl: row.instagram_url ? String(row.instagram_url) : null,
    businessPhone: row.business_phone ? String(row.business_phone) : null,
    contactSourceUrl: row.contact_source_url ? String(row.contact_source_url) : null,
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
    runId: row.run_id ? String(row.run_id) : null,
    agentState: (row.agent_state as AgentState | null) ?? null,
  };
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

export async function getOutreachDraftById(id: string): Promise<OutreachDraft | null> {
  const sql = getSql();
  if (!sql) return null;
  const [row] = await sql`
    SELECT id, lead_id, channel, kind, content, status, updated_at
    FROM outreach_drafts
    WHERE id = ${id}
    LIMIT 1
  `;
  return row ? {
    id: String(row.id),
    leadId: String(row.lead_id),
    channel: row.channel as OutreachDraft["channel"],
    kind: (row.kind as OutreachDraft["kind"]) ?? "dm",
    content: String(row.content),
    status: row.status as DraftStatus,
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  } : null;
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

/**
 * Un lead que Adrian carga a mano desde `/ops`. El `id` lo genera el cliente:
 * un doble toque o un reintento no duplica la fila, y un reintento con un dato
 * corregido lo corrige (sólo mientras el lead manual siga sin tocar).
 */
export async function createManualLead(input: {
  id: string;
  businessName: string;
  businessPhone: string | null;
  source: string;
  offer: string;
  note: string;
  today: string;
}) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  await sql`
    INSERT INTO leads (id, business_name, vertical, evidence, problem_detected, offer_angle, lead_score,
      status, business_phone, next_action, next_action_at)
    VALUES (${input.id}, ${input.businessName}, 'Manual', ${`Fuente: ${input.source}`}, ${input.note}, ${input.offer}, 5,
      'new', ${input.businessPhone}, 'Primer contacto', ${input.today}::date)
    ON CONFLICT (id) DO UPDATE
      SET business_name = EXCLUDED.business_name, business_phone = EXCLUDED.business_phone,
          evidence = EXCLUDED.evidence, offer_angle = EXCLUDED.offer_angle,
          problem_detected = EXCLUDED.problem_detected, updated_at = now()
      WHERE leads.vertical = 'Manual' AND leads.status = 'new'
  `;
}

/** «Qué pasó»: estado, próximo paso y último contacto en una sola escritura. */
export async function logLeadOutcome(
  id: string,
  patch: { status: LeadStatus; nextAction: string | null; nextActionAt: string | null },
) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const rows = await sql`
    UPDATE leads
    SET status = ${patch.status}, next_action = ${patch.nextAction}, next_action_at = ${patch.nextActionAt}::date,
        last_contacted_at = now(), updated_at = now()
    WHERE id = ${id}
    RETURNING last_contacted_at
  `;
  return rows[0] ? new Date(String(rows[0].last_contacted_at)).toISOString() : null;
}

export async function updateLeadFields(
  id: string,
  input: {
    nextAction?: string | null;
    nextActionAt?: string | null;
    closeProbability?: number | null;
    potentialValue?: number | null;
    businessPhone?: string | null;
    contactSourceUrl?: string | null;
  },
) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const nextAction = input.nextAction === undefined ? null : input.nextAction;
  const nextActionAt = input.nextActionAt === undefined ? null : input.nextActionAt;
  const closeProbability = input.closeProbability === undefined ? null : input.closeProbability;
  const potentialValue = input.potentialValue === undefined ? null : input.potentialValue;
  const businessPhone = input.businessPhone === undefined ? null : input.businessPhone;
  const contactSourceUrl = input.contactSourceUrl === undefined ? null : input.contactSourceUrl;
  await sql`
    UPDATE leads
    SET next_action = CASE WHEN ${input.nextAction === undefined} THEN next_action ELSE ${nextAction} END,
        next_action_at = CASE WHEN ${input.nextActionAt === undefined} THEN next_action_at ELSE ${nextActionAt}::date END,
        close_probability = CASE WHEN ${input.closeProbability === undefined} THEN close_probability ELSE ${closeProbability} END,
        potential_value = CASE WHEN ${input.potentialValue === undefined} THEN potential_value ELSE ${potentialValue} END,
        business_phone = CASE WHEN ${input.businessPhone === undefined} THEN business_phone ELSE ${businessPhone} END,
        contact_source_url = CASE WHEN ${input.contactSourceUrl === undefined} THEN contact_source_url ELSE ${contactSourceUrl} END,
        updated_at = now()
    WHERE id = ${id}
  `;
}

export async function createGrowthOutreachAttempt(input: {
  actionId: string;
  leadId: string;
  recipient: string;
  content: string;
  sentBy: string;
  channelKind?: "cloud_api" | "waha";
}) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const rows = await sql`
    INSERT INTO growth_outreach_messages (
      client_action_id, lead_id, recipient, content, sent_by, channel_kind
    ) VALUES (
      ${input.actionId}, ${input.leadId}, ${input.recipient}, ${input.content},
      ${input.sentBy}, ${input.channelKind ?? null}
    )
    ON CONFLICT (client_action_id) WHERE client_action_id IS NOT NULL DO NOTHING
    RETURNING id, status
  `;
  if (rows[0]) return { id: String(rows[0].id), status: String(rows[0].status), created: true };
  const [existing] = await sql`
    SELECT id, status FROM growth_outreach_messages WHERE client_action_id = ${input.actionId}
  `;
  if (!existing) throw new Error("No se pudo recuperar el intento de outreach persistido.");
  return { id: String(existing.id), status: String(existing.status), created: false };
}

export async function hasRecentSentGrowthOutreach(recipient: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const [row] = await sql`
    SELECT EXISTS (
      SELECT 1 FROM growth_outreach_messages
      WHERE status = 'sent'
        AND regexp_replace(recipient, '\\D', '', 'g') = regexp_replace(${recipient}, '\\D', '', 'g')
        AND sent_at >= now() - interval '24 hours'
    ) AS blocked
  `;
  return row?.blocked === true;
}

export async function completeGrowthOutreachAttempt(
  id: string,
  input: {
    status: "sent" | "failed" | "unknown";
    providerMessageId?: string;
    conversationId?: number;
    channelKind?: "cloud_api" | "waha";
    error?: string;
  },
) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  await sql`
    UPDATE growth_outreach_messages
    SET status = ${input.status},
        provider_message_id = ${input.providerMessageId ?? null},
        conversation_id = COALESCE(${input.conversationId ?? null}, conversation_id),
        channel_kind = COALESCE(${input.channelKind ?? null}, channel_kind),
        error = ${input.error?.slice(0, 800) ?? null},
        sent_at = CASE WHEN ${input.status} = 'sent' THEN now() ELSE sent_at END
    WHERE id = ${id} AND status = 'pending'
  `;
}

const SOURCE_LABEL: Record<CapturedRow["source"], string> = {
  anuncio: "anuncio",
  web: "web",
  invitacion: "invitación",
  whatsapp: "WhatsApp",
};

/**
 * Un lead que llegó solo desde Vocero, ya filtrado. Si el teléfono ya existe
 * (un negocio invitado desde Growth o cargado a mano) se actualiza esa misma
 * fila; si no, la fila nace con un id que sale de la conversación, así que
 * repetir el lote no duplica nada. Lo que decide la cola sale de
 * `followupFor`, y lo que Adrian marcó con «Qué pasó» sigue mandando.
 * Devuelve el id y si la fila es nueva.
 */
export async function upsertCapturedLead(row: CapturedRow, now = new Date()) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const id = capturedLeadId(row.conversationId);
  const digits = waDigits(row.phone) ?? row.phone.replace(/\D/g, "");
  const tail = digits.slice(-10);

  const found = await sql`
    SELECT id, status, next_action, next_action_at, last_contacted_at, to_jsonb(leads) -> 'agent_state' AS agent_state
    FROM leads
    WHERE id = ${id} OR right(regexp_replace(coalesce(business_phone, ''), '\\D', '', 'g'), 10) = ${tail}
    ORDER BY (id = ${id}) DESC, created_at DESC
    LIMIT 1
  `;
  const existing = found[0];
  const prevState = (existing?.agent_state as AgentState | null) ?? null;
  const patch = followupFor(
    row,
    existing
      ? {
          status: String(existing.status),
          nextAction: existing.next_action ? String(existing.next_action) : null,
          nextActionAt: existing.next_action_at ? new Date(String(existing.next_action_at)).toISOString().slice(0, 10) : null,
          lastContactedAt: existing.last_contacted_at ? new Date(String(existing.last_contacted_at)).toISOString() : null,
          step: prevState?.step ?? 0,
        }
      : null,
    now,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- el teléfono vive en `business_phone`, no en el estado
  const { phone: _phone, ...fromVocero } = row;
  const stage: CaptureStage =
    patch.stage === "asked" || patch.stage === "closed" ? (prevState?.stage ?? "followup") : patch.stage;
  // Un número que ya estaba en /ops (invitado desde Growth o cargado a mano) volvió por el agente.
  const invited = existing && String(existing.id) !== id && row.source !== "anuncio";
  const agentState: AgentState = {
    ...fromVocero,
    source: invited ? "invitacion" : row.source,
    stage,
    step: patch.step,
    computedAt: now.toISOString(),
  };
  const state = JSON.stringify(agentState);
  const lastContactedAt = patch.lastContactedAt;

  if (existing) {
    await sql`
      UPDATE leads
      SET status = ${patch.status}, next_action = ${patch.nextAction}, next_action_at = ${patch.nextActionAt}::date,
          last_contacted_at = ${lastContactedAt}, agent_state = ${state}::jsonb,
          business_phone = coalesce(business_phone, ${digits}), contact_source_url = coalesce(contact_source_url, ${row.crmUrl}),
          updated_at = now()
      WHERE id = ${String(existing.id)}
    `;
    return { id: String(existing.id), created: false };
  }

  const source = row.source === "anuncio" && row.adHeadline ? `anuncio "${row.adHeadline}"` : SOURCE_LABEL[row.source];
  await sql`
    INSERT INTO leads (id, business_name, vertical, evidence, problem_detected, offer_angle, lead_score, status,
      business_phone, contact_source_url, next_action, next_action_at, last_contacted_at, agent_state)
    VALUES (${id}, ${row.name?.trim() || `Sin nombre ·${digits.slice(-4)}`}, ${row.rubro?.trim() || "WhatsApp"},
      ${`Fuente: ${source}`}, ${row.dolor?.trim() || row.firstMessage?.trim() || ""}, 'vocero', ${row.calificado ? 8 : 6},
      ${patch.status}, ${digits}, ${row.crmUrl}, ${patch.nextAction}, ${patch.nextActionAt}::date, ${lastContactedAt},
      ${state}::jsonb)
    ON CONFLICT (id) DO NOTHING
  `;
  return { id, created: true };
}

/** Invitaciones y seguimientos de Growth anotados hoy (día de Caracas). */
export async function countInvitesToday(): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;
  const [row] = await sql`
    SELECT count(*)::int AS total FROM growth_outreach_messages
    WHERE (created_at AT TIME ZONE 'America/Caracas')::date = (now() AT TIME ZONE 'America/Caracas')::date
  `;
  return Number(row?.total ?? 0);
}

/** ¿Ya se anotó este borrador? Un «Abrir otra vez» no cuenta contra el tope. */
export async function inviteAlreadyLogged(draftId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = await sql`SELECT 1 FROM growth_outreach_messages WHERE client_action_id = ${draftId} LIMIT 1`;
  return rows.length > 0;
}

const INVITE_NEXT: Record<"dm" | "followup_1" | "followup_2", { action: string; days: number | null }> = {
  dm: { action: "Seguimiento 1 de la invitación", days: 2 },
  followup_1: { action: "Seguimiento 2 de la invitación", days: 3 },
  followup_2: { action: "Invitación sin respuesta", days: null },
};

/**
 * Adrian abrió WhatsApp con el borrador para mandarlo desde su teléfono: queda
 * anotado (auditoría en `growth_outreach_messages`, con el id del borrador como
 * llave, así que un doble toque no cuenta dos veces), el lead pasa a contactado
 * y el siguiente seguimiento queda con fecha. Todo en una transacción.
 */
export async function logInvite(input: {
  draftId: string;
  leadId: string;
  kind: "dm" | "followup_1" | "followup_2";
  recipient: string;
  content: string;
  sentBy: string;
  today: string;
}) {
  const sql = getSql();
  if (!sql) throw new Error("DATABASE_URL is not configured");
  const next = INVITE_NEXT[input.kind];
  const nextActionAt = next.days === null ? null : addDays(input.today, next.days);
  const rows = await sql.transaction([
    sql`
      UPDATE outreach_drafts SET content = ${input.content}, status = 'approved', reviewed_by = ${input.sentBy},
        reviewed_at = now(), updated_at = now()
      WHERE id = ${input.draftId}
    `,
    sql`
      WITH logged AS (
        INSERT INTO growth_outreach_messages (lead_id, channel, recipient, content, status, sent_by, sent_at, client_action_id)
        VALUES (${input.leadId}, 'whatsapp', ${input.recipient}, ${input.content}, 'sent', ${input.sentBy}, now(), ${input.draftId})
        ON CONFLICT (client_action_id) WHERE client_action_id IS NOT NULL DO NOTHING
        RETURNING lead_id
      )
      UPDATE leads
      SET status = CASE WHEN status IN ('new', 'researched', 'drafted', 'approved') THEN 'contacted' ELSE status END,
          last_contacted_at = now(), next_action = ${next.action}, next_action_at = ${nextActionAt}::date, updated_at = now()
      WHERE id = ${input.leadId}
        AND EXISTS (SELECT 1 FROM logged)
        -- Si ya entró por el agente, su próximo paso lo decide Hoy, no la invitación.
        AND ((to_jsonb(leads) -> 'agent_state') IS NULL OR (to_jsonb(leads) -> 'agent_state') = 'null'::jsonb)
      RETURNING id
    `,
  ]);
  const logged = rows[1].length > 0;
  return { logged, nextAction: next.action, nextActionAt };
}
