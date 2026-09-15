// Portfolio home preserved from the original allok.fun landing.
import WorkSequence from "@/components/work/WorkSequence";
import PersonalSections from "@/components/home/PersonalSections";
import SystemsConstellation from "@/components/lab/SystemsConstellation";
import { chronologicalProjects } from "@/lib/project-editorial";
import { EXPERIMENTS } from "@/components/lab/registry";
import type { Metadata } from "next";
import Link from "next/link";
import Lens from "@/components/rig/Lens";
import RigFooter from "@/components/rig/RigFooter";
import RigHeader from "@/components/rig/RigHeader";
import SkyDriver from "@/components/rig/SkyDriver";
import SkyPlate from "@/components/rig/SkyPlate";
import { Marquee } from "@/components/ui/marquee";
import { NumberTicker } from "@/components/ui/number-ticker";
import { PORTFOLIO_PROJECTS } from "@/lib/projects";

const TITLE = "Portafolio — Adrian Avila Molina";
const DESCRIPTION =
  "Industrial engineer turned design engineer. I build the software that fixes a business's bottlenecks — storefronts, CRMs, property platforms, booking apps — design through deploy, with AI agents doing the boring half.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/portfolio" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/portfolio", type: "website", locale: "en" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// Every number on this page is counted from the synced project data, never
// written by hand — if a project changes state the page changes with it.
const TOTAL = PORTFOLIO_PROJECTS.length;
const LIVE = PORTFOLIO_PROJECTS.filter((p) => p.status === "launched").length;
const OPENABLE = PORTFOLIO_PROJECTS.filter((p) => p.liveUrl).length;

const STACK = Object.entries(
  PORTFOLIO_PROJECTS.flatMap((p) => p.stack).reduce<Record<string, number>>(
    (acc, tech) => ({ ...acc, [tech]: (acc[tech] ?? 0) + 1 }),
    {},
  ),
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12);

const SELECTED = ["rei-fm", "mistica", "samer", "soapy", "ainetworking-canada"]
  .map((id) => PORTFOLIO_PROJECTS.find((p) => p.id === id))
  .filter((p): p is (typeof PORTFOLIO_PROJECTS)[number] => Boolean(p));

const SPEC = [
  {
    unit: "D-01",
    title: "Design",
    lines: [
      "Interface systems, not screens",
      "Type, grid, motion, tokens",
      "Figma optional — I design in code",
      "Accessibility is a spec, not a pass",
    ],
  },
  {
    unit: "E-02",
    title: "Engineering",
    lines: [
      "Next.js · TypeScript · Postgres",
      "Stripe, webhooks, receipts, refunds",
      "Auth, roles, audit trails",
      "Ships to Vercel, Coolify or a VPS",
    ],
  },
  {
    unit: "A-03",
    title: "Agents",
    lines: [
      "WhatsApp and voice front desks",
      "Lead capture → follow-up → sale",
      "Human handover, always",
      "Built with Claude Code and Codex",
    ],
  },
];

