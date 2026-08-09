import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";

export type ConversationItemProps = {
  name: string;
  preview: string;
  time: string;
  channel?: "whatsapp" | "instagram" | "web";
  unread?: boolean;
  active?: boolean;
  tone?: "neutral" | "active" | "warn" | "risk";
  className?: string;
};

const CHANNEL_LABEL: Record<NonNullable<ConversationItemProps["channel"]>, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  web: "Sitio web",
};

function ConversationItem({
  name,
  preview,
  time,
  channel = "whatsapp",
  unread = false,
  active = false,
  tone = "neutral",
  className,
}: ConversationItemProps) {
  return (
    <div
      data-slot="conversation-item"
      className={cn(
        "flex items-start gap-3 rounded-[var(--r-md)] border px-3 py-2.5 transition-colors",
        active
          ? "border-[var(--line-strong)] bg-[var(--surface-3)]"
          : "border-transparent hover:bg-[var(--surface-2)]",
        className
      )}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-xs font-medium text-[var(--text-secondary)]">
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              unread ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-primary)]"
            )}
          >
            {name}
          </span>
          <span className="shrink-0 font-mono text-[11px] text-[var(--text-tertiary)]">{time}</span>
        </div>
        <p className="truncate text-xs text-[var(--text-secondary)]">{preview}</p>
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
          <StatusDot tone={tone} />
          {CHANNEL_LABEL[channel]}
        </span>
      </div>
      {unread ? <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--lima)]" aria-hidden /> : null}
    </div>
  );
}

export { ConversationItem };
