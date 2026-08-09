import type { Messages } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ACCENTS = [
  "var(--lima)",
  "var(--viz-cyan)",
  "var(--viz-teal)",
  "var(--viz-amber)",
  "var(--viz-violet)",
  "var(--viz-coral)",
];

export default function Benefits({ messages }: { messages: Messages }) {
  const { benefits } = messages.home;

  return (
    <section className="border-t border-[var(--line)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
            {benefits.label}
          </span>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {benefits.title}
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
          {benefits.items.map(([title, description], index) => (
            <div
              key={title}
              className={cn(
                "allok-reveal flex flex-col gap-3 bg-[var(--surface-1)] p-6 sm:p-8",
                index % 3 === 0 && "sm:col-span-2"
              )}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span
                aria-hidden
                className="inline-block h-1 w-8 rounded-full"
                style={{ backgroundColor: ACCENTS[index % ACCENTS.length] }}
              />
              <h3 className="text-xl font-medium text-[var(--text-primary)] sm:text-2xl">{title}</h3>
              <p className="max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
