'use client';
import { useState } from 'react';
import Link from 'next/link';
import { PROJECT_CATEGORIES, type PortfolioProject, type ProjectCategory } from '@/lib/projects';
import { chronologicalProjects, dateLabel, projectDate } from '@/lib/project-editorial';
import ProjectScreens from './ProjectScreens';

export default function WorkIndex({ projects }: { projects: PortfolioProject[] }) {
  const [filter, setFilter] = useState<'all' | ProjectCategory>('all');
  const shown = chronologicalProjects(projects).filter(p => filter === 'all' || p.categories.includes(filter));
  const years = [...new Set(shown.map(p => projectDate(p).value.slice(0, 4)))];
  return <div className="work-archive">
    <div className="archive-toolbar">
      <div role="group" aria-label="Filter systems" className="archive-filters">{PROJECT_CATEGORIES.map(category => <button key={category.id} type="button" aria-pressed={filter === category.id} onClick={() => setFilter(category.id)} className="mono">{category.label} <span>{category.id === 'all' ? projects.length : projects.filter(p => p.categories.includes(category.id as ProjectCategory)).length}</span></button>)}</div>
      <span className="mono" aria-live="polite">{shown.length} systems · newest first</span>
    </div>
    {years.map(year => <section className="archive-year" key={year} aria-label={`${year} projects`}><h2 className="macro archive-year-title">{year}<span className="mono">Selected history</span></h2>
      <ol className="archive-projects">{shown.filter(p => projectDate(p).value.startsWith(year)).map(project => <li key={project.id}>
        <Link href={`/work/${project.id}`} className="archive-project"><div className="archive-preview"><ProjectScreens project={project} /></div><div className="archive-copy"><p className="mono">{dateLabel(project)}</p><h3>{project.name} <span aria-hidden>↗</span></h3><p>{project.kind}</p><span className="mono">{project.status === 'launched' ? 'In production' : project.status === 'improving' ? 'In development' : project.status} · {project.categories.join(' / ')}</span></div></Link>
      </li>)}</ol>
    </section>)}
    {!shown.length && <p className="mono py-12">No systems in this category.</p>}
  </div>;
}
