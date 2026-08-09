import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  trend?: { direction: "up" | "down"; label: string; tone?: "ok" | "risk" | "neutral" };
  icon?: ReactNode;
  className?: string;
};

const trendTone: Record<string, string> = {
  ok: "text-[var(--status-ok)]",
  risk: "text-[var(--status-risk)]",
  neutral: "text-[var(--text-secondary)]",
};

function MetricCard({ label, value, detail, trend, icon, className }: MetricCardProps) {
  return (
    <div
      data-slot="metric-card"
      className={cn(
        "flex flex-col gap-2.5 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-2)] p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
          {label}
        </span>
        {icon ? <span className="text-[var(--text-tertiary)]">{icon}</span> : null}
      </div>
      <div className="font-mono text-2xl font-medium tabular-nums text-[var(--text-primary)] sm:text-[1.75rem]">
        {value}
      </div>
      {(detail || trend) && (
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          {trend ? (
            <span className={cn("inline-flex items-center gap-0.5 font-medium", trendTone[trend.tone ?? "neutral"])}>
              {trend.direction === "up" ? (
                <ArrowUpRight className="size-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="size-3.5" aria-hidden />
              )}
              {trend.label}
            </span>
          ) : null}
          {detail ? <span>{detail}</span> : null}
        </div>
      )}
    </div>
  );
}

export { MetricCard };
export type { MetricCardProps };
