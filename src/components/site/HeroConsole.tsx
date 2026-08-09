"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, MessageCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { ConversationItem } from "@/components/app/ConversationItem";
import { AssistantSuggestion, type AssistantSuggestionState } from "@/components/app/AssistantSuggestion";
import { StatusDot } from "@/components/ui/status-dot";

type Phase = 0 | 1 | 2 | 3;

const COPY: Record<
  Locale,
  {
    inboxLabel: string;
    conversations: { name: string; preview: string; time: string }[];
    incoming: string;
    suggestion: string;
    pipelineLabel: string;
    stages: string[];
    customer: string;
    followUpLabel: string;
    followUpPending: string;
    followUpScheduled: string;
  }
> = {
  es: {
    inboxLabel: "Inbox",
    conversations: [
      { name: "Laura Méndez", preview: "¿Tienen disponibilidad este mes?", time: "09:12" },
      { name: "Carlos Herrera", preview: "Perfecto, esperamos la propuesta", time: "ayer" },
    ],
    incoming: "Hola, vi el apartamento en la avenida. ¿Sigue disponible?",
    suggestion: "Sí, sigue disponible. ¿Coordinamos una visita esta semana?",
    pipelineLabel: "Pipeline",
    stages: ["Nuevo contacto", "Calificado", "Negociación"],
    customer: "María González",
    followUpLabel: "Seguimiento",
    followUpPending: "Pendiente",
    followUpScheduled: "Programado · mañana 10:00",
  },
  en: {
    inboxLabel: "Inbox",
    conversations: [
      { name: "Laura Méndez", preview: "Do you have availability this month?", time: "9:12 AM" },
      { name: "Carlos Herrera", preview: "Perfect, waiting on the proposal", time: "yesterday" },
    ],
    incoming: "Hi, I saw the listing on the avenue. Is it still available?",
    suggestion: "Yes, it's still available. Should we set up a visit this week?",
    pipelineLabel: "Pipeline",
    stages: ["New contact", "Qualified", "Negotiation"],
    customer: "María González",
    followUpLabel: "Follow-up",
    followUpPending: "Pending",
    followUpScheduled: "Scheduled · tomorrow 10:00",
  },
};

const PHASE_MS = 2600;
const SUGGESTION_STATE: AssistantSuggestionState[] = ["suggestion", "review", "review", "review"];

export default function HeroConsole({ locale }: { locale: Locale }) {
  const copy = COPY[locale];
  const [phase, setPhase] = useState<Phase>(0);
  const [reduceMotion, setReduceMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [inView, setInView] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    const id = setInterval(() => setPhase((p) => (((p + 1) % 4) as Phase)), PHASE_MS);
    return () => clearInterval(id);
  }, [reduceMotion, inView]);

  // Reduced motion freezes on the settled end state (phase 3): message
  // delivered, suggestion reviewed, stage advanced, follow-up scheduled.
  const activePhase = reduceMotion ? 3 : phase;
  const messageVisible = activePhase >= 0;
  const suggestionVisible = activePhase >= 1;
  const stageIndex = activePhase >= 2 ? 1 : 0;
  const followUpScheduled = activePhase >= 3;
  const value = activePhase >= 2 ? 128000 : 0;

  return (
    <div
      ref={containerRef}
      className="canvas-noise relative overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] shadow-[var(--shadow-3)]"
      role="img"
      aria-label={
        locale === "es"
          ? "Vista del inbox de Allok: una conversación entrando, una sugerencia del asistente y una oportunidad avanzando en el pipeline"
          : "Preview of the Allok inbox: an incoming message, an assistant suggestion, and an opportunity moving through the pipeline"
      }
    >
      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] divide-x divide-[var(--line)]">
        {/* Inbox column */}
        <div className="hidden flex-col gap-1 p-3 sm:flex">
          <span className="mb-1 px-2 text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
            {copy.inboxLabel}
          </span>
          <ConversationItem
            name={copy.customer}
            preview={copy.incoming}
            time="now"
            active
            unread
            tone="active"
          />
          {copy.conversations.map((conversation) => (
            <ConversationItem key={conversation.name} {...conversation} />
          ))}
        </div>

        {/* Active conversation + assistant + pipeline */}
        <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
              <MessageCircle className="size-3.5" aria-hidden />
              {copy.customer}
            </span>
            <Bell className="size-3.5 text-[var(--text-tertiary)]" aria-hidden />
          </div>

          <div
            className="flex min-h-[3.25rem] items-end"
            style={{
              opacity: messageVisible ? 1 : 0,
              transform: messageVisible ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 320ms var(--ease-out), transform 320ms var(--ease-out)",
            }}
          >
            <p className="max-w-[85%] rounded-[var(--r-md)] rounded-bl-sm bg-[var(--surface-3)] px-3 py-2 text-sm text-[var(--text-primary)]">
              {copy.incoming}
            </p>
          </div>

          <div
            style={{
              opacity: suggestionVisible ? 1 : 0,
              transform: suggestionVisible ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 320ms var(--ease-out) 80ms, transform 320ms var(--ease-out) 80ms",
            }}
          >
            <AssistantSuggestion state={SUGGESTION_STATE[activePhase]} text={copy.suggestion} />
          </div>

          <div className="mt-1 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-2)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                {copy.pipelineLabel}
              </span>
              <span
                data-metric
                className="font-mono text-sm font-medium tabular-nums text-[var(--lima)] transition-all duration-500"
              >
                {value > 0 ? `USD ${value.toLocaleString(locale === "es" ? "es-VE" : "en-US")}` : "—"}
              </span>
            </div>
            <div className="mb-3 flex items-center gap-1.5">
              {copy.stages.map((stage, index) => (
                <span
                  key={stage}
                  className="flex items-center gap-1.5 text-[11px] font-medium transition-colors duration-500"
                  style={{
                    color: index <= stageIndex ? "var(--text-primary)" : "var(--text-tertiary)",
                  }}
                >
                  <StatusDot tone={index <= stageIndex ? "active" : "neutral"} />
                  {stage}
                  {index < copy.stages.length - 1 && (
                    <span className="mx-0.5 h-px w-3 bg-[var(--line-strong)]" aria-hidden />
                  )}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-tertiary)]">{copy.followUpLabel}</span>
              <span
                className="font-medium transition-colors duration-500"
                style={{ color: followUpScheduled ? "var(--status-info)" : "var(--text-secondary)" }}
              >
                {followUpScheduled ? copy.followUpScheduled : copy.followUpPending}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
