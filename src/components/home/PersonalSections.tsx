import Link from 'next/link';
import { WRITING } from '@/lib/writing';
const EXPERIENCE = [
  ['2026 — present', 'AI Product Builder & Founder', 'Servicios Creativos / Creativv', 'Business websites, internal tools and AI-assisted products. Product definition through deployment.'],
  ['2022 — present', 'Business Intelligence Consultant', 'Independent', 'KPI systems, dashboards and reporting automation for small businesses and digital teams.'],
  ['2019 — 2022', 'Data Analyst & Automation Specialist', 'SAMER · Tarija, Bolivia', 'Procurement, operating costs and project performance made visible through data and automated reporting.'],
  ['2018', 'Junior Engineer Intern', 'SICOMAC · Tarija, Bolivia', 'Production monitoring and OEE tracking for ceramic manufacturing.'],
];
export default function PersonalSections() {
  return <>
    <aside className="personal-interlude"><span className="mono">A little space of my own</span><p>A personal website should feel like you’ve briefly left the rest of the internet.</p><span className="mono">Stay a little. Look around.</span></aside>
    <section className="personal-section" id="fragments"><div className="section-rule"><h2 className="mono">[ Fragments of me ]</h2><span className="mono">The person behind the systems</span></div>
      <div className="fragments-grid">
        <article className="fragment-engineering"><span className="mono">01 / A way of seeing</span><h3>Everything<br />connects.</h3><div className="fragment-path mono"><span>Observe</span><span>→</span><span>Understand</span><span>→</span><span>Build</span></div><p>Industrial engineering taught me to look for the bottleneck. Building software gave me another way to remove it.</p></article>
        <article className="fragment-location"><span className="mono">02 / Here, working everywhere</span><div className="location-orbit" aria-hidden><span>VE</span><i /></div><h3>Based in Venezuela.<br />Built for real life.</h3><p>From production lines in Bolivia to remote work on digital products. The setting changes; the curiosity stays.</p></article>
        <article className="fragment-data"><span className="mono">03 / Before the interface</span><h3>I worked<br />with the numbers.</h3><p>Dashboards, reporting and operating KPIs came before the apps. I still want to know what a product actually changes.</p><Link href="#experience" className="mono">The longer story ↓</Link></article>
      </div>
    </section>
    <section id="experience" className="personal-section"><div className="section-rule"><h2 className="mono">[ Experience ]</h2><span className="mono">Engineering → data → products</span></div><div className="experience-list">{EXPERIENCE.map(([date, title, company, description]) => <article key={company}><p className="mono">{date}</p><div><h3>{title}</h3><span className="mono">{company}</span></div><p>{description}</p></article>)}</div><div className="education mono"><span>Industrial Engineering · UNC · 2012–2020</span><span>Digital Business Diploma · UCA · 2021–2022</span></div></section>
    <section className="personal-section" id="reading"><div className="section-rule"><h2 className="mono">[ Readings ]</h2><span className="mono">On my desk, right now</span></div><div className="reading-layout"><div className="reading-cover" aria-label="Typographic reading card for Dopamine"><span className="mono">Currently reading / 01</span><p>Dopa<br />mine<span>↗</span></p><div className="book-lines" aria-hidden /></div><div className="reading-copy"><span className="mono">In progress</span><h3>Dopamine.</h3><p>A small place for what I’m reading, alongside what I’m building.</p><span className="mono">Notes will come after the reading.</span></div></div></section>
    <section className="personal-section" id="writing"><div className="section-rule"><h2 className="mono">[ Writing ]</h2><Link className="mono" href="/writing">All notes ↗</Link></div><div className="writing-list">{WRITING.map((note, index) => <Link key={note.slug} href={`/writing/${note.slug}`}><span className="mono">0{index + 1} / {note.category}</span><h3>{note.title}<span aria-hidden>↗</span></h3><p>{note.summary}</p></Link>)}</div></section>
  </>;
}
