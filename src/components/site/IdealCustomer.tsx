import type { Messages } from "@/lib/i18n";

export default function IdealCustomer({ messages }: { messages: Messages }) {
  const { idealCustomer } = messages.home;

  return (
    <section className="border-t border-[var(--line)] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lima)]">
              {idealCustomer.label}
            </span>
            <h2 className="mt-5 text-balance text-[clamp(2.8rem,4.5vw,4.75rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[var(--text-primary)]">
              {idealCustomer.title}
            </h2>
          </div>

          <div className="lg:col-span-7">
            <ul className="grid border-t border-[var(--line)] sm:grid-cols-2">
              {idealCustomer.traits.map((trait, index) => (
                <li
                  key={trait}
                  className={`flex min-h-24 items-start gap-3 border-b border-[var(--line)] py-6 pr-6 text-sm leading-relaxed text-[var(--text-secondary)] ${index % 2 === 0 ? "sm:border-r" : "sm:pl-6"}`}
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--lima)]" aria-hidden />
                  {trait}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 border-y border-[var(--line)] py-5">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {idealCustomer.verticals.map((vertical) => (
              <span key={vertical} className="text-sm font-medium text-[var(--text-tertiary)]">
                {vertical}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
