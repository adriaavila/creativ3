import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";

export type OpportunityCardProps = {
  customer: string;
  source: string;
  value: string;
  stage: string;
  nextTask?: string;
  overdue?: boolean;
  className?: string;
};

function OpportunityCard({
  customer,
  source,
  value,
  stage,
  nextTask,
  overdue = false,
  className,
}: OpportunityCardProps) {
  return (
    <div
      data-slot="opportunity-card"
      className={cn(
        "flex flex-col gap-2 rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--surface-2)] p-3",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">{customer}</span>
        <span className="font-mono text-sm font-medium tabular-nums text-[var(--lima)]">{value}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
        <StatusDot tone="neutral" />
        {source}
        <span aria-hidden>·</span>
        {stage}
      </div>
      {nextTask ? (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs",
            overdue ? "text-[var(--status-risk)]" : "text-[var(--text-secondary)]"
          )}
        >
          <Clock className="size-3" aria-hidden />
          {nextTask}
        </div>
      ) : null}
    </div>
  );
}

export { OpportunityCard };
