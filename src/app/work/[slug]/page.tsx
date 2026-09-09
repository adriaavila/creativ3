import type { Metadata } from "next";
import ProjectScreens from "@/components/work/ProjectScreens";
import ScreenGallery from "@/components/work/ScreenGallery";
import { chronologicalProjects, dateLabel, projectStory } from "@/lib/project-editorial";
import Link from "next/link";
import { notFound } from "next/navigation";
import RigFooter from "@/components/rig/RigFooter";
import RigHeader from "@/components/rig/RigHeader";
import SkyDriver from "@/components/rig/SkyDriver";
import SkyPlate from "@/components/rig/SkyPlate";
import { PORTFOLIO_PROJECTS, type PortfolioProject } from "@/lib/projects";

type Params = { slug: string };

export function generateStaticParams() {
  return PORTFOLIO_PROJECTS.map((project) => ({ slug: project.id }));
}

const find = (slug: string) => PORTFOLIO_PROJECTS.find((p) => p.id === slug);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const project = find((await params).slug);
  if (!project) return {};
  const title = `${project.name} — ${project.kind}`;
  return {
    title,
    description: project.description,
    alternates: { canonical: `/work/${project.id}` },
    openGraph: {
      title,
      description: project.description,
      url: `/work/${project.id}`,
      type: "article",
    },
  };
}

const STATUS_COPY: Record<PortfolioProject["status"], string> = {
  launched: "In production",
  improving: "In development",
  demo: "Demo",
  prototype: "Prototype",
};

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-5 sm:p-6">
      <dt className="mono text-[var(--carbon-3)]">{label}</dt>
      <dd className="mono mt-2 [letter-spacing:0.02em] [text-transform:none]">{children}</dd>
    </div>
  );
}

export default async function CasePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const project = find(slug);
  if (!project) notFound();

  const ordered = chronologicalProjects(PORTFOLIO_PROJECTS);
  const index = ordered.indexOf(project);
  const next = ordered[(index + 1) % ordered.length];
  const previous = ordered[(index - 1 + ordered.length) % ordered.length];
  const story = projectStory(project);

  return (
    <div className="rig min-h-screen">
      <SkyDriver />
      <RigHeader />

      <main>
        <section className="px-5 pb-8 pt-10 sm:px-10 sm:pt-14">
          <div className="mono flex items-center justify-between text-[var(--carbon-3)]">
            <Link href="/work" className="text-[var(--carbon)] hover:text-[var(--hazard)]">
              ← Work
            </Link>
            <span>
              Unit {String(index + 1).padStart(2, "0")} / {PORTFOLIO_PROJECTS.length}
            </span>
          </div>

          <h1 className="macro mt-6 !text-[clamp(2.6rem,9vw,8rem)]">{project.name}</h1>
          <p className="mt-5 max-w-3xl text-[clamp(1.15rem,2.6vw,1.75rem)] leading-[1.25] tracking-[-0.02em]">
            {project.kind}
          </p>
        </section>

        <SkyPlate
          label={STATUS_COPY[project.status]}
          className="flex h-[74px] items-center sm:h-[92px]"
        />

        {/* ── Spec sheet ── */}
        <dl className="hairgrid border-y border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-4">
          <Spec label="Status">{STATUS_COPY[project.status]}</Spec>
          <Spec label="Chronology">{dateLabel(project)}</Spec>
          <Spec label="Stack">{project.stack.join(" · ")}</Spec>
          <Spec label="Agent role">{project.agentRole}</Spec>
        </dl>

        {/* ── The story ── */}
        <section className="grid gap-10 px-5 py-14 sm:px-10 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2 className="mono border-b-2 border-[var(--rule-hard)] pb-3">[ The problem ]</h2>
            <p className="mt-6 text-[17px] leading-[1.55] text-[var(--carbon-2)]">
              {story.problem}
            </p>
          </div>
          <div>
            <h2 className="mono border-b-2 border-[var(--rule-hard)] pb-3">[ My contribution ]</h2>
            <p className="mt-6 text-[17px] leading-[1.55] text-[var(--carbon-2)]">{story.contribution}</p>
            {story.outcome ? (
              <p className="mt-4 text-[17px] leading-[1.55] text-[var(--carbon-2)]">
                {story.outcome}
              </p>
            ) : null}
            <div className="mono mt-8 flex flex-wrap gap-x-8 gap-y-3">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  className="text-[var(--hazard)] underline-offset-4 hover:underline"
                >
                  Open it live ↗
                </a>
              ) : null}
              {project.sourceUrl ? (
                <a href={project.sourceUrl} className="text-[var(--carbon-2)] hover:text-[var(--carbon)]">
                  Source ↗
                </a>
              ) : null}
              <span className="text-[var(--carbon-3)]">Last push · {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(project.githubPushedAt))}</span>
            </div>
          </div>
        </section>

        {/* ── The product, running ── */}
        {project.images.length > 0 ? (
          <section className="border-t border-[var(--rule)]">
            <h2 className="mono border-b border-[var(--rule)] px-5 py-4 sm:px-10">
              [ {project.id === 'vocero-crm' ? 'Upstream reference interface' : 'The product, running'} · {project.images.length} frames ]
            </h2>
            <ScreenGallery images={project.images} name={project.name} />
          </section>
        ) : <section className="mx-auto max-w-4xl border-t border-[var(--rule)] py-10"><ProjectScreens project={project} /></section>}

        {project.attribution && <p className="px-5 py-8 sm:px-10">Built on <a className="underline" href={project.attribution.url}>{project.attribution.name}</a>. The agency adaptation is my contribution.</p>}
        {/* ── Next ── */}
        <section className="border-t-2 border-[var(--rule-hard)] px-5 py-12 sm:px-10">
          <Link className="mono mb-8 block" href={`/work/${previous.id}`}>← Previous: {previous.name}</Link>
          <Link href={`/work/${next.id}`} className="group block">
            <span className="mono text-[var(--carbon-3)]">Next system →</span>
            <span className="macro mt-3 block !text-[clamp(2rem,6vw,4.5rem)] group-hover:text-[var(--hazard)]">
              {next.name}
            </span>
          </Link>
        </section>
      </main>

      <RigFooter />
    </div>
  );
}
