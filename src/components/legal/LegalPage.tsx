import Link from "next/link";
import AllokLogo from "@/components/brand/AllokLogo";
import type { Locale, Messages } from "@/lib/i18n";

export default function LegalPage({
  locale,
  messages,
  type,
}: {
  locale: Locale;
  messages: Messages;
  type: "privacy" | "terms";
}) {
  const title =
    type === "privacy"
      ? messages.legal.privacyTitle
      : messages.legal.termsTitle;
  const sections =
    type === "privacy" ? messages.legal.privacy : messages.legal.terms;

  return (
    <main className="min-h-screen bg-white text-black">
      <nav className="mx-auto flex h-20 max-w-4xl items-center justify-between px-5 sm:px-8">
        <Link href={`/${locale}`} aria-label="allok">
          <AllokLogo variant="lockup-bare" className="h-8 w-auto" />
        </Link>
        <Link href={`/${locale}`} className="text-sm font-semibold text-neutral-600 hover:text-black">
          {messages.common.back}
        </Link>
      </nav>
      <article className="mx-auto max-w-4xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-neutral-500">
          allok.fun
        </p>
        <h1 className="mt-4 text-[clamp(2.8rem,7vw,5.5rem)] font-semibold tracking-[-.05em]">
          {title}
        </h1>
        <p className="mt-4 text-sm text-neutral-500">{messages.legal.updated}</p>
        <div className="mt-14 divide-y divide-neutral-200 border-y border-neutral-200">
          {sections.map(([heading, body]) => (
            <section key={heading} className="grid gap-3 py-8 sm:grid-cols-[1fr_2fr] sm:gap-10">
              <h2 className="text-lg font-semibold">{heading}</h2>
              <p className="leading-relaxed text-neutral-600">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
