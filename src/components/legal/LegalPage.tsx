import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale, Messages } from "@/lib/i18n";

export default function LegalPage({
  messages,
  type,
}: {
  locale: Locale;
  messages: Messages;
  type: "privacy" | "terms";
}) {
  const title = type === "privacy" ? messages.legal.privacyTitle : messages.legal.termsTitle;
  const sections = type === "privacy" ? messages.legal.privacy : messages.legal.terms;
  return <LegalShell title={title} updated={messages.legal.updated} sections={sections} />;
}

/** El molde de toda página legal: privacidad, términos y eliminación de datos. */
export function LegalShell({
  title,
  updated,
  sections,
}: {
  title: string;
  updated?: string;
  sections: ReadonlyArray<readonly [string, ReactNode] | readonly string[]>;
}) {
  return (
    <main className="min-h-screen pt-28 sm:pt-36">
      <article className="mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        {/* La salida de vuelta a casa: antes las páginas legales no tenían ninguna. */}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[.18em] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
        >
          ← allok
        </Link>
        <h1 className="mt-4 text-[clamp(2.2rem,6vw,3.75rem)] font-medium tracking-[-.03em] text-[var(--text-primary)]">
          {title}
        </h1>
        {updated ? <p className="mt-4 text-sm text-[var(--text-tertiary)]">{updated}</p> : null}
        <div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {sections.map(([heading, body]) => (
            <section key={heading} className="grid gap-3 py-7 sm:grid-cols-[1fr_2fr] sm:gap-10">
              <h2 className="text-base font-medium text-[var(--text-primary)]">{heading}</h2>
              <div className="leading-relaxed text-[var(--text-secondary)]">{body}</div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
