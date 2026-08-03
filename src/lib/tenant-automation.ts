import { z } from "zod";

export const AUTOMATION_RULE_KEYS = ["saludo", "servicios", "precio", "cita"] as const;
export type AutomationMode = "off" | "approval" | "automatic";
export type ModelTier = "fast" | "balanced";

const nullableText = (max: number) => z.string().max(max).nullable().transform((value) => value?.trim() || null);
const replyText = z.string().max(1_000).transform((value) => value.trim()).optional();

const tenantAutomationInputSchema = z.object({
  enabled: z.boolean(),
  operatingMode: z.enum(["off", "approval", "automatic"]),
  modelTier: z.enum(["fast", "balanced"]),
  systemPrompt: nullableText(6_000),
  businessFacts: nullableText(12_000),
  handoffNote: nullableText(500),
  autoReplies: z.object({
    saludo: replyText,
    servicios: replyText,
    precio: replyText,
    cita: replyText,
  }).strict().transform((replies) => Object.fromEntries(
    Object.entries(replies).filter(([, text]) => Boolean(text)),
  ) as Record<(typeof AUTOMATION_RULE_KEYS)[number], string>),
}).strict();

export type TenantAutomationInput = z.infer<typeof tenantAutomationInputSchema>;

type RuntimeConfig = Pick<TenantAutomationInput, "enabled" | "operatingMode" | "modelTier">;

export function isAutomaticAutomation(config: Pick<RuntimeConfig, "enabled" | "operatingMode">) {
  return config.enabled && config.operatingMode === "automatic";
}

export function automationRuntimePolicy(
  config: RuntimeConfig,
  models: { fast: string; capable: string },
) {
  const automatic = isAutomaticAutomation(config);
  return {
    autoAssignNewConversations: automatic,
    maySendRuleReplies: automatic,
    classifyModel: models.fast,
    replyModel: config.modelTier === "fast" ? models.fast : models.capable,
    fallbackModel: models.fast,
  };
}

export function parseTenantAutomationInput(value: unknown): TenantAutomationInput {
  return tenantAutomationInputSchema.parse(value);
}