export default function Home() {
  return (
    <div className="rig min-h-screen">
      <SkyDriver />
      <RigHeader />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <main>
        <section className="relative border-b border-[var(--rule)]">
          <div className="flex">
            {/* index rail */}
            <div
              aria-hidden="true"
              className="mono hidden w-[86px] shrink-0 flex-col justify-between border-r border-[var(--rule)] py-8 pl-5 pr-4 text-[var(--carbon-3)] lg:flex"
            >
              <span className="text-[var(--carbon)]">
                01
                <br />
                WORK
              </span>
              <span>
                02
                <br />
                LAB
              </span>
              <span>
                03
                <br />
                CONTACT
              </span>
              <span className="text-[var(--hazard)] [writing-mode:vertical-rl]">SCROLL</span>
            </div>

            <div className="min-w-0 flex-1 px-5 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-14">
              <p className="mono text-[var(--carbon-2)]">
                Adrian Avila Molina · industrial engineer · designs and ships the whole system
              </p>

              <h1 className="macro mt-5">
                Industrial
                <SkyPlate
                  label="Dawn → dusk · the only colour on this page"
                  className="my-2 flex h-[74px] items-center sm:h-[96px] lg:ml-[9%]"
                />
                Engineer
              </h1>

              <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_360px] lg:items-start">
                <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
                  <div className="flex items-end gap-5">
                    <data value={TOTAL} className="macro !text-[clamp(5rem,15vw,13rem)] tabular-nums">
                      <NumberTicker value={TOTAL} className="text-[var(--carbon)]" />
                    </data>
                    <dl className="mono mb-4 grid gap-1">
                      <div>
                        <dt className="inline">Systems</dt>
                      </div>
                      <div className="text-[var(--carbon-2)]">
                        <dd className="inline">{LIVE} in production</dd>
                      </div>
                      <div className="text-[var(--hazard)]">
                        <dd className="inline">{OPENABLE} you can open right now</dd>
                      </div>
                    </dl>
                  </div>
                  <Lens href="/work">See the work</Lens>
                </div>

                <p className="border-t-2 border-[var(--rule-hard)] pt-4 text-[16px] leading-[1.55] text-[var(--carbon-2)]">
                  Industrial engineering taught me to read a business as a system — bottlenecks,
                  throughput, waste. I build the software that fixes them: storefronts, CRMs,
                  property platforms, booking apps. Design, frontend, backend and deploy, by the
                  same pair of hands, with agents doing the boring half.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TICKER ───────────────────────────────────────────── */}
        <div className="border-b border-[var(--rule)] bg-[var(--carbon)] text-[var(--paper)]">
          <Marquee className="[--duration:52s] [--gap:2.5rem] py-3">
            {PORTFOLIO_PROJECTS.map((p) => (
              <span key={p.id} className="mono flex items-center gap-10 whitespace-nowrap">
                {p.name}
                <span className="text-[var(--hazard)]">◆</span>
              </span>
            ))}
          </Marquee>
        </div>

        {/* ─── SELECTED SYSTEMS ─────────────────────────────────── */}
        <section className="border-b border-[var(--rule)] px-5 py-16 sm:px-10 sm:py-24">
          <div className="mono flex items-baseline justify-between border-b-2 border-[var(--rule-hard)] pb-3">
            <h2 className="mono">[ Selected systems ]</h2>
            <Link href="/work" className="text-[var(--hazard)] hover:underline">
              All {TOTAL} ↗
            </Link>
          </div>

          <WorkSequence projects={chronologicalProjects(SELECTED)} />
        </section>

        {/* ─── SPEC SHEET ───────────────────────────────────────── */}
        <section className="border-b border-[var(--rule)] px-5 py-16 sm:px-10 sm:py-24">
          <h2 className="mono border-b-2 border-[var(--rule-hard)] pb-3">[ Capability spec ]</h2>
          <div className="hairgrid mt-px md:grid-cols-3">
            {SPEC.map((block) => (
              <div key={block.unit} className="p-6 sm:p-8">
                <div className="mono flex items-center justify-between text-[var(--carbon-3)]">
                  <span>Unit / {block.unit}</span>
                  <span aria-hidden="true">+</span>
                </div>
                <h3 className="macro mt-6 !text-[clamp(2rem,4.5vw,3.25rem)]">{block.title}</h3>
                <ul className="mono mt-6 grid gap-2 text-[var(--carbon-2)] [text-transform:none] [letter-spacing:0.02em]">
                  {block.lines.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span aria-hidden="true" className="text-[var(--hazard)]">
                        {"///"}
                      </span>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ─── STACK, BY FREQUENCY ──────────────────────────────── */}
        <section className="border-b border-[var(--rule)] px-5 py-16 sm:px-10 sm:py-24">
          <h2 className="mono border-b-2 border-[var(--rule-hard)] pb-3">
            [ Stack · counted across {TOTAL} builds ]
          </h2>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5">
            {STACK.map(([tech, count]) => (
              <div key={tech} className="flex items-baseline gap-2">
                <dt className="text-[clamp(1.1rem,2.4vw,1.6rem)] font-medium tracking-[-0.02em]">
                  {tech}
                </dt>
                <dd className="mono tabular-nums text-[var(--hazard)]">×{count}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ─── LAB ──────────────────────────────────────────────── */}
        <section className="px-5 py-16 sm:px-10 sm:py-24">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end">
            <div>
              <h2 className="mono text-[var(--carbon-2)]">[ The lab ]</h2>
              <p className="macro mt-4 !text-[clamp(2.4rem,7vw,5.5rem)]">Things I built to find out</p>
            </div>
            <p className="text-[16px] leading-[1.55] text-[var(--carbon-2)]">
              Working toys, not screenshots: the sky engine behind this page with its knobs
              exposed, the glass kit you can re-tune and copy out, a typography field you can push
              around. Each one is a question I wanted answered.
              <Link
                href="/lab"
                className="mono ml-3 whitespace-nowrap text-[var(--hazard)] hover:underline"
              >
                Open the lab ↗
              </Link>
            </p>
          </div>
          <div className="mt-12"><SystemsConstellation compact /></div>
          <div className="lab-preview-links">{EXPERIMENTS.filter(e => e.slug !== "systems-constellation").map(e => <Link key={e.slug} href={`/lab/${e.slug}`}><div className={`lab-miniature lab-miniature-${e.slug}`} aria-hidden><span>{e.slug === "sky-machine" ? "◒" : e.slug === "glass-forge" ? "◉" : e.slug === "type-weather" ? "Aa" : ">_"}</span></div><span className="mono">{e.unit} / Explore ↗</span><h3>{e.title}</h3><p>{e.question}</p></Link>)}</div>
        </section>
        <PersonalSections />
      </main>

      <RigFooter />
    </div>
  );
}
