"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@vercel/analytics";
import { ArrowLeft, ArrowRight, MessageCircle, RotateCcw } from "lucide-react";
import type { Locale, Messages } from "@/lib/i18n";
import { whatsappUrl } from "@/lib/contact";
import { PRICING_STAGES } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Qualify = Messages["qualify"];
type QuestionId = Qualify["questions"][number]["id"];
type Answers = Partial<Record<QuestionId, string>>;

const RECOMMENDED_LAYERS: Record<string, { es: string[]; en: string[] }> = {
  bottleneck_default: {
    es: ["Inbox conectado a WhatsApp", "Pipeline con etapas claras", "Seguimiento programado"],
    en: ["A WhatsApp-connected inbox", "A pipeline with clear stages", "Scheduled follow-up"],
  },
};

export default function QualificationFlow({
  locale,
  qualify,
  onDone,
  embedded = true,
}: {
  locale: Locale;
  qualify: Qualify;
  onDone?: () => void;
  embedded?: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const questions = qualify.questions;
  const isSummary = stepIndex >= questions.length;

  useEffect(() => {
    track("qualification_started");
  }, []);

  const progressLabel = qualify.progress
    .replace("{current}", String(Math.min(stepIndex + 1, questions.length)))
    .replace("{total}", String(questions.length));

  const selectOption = (question: (typeof questions)[number], value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    track("qualification_step", { step: question.id, value });
    if (stepIndex < questions.length) {
      setStepIndex((i) => i + 1);
    }
    if (stepIndex === questions.length - 1) {
      track("qualification_completed", {
        business_type: answers.businessType,
        volume: answers.volume,
        channel: answers.channel,
        bottleneck: answers.bottleneck,
        [question.id]: value,
      });
    }
  };

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const restart = () => {
    setAnswers({});
    setStepIndex(0);
  };

  const summaryMessage = useMemo(() => {
    const lines = [
      locale === "en" ? "Hi, I want a personalized demo of Allok." : "Hola, quiero una demo personalizada de Allok.",
      answers.businessType ? `${questions[0].label} ${answers.businessType}` : null,
      answers.volume ? `${questions[1].label} ${answers.volume}` : null,
      answers.channel ? `${questions[2].label} ${answers.channel}` : null,
      answers.followUp ? `${questions[3].label} ${answers.followUp}` : null,
      answers.bottleneck ? `${questions[4].label} ${answers.bottleneck}` : null,
    ].filter(Boolean);
    return lines.join("\n");
  }, [answers, locale, questions]);

  const handoffHref = whatsappUrl(summaryMessage);
  const layers = RECOMMENDED_LAYERS.bottleneck_default[locale];
  const implementationStage = PRICING_STAGES[0];

  return (
    <div className={cn("flex flex-col", embedded ? "p-6 sm:p-7" : "")}>
      <div className={cn("mb-5 flex items-center justify-between gap-3", embedded && "pr-8")}>
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
          {qualify.eyebrow}
        </span>
        {!isSummary && (
          <span className="shrink-0 font-mono text-xs text-[var(--text-tertiary)]">{progressLabel}</span>
        )}
      </div>

      {!isSummary && (
        <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--lima)] transition-[width] duration-300 ease-out"
            style={{ width: `${(stepIndex / questions.length) * 100}%` }}
          />
        </div>
      )}

      {!isSummary ? (
        <fieldset key={questions[stepIndex].id} className="allok-enter border-0 p-0 m-0">
          <legend className="mb-5 text-xl font-medium text-[var(--text-primary)] sm:text-2xl">
            {questions[stepIndex].label}
          </legend>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={questions[stepIndex].label}>
            {questions[stepIndex].options.map((option) => {
              const selected = answers[questions[stepIndex].id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectOption(questions[stepIndex], option)}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-[var(--r-md)] border px-4 py-3 text-left text-sm font-medium transition-colors",
                    selected
                      ? "border-[var(--lima)] bg-[var(--lima-dim)] text-[var(--text-primary)]"
                      : "border-[var(--line)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {option}
                  <ArrowRight className="size-4 shrink-0 text-[var(--text-tertiary)]" aria-hidden />
                </button>
              );
            })}
          </div>

          {stepIndex > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="mt-5 text-[var(--text-secondary)]"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              {qualify.back}
            </Button>
          )}
        </fieldset>
      ) : (
        <div>
          <h3 className="mb-1.5 text-xl font-medium text-[var(--text-primary)] sm:text-2xl">
            {qualify.summaryTitle}
          </h3>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">{qualify.summaryLead}</p>

          <div className="mb-6 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-1)] p-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
              {qualify.implementationLabel} · {implementationStage.range}
            </p>
            <ul className="flex flex-col gap-2">
              {layers.map((layer) => (
                <li key={layer} className="flex items-center gap-2.5 text-sm text-[var(--text-primary)]">
                  <span className="size-1.5 rounded-full bg-[var(--lima)]" aria-hidden />
                  {layer}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button asChild size="lg" className="min-h-12 flex-1 rounded-full text-sm font-semibold">
              <a
                href={handoffHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track("whatsapp_cta", { location: "qualification_summary" });
                  onDone?.();
                }}
              >
                <MessageCircle className="size-4" aria-hidden />
                {qualify.summaryCta}
              </a>
            </Button>
            <Button type="button" variant="outline" size="lg" className="min-h-12 rounded-full" onClick={restart}>
              <RotateCcw className="size-3.5" aria-hidden />
              {qualify.restart}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
