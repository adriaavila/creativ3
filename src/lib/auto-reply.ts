import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getConversationById, setConversationAssignedMode, type AssignedMode, type ConversationStatus, type MessageDirection, type WaConversation } from "@/lib/whatsapp-inbox-db";
import { PilotRecipientDeniedError } from "@/lib/outbound-safety";
import { isAutomaticAutomation, matchAutomationRule } from "@/lib/tenant-automation";
import { isWithinFreeTextWindow, OutsideFreeTextWindowError, sendToConversation } from "@/lib/whatsapp-send";
import { suggestReply } from "@/lib/whatsapp-ai";
import { getTenantBotConfig, resolveAutoReplyText } from "@/lib/tenant-bot-config";

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
  channelKey: string;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
};

export type { AutoReplyDecision } from "@/lib/tenant-automation";
export { matchAutomationRule as matchAutoReply } from "@/lib/tenant-automation";

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for auto replies.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
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
      conversation.channel_kind, conversation.channel_key,
      conversation.last_message_at, conversation.last_inbound_at
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
    channelKey: String(row.channel_key),
    lastMessageAt: row.last_message_at ? new Date(String(row.last_message_at)).toISOString() : null,
    lastInboundAt: row.last_inbound_at ? new Date(String(row.last_inbound_at)).toISOString() : null,
  }));
}

async function sentReplyRule(jobId: number): Promise<string | null> {
  // ponytail: Neon audit recovers acknowledged sends; provider-level idempotency
  // is the upgrade path if remote-send retries become material.
  const sql = getSql();
  const rows = await sql`
    SELECT payload->>'ruleKey' AS rule_key
    FROM wa_messages
    WHERE direction = 'out'
      AND payload->>'autoReplyJobId' = ${String(jobId)}
    LIMIT 1
  `;
  return rows[0]?.rule_key ? String(rows[0].rule_key) : null;
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
      const recoveredRule = await sentReplyRule(job.id);
      if (recoveredRule) {
        if (recoveredRule === "cita") await setConversationAssignedMode(job.conversationId, "human");
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

      const [decision, tenantConfig] = await Promise.all([
        Promise.resolve(matchAutomationRule(job.body)),
        getTenantBotConfig(job.channelKey).catch(() => null),
      ]);
      if (decision?.handoff) {
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

      let ruleKey = decision?.key ?? "ai";
      let reply = decision ? resolveAutoReplyText(tenantConfig, decision.key) : null;
      let aiMetadata: Record<string, unknown> = {};
      if (!decision && isAutomaticAutomation(tenantConfig ?? { enabled: false, operatingMode: "off" })) {
        const suggestion = await suggestReply(current);
        reply = suggestion.text;
        ruleKey = `ai_${suggestion.classification}`;
        aiMetadata = { model: suggestion.model, classification: suggestion.classification };
      }
      if (!reply) {
        await setConversationAssignedMode(job.conversationId, "human");
        await markSkipped(
          job.id,
          decision?.key ?? "no_match",
          decision
            ? "Este número no tiene una respuesta configurada para esa regla."
            : "La automatización generativa no está activa para este canal.",
        );
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
            components: [{ type: "body", parameters: [{ type: "text", text: reply }] }],
          }
        : undefined;
      await sendToConversation({
        conversationId: job.conversationId,
        text: reply,
        template,
        source: "ai",
        metadata: { autoReplyJobId: job.id, ruleKey, ...aiMetadata },
      });
      if (decision?.handoffAfterReply) {
        await setConversationAssignedMode(job.conversationId, "human");
      }
      await markSent(job.id, ruleKey, reply);
      sent += 1;
    } catch (error) {
      if (error instanceof OutsideFreeTextWindowError) {
        await markSkipped(job.id, "outside_window", error.message);
        skipped += 1;
      } else if (error instanceof PilotRecipientDeniedError || job.attempts >= 3) {
        await setConversationAssignedMode(job.conversationId, "human");
        await markSkipped(
          job.id,
          error instanceof PilotRecipientDeniedError ? "pilot_allowlist" : "agent_error",
          error instanceof Error ? error.message : "La automatización falló y pasó a una persona.",
        );
        skipped += 1;
      } else {
        await markFailed(job.id, job.attempts, error);
        failed += 1;
      }
    }
  }

  return { claimed: jobs.length, sent, skipped, failed };
}
