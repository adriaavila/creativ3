"use client";

import { ArrowRight } from "lucide-react";
import { track } from "@vercel/analytics";
import type { Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useQualificationDialog } from "./QualificationDialogProvider";

export default function FinalCta({ messages }: { messages: Messages }) {
  const { finalCta } = messages.home;
  const { open } = useQualificationDialog();

  return (
    <section className="canvas-noise relative overflow-hidden border-t border-[var(--line)] bg-[var(--surface-1)] py-28 sm:py-40">
      <div
        aria-hidden
        className="!absolute left-1/2 top-1/2 h-[38rem] w-[58rem] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(197,240,74,0.14),transparent_68%)]"
      />
      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--lima)]">WhatsApp → venta</span>
        <h2 className="mx-auto mt-6 max-w-5xl text-balance text-[clamp(3.4rem,7.5vw,7.5rem)] font-medium leading-[0.88] tracking-[-0.06em] text-[var(--text-primary)]">
          {finalCta.title}
        </h2>
        <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
          {finalCta.body}
        </p>
        <Button
          size="lg"
          className="mt-10 min-h-14 rounded-full px-8 text-sm font-semibold shadow-[0_0_50px_rgba(197,240,74,0.18)] hover:-translate-y-0.5"
          onClick={() => {
            track("qualification_opened", { location: "final_cta", offer: "whatsapp_system" });
            open();
          }}
        >
          {finalCta.cta}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </section>
  );
}
