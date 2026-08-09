import type { Messages } from "@/lib/i18n";

export default function ProductStory({ messages }: { messages: Messages }) {
  const { story } = messages.home;

  return (
    <section id="producto-story" className="border-t border-[var(--line)] py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--lima)]">
            {story.label}
          </span>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.02em] text-[var(--text-primary)] sm:text-4xl">
            {story.title}
          </h2>
        </div>

        <ol className="relative grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
          {story.steps.map(([number, title, description], index) => (
            <li
              key={number}
              className="allok-reveal relative flex flex-col gap-2 border-t border-[var(--line)] px-0 py-6 pr-6 sm:px-6 sm:first:pl-0"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className="font-mono text-xs text-[var(--text-tertiary)]">{number}</span>
              <h3 className="text-base font-medium text-[var(--text-primary)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
