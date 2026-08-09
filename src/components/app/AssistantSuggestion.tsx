import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type AssistantSuggestionState = "suggestion" | "review" | "scheduled" | "sent" | "attention";

const STATE_LABEL: Record<AssistantSuggestionState, string> = {
  suggestion: "Sugerencia",
  review: "Revisar antes de enviar",
  scheduled: "Programado",
  sent: "Enviado",
  attention: "Requiere atención",
};

const STATE_TONE: Record<AssistantSuggestionState, string> = {
  suggestion: "bg-[var(--lima-dim)] text-[var(--lima)]",
  review: "bg-[var(--status-warn)]/15 text-[var(--status-warn)]",
  scheduled: "bg-[var(--status-info)]/15 text-[var(--status-info)]",
  sent: "bg-[var(--status-ok)]/15 text-[var(--status-ok)]",
  attention: "bg-[var(--status-risk)]/15 text-[var(--status-risk)]",
};

function AssistantSuggestionBadge({ state }: { state: AssistantSuggestionState }) {
  return (
    <Badge className={cn("gap-1 border-0 font-medium", STATE_TONE[state])}>{STATE_LABEL[state]}</Badge>
  );
}

export type AssistantSuggestionProps = {
  state: AssistantSuggestionState;
  text: string;
  className?: string;
};

/**
 * The assistant is always supervised: it never implies an autonomous send.
 * Every rendering carries an explicit state badge (Sugerencia / Revisar antes
 * de enviar / Programado / Enviado / Requiere atención).
 */
function AssistantSuggestion({ state, text, className }: AssistantSuggestionProps) {
  return (
    <div
      data-slot="assistant-suggestion"
      className={cn(
        "rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-1)] p-3",
        className
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-tertiary)]">
          <Sparkles className="size-3.5 text-[var(--lima)]" aria-hidden />
          Asistente
        </span>
        <AssistantSuggestionBadge state={state} />
      </div>
      <p className="text-sm leading-relaxed text-[var(--text-primary)]">{text}</p>
    </div>
  );
}

export { AssistantSuggestion, AssistantSuggestionBadge, STATE_LABEL as ASSISTANT_STATE_LABEL };
