import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { notFound } from "next/navigation";
import AllokLogo from "@/components/brand/AllokLogo";
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
      ? "Hola allok, quiero saber si allok Desk encaja en mi negocio."
      : "Hi allok, I want to know whether allok Desk fits my business.",
  );

  return (
    <main className="studio min-h-screen bg-[#f3f3f3] text-[#111214]">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href={`/${locale}`} className="text-black" aria-label="allok">
          <AllokLogo variant="lockup-bare" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <Link href="/es/desk" aria-current={locale === "es" ? "page" : undefined} className={locale === "es" ? "text-black" : "text-neutral-400"}>ES</Link>
          <span className="text-neutral-300">/</span>
          <Link href="/en/desk" aria-current={locale === "en" ? "page" : undefined} className={locale === "en" ? "text-black" : "text-neutral-400"}>EN</Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pb-28 sm:pt-24">
        <span className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[.16em]">
          {messages.desk.eyebrow}
        </span>
        <h1 className="mx-auto mt-7 max-w-4xl text-[clamp(3rem,7vw,6rem)] font-semibold leading-[.94] tracking-[-.055em]">
          {messages.desk.title}
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-neutral-600 sm:text-xl">
          {messages.desk.lead}
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#planes" className="inline-flex items-center justify-center rounded-full bg-black px-7 py-4 font-semibold text-white transition duration-200 hover:-translate-y-0.5">
            {messages.desk.primary}
          </a>
          <a href={contact} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 bg-white px-7 py-4 font-semibold transition-colors duration-200 hover:border-black">
            <MessageCircle className="h-4 w-4" aria-hidden /> {messages.desk.secondary}
          </a>
        </div>
      </section>

      <section className="border-y border-black/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-px bg-black/10 md:grid-cols-4">
          {messages.desk.features.map(([title, description]) => (
            <article key={title} className="bg-white p-7">
              <Check className="h-5 w-5" aria-hidden />
              <h2 className="mt-5 text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planes" className="scroll-mt-8 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 max-w-2xl text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-tight">
            {messages.desk.pricingTitle}
          </h2>
          <DeskCheckout locale={locale} messages={messages.desk} />
          <Link href={`/${locale}`} className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {messages.common.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
