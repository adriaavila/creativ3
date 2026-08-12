"use client";

import { Check, MessageCircle } from "lucide-react";
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
    <section id="precios" className="scroll-mt-24 border-t border-[var(--line)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-16 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lima)]">
            {pricing.label}
            </span>
            <h2 className="mt-5 text-balance text-[clamp(2.8rem,5vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[var(--text-primary)]">
              {pricing.title}
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-[var(--text-secondary)] lg:col-span-4">{pricing.lead}</p>
        </div>

        <div className="grid overflow-hidden border border-[var(--line)] bg-[var(--line)] lg:grid-cols-12">
          {PRICING_STAGES.map((stage, index) => {
            const copy = pricing.stages[index];
            return (
              <article
                key={stage.id}
                className={`flex flex-col bg-[var(--surface-1)] p-7 sm:p-10 ${
                  index === 0
                    ? "lg:col-span-7"
                    : index === 1
                      ? "lg:col-span-5 lg:ml-px"
                      : "mt-px lg:col-span-12 lg:grid lg:grid-cols-[0.7fr_1fr_1.3fr] lg:items-start lg:gap-10"
                }`}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--lima)]">
                  0{index + 1} · {copy.label}
                </span>
                <div className={index === 2 ? "mt-5 lg:mt-0" : "mt-12"}>
                  <div className={`${index === 2 ? "text-2xl" : "text-[clamp(2.7rem,5vw,4.75rem)]"} font-medium leading-none tracking-[-0.05em] tabular-nums text-[var(--text-primary)]`}>
                    {stage.range}
                  </div>
                  <div className="mt-2 font-mono text-xs text-[var(--text-tertiary)]">{pricing.cadence[stage.cadence]}</div>
                </div>
                <div className={index === 2 ? "mt-5 lg:mt-0" : "mt-8"}>
                  <p className="max-w-md text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">{copy.description}</p>
                </div>
                <ul className={`${index === 2 ? "mt-6 grid gap-x-6 sm:grid-cols-2 lg:mt-0" : "mt-8 flex flex-col"} gap-2.5 border-t border-[var(--line)] pt-6`}>
                  {copy.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-[var(--lima)]" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 border-b border-[var(--line)] pb-10 sm:flex-row sm:items-center">
          <Button
            size="lg"
            className="min-h-14 rounded-full px-7 text-sm font-semibold hover:-translate-y-0.5"
            onClick={() => {
              track("qualification_opened", { location: "pricing_primary", offer: "whatsapp_system" });
              open();
            }}
          >
            {pricing.primaryCta}
          </Button>
          <Button asChild size="lg" variant="ghost" className="min-h-14 rounded-full px-6 text-sm font-semibold text-[var(--text-secondary)]">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_opened", { location: "pricing_secondary", offer: "whatsapp_system" })}
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
