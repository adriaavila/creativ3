import type { Messages } from "@/lib/i18n";

const LAYOUT = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-4",
  "lg:col-span-8",
  "lg:col-span-7",
  "lg:col-span-5",
];

export default function Benefits({ messages }: { messages: Messages }) {
  const { benefits } = messages.home;

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-16 max-w-4xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lima)]">
            {benefits.label}
          </span>
          <h2 className="mt-5 text-balance text-[clamp(2.8rem,5vw,5.25rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[var(--text-primary)]">
            {benefits.title}
          </h2>
        </div>

        <div className="grid border-t border-[var(--line)] lg:grid-cols-12">
          {benefits.items.map(([title, description], index) => (
            <article
              key={title}
              className={`group allok-reveal min-h-64 border-b border-[var(--line)] p-6 transition-colors duration-300 hover:bg-[var(--surface-1)] sm:p-8 ${LAYOUT[index]} ${
                index % 2 === 0 ? "lg:border-r" : ""
              }`}
            >
              <span className="font-mono text-xs text-[var(--text-tertiary)] transition-colors group-hover:text-[var(--lima)]">
                0{index + 1}
              </span>
              <h3 className="mt-10 max-w-xl text-balance text-2xl font-medium leading-tight text-[var(--text-primary)] sm:text-3xl">
                {title}
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
