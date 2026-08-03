import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { isAutomaticAutomation, type AutomationMode, type ModelTier } from "@/lib/tenant-automation";

// Per-tenant bot behavior (migration 015). Keyed by phone_number_id — the same
// key the webhook routes on and wa_conversations stores as channel_key — so a
// client is onboarded with one row, not one workflow.

let sqlClient: NeonQueryFunction<false, false> | null = null;

export type TenantBotConfig = {
  phoneNumberId: string;
  systemPrompt: string | null;
  businessFacts: string | null;
  handoffNote: string | null;
  /** Keyword rule key -> this tenant's sentence. Missing key = do not auto-answer. */
  autoReplies: Record<string, string>;
  enabled: boolean;
  operatingMode: AutomationMode;
  modelTier: ModelTier;
};

/**
 * The sentence this tenant answers with for a matched rule key. Null means the
 * tenant has no copy for it, and the caller must stay silent rather than fall
 * back to another business's words.
 */
export function resolveAutoReplyText(
  config: TenantBotConfig | null,
  key: string,
): string | null {
  if (!config || !isAutomaticAutomation(config)) return null;
  const text = config.autoReplies[key];
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

function parseAutoReplies(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === "string" && text.trim()) out[key] = text.trim();
  }
  return out;
}

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for tenant bot config.");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export async function getTenantBotConfig(phoneNumberId: string): Promise<TenantBotConfig | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT phone_number_id, system_prompt, business_facts, handoff_note, auto_replies,
      enabled, operating_mode, model_tier
    FROM tenant_bot_config
    WHERE phone_number_id = ${phoneNumberId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    phoneNumberId: String(row.phone_number_id),
    systemPrompt: row.system_prompt ? String(row.system_prompt) : null,
    businessFacts: row.business_facts ? String(row.business_facts) : null,
    handoffNote: row.handoff_note ? String(row.handoff_note) : null,
    autoReplies: parseAutoReplies(row.auto_replies),
    enabled: row.enabled !== false,
    operatingMode: row.operating_mode === "off" || row.operating_mode === "automatic" ? row.operating_mode : "approval",
    modelTier: row.model_tier === "fast" ? "fast" : "balanced",
  };
}

export async function upsertTenantBotConfig(input: {
  phoneNumberId: string;
  systemPrompt?: string | null;
  businessFacts?: string | null;
  handoffNote?: string | null;
  autoReplies?: Record<string, string>;
  enabled?: boolean;
  operatingMode?: AutomationMode;
  modelTier?: ModelTier;
}): Promise<TenantBotConfig> {
  const sql = getSql();
  await sql`
    INSERT INTO tenant_bot_config (
      phone_number_id, system_prompt, business_facts, handoff_note, auto_replies,
      enabled, operating_mode, model_tier, updated_at
    )
    VALUES (
      ${input.phoneNumberId}, ${input.systemPrompt ?? null}, ${input.businessFacts ?? null},
      ${input.handoffNote ?? null}, ${JSON.stringify(input.autoReplies ?? {})}::jsonb,
      ${input.enabled ?? true}, ${input.operatingMode ?? "approval"}, ${input.modelTier ?? "balanced"}, now()
    )
    ON CONFLICT (phone_number_id) DO UPDATE SET
      system_prompt = EXCLUDED.system_prompt,
      business_facts = EXCLUDED.business_facts,
      handoff_note = EXCLUDED.handoff_note,
      auto_replies = EXCLUDED.auto_replies,
      enabled = EXCLUDED.enabled,
      operating_mode = EXCLUDED.operating_mode,
      model_tier = EXCLUDED.model_tier,
      updated_at = now()
  `;
  return (await getTenantBotConfig(input.phoneNumberId))!;
}

/**
 * Builds the system prompt for one tenant: their persona (or the shared default),
 * their business facts, and the rolling summary of this conversation.
 * Pure — the DB reads happen in the caller, which keeps this testable.
 */
export function composeSystemPrompt(input: {
  base: string;
  config: TenantBotConfig | null;
  summary?: string | null;
}): string {
  const parts = [input.config?.systemPrompt?.trim() || input.base];

  if (input.config?.businessFacts?.trim()) {
    parts.push(
      `Datos verificados de este negocio. Respondé solo con esto, nunca inventes lo que falte:\n${input.config.businessFacts.trim()}`,
    );
  }
  if (input.config?.handoffNote?.trim()) {
    parts.push(`Cuando escales a una persona, decí exactamente: ${input.config.handoffNote.trim()}`);
  }
  if (input.summary?.trim()) {
    parts.push(`Resumen de lo ya conversado con este contacto:\n${input.summary.trim()}`);
  }

  return parts.join("\n\n");
}
