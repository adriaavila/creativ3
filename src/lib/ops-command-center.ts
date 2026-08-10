export type OpsActionKind = "reply" | "follow_up" | "approval" | "proposal" | "incident";
export type OpsSeverity = "critical" | "high" | "normal";

export type OpsAction = {
  id: string;
  kind: OpsActionKind;
  severity: OpsSeverity;
  title: string;
  reason: string;
  occurredAt: string | null;
  href: string;
  cta: string;
};

export type OpsHealthStatus = "healthy" | "unhealthy" | "unknown";
export type OpsHealth = { id: string; label: string; status: OpsHealthStatus; detail: string };
export type OpsActionSource = { count: number; actions: OpsAction[] };

export type OpsCommandCenter = {
  businessDate: string;
  counts: {
    waitingReplies: number | null;
    dueFollowUps: number | null;
    pendingApprovals: number | null;
    incidents: number | null;
  };
  actions: OpsAction[];
  pulse: { nextStepShare: number | null; citas: number | null; weightedPipeline: number | null };
  health: OpsHealth[];
  sourceErrors: string[];
};

type ProjectionInput = {
  businessDate: string;
  replies?: OpsActionSource;
  followUps?: OpsActionSource;
  approvals?: OpsActionSource;
  incidents?: OpsActionSource;
  pulse: OpsCommandCenter["pulse"];
  health?: OpsHealth[];
  sourceErrors?: string[];
};

const SEVERITY_ORDER: Record<OpsSeverity, number> = { critical: 0, high: 1, normal: 2 };
const KIND_ORDER: Record<OpsActionKind, number> = { incident: 0, reply: 1, follow_up: 2, approval: 3, proposal: 4 };

export function sortOpsActions(actions: OpsAction[]) {
  return [...actions].sort((left, right) =>
    SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
    || KIND_ORDER[left.kind] - KIND_ORDER[right.kind]
    || timestamp(left.occurredAt) - timestamp(right.occurredAt)
    || left.id.localeCompare(right.id));
}

export function projectOpsCommandCenter(input: ProjectionInput, queueLimit = 30): OpsCommandCenter {
  return {
    businessDate: input.businessDate,
    counts: {
      waitingReplies: input.replies?.count ?? null,
      dueFollowUps: input.followUps?.count ?? null,
      pendingApprovals: input.approvals?.count ?? null,
      incidents: input.incidents?.count ?? null,
    },
    actions: sortOpsActions([
      ...(input.incidents?.actions ?? []),
      ...(input.replies?.actions ?? []),
      ...(input.followUps?.actions ?? []),
      ...(input.approvals?.actions ?? []),
    ]).slice(0, queueLimit),
    pulse: input.pulse,
    health: input.health ?? [],
    sourceErrors: input.sourceErrors ?? [],
  };
}

function timestamp(value: string | null) {
  return value ? Date.parse(value) : Number.POSITIVE_INFINITY;
}

export function caracasBusinessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export const inboxConversationUrl = (id: number) => `/ops/inbox?conversation=${encodeURIComponent(id)}`;
export const crmLeadUrl = (id: string) => `/ops/crm?lead=${encodeURIComponent(id)}`;
export const growthDraftUrl = (id: string) => `/ops/growth?tab=drafts&draft=${encodeURIComponent(id)}`;

type GrowthActionRecord = {
  id: string;
  businessName: string;
  status: string;
  nextAction: string | null;
  nextActionAt: string | null;
  lastContactedAt: string | null;
  createdAt: string;
};

