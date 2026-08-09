import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Purpose-built empty/error/setup state — never a blank page or a generic
 * "Something went wrong". Every call site names what happened and, where
 * there is one, the next action.
 */
function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--r-xl)] border border-dashed border-[var(--line)] bg-[var(--surface-1)] px-6 py-12 text-center",
        className
      )}
    >
      {icon ? (
        <div className="flex size-11 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-secondary)]">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
