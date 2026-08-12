import type { Messages } from "@/lib/i18n";
import { IMPLEMENTATION_TIMELINE_DAYS } from "@/lib/pricing";

export default function SevenDayPlan({ messages }: { messages: Messages }) {
  const { timeline } = messages.home;

  return (
    <section className="border-t border-[var(--line)] bg-[var(--surface-1)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-16 max-w-5xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lima)]">
            {timeline.label}
          </span>
          <h2 className="mt-5 text-balance text-[clamp(2.8rem,5vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[var(--text-primary)]">
            {timeline.title}
          </h2>
        </div>

        <ol className="grid border-t border-[var(--line)] sm:grid-cols-2 lg:grid-cols-6">
          {IMPLEMENTATION_TIMELINE_DAYS.map((day, index) => {
            const copy = timeline.days[index];
            return (
              <li
                key={day}
                className={`allok-reveal min-h-64 border-b border-[var(--line)] py-6 pr-5 lg:border-r lg:pl-5 lg:first:pl-0 lg:last:border-r-0 ${index % 2 === 0 ? "sm:border-r" : "sm:pl-5"}`}
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--lima)]">
                  {timeline.dayLabel} {day}
                </span>
                <h3 className="mt-12 text-lg font-medium leading-tight text-[var(--text-primary)]">{copy.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{copy.description}</p>
              </li>
            );
          })}
        </ol>

        <p className="mt-6 text-xs text-[var(--text-tertiary)]">{timeline.note}</p>
      </div>
    </section>
  );
}
