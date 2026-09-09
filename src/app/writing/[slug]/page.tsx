import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import RigHeader from '@/components/rig/RigHeader';
import RigFooter from '@/components/rig/RigFooter';
import SkyDriver from '@/components/rig/SkyDriver';
import { WRITING } from '@/lib/writing';
type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return WRITING.map(note => ({ slug: note.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = WRITING.find(n => n.slug === slug);
  return note ? { title: note.title, description: note.summary, alternates: { canonical: `/writing/${slug}` }, openGraph: { type: 'article', title: note.title, description: note.summary } } : {};
}
export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = WRITING.find(n => n.slug === slug);
  if (!note) notFound();
  return <div className="rig min-h-screen"><SkyDriver /><RigHeader /><main className="note-page"><Link className="mono" href="/writing">← All writing</Link><article><p className="mono note-category">{note.category}</p><h1>{note.title}</h1><p className="note-deck">{note.summary}</p><span className="mono">Adrian Avila Molina · Project note</span><div className="note-body">{note.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>{note.project ? <><Link className="mono" href={`/work/${note.project}`}>Explore {note.projectName} ↗</Link>{note.project === 'vocero-crm' && <p className="mt-6"><a className="underline" href="https://github.com/kevinrivm/vocero-crm">Original Vocero CRM by Kevin Belier ↗</a></p>}</> : null}</article></main><RigFooter /></div>;
}
