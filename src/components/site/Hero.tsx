import { Check, Radio } from "lucide-react";
import type { Locale, Messages } from "@/lib/i18n";
import HeroConsole from "./HeroConsole";
import HeroCtas from "./HeroCtas";

export default function Hero({ locale, messages }: { locale: Locale; messages: Messages }) {
  const { hero } = messages.home;

  return (
    <section id="producto" className="canvas-noise relative overflow-hidden pb-20 pt-32 sm:pb-28 sm:pt-44">
      <div
        aria-hidden
        className="pointer-events-none !absolute -left-[10%] top-0 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle,rgba(197,240,74,0.12)_0%,rgba(197,240,74,0)_68%)] blur-2xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 border-l border-[var(--lima)] pl-3 text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              <span className="size-1.5 rounded-full bg-[var(--lima)] shadow-[0_0_18px_var(--lima)]" aria-hidden />
              {hero.eyebrow}
            </span>
            <h1 className="mt-7 text-balance text-[clamp(3.35rem,7.2vw,6.75rem)] font-medium leading-[0.88] tracking-[-0.065em] text-[var(--text-primary)]">
              {hero.title}
              <span className="mt-2 block text-[var(--lima)]">{hero.titleAccent}</span>
            </h1>
            <p className="mt-8 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
              {hero.lead}
            </p>

            <HeroCtas hero={hero} />
          </div>

          <div className="relative lg:col-span-5 lg:pt-12">
            <div className="mb-3 flex items-center justify-between border-x border-t border-[var(--line)] bg-[var(--surface-1)] px-4 py-3 text-xs">
              <span className="inline-flex items-center gap-2 font-medium text-[var(--text-primary)]">
                <Radio className="size-3.5 text-[var(--lima)]" aria-hidden />
                {hero.liveLabel}
              </span>
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] sm:inline">
                {hero.flowLabel}
              </span>
            </div>
            <div className="relative before:absolute before:-inset-8 before:-z-10 before:bg-[radial-gradient(circle,rgba(197,240,74,0.08),transparent_65%)]">
              <HeroConsole locale={locale} />
            </div>
          </div>
        </div>

        <ul className="mt-16 grid border-y border-[var(--line)] sm:grid-cols-3 lg:mt-24">
          {hero.proof.map((item) => (
            <li
              key={item}
              className="flex min-h-16 items-center gap-3 border-b border-[var(--line)] px-1 text-sm font-medium text-[var(--text-secondary)] last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0 sm:last:border-r-0"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-[var(--lima-dim)]">
                <Check className="size-3.5 text-[var(--lima)]" aria-hidden />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
