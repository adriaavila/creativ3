import type { Messages } from "@/lib/i18n";

export default function Positioning({ messages }: { messages: Messages }) {
  const { positioning } = messages.home;
  const pairs = [
    positioning.items.slice(0, 2),
    positioning.items.slice(2, 4),
    positioning.items.slice(4, 6),
  ];

  return (
    <section className="border-y border-[var(--line)] bg-[var(--surface-1)] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lima)]">
            {positioning.label}
          </span>
          <h2 className="mt-5 max-w-5xl text-balance text-[clamp(2.7rem,5.4vw,5.6rem)] font-medium leading-[0.94] tracking-[-0.05em] text-[var(--text-primary)]">
            {positioning.title}
          </h2>
        </div>

        <ol className="border-t border-[var(--line)] lg:col-span-4">
          {pairs.map((pair, index) => (
            <li key={pair.join("-")} className="grid grid-cols-[2rem_1fr] gap-3 border-b border-[var(--line)] py-5">
              <span className="font-mono text-xs text-[var(--lima)]">0{index + 1}</span>
              <span className="text-sm font-medium leading-relaxed text-[var(--text-secondary)]">
                {pair.join(" + ")}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
