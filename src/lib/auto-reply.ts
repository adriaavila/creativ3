import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getConversationById, setConversationAssignedMode, type AssignedMode, type ConversationStatus, type MessageDirection, type WaConversation } from "@/lib/whatsapp-inbox-db";
import { isWithinFreeTextWindow, OutsideFreeTextWindowError, sendToConversation } from "@/lib/whatsapp-send";

type AutoReplyJob = {
  id: number;
  conversationId: number;
  messageId: number;
  attempts: number;
  direction: MessageDirection;
  msgType: string;
  body: string | null;
  assignedMode: AssignedMode;
  conversationStatus: ConversationStatus;
  channelKind: WaConversation["channelKind"];
  lastMessageAt: string | null;
  lastInboundAt: string | null;
};

export type AutoReplyDecision =
  | { key: string; reply: string; handoff?: false }
  | { key: "handoff"; reply: null; handoff: true }
  | null;

const RULES: Array<Exclude<AutoReplyDecision, null>> = [
  { key: "handoff", reply: null, handoff: true },
  {
    key: "saludo",
    reply: "¡Hola! Gracias por escribir a allok. ¿Qué tipo de sistema necesitas?",
  },
  {
    key: "servicios",
    reply: "En allok hacemos webs, automatizaciones, CRM y sistemas a medida. Cuéntame qué quieres resolver y te orientamos.",
  },
  {
    key: "precio",
    reply: "Podemos orientarte con una cotización. ¿Qué necesitas, para qué negocio y en qué ciudad?",
  },
  {
    key: "cita",
    reply: "Claro. Para agendar, dime qué día y horario te conviene y una persona del equipo te confirma.",
  },
];

const MATCHES: Record<string, string[]> = {
  handoff: ["humano", "persona", "asesor", "agente"],
  saludo: ["hola", "buenas", "buenos dias", "informacion"],
  servicios: ["servicios", "que hacen", "pagina web", "web", "automatizacion", "crm"],
  precio: ["precio", "precios", "cotizacion", "cuanto", "costo", "presupuesto"],
  cita: ["cita", "agenda", "agendar", "reunion", "reservar"],
};

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for auto replies.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export function matchAutoReply(body: string): AutoReplyDecision {
  const normalized = body
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (!normalized) return null;

  const rule = RULES.find((candidate) => MATCHES[candidate.key]?.some((match) => normalized.includes(match)));
  return rule ?? null;
}

export async function enqueueAutoReplyJob(conversationId: number, messageId: number): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO auto_reply_jobs (conversation_id, message_id)
    VALUES (${conversationId}, ${messageId})
    ON CONFLICT (message_id) DO NOTHING
  `;
}

async function claimAutoReplyJobs(limit: number): Promise<AutoReplyJob[]> {
  const sql = getSql();
  const rows = await sql`
    WITH candidates AS (
      SELECT id
      FROM auto_reply_jobs
      WHERE (
          (status IN ('pending', 'failed') AND next_attempt_at <= now())
          OR (status = 'processing' AND processing_started_at < now() - interval '5 minutes')
        )
        AND attempts < 10
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT ${limit}
    ), claimed AS (
      UPDATE auto_reply_jobs AS job
      SET status = 'processing',
          attempts = job.attempts + 1,
          processing_started_at = now(),
          last_error = null,
          updated_at = now()
      FROM candidates
      WHERE job.id = candidates.id
      RETURNING job.id, job.conversation_id, job.message_id, job.attempts
    )
    SELECT claimed.id, claimed.conversation_id, claimed.message_id, claimed.attempts,
      message.direction, message.msg_type, message.body,
      conversation.assigned_mode, conversation.status AS conversation_status,
      conversation.channel_kind, conversation.last_message_at, conversation.last_inbound_at
    FROM claimed
    JOIN wa_messages AS message ON message.id = claimed.message_id
    JOIN wa_conversations AS conversation ON conversation.id = claimed.conversation_id
  `;
  return rows.map((row) => ({
    id: Number(row.id),
    conversationId: Number(row.conversation_id),
    messageId: Number(row.message_id),
    attempts: Number(row.attempts),
    direction: row.direction as MessageDirection,
    msgType: String(row.msg_type),
    body: row.body ? String(row.body) : null,
    assignedMode: row.assigned_mode as AssignedMode,
    conversationStatus: row.conversation_status as ConversationStatus,
    channelKind: row.channel_kind as AutoReplyJob["channelKind"],
    lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : null,
    lastInboundAt: row.last_inbound_at ? new Date(String(row.last_inbound_at)).toISOString() : null,
  }));
}

async function hasSentReply(jobId: number): Promise<boolean> {
  // ponytail: Neon audit recovers acknowledged sends; provider-level idempotency
  // is the upgrade path if remote-send retries become material.
  const sql = getSql();
  const rows = await sql`
    SELECT 1
    FROM wa_messages
    WHERE direction = 'out'
      AND payload->>'autoReplyJobId' = ${String(jobId)}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function markSent(id: number, ruleKey: string, reply: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE auto_reply_jobs
    SET status = 'sent', rule_key = ${ruleKey}, reply_text = ${reply}, processed_at = now(), updated_at = now()
    WHERE id = ${id}
  `;
}

async function markSkipped(id: number, ruleKey: string, reason: string): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE auto_reply_jobs
    SET status = 'skipped', rule_key = ${ruleKey}, last_error = ${reason}, processed_at = now(), updated_at = now()
    WHERE id = ${id}
  `;
}

