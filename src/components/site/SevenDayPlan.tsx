import type { Messages } from "@/lib/i18n";
import { IMPLEMENTATION_TIMELINE_DAYS } from "@/lib/pricing";

export default function SevenDayPlan({ messages }: { messages: Messages }) {
  const { timeline } = messages.home;

  return (
    <section className="border-t border-[var(--line)] bg-[var(--surface-1)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
            {timeline.label}
          </span>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {timeline.title}
          </h2>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IMPLEMENTATION_TIMELINE_DAYS.map((day, index) => {
            const copy = timeline.days[index];
            return (
              <li
                key={day}
                className="allok-reveal flex flex-col gap-1.5 rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--surface-2)] p-5"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <span className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--lima)]">
                  {timeline.dayLabel} {day}
                </span>
                <h3 className="text-base font-medium text-[var(--text-primary)]">{copy.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{copy.description}</p>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 text-xs text-[var(--text-tertiary)]">{timeline.note}</p>
      </div>
    </section>
  );
}