export function classifyGrowthAction(
  lead: GrowthActionRecord,
  businessDate: string,
  now = new Date(),
): OpsAction | null {
  if (lead.status === "won" || lead.status === "lost") return null;
  if (lead.status === "replied") {
    return {
      id: `proposal:${lead.id}`,
      kind: "proposal",
      severity: "normal",
      title: `Preparar propuesta para ${lead.businessName}`,
      reason: "El lead respondió con interés y necesita una propuesta.",
      occurredAt: lead.lastContactedAt ?? lead.createdAt,
      href: crmLeadUrl(lead.id),
      cta: "Abrir lead",
    };
  }

  const firstContact = lead.status === "approved" && !lead.lastContactedAt;
  const scheduledDue = Boolean(lead.nextActionAt && lead.nextActionAt.slice(0, 10) <= businessDate);
  const stale = lead.status === "contacted"
    && Boolean(lead.lastContactedAt)
    && now.getTime() - Date.parse(lead.lastContactedAt!) >= 3 * 86_400_000;
  if (!firstContact && !scheduledDue && !stale) return null;

  return {
    id: `follow_up:${lead.id}`,
    kind: "follow_up",
    severity: "high",
    title: firstContact ? `Contactar a ${lead.businessName}` : `Dar seguimiento a ${lead.businessName}`,
    reason: firstContact
      ? "Lead aprobado y todavía sin primer contacto."
      : scheduledDue
        ? lead.nextAction ?? "La siguiente acción ya venció."
        : "Lleva al menos tres días sin respuesta.",
    occurredAt: scheduledDue ? lead.nextActionAt : lead.lastContactedAt ?? lead.createdAt,
    href: crmLeadUrl(lead.id),
    cta: "Abrir lead",
  };
}

export function draftApprovalAction(draft: { id: string; businessName: string; updatedAt: string }): OpsAction {
  return {
    id: `approval:${draft.id}`,
    kind: "approval",
    severity: "normal",
    title: `Revisar borrador de ${draft.businessName}`,
    reason: "El borrador está esperando aprobación humana.",
    occurredAt: draft.updatedAt,
    href: growthDraftUrl(draft.id),
    cta: "Revisar borrador",
  };
}

export async function getOpsCommandCenter(now = new Date()): Promise<OpsCommandCenter> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for Ops.");
  const sql = neon(process.env.DATABASE_URL);
  const businessDate = caracasBusinessDate(now);
  const [replies, growth, approvals, incidents, nextStep, pipeline] = await Promise.allSettled([
    getWaitingReplies(sql),
    getGrowthActions(sql, businessDate, now),
    getPendingApprovals(sql),
    getSystemIncidents(sql),
    getNextStepSummary(),
    getWeightedPipeline(sql),
  ]);

  const sourceErrors: string[] = [];
  const read = <T>(result: PromiseSettledResult<T>, label: string): T | undefined => {
    if (result.status === "fulfilled") return result.value;
    sourceErrors.push(label);
    console.error(`Ops command center source unavailable: ${label}`, result.reason);
    return undefined;
  };
  const replySource = read(replies, "Bandeja");
  const growthSource = read(growth, "Pipeline");
  const approvalSource = read(approvals, "Borradores");
  const incidentSource = read(incidents, "Sistema");
  const nextStepPulse = read(nextStep, "Resultados comerciales");
  const weightedPipeline = read(pipeline, "Pipeline ponderado");

  return projectOpsCommandCenter({
    businessDate,
    replies: replySource,
    followUps: growthSource,
    approvals: approvalSource,
    incidents: incidentSource,
    pulse: {
      nextStepShare: nextStepPulse?.share ?? null,
      citas: nextStepPulse?.citas ?? null,
      weightedPipeline: weightedPipeline?.weightedPipeline ?? null,
    },
    health: [
      health("inbox", "Bandeja", replySource !== undefined, replySource ? `${replySource.count} esperando respuesta` : "No disponible"),
      health("growth", "Growth", growthSource !== undefined && approvalSource !== undefined, growthSource && approvalSource ? `${growthSource.count + approvalSource.count} acciones abiertas` : "No disponible"),
      incidentSource === undefined
        ? { id: "channels", label: "Canales y entregas", status: "unknown", detail: "No disponible" }
        : {
            id: "channels",
            label: "Canales y entregas",
            status: incidentSource.count > 0 || incidentSource.activeConnections === 0 ? "unhealthy" : "healthy",
            detail: incidentSource.activeConnections === 0
              ? "Sin WhatsApp activo"
              : `${incidentSource.activeConnections} canal${incidentSource.activeConnections === 1 ? "" : "es"} activo${incidentSource.activeConnections === 1 ? "" : "s"}`,
          },
    ],
    sourceErrors,
  });
}

function health(id: string, label: string, available: boolean, detail: string): OpsHealth {
  return { id, label, status: available ? "healthy" : "unknown", detail };
}

type Sql = NeonQueryFunction<false, false>;

