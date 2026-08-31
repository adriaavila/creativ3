import type { Metadata } from "next";
import Link from "next/link";
import RigFooter from "@/components/rig/RigFooter";
import RigHeader from "@/components/rig/RigHeader";
import SkyDriver from "@/components/rig/SkyDriver";
import SkyPlate from "@/components/rig/SkyPlate";
import { EXPERIMENTS } from "@/components/lab/registry";

const TITLE = "Lab — working toys, not screenshots";
const DESCRIPTION =
  "Four playable experiments by Adrián Ávila Molina: the sky engine behind this site, a liquid-glass workshop, a typography flow field, and a replay of building with AI agents.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/lab" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/lab", type: "website" },
};

export default function LabPage() {
  return (
    <div className="rig min-h-screen">
      <SkyDriver />
      <RigHeader />

      <main>
        <section className="px-5 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-14">
          <p className="mono text-[var(--carbon-2)]">02 · Lab · everything here runs</p>
          <h1 className="macro mt-5">Lab</h1>
          <SkyPlate
            label={`${EXPERIMENTS.length} experiments · all client-side · none of them call an API`}
            className="mt-6 flex h-[74px] items-center sm:h-[92px]"
          />
          <p className="mt-8 max-w-2xl text-[16px] leading-[1.55] text-[var(--carbon-2)]">
            Every one of these is playable right here — drag the sliders on this page, no need to
            open anything. Each started as a question I could not answer by reading, so I built the
            smallest thing that would answer it.
          </p>
        </section>

        <div className="hairgrid border-t border-[var(--rule)] lg:grid-cols-2">
          {EXPERIMENTS.map(({ slug, unit, title, question, Component }) => (
            <section key={slug} className="p-5 sm:p-8">
              <div className="mono flex items-center justify-between text-[var(--carbon-3)]">
                <span>Unit / {unit}</span>
                <Link href={`/lab/${slug}`} className="text-[var(--hazard)] hover:underline">
                  Full size ↗
                </Link>
              </div>
              <h2 className="macro mt-5 !text-[clamp(1.8rem,4vw,2.75rem)]">{title}</h2>
              <p className="mono mt-3 text-[var(--carbon-2)] [letter-spacing:0.02em] [text-transform:none]">
                {question}
              </p>
              <div className="mt-6 border border-[var(--rule)]">
                <Component compact />
              </div>
            </section>
          ))}
        </div>
      </main>

      <RigFooter />
    </div>
  );
}
