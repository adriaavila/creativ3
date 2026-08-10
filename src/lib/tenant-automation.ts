import { z } from "zod";

export const AUTOMATION_RULE_KEYS = ["saludo", "servicios", "precio", "cita"] as const;
export type AutomationRuleKey = (typeof AUTOMATION_RULE_KEYS)[number];
export type AutomationMode = "off" | "approval" | "automatic";
export type ModelTier = "fast" | "balanced";

export type AutoReplyDecision =
  | { key: AutomationRuleKey; handoff?: false; handoffAfterReply?: boolean }
  | { key: "handoff"; handoff: true }
  | null;

const RULES: Array<Exclude<AutoReplyDecision, null>> = [
  { key: "handoff", handoff: true },
  { key: "cita", handoffAfterReply: true },
  { key: "precio" },
  { key: "servicios" },
  { key: "saludo" },
];

const MATCHES: Record<Exclude<AutoReplyDecision, null>["key"], string[]> = {
  handoff: ["humano", "persona", "asesor", "agente"],
  saludo: ["hola", "buenas", "buenos dias", "informacion"],
  servicios: ["servicios", "que hacen", "pagina web", "web", "automatizacion", "crm"],
  precio: ["precio", "precios", "cotizacion", "cuanto", "costo", "presupuesto"],
  cita: ["cita", "agenda", "agendar", "reunion", "reservar"],
};

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

export function matchAutomationRule(body: string): AutoReplyDecision {
  const normalized = body.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  if (!normalized) return null;
  return RULES.find((candidate) => MATCHES[candidate.key].some((match) => normalized.includes(match))) ?? null;
}

export function previewTenantAutomation(message: string, config: TenantAutomationInput) {
  if (!config.enabled || config.operatingMode === "off") {
    return { kind: "human" as const, label: "La configuración está desactivada." };
  }
  if (config.operatingMode === "approval") {
    return { kind: "approval" as const, label: "La IA prepara una sugerencia; una persona decide si enviarla." };
  }

  const decision = matchAutomationRule(message);
  if (decision?.handoff) return { kind: "human" as const, label: "Pasa directamente a una persona." };
  if (!decision) return { kind: "ai" as const, label: "La IA responde usando la persona y los datos verificados." };

  const reply = config.autoReplies[decision.key]?.trim();
  if (!reply) return { kind: "human" as const, label: `La regla ${decision.key} no tiene respuesta y escala a una persona.` };
  return {
    kind: "rule" as const,
    label: `Responde con la regla ${decision.key}${decision.handoffAfterReply ? " y después transfiere" : ""}.`,
    reply,
  };
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
