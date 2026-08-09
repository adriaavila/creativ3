import type { Messages } from "@/lib/i18n";

export default function IdealCustomer({ messages }: { messages: Messages }) {
  const { idealCustomer } = messages.home;

  return (
    <section className="border-t border-[var(--line)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
              {idealCustomer.label}
            </span>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
              {idealCustomer.title}
            </h2>
            <ul className="mt-6 flex flex-col gap-2.5">
              {idealCustomer.traits.map((trait) => (
                <li key={trait} className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--lima)]" aria-hidden />
                  {trait}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col justify-center gap-3">
            <span className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
              Ejemplos
            </span>
            <div className="flex flex-wrap gap-2">
              {idealCustomer.verticals.map((vertical) => (
                <span
                  key={vertical}
                  className="rounded-full border border-[var(--line)] px-3.5 py-1.5 text-sm text-[var(--text-secondary)]"
                >
                  {vertical}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
