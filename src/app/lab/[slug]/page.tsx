import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RigFooter from "@/components/rig/RigFooter";
import RigHeader from "@/components/rig/RigHeader";
import SkyDriver from "@/components/rig/SkyDriver";
import { EXPERIMENTS, findExperiment } from "@/components/lab/registry";

type Params = { slug: string };

export function generateStaticParams() {
  return EXPERIMENTS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const experiment = findExperiment((await params).slug);
  if (!experiment) return {};
  return {
    title: `${experiment.title} — Lab`,
    description: experiment.question,
    alternates: { canonical: `/lab/${experiment.slug}` },
  };
}

export default async function ExperimentPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const experiment = findExperiment(slug);
  if (!experiment) notFound();

  const index = EXPERIMENTS.indexOf(experiment);
  const next = EXPERIMENTS[(index + 1) % EXPERIMENTS.length];
  const { Component } = experiment;

  return (
    <div className="rig min-h-screen">
      <SkyDriver />
      <RigHeader />

      <main>
        <section className="px-5 pb-8 pt-10 sm:px-10 sm:pt-14">
          <div className="mono flex items-center justify-between text-[var(--carbon-3)]">
            <Link href="/lab" className="text-[var(--carbon)] hover:text-[var(--hazard)]">
              ← Lab
            </Link>
            <span>Unit / {experiment.unit}</span>
          </div>
          <h1 className="macro mt-6 !text-[clamp(2.4rem,8vw,7rem)]">{experiment.title}</h1>
          <p className="mt-5 max-w-3xl text-[clamp(1.15rem,2.6vw,1.75rem)] leading-[1.25] tracking-[-0.02em]">
            {experiment.question}
          </p>
        </section>

        <section className="border-y border-[var(--rule)]">
          <Component />
        </section>

        <section className="px-5 py-12 sm:px-10 sm:py-16">
          <h2 className="mono border-b-2 border-[var(--rule-hard)] pb-3">[ What I found out ]</h2>
          <p className="mt-6 max-w-3xl text-[17px] leading-[1.55] text-[var(--carbon-2)]">
            {experiment.note}
          </p>
        </section>

        <section className="border-t-2 border-[var(--rule-hard)] px-5 py-12 sm:px-10">
          <Link href={`/lab/${next.slug}`} className="group block">
            <span className="mono text-[var(--carbon-3)]">Next experiment →</span>
            <span className="macro mt-3 block !text-[clamp(2rem,6vw,4.5rem)] group-hover:text-[var(--hazard)]">
              {next.title}
            </span>
          </Link>
        </section>
      </main>

      <RigFooter />
    </div>
  );
}