async function getWaitingReplies(sql: Sql): Promise<OpsActionSource> {
  const [row] = await sql`
    WITH scoped AS (
      SELECT conversation.*,
        regexp_replace(COALESCE(
          CASE WHEN conversation.channel_kind = 'cloud_api' THEN (
            SELECT connection.client FROM whatsapp_connections AS connection
            WHERE connection.phone_number_id = conversation.channel_key
            ORDER BY connection.updated_at DESC LIMIT 1
          ) ELSE (
            SELECT COALESCE(connection.workspace_id, connection.client)
            FROM waha_connections AS connection
            WHERE connection.id = conversation.channel_key OR connection.waha_session_id = conversation.channel_key
            ORDER BY connection.updated_at DESC LIMIT 1
          ) END,
          conversation.channel_kind || ':' || conversation.channel_key
        ), '-ops-owner$', '') AS workspace_key,
        regexp_replace(COALESCE(conversation.contact_phone, conversation.contact_wa_id), '\\D', '', 'g') AS contact_key
      FROM wa_conversations AS conversation
      WHERE conversation.status = 'open'
        AND conversation.assigned_mode = 'human'
        AND conversation.last_inbound_at IS NOT NULL
        AND conversation.last_message_at = conversation.last_inbound_at
        AND conversation.last_inbound_at >= now() - interval '7 days'
    ), waiting AS (
      SELECT DISTINCT ON (workspace_key, contact_key)
        id, contact_name, contact_phone, contact_wa_id, last_inbound_at
      FROM scoped
      ORDER BY workspace_key, contact_key, (channel_kind = 'cloud_api') DESC, last_inbound_at DESC
    ), top AS (
      SELECT * FROM waiting ORDER BY last_inbound_at ASC LIMIT 30
    )
    SELECT (SELECT count(*)::int FROM waiting) AS count,
      COALESCE(jsonb_agg(to_jsonb(top) ORDER BY top.last_inbound_at) FILTER (WHERE top.id IS NOT NULL), '[]'::jsonb) AS actions
    FROM top
  `;
  return {
    count: Number(row?.count ?? 0),
    actions: jsonRows(row?.actions).map((item) => ({
      id: `reply:${item.id}`,
      kind: "reply",
      severity: "high",
      title: `Responder a ${String(item.contact_name || item.contact_phone || "Contacto de WhatsApp")}`,
      reason: "El último mensaje es del cliente y espera respuesta humana.",
      occurredAt: iso(item.last_inbound_at),
      href: inboxConversationUrl(Number(item.id)),
      cta: "Responder",
    })),
  };
}

async function getGrowthActions(sql: Sql, businessDate: string, now: Date): Promise<OpsActionSource> {
  const [row] = await sql`
    WITH actionable AS (
      SELECT id, business_name, status, next_action, next_action_at, last_contacted_at, created_at,
        CASE WHEN status = 'replied' THEN 'proposal' ELSE 'follow_up' END AS action_kind
      FROM leads
      WHERE status NOT IN ('won', 'lost') AND (
        status = 'replied'
        OR (status = 'approved' AND last_contacted_at IS NULL)
        OR (next_action_at IS NOT NULL AND next_action_at <= ${businessDate}::date)
        OR (status = 'contacted' AND last_contacted_at <= ${now.toISOString()}::timestamptz - interval '3 days')
      )
    ), top AS (
      SELECT * FROM actionable
      ORDER BY CASE action_kind WHEN 'follow_up' THEN 0 ELSE 1 END,
        COALESCE(next_action_at::timestamptz, last_contacted_at, created_at) ASC
      LIMIT 30
    )
    SELECT (SELECT count(*)::int FROM actionable WHERE action_kind = 'follow_up') AS count,
      COALESCE(jsonb_agg(to_jsonb(top)) FILTER (WHERE top.id IS NOT NULL), '[]'::jsonb) AS actions
    FROM top
  `;
  return {
    count: Number(row?.count ?? 0),
    actions: jsonRows(row?.actions)
      .map((item) => classifyGrowthAction({
        id: String(item.id),
        businessName: String(item.business_name),
        status: String(item.status),
        nextAction: item.next_action ? String(item.next_action) : null,
        nextActionAt: iso(item.next_action_at),
        lastContactedAt: iso(item.last_contacted_at),
        createdAt: iso(item.created_at)!,
      }, businessDate, now))
      .filter((item): item is OpsAction => item !== null),
  };
}

