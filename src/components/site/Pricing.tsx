"use client";

import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { track } from "@vercel/analytics";
import type { Messages } from "@/lib/i18n";
import { PRICING_STAGES } from "@/lib/pricing";
import { whatsappUrl } from "@/lib/contact";
import { Button } from "@/components/ui/button";
import { useQualificationDialog } from "./QualificationDialogProvider";

export default function Pricing({ messages }: { messages: Messages }) {
  const { pricing } = messages.home;
  const { open } = useQualificationDialog();

  return (
    <section id="precios" className="border-t border-[var(--line)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
            {pricing.label}
          </span>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {pricing.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{pricing.lead}</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {PRICING_STAGES.map((stage, index) => {
            const copy = pricing.stages[index];
            return (
              <div
                key={stage.id}
                className="relative flex flex-col gap-4 rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--surface-1)] p-6"
              >
                {index < PRICING_STAGES.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="absolute top-1/2 -right-6 hidden size-5 -translate-y-1/2 text-[var(--text-tertiary)] lg:block"
                  />
                )}
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  0{index + 1} · {copy.label}
                </span>
                <div>
                  <div className="font-mono text-2xl font-medium tabular-nums text-[var(--text-primary)]">
                    {stage.range}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">{pricing.cadence[stage.cadence]}</div>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{copy.description}</p>
                <ul className="flex flex-col gap-2">
                  {copy.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--lima)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            size="lg"
            className="min-h-12 rounded-full px-6 text-sm font-semibold"
            onClick={() => {
              track("whatsapp_cta", { location: "pricing_primary" });
              open();
            }}
          >
            {pricing.primaryCta}
          </Button>
          <Button asChild size="lg" variant="outline" className="min-h-12 rounded-full px-6 text-sm font-semibold">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_cta", { location: "pricing_secondary" })}
            >
              <MessageCircle className="size-4" aria-hidden />
              {pricing.secondaryCta}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
