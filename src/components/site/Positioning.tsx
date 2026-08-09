import type { Messages } from "@/lib/i18n";

export default function Positioning({ messages }: { messages: Messages }) {
  const { positioning } = messages.home;

  return (
    <section className="border-t border-[var(--line)] bg-[var(--surface-1)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
          {positioning.label}
        </span>
        <h2 className="mt-3 max-w-3xl text-2xl font-medium leading-snug tracking-[-0.015em] text-[var(--text-primary)] sm:text-3xl">
          {positioning.title}
        </h2>

        <div className="mt-10 flex flex-wrap gap-2">
          {positioning.items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm text-[var(--text-secondary)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