async function markFailed(id: number, attempts: number, error: unknown): Promise<void> {
  const sql = getSql();
  const retryAt = new Date(Date.now() + Math.min(3600, 2 ** Math.max(0, attempts - 1)) * 1000).toISOString();
  const safeError = error instanceof Error ? error.message.slice(0, 500) : "Auto reply failed";
  await sql`
    UPDATE auto_reply_jobs
    SET status = 'failed', last_error = ${safeError}, next_attempt_at = ${retryAt}, updated_at = now()
    WHERE id = ${id}
  `;
}

export async function processAutoReplyQueue(limit = 10) {
  const jobs = await claimAutoReplyJobs(limit);
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of jobs) {
    try {
      if (await hasSentReply(job.id)) {
        await markSent(job.id, "recovered", "[respuesta ya registrada]");
        sent += 1;
        continue;
      }
      if (job.direction !== "in") {
        await markSkipped(job.id, "not_inbound", "El mensaje no es entrante.");
        skipped += 1;
        continue;
      }
      if (job.assignedMode !== "ai") {
        await markSkipped(job.id, "human_mode", "La conversación está asignada a una persona.");
        skipped += 1;
        continue;
      }
      if (job.conversationStatus !== "open" || job.lastMessageAt !== job.lastInboundAt) {
        await markSkipped(job.id, "stale_inbound", "La conversación cambió antes de procesar el mensaje.");
        skipped += 1;
        continue;
      }
      if (job.msgType !== "text" || !job.body) {
        await setConversationAssignedMode(job.conversationId, "human");
        await markSkipped(job.id, "ambiguous_handoff", "Audio, imagen o mensaje sin texto: requiere atención humana.");
        skipped += 1;
        continue;
      }

      const decision = matchAutoReply(job.body);
      if (!decision) {
        await markSkipped(job.id, "no_match", "No hay una regla segura para este mensaje.");
        skipped += 1;
        continue;
      }
      if (decision.handoff) {
        await setConversationAssignedMode(job.conversationId, "human");
        await markSkipped(job.id, decision.key, "El cliente pidió atención humana.");
        skipped += 1;
        continue;
      }

      const current = await getConversationById(job.conversationId);
      if (!current || current.assignedMode !== "ai") {
        await markSkipped(job.id, "human_mode", "La conversación pasó a una persona antes del envío.");
        skipped += 1;
        continue;
      }
      if (current.status !== "open" || current.lastMessageAt !== current.lastInboundAt) {
        await markSkipped(job.id, "stale_inbound", "La conversación cambió antes del envío.");
        skipped += 1;
        continue;
      }

      const templateName = process.env.WHATSAPP_AUTO_REPLY_TEMPLATE_NAME;
      const withinWindow = isWithinFreeTextWindow(job.lastInboundAt);
      if (job.channelKind === "cloud_api" && !withinWindow && !templateName) {
        await markSkipped(job.id, "outside_window", "Cloud API requiere una plantilla aprobada fuera de la ventana de 24h.");
        skipped += 1;
        continue;
      }

      const template = job.channelKind === "cloud_api" && !withinWindow && templateName
        ? {
            name: templateName,
            languageCode: process.env.WHATSAPP_AUTO_REPLY_TEMPLATE_LANGUAGE ?? "es",
            components: [{ type: "body", parameters: [{ type: "text", text: decision.reply }] }],
          }
        : undefined;
      await sendToConversation({
        conversationId: job.conversationId,
        text: decision.reply,
        template,
        source: "ai",
        metadata: { autoReplyJobId: job.id, ruleKey: decision.key },
      });
      await markSent(job.id, decision.key, decision.reply);
      sent += 1;
    } catch (error) {
      if (error instanceof OutsideFreeTextWindowError) {
        await markSkipped(job.id, "outside_window", error.message);
        skipped += 1;
      } else {
        await markFailed(job.id, job.attempts, error);
        failed += 1;
      }
    }
  }

  return { claimed: jobs.length, sent, skipped, failed };
}
