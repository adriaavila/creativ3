import type { Messages } from "@/lib/i18n";

export default function ProductStory({ messages }: { messages: Messages }) {
  const { story } = messages.home;

  return (
    <section id="como-funciona" className="scroll-mt-24 border-y border-[var(--line)] bg-[var(--surface-1)] py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--lima)]">
            {story.label}
          </span>
          <h2 className="mt-5 max-w-xl text-balance text-[clamp(2.8rem,4.8vw,5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[var(--text-primary)] lg:sticky lg:top-32">
            {story.title}
          </h2>
        </div>

        <ol className="border-t border-[var(--line)] lg:col-span-7">
          {story.steps.map(([number, title, description]) => (
            <li
              key={number}
              className="group allok-reveal grid gap-4 border-b border-[var(--line)] py-8 sm:grid-cols-[4rem_1fr] sm:py-10"
            >
              <span className="font-mono text-sm text-[var(--lima)]">{number}</span>
              <div>
                <h3 className="text-balance text-2xl font-medium text-[var(--text-primary)] transition-transform duration-300 group-hover:translate-x-1 sm:text-3xl">
                  {title}
                </h3>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-[var(--text-secondary)]">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
