import type { Metadata } from 'next';
import Link from 'next/link';
import RigHeader from '@/components/rig/RigHeader';
import RigFooter from '@/components/rig/RigFooter';
import SkyDriver from '@/components/rig/SkyDriver';
import { WRITING } from '@/lib/writing';
export const metadata: Metadata = { title: 'Writing — notes from the work', description: 'Notes on interfaces, agents and building useful software.', alternates: { canonical: '/writing' } };
export default function WritingPage() { return <div className="rig min-h-screen"><SkyDriver /><RigHeader /><main className="personal-section"><span className="mono">Field notes / Adrian Avila Molina</span><h1 className="macro mt-6">Writing</h1><p className="mt-8 max-w-xl text-lg">Decisions, observations and questions from the things I build.</p><div className="writing-list mt-16">{WRITING.map(note => <Link key={note.slug} href={`/writing/${note.slug}`}><span className="mono">{note.category}</span><h2>{note.title} ↗</h2><p>{note.summary}</p></Link>)}</div></main><RigFooter /></div>; }
