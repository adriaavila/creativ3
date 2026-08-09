import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import DeskCheckout from "@/components/billing/DeskCheckout";
import {
  alternateLanguages,
  getMessages,
  isLocale,
  localePath,
} from "@/lib/i18n";
import { whatsappUrl } from "@/lib/contact";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/desk">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { desk } = getMessages(locale);
  return {
    title: desk.metaTitle,
    description: desk.metaDescription,
    alternates: {
      canonical: localePath(locale, "/desk"),
      languages: alternateLanguages("/desk"),
    },
  };
}

export default async function DeskPage({ params }: PageProps<"/[locale]/desk">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const messages = getMessages(locale);
  const contact = whatsappUrl(
    locale === "es"
      ? "Hola Allok, quiero saber si allok Desk encaja en mi negocio."
      : "Hi Allok, I want to know whether allok Desk fits my business.",
  );

  return (
    <main className="min-h-screen pt-16 sm:pt-20">
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-28 sm:pt-24">
        <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[.16em] text-[var(--text-secondary)]">
          {messages.desk.eyebrow}
        </span>
        <h1 className="mx-auto mt-7 max-w-4xl text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[.98] tracking-[-.03em] text-[var(--text-primary)]">
          {messages.desk.title}
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl">
          {messages.desk.lead}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#planes"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--lima)] px-7 font-semibold text-[var(--lima-ink)] transition duration-200 hover:-translate-y-0.5"
          >
            {messages.desk.primary}
          </a>
          <a
            href={contact}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--line)] px-7 font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--surface-2)]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden /> {messages.desk.secondary}
          </a>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--surface-1)]">
        <div className="mx-auto grid max-w-6xl gap-px bg-[var(--line)] md:grid-cols-4">
          {messages.desk.features.map(([title, description]) => (
            <article key={title} className="bg-[var(--surface-1)] p-7">
              <Check className="h-5 w-5 text-[var(--lima)]" aria-hidden />
              <h2 className="mt-5 text-xl font-medium text-[var(--text-primary)]">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planes" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 max-w-2xl text-[clamp(2rem,4.5vw,3.2rem)] font-medium leading-tight text-[var(--text-primary)]">
            {messages.desk.pricingTitle}
          </h2>
          <DeskCheckout locale={locale} messages={messages.desk} />
          <Link
            href={`/${locale}`}
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> {messages.common.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
