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
    <section className="canvas-noise border-t border-[var(--line)] bg-[var(--surface-1)] py-20 sm:py-28">
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-medium tracking-[-0.025em] text-[var(--text-primary)] sm:text-5xl">
          {finalCta.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
          {finalCta.body}
        </p>
        <Button
          size="lg"
          className="mt-8 min-h-12 rounded-full px-7 text-sm font-semibold"
          onClick={() => {
            track("whatsapp_cta", { location: "final_cta" });
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
