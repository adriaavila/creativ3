import { CheckCircle2 } from "lucide-react";
import type { Locale, Messages } from "@/lib/i18n";
import HeroConsole from "./HeroConsole";
import HeroCtas from "./HeroCtas";

export default function Hero({ locale, messages }: { locale: Locale; messages: Messages }) {
  const { hero } = messages.home;

  return (
    <section id="producto" className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8">
        <div>
          <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            {hero.eyebrow}
          </span>
          <h1 className="mt-5 text-[clamp(2.5rem,6vw,4.25rem)] font-medium leading-[0.98] tracking-[-0.03em] text-[var(--text-primary)]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            {hero.lead}
          </p>

          <HeroCtas hero={hero} />

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {hero.proof.map((item) => (
              <li key={item} className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="size-4 text-[var(--lima)]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <HeroConsole locale={locale} />
      </div>
    </section>
  );
}
