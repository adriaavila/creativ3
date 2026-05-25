import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import CreativvLogo from "@/components/landing/CreativvLogo";
import { whatsappUrl } from "@/lib/contact";
import { VERTICAL_LIST, type Vertical } from "@/lib/verticals";

type Props = {
  vertical: Vertical;
};

export default function VerticalLandingPage({ vertical }: Props) {
  const Icon = vertical.icon;

  return (
    <main className="min-h-screen bg-[#f5f3ec] text-[#1f2a1d]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 md:px-10">
        <Link href="/" aria-label="creativv" className="flex items-center text-[#1f2a1d]">
          <CreativvLogo variant="lockup-bare" className="h-8 w-auto" />
        </Link>
        <a
          href={whatsappUrl(vertical.message)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#1f2a1d] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#336443]"
        >
          <MessageCircle className="h-4 w-4" />
          Pedir diagnostico
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:px-10 md:pb-24 md:pt-16">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#336443]/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#336443]">
            <Icon className="h-4 w-4" />
            {vertical.eyebrow}
          </div>
          <h1 className="max-w-4xl text-5xl font-normal leading-[0.95] text-[#336443] sm:text-6xl md:text-7xl">
            {vertical.title}
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-relaxed text-[#4b5b47] md:text-lg">
            {vertical.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappUrl(vertical.message)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#1f2a1d] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#336443]"
            >
              Quiero revisar mi caso
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/cotizar"
              className="inline-flex items-center gap-2 rounded-full border border-[#1f2a1d]/15 bg-white px-6 py-3 text-sm font-semibold text-[#1f2a1d] transition-colors hover:bg-[#f5f3ec]"
            >
              Ver planes
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-[#1f2a1d]/10 bg-white p-6 shadow-sm md:p-7">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#336443]">
            Cuando vale la pena intervenir
          </div>
          <div className="mt-5 grid gap-4">
            {vertical.pain.map((item) => (
              <div key={item} className="flex gap-3 text-sm leading-relaxed text-[#4b5b47]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#336443]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-lg bg-[#f5f3ec] p-5">
            <div className="text-sm font-semibold text-[#1f2a1d]">{vertical.pilot}</div>
            <p className="mt-2 text-sm leading-relaxed text-[#4b5b47]">{vertical.proof}</p>
          </div>
        </aside>
      </section>

      <section className="bg-[#1f2a1d] px-6 py-16 text-white md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-start">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#85AB8B]">
              Primer entregable
            </div>
            <h2 className="mt-4 max-w-xl text-4xl font-normal leading-[1] md:text-5xl">
              Primero probamos una mejora concreta. Luego escalamos con evidencia.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {vertical.outcomes.map((outcome) => (
              <div key={outcome} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                <CheckCircle2 className="h-5 w-5 text-[#85AB8B]" />
                <p className="mt-4 text-sm leading-relaxed text-white/75">{outcome}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <div className="rounded-lg border border-[#1f2a1d]/10 bg-white p-6 md:p-8">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#336443]">
                Otras verticales
              </div>
              <h2 className="mt-3 text-3xl font-semibold">Mismo criterio, distinto cuello de botella.</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {VERTICAL_LIST.filter((item) => item.slug !== vertical.slug).map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[#1f2a1d]/10 px-4 py-2 text-sm font-semibold text-[#336443] transition-colors hover:bg-[#f5f3ec]"
                >
                  {item.eyebrow.split(",")[0]}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
