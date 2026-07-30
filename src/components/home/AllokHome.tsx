import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Mail, MessageCircle, Plus } from "lucide-react";
import AllokLogo from "@/components/brand/AllokLogo";
import Waveform from "@/components/brand/Waveform";
import type { Locale, Messages } from "@/lib/i18n";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/contact";

const anchors = ["soluciones", "trabajo", "proceso", "precios", "preguntas"] as const;
const workImages = [
  "/projects/rei-fm/01-desktop.jpg",
  "/projects/shopea/01-desktop.jpg",
  "/projects/frontai-landing/01-desktop.jpg",
] as const;

export default function AllokHome({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const { common, home } = messages;
  const contactUrl = whatsappUrl(
    locale === "es"
      ? "Hola allok, quiero mejorar cómo vende u opera mi negocio."
      : "Hi allok, I want to improve how my business sells or operates.",
  );

  return (
    <div className="studio min-h-screen bg-white text-black antialiased selection:bg-[#c5f04a] selection:text-black">
      <header className="studio-header sticky top-0 z-50">
        <nav className="studio-nav mx-auto flex max-w-[90rem] items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href={`/${locale}`} aria-label="allok" className="shrink-0 text-black">
            <AllokLogo variant="lockup-bare" className="h-7 w-auto sm:h-[30px]" />
          </Link>
          <div className="hidden items-center gap-0.5 lg:flex">
            {home.nav.map((label, index) => (
              <a
                key={anchors[index]}
                href={`#${anchors[index]}`}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:bg-[var(--studio-surface)] hover:text-black"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex rounded-full border border-neutral-200 bg-white p-1 text-xs font-semibold"
              aria-label={locale === "es" ? "Cambiar idioma" : "Change language"}
            >
              {(["es", "en"] as const).map((item) => (
                <Link
                  key={item}
                  href={`/${item}`}
                  hrefLang={item}
                  aria-current={item === locale ? "page" : undefined}
                  className={`rounded-full px-2.5 py-1.5 transition-colors duration-200 ${
                    item === locale ? "bg-black text-white" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </div>
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-800 sm:inline-flex"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {common.talk}
            </a>
          </div>
        </nav>
      </header>

      <main>
        <section className="studio-hero relative overflow-hidden border-b border-black/10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
          />
          <Waveform
            accentTail
            id="hero-ambient-wave"
            cycles={18}
            weight={1.4}
            className="pointer-events-none absolute -right-[8%] top-8 w-[74rem] max-w-none rotate-[-7deg] text-black/[.055]"
          />
          <div className="allok-enter relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[90rem] items-center gap-16 px-5 pb-20 pt-14 sm:px-8 sm:py-24 lg:grid-cols-12 lg:gap-12">
            <div className="relative z-10 lg:col-span-7 lg:pl-[6vw]">
              <span className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white/70 px-3.5 py-1.5 text-[12px] font-semibold backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c5f04a]" aria-hidden />
                {home.available}
              </span>
              <h1 className="brand-tail-text mt-7 max-w-4xl pb-[.08em] text-[clamp(3.4rem,7.3vw,7.6rem)] font-semibold leading-[.9] tracking-[-.06em] text-balance">
                {home.heroTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-[clamp(1.2rem,2vw,1.72rem)] font-semibold leading-[1.3] text-balance">
                {home.heroLead}
              </p>
              <p className="mt-4 max-w-[58ch] text-[17px] leading-relaxed text-neutral-600 sm:text-[19px]">
                {home.heroBody}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="brand-button inline-flex items-center justify-center gap-2 bg-black px-7 py-4 font-semibold text-white transition duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {common.whatsapp} <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <a
                  href="#precios"
                  className="inline-flex items-center justify-center rounded-full border border-black/25 bg-white/50 px-7 py-4 font-semibold backdrop-blur transition-colors duration-200 hover:border-black hover:bg-white"
                >
                  {common.prices}
                </a>
              </div>
              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5">
                {home.trust.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <Check className="h-4 w-4" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative lg:col-span-5 lg:-ml-10">
              <span aria-hidden className="absolute -left-9 -top-10 font-mono text-[10px] uppercase tracking-[.18em] text-black/45 [writing-mode:vertical-rl]">
                allok / system 01
              </span>
              <div className="studio-window overflow-hidden border border-black/15 bg-white shadow-[0_34px_100px_rgba(0,0,0,.16)]">
                <div className="flex items-center gap-1.5 border-b border-[var(--studio-hairline)] bg-[var(--studio-surface)] px-4 py-3" aria-hidden>
                  <i className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <i className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  <i className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                </div>
                <div className="relative aspect-[4/3] lg:aspect-[5/4]">
                  <Image
                    src="/projects/rei-fm/01-desktop.jpg"
                    alt={locale === "es" ? "Sistema inmobiliario creado por allok" : "Real estate system built by allok"}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 460px"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <Section id="soluciones" label={home.offersLabel} title={home.offersTitle} lead={home.offersLead}>
          <div id="precios" className="mt-12 grid scroll-mt-24 gap-5 lg:grid-cols-[.92fr_1.16fr_.92fr] lg:items-stretch">
            {home.offers.map((offer, index) => {
              const isDesk = index === 2;
              const ctaClass = `mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${
                index === 1 ? "bg-white text-black" : "bg-black text-white"
              }`;
              return (
                <article
                  key={offer.name}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border p-7 transition duration-300 hover:-translate-y-1 ${
                    index === 1
                      ? "border-black bg-black text-white shadow-[0_24px_60px_rgba(0,0,0,.18)] lg:-translate-y-5 lg:pb-10 lg:pt-10 lg:hover:-translate-y-6"
                      : "border-black/10 bg-white hover:border-black/35 hover:shadow-[var(--studio-shadow)]"
                  }`}
                >
                  <span aria-hidden className={`absolute right-5 top-3 font-mono text-6xl font-semibold tracking-[-.08em] ${index === 1 ? "text-white/[.06]" : "text-black/[.035]"}`}>
                    0{index + 1}
                  </span>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${index === 1 ? "bg-[#c5f04a] text-black" : "bg-[var(--studio-surface)]"}`}>
                    {offer.tag}
                  </span>
                  <h2 className="mt-6 text-2xl font-semibold">{offer.name}</h2>
                  <p className={`mt-3 text-sm leading-relaxed ${index === 1 ? "text-neutral-300" : "text-neutral-600"}`}>
                    {offer.description}
                  </p>
                  <strong className="mt-6 text-2xl">{offer.price}</strong>
                  <ul className={`mt-6 flex-1 space-y-3 border-t pt-6 ${index === 1 ? "border-white/15" : "border-neutral-200"}`}>
                    {offer.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-sm">
                        <Check className={`h-4 w-4 shrink-0 ${index === 1 ? "text-[#c5f04a]" : ""}`} aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isDesk ? (
                    <Link href={`/${locale}/desk`} className={ctaClass}>
                      {offer.cta} <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : (
                    <a
                      href={whatsappUrl(
                        locale === "es"
                          ? `Hola allok, quiero cotizar ${offer.name}.`
                          : `Hi allok, I'd like a quote for ${offer.name}.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={ctaClass}
                    >
                      {offer.cta} <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </a>
                  )}
                </article>
              );
            })}
          </div>
        </Section>

        <Section id="trabajo" label={home.workLabel} title={home.workTitle} lead={home.workLead} muted>
          <div className="mt-12 grid gap-5 md:grid-cols-12">
            {home.work.map(([name, kind, description], index) => (
              <article
                key={name}
                className={`group overflow-hidden rounded-3xl border border-black/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-black/25 hover:shadow-[var(--studio-shadow)] ${
                  index === 0 ? "md:col-span-7" : index === 1 ? "md:col-span-5" : "md:col-span-12 md:grid md:grid-cols-2"
                }`}
              >
                <div className={`relative overflow-hidden ${index === 2 ? "aspect-[16/10] md:aspect-auto md:min-h-72" : "aspect-[16/10]"}`}>
                  <Image
                    src={workImages[index]}
                    alt={`${name} — ${kind}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.025]"
                  />
                </div>
                <div className={`p-6 ${index === 2 ? "md:flex md:flex-col md:justify-end md:p-10" : ""}`}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{kind}</span>
                  <h2 className="mt-2 text-xl font-semibold">{name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section id="proceso" label={home.processLabel} title={home.processTitle}>
          <ol className="mt-12 grid border-y border-black/15 md:grid-cols-4">
            {home.process.map(([number, title, description]) => (
              <li key={number} className="group border-b border-black/10 bg-white py-8 pr-6 md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0">
                <span className="font-mono text-xs font-semibold text-neutral-400 transition-colors group-hover:text-black">{number}</span>
                <h2 className="mt-4 text-lg font-semibold">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{description}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="preguntas" label={home.faqLabel} title={home.faqTitle} muted>
          <div className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200">
            {home.faqs.map(([question, answer]) => (
              <details key={question} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                  {question}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-300 transition-transform duration-200 group-open:rotate-45">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl leading-relaxed text-neutral-600">{answer}</p>
              </details>
            ))}
          </div>
        </Section>

        <section className="relative overflow-hidden bg-black py-24 text-white sm:py-36">
          <Waveform accentTail id="final-wave" cycles={22} weight={2} className="absolute left-1/2 top-1/2 w-[90rem] max-w-none -translate-x-1/2 -translate-y-1/2 text-white/15" />
          <div className="relative mx-auto max-w-5xl px-5 text-center">
            <p className="mb-6 font-mono text-[10px] uppercase tracking-[.22em] text-[#c5f04a]">
              {locale === "es" ? "allok / cuando quieras" : "allok / ready when you are"}
            </p>
            <h2 className="brand-tail-text-dark text-[clamp(2.7rem,6vw,5.8rem)] font-semibold leading-[.9] text-balance">{home.finalTitle}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-400">{home.finalBody}</p>
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#c5f04a] px-8 py-4 font-semibold text-black transition duration-200 hover:-translate-y-0.5"
            >
              <MessageCircle className="h-5 w-5" aria-hidden /> {common.whatsapp}
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-white">
        <Waveform className="h-24 w-full text-black/[.13] sm:h-32" cycles={26} weight={2.2} />
        <div className="mx-auto flex max-w-6xl flex-col gap-7 px-5 pb-10 sm:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row">
            <div>
              <AllokLogo variant="lockup-bare" className="h-8 w-auto" />
              <p className="mt-3 text-sm text-neutral-600">{home.footer}</p>
            </div>
            <nav className="flex flex-wrap gap-5 text-sm font-medium text-neutral-600">
              <Link href={locale === "es" ? "/es/privacidad" : "/en/privacy"} className="hover:text-black">{common.privacy}</Link>
              <Link href={locale === "es" ? "/es/terminos" : "/en/terms"} className="hover:text-black">{common.terms}</Link>
              <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-1.5 hover:text-black">
                <Mail className="h-4 w-4" aria-hidden /> {CONTACT_EMAIL}
              </a>
            </nav>
          </div>
          <span className="border-t border-neutral-200 pt-6 text-sm text-neutral-500">
            © {new Date().getFullYear()} allok · allok.fun
          </span>
        </div>
      </footer>
    </div>
  );
}

function Section({
  id,
  label,
  title,
  lead,
  muted,
  children,
}: {
  id: string;
  label: string;
  title: string;
  lead?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-b border-[var(--studio-hairline)] py-20 sm:py-28 ${muted ? "bg-[var(--studio-surface)]" : ""}`}
    >
      <div className="allok-reveal mx-auto max-w-6xl px-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-neutral-500">{label}</p>
        <h2 className="brand-tail-text mt-4 max-w-4xl text-[clamp(2.2rem,4.6vw,4.2rem)] font-semibold leading-[.95] text-balance">{title}</h2>
        {lead ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-600">{lead}</p> : null}
        {children}
      </div>
    </section>
  );
}
