'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { PortfolioProject } from '@/lib/projects';
import { dateLabel, projectStory } from '@/lib/project-editorial';
import ProjectScreens from './ProjectScreens';

export default function WorkSequence({ projects }: { projects: PortfolioProject[] }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const entries = root.current?.querySelectorAll<HTMLElement>('[data-story]');
    if (!entries) return;
    const observer = new IntersectionObserver(records => {
      for (const record of records) if (record.isIntersecting) setActive(Number((record.target as HTMLElement).dataset.story));
    }, { rootMargin: '-25% 0px -45% 0px', threshold: 0 });
    entries.forEach(entry => observer.observe(entry));
    return () => observer.disconnect();
  }, []);
  const selected = projects[active];
  if (!selected) return null;
  return <div ref={root} className="work-sequence">
    <ol className="sequence-stories">
      {projects.map((project, index) => {
        const story = projectStory(project);
        return <li key={project.id} data-story={index} className="sequence-story" data-active={index === active}>
          <p className="mono timeline-date"><span className="timeline-dot" aria-hidden />{dateLabel(project)}</p>
          <Link href={`/work/${project.id}`} className="story-title" onFocus={() => setActive(index)}>{project.name}<span aria-hidden>↗</span></Link>
          <p className="story-problem">{story.problem}</p>
          <dl className="story-detail"><div><dt className="mono">My contribution</dt><dd>{story.contribution}</dd></div><div><dt className="mono">What it enables</dt><dd>{story.outcome}</dd></div></dl>
          <div className="sequence-mobile"><ProjectScreens project={project} /></div>
          <Link className="mono story-read" href={`/work/${project.id}`}>Inside the project ↗</Link>
        </li>;
      })}
    </ol>
    <div className="sequence-stage" aria-hidden="true">
      <div className="stage-topline mono"><span>Selected systems / field notes</span><span>{String(active + 1).padStart(2, '0')} — {String(projects.length).padStart(2, '0')}</span></div>
      <div className="stage-image">
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={selected.id} className="stage-layer" initial={{ opacity: 0, scale: reduced ? 1 : .975 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .45 }}>
            <ProjectScreens project={selected} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="stage-caption"><span>{selected.name}</span><span className="mono">{selected.images.length ? 'Real product screens' : 'The service, mapped'}</span></div>
      <div className="stage-progress">{projects.map((project, index) => <span key={project.id} data-active={index === active} />)}</div>
    </div>
  </div>;
}