async function getPendingApprovals(sql: Sql): Promise<OpsActionSource> {
  const [row] = await sql`
    WITH pending AS (
      SELECT draft.id, lead.business_name, draft.updated_at
      FROM outreach_drafts AS draft
      JOIN leads AS lead ON lead.id = draft.lead_id
      WHERE draft.status = 'pending'
    ), top AS (
      SELECT * FROM pending ORDER BY updated_at ASC LIMIT 30
    )
    SELECT (SELECT count(*)::int FROM pending) AS count,
      COALESCE(jsonb_agg(to_jsonb(top) ORDER BY top.updated_at) FILTER (WHERE top.id IS NOT NULL), '[]'::jsonb) AS actions
    FROM top
  `;
  return {
    count: Number(row?.count ?? 0),
    actions: jsonRows(row?.actions).map((item) => draftApprovalAction({
      id: String(item.id),
      businessName: String(item.business_name),
      updatedAt: iso(item.updated_at)!,
    })),
  };
}

type IncidentSource = OpsActionSource & { activeConnections: number };

async function getSystemIncidents(sql: Sql): Promise<IncidentSource> {
  const [row] = await sql`
    WITH incidents AS (
      SELECT 'delivery:' || id::text AS id, 'Entrega sin confirmar' AS title,
        'Un mensaje salió al proveedor pero su resultado no pudo confirmarse.' AS reason,
        created_at AS occurred_at, '/ops/inbox?conversation=' || conversation_id::text AS href
      FROM wa_messages WHERE status = 'unknown'
      UNION ALL
      SELECT 'run:' || id::text, 'Run de Growth fallido', 'El agente reportó un fallo.', created_at, '/ops/growth?tab=runs'
      FROM growth_runs WHERE status = 'failed' AND created_at >= now() - interval '7 days'
      UNION ALL
      SELECT 'webhook:' || id::text, 'Webhook de Meta fallido', 'El evento no pudo procesarse.', received_at, '/ops/crm?view=connections'
      FROM meta_whatsapp_webhook_events WHERE status = 'failed'
      UNION ALL
      SELECT 'channel:' || phone_number_id, 'Canal de WhatsApp desconectado',
        COALESCE(display_phone_number, phone_number_id) || ' requiere reconexión.', updated_at, '/ops/crm?view=connections'
      FROM whatsapp_connections
      WHERE status = 'deauthorized' AND updated_at >= now() - interval '7 days'
    ), top AS (
      SELECT * FROM incidents ORDER BY occurred_at ASC LIMIT 30
    )
    SELECT (SELECT count(*)::int FROM incidents) AS count,
      (SELECT count(*)::int FROM whatsapp_connections WHERE status != 'deauthorized') AS active_connections,
      COALESCE(jsonb_agg(to_jsonb(top) ORDER BY top.occurred_at) FILTER (WHERE top.id IS NOT NULL), '[]'::jsonb) AS actions
    FROM top
  `;
  return {
    count: Number(row?.count ?? 0),
    activeConnections: Number(row?.active_connections ?? 0),
    actions: jsonRows(row?.actions).map((item) => ({
      id: String(item.id),
      kind: "incident",
      severity: "critical",
      title: String(item.title),
      reason: String(item.reason).slice(0, 240),
      occurredAt: iso(item.occurred_at),
      href: String(item.href),
      cta: "Revisar sistema",
    })),
  };
}

async function getWeightedPipeline(sql: Sql) {
  const [row] = await sql`
    SELECT sum(potential_value * close_probability / 100.0) AS weighted_pipeline
    FROM leads
    WHERE status NOT IN ('won', 'lost')
      AND potential_value IS NOT NULL
      AND close_probability IS NOT NULL
  `;
  return { weightedPipeline: row?.weighted_pipeline === null ? null : Number(row?.weighted_pipeline) };
}

function jsonRows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value as Array<Record<string, unknown>> : [];
}

function iso(value: unknown): string | null {
  return value ? new Date(String(value)).toISOString() : null;
}
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getNextStepSummary } from "@/lib/whatsapp-inbox-db";
