"use client";

import { ArrowRight } from "lucide-react";
import { track } from "@vercel/analytics";
import type { Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useQualificationDialog } from "./QualificationDialogProvider";

export default function HeroCtas({ hero }: { hero: Messages["home"]["hero"] }) {
  const { open } = useQualificationDialog();

  return (
    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        className="min-h-14 rounded-full px-7 text-sm font-semibold shadow-[0_0_40px_rgba(197,240,74,0.14)] hover:-translate-y-0.5"
        onClick={() => {
          track("qualification_opened", { location: "hero_primary", offer: "whatsapp_system" });
          open();
        }}
      >
        {hero.primaryCta}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
      <Button asChild size="lg" variant="ghost" className="min-h-14 rounded-full px-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <a href="#como-funciona">{hero.secondaryCta}</a>
      </Button>
    </div>
  );
}
