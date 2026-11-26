/* eslint-disable @next/next/no-html-link-for-pages -- <a> simples, sin el JS de next/link, igual que en /pen */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WordmarkSvg } from "@/components/ak/Brand";
import PenLine from "@/components/pen/PenLine";
import PenShare from "@/components/pen/PenShare";
import { whatsappUrl } from "@/lib/contact";
import { IDEAS, findIdea, ideaNumber, ideaPath, ideaReply } from "@/lib/pen-ideas";
import { penFonts } from "../../fonts";
import "../../pen.css";

// Una idea del cuaderno de /pen, con su propia dirección para compartirla.
// La misma línea de la página: tacha lo que se suele creer, dibuja y subraya
// la idea. Fuera de Google mientras /pen sea una página de prueba.

export function generateStaticParams() {
  return IDEAS.map((idea) => ({ slug: idea.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const idea = findIdea(slug);
  if (!idea) return {};
  const description = idea.body[0]!;
  return {
    title: { absolute: `${idea.title} · Adrián Ávila` },
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: ideaPath(idea) },
    openGraph: { title: idea.title, description, url: ideaPath(idea), siteName: "allok", type: "article", locale: "en", authors: ["Adrián Ávila"] },
    twitter: { card: "summary_large_image", title: idea.title, description },
  };
}

export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = findIdea(slug);
  if (!idea) notFound();
  const others = IDEAS.filter((other) => other !== idea);

  return (
    <div className={`pen ${penFonts}`} lang="en">
      <PenLine />
      <header className="pen-top">
        <a className="pen-wordmark" href="/pen" aria-label="allok, back to the start">
          <WordmarkSvg />
        </a>
        <nav className="pen-nav" aria-label="Site">
          <a href="/pen#work">Work</a>
          <a href="/pen#notebook">Notebook</a>
          <a href="/pen#your-turn">Your turn</a>
        </nav>
        <a className="pen-btn is-small" href={whatsappUrl(ideaReply(idea))} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </header>

      <main>
        <article className="pen-idea" data-pen-column>
          <p className="pen-label">
            <a href="/pen#notebook">Notebook</a> · {ideaNumber(idea)}
          </p>
          <p className="pen-before">
            <span data-pen="strike">{idea.belief}</span>
          </p>
          <span className="pen-glyph" data-pen="draw" data-glyph={idea.glyph} />
          <h1 className="pen-idea-title">
            <span data-pen="underline">{idea.title}</span>
          </h1>
          <div className="pen-idea-body">
            {idea.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="pen-idea-by">Adrián Ávila</p>
          {idea.from ? (
            <a className="pen-link" href={idea.from.href}>
              {idea.from.text}
            </a>
          ) : null}
          <PenShare path={ideaPath(idea)} text={idea.title} />
        </article>

        {others.length > 0 ? (
          <section className="pen-more" aria-labelledby="pen-more-title">
            <p className="pen-label" id="pen-more-title">
              More from the notebook
            </p>
            <ul className="pen-more-list">
              {others.map((other) => (
                <li key={other.slug}>
                  <a href={ideaPath(other)}>
                    <span className="pen-label">{ideaNumber(other)}</span>
                    <span className="pen-more-title">{other.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="pen-end" aria-labelledby="pen-end-title">
          <p className="pen-label">See it differently? Even better</p>
          <h2 id="pen-end-title" className="pen-h2 is-big">
            Tell me what <em>you</em> think.
          </h2>
          <a className="pen-btn is-big" data-pen="loop" href={whatsappUrl(ideaReply(idea))} target="_blank" rel="noopener noreferrer">
            Reply on WhatsApp
          </a>
          <p className="pen-meter pen-label">
            One line, from the first word to this button · <span data-pen-meter>0.0 m</span> of ink
          </p>
        </section>
      </main>
    </div>
  );
}
