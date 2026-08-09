import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusDotVariants = cva("inline-block size-1.5 shrink-0 rounded-full", {
  variants: {
    tone: {
      neutral: "bg-[var(--text-tertiary)]",
      active: "bg-[var(--lima)]",
      ok: "bg-[var(--status-ok)]",
      info: "bg-[var(--status-info)]",
      warn: "bg-[var(--status-warn)]",
      risk: "bg-[var(--status-risk)]",
      lost: "bg-[var(--status-lost)]",
    },
    pulse: {
      true: "animate-pulse",
      false: "",
    },
  },
  defaultVariants: { tone: "neutral", pulse: false },
});

function StatusDot({
  className,
  tone,
  pulse,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusDotVariants>) {
  return (
    <span
      data-slot="status-dot"
      aria-hidden
      className={cn(statusDotVariants({ tone, pulse }), className)}
      {...props}
    />
  );
}

export { StatusDot, statusDotVariants };
