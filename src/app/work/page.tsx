import type { Metadata } from "next";
import RigFooter from "@/components/rig/RigFooter";
import RigHeader from "@/components/rig/RigHeader";
import SkyDriver from "@/components/rig/SkyDriver";
import SkyPlate from "@/components/rig/SkyPlate";
import WorkIndex from "@/components/work/WorkIndex";
import { PORTFOLIO_PROJECTS, PROJECTS_LAST_SYNCED_AT } from "@/lib/projects";

const TITLE = "Work — every system, nothing staged";
const DESCRIPTION =
  "Every system Adrián Ávila Molina has shipped: storefronts, CRMs, property platforms, booking apps and agents. Real screenshots, real stacks, live links where they exist.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/work" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/work", type: "website" },
};

export default function WorkPage() {
  const total = PORTFOLIO_PROJECTS.length;
  const shots = PORTFOLIO_PROJECTS.reduce((n, p) => n + p.images.length, 0);

  return (
    <div className="rig min-h-screen">
      <SkyDriver />
      <RigHeader />

      <main>
        <section className="px-5 pb-10 pt-10 sm:px-10 sm:pb-14 sm:pt-14">
          <p className="mono text-[var(--carbon-2)]">01 · Work · every system, nothing staged</p>
          <h1 className="macro mt-5">Work</h1>
          <SkyPlate
            label={`${total} systems · ${shots} real screenshots · synced ${PROJECTS_LAST_SYNCED_AT}`}
            className="mt-6 flex h-[74px] items-center sm:h-[92px]"
          />
          <p className="mt-8 max-w-2xl text-[16px] leading-[1.55] text-[var(--carbon-2)]">
            No mockups on this page. Every screenshot is the product running, and every row links
            to what it does, who uses it and what holds it up. Some are live and taking money; some
            are prototypes I built to answer a question. Both are labelled.
          </p>
        </section>

        <WorkIndex projects={PORTFOLIO_PROJECTS} />
      </main>

      <RigFooter />
    </div>
  );
}
