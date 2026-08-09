import type { Messages } from "@/lib/i18n";

const ROW_HEIGHT = 92;

export default function SystemLayers({ messages }: { messages: Messages }) {
  const { system } = messages.home;
  const height = system.layers.length * ROW_HEIGHT;

  return (
    <section id="como-funciona" className="border-t border-[var(--line)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
            {system.label}
          </span>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {system.title}
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <svg
            aria-hidden
            className="hidden shrink-0 lg:block"
            width="32"
            height={height}
            viewBox={`0 0 32 ${height}`}
            fill="none"
          >
            <line
              x1="16"
              y1={ROW_HEIGHT / 2}
              x2="16"
              y2={height - ROW_HEIGHT / 2}
              stroke="var(--line-strong)"
              strokeWidth="1.5"
            />
            <line
              x1="16"
              y1={ROW_HEIGHT / 2}
              x2="16"
              y2={height - ROW_HEIGHT / 2}
              className="flow-line"
              stroke="var(--lima)"
              strokeWidth="1.5"
            />
            {system.layers.map((_, index) => (
              <circle
                key={index}
                cx="16"
                cy={ROW_HEIGHT / 2 + index * ROW_HEIGHT}
                r="5"
                fill="var(--surface-0)"
                stroke="var(--lima)"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          <ol className="flex flex-col divide-y divide-[var(--line)] rounded-[var(--r-xl)] border border-[var(--line)]">
            {system.layers.map(([name, description], index) => (
              <li
                key={name}
                className="allok-reveal flex flex-col gap-1 px-5 py-5 sm:flex-row sm:items-baseline sm:gap-6 sm:px-6"
                style={{ minHeight: ROW_HEIGHT, animationDelay: `${index * 50}ms` }}
              >
                <span className="font-mono text-xs text-[var(--text-tertiary)] sm:w-6">
                  0{index + 1}
                </span>
                <h3 className="text-base font-medium text-[var(--text-primary)] sm:w-32 sm:shrink-0">
                  {name}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
