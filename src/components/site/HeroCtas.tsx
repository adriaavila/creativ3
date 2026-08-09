"use client";

import { ArrowRight } from "lucide-react";
import { track } from "@vercel/analytics";
import type { Messages } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useQualificationDialog } from "./QualificationDialogProvider";

export default function HeroCtas({ hero }: { hero: Messages["home"]["hero"] }) {
  const { open } = useQualificationDialog();

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        className="min-h-12 rounded-full px-6 text-sm font-semibold"
        onClick={() => {
          track("whatsapp_cta", { location: "hero_primary" });
          open();
        }}
      >
        {hero.primaryCta}
        <ArrowRight className="size-4" aria-hidden />
      </Button>
      <Button asChild size="lg" variant="outline" className="min-h-12 rounded-full px-6 text-sm font-semibold">
        <a href="#producto-story">{hero.secondaryCta}</a>
      </Button>
    </div>
  );
}
