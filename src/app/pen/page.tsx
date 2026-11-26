import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import { WordmarkSvg } from "@/components/ak/Brand";
import PenLine from "@/components/pen/PenLine";
import PenSketch from "@/components/pen/PenSketch";
import { propsDeImagen } from "@/components/vitrina/imagen";
import { HOME_WHATSAPP_MESSAGE, whatsappUrl } from "@/lib/contact";
import { AGENT, SKETCHBOOK, SKETCH_EXAMPLES, STORIES, countWord, type Story } from "@/lib/pen";
import "./pen.css";

// «I never lift the pen»: el concepto de portada que Adrián eligió el 25 de
// noviembre de 2026, en blanco. Una sola línea recorre la página: tacha cada
// problema, dibuja la pieza, subraya el resultado y envuelve la captura.
// Es una página de prueba: fuera del menú, del sitemap y de Google hasta que
// él decida si reemplaza la portada.

const sans = Geist({ subsets: ["latin"], variable: "--font-pen-sans", display: "swap" });
const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-pen-serif",
  display: "swap",
});

const TITLE = "I never lift the pen · Adrián Ávila";
const DESCRIPTION =
  "Websites, systems and AI agents by Adrián Ávila. One line crosses out each problem and draws what replaced it.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  alternates: { canonical: "/pen" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/pen", siteName: "allok", type: "website", locale: "en" },
};

const SIZES = {
  desktop: "(max-width: 760px) 92vw, 56vw",
  phone: "(max-width: 760px) 70vw, 300px",
  tile: "(max-width: 760px) 44vw, 28vw",
};

function Shot({ story }: { story: Story }) {
  const { image } = story;
  const ratio = image.phone ? image.ratio : 16 / 10;
  const img = propsDeImagen({
    src: image.src,
    alt: image.alt,
    fill: true,
    sizes: image.phone ? SIZES.phone : SIZES.desktop,
    loading: "lazy",
  });
  return (
    <figure className={image.phone ? "pen-frame is-phone" : "pen-frame"}>
      <div className="pen-shot" data-pen="wrap" style={{ aspectRatio: String(+ratio.toFixed(4)) } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element -- es el <img> de next/image, sin su JS */}
        <img {...img} alt={image.alt} />
      </div>
      <figcaption className="pen-label">
        {story.name}
        {story.note ? ` · ${story.note}` : ""}
      </figcaption>
    </figure>
  );
}

export default function PenPage() {
  const wa = whatsappUrl(HOME_WHATSAPP_MESSAGE);
  return (
    <div className={`pen ${sans.variable} ${serif.variable}`} lang="en">
      <PenLine />
      <noscript>
        <style>{`.pen [data-pen] img,.pen [data-pen-tile] img{filter:none!important;opacity:1!important}`}</style>
      </noscript>

      <header className="pen-top">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- <a> simple, sin JS de next/link */}
        <a className="pen-wordmark" href="/" aria-label="allok, home">
          <WordmarkSvg />
        </a>
        <nav className="pen-nav" aria-label="On this page">
          <a href="#work">Work</a>
          <a href="#sketchbook">Sketchbook</a>
          <a href="#your-turn">Your turn</a>
        </nav>
        <a className="pen-btn is-small" href={wa} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </header>

      <main>
        <section className="pen-hero" data-pen-pad aria-labelledby="pen-title">
          <p className="pen-label">Adrián Ávila · Engineer</p>
          <h1 id="pen-title" className="pen-display" data-pen="start">
            I never lift
            <br />
            the <em>pen.</em>
          </h1>
          <p className="pen-lead">
            I design and build websites, systems and AI agents. Each one starts as somebody’s problem. Scroll: the line
            crosses it out and draws what replaced it.
          </p>
          <p className="pen-hint pen-label" aria-hidden="true">
            Move your mouse. The pen is yours until you scroll.
          </p>
        </section>

        <section className="pen-section" id="work" data-pen-column aria-labelledby="pen-work-title">
          <header className="pen-head">
            <p className="pen-label">Results</p>
            <h2 id="pen-work-title" className="pen-h2">
              {countWord(STORIES.length)} problems, <em>crossed out.</em>
            </h2>
          </header>

          {STORIES.map((story, i) => (
            <article className="pen-story" key={story.id}>
              <p className="pen-label">
                {story.n} · {story.label}
              </p>
              <p className="pen-before">
                <span data-pen="strike">{story.before}</span>
              </p>
              <div className={i % 2 === 1 ? "pen-row is-flip" : "pen-row"}>
                <div className="pen-after">
                  <span className="pen-glyph" data-pen="draw" data-glyph={story.glyph} />
                  <h3 className="pen-result">
                    <span data-pen="underline">{story.after}</span>
                  </h3>
                  <p className="pen-body">{story.body}</p>
                  {story.link ? (
                    <a
                      className="pen-link"
                      href={story.link.href}
                      {...(story.link.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {story.link.text}
                    </a>
                  ) : null}
                </div>
                <Shot story={story} />
              </div>
            </article>
          ))}

          <article className="pen-story is-agent">
            <p className="pen-label">
              {String(STORIES.length + 1).padStart(2, "0")} · {AGENT.label}
            </p>
            <p className="pen-before">
              <span data-pen="strike">{AGENT.before}</span>
            </p>
            <div className="pen-row is-agent">
              <span className="pen-glyph is-big" data-pen="draw" data-glyph="bubble" />
              <div className="pen-after">
                <h3 className="pen-result">
                  <span data-pen="underline">{AGENT.after}</span>
                </h3>
                <p className="pen-body">{AGENT.body}</p>
                <a className="pen-link" href={AGENT.link.href}>
                  {AGENT.link.text}
                </a>
              </div>
            </div>
          </article>
        </section>

        <section className="pen-section" id="sketchbook" aria-labelledby="pen-book-title">
          <header className="pen-head">
            <p className="pen-label">Creative work</p>
            <h2 id="pen-book-title" className="pen-h2">
              The rest of the <em>sketchbook.</em>
            </h2>
            <p className="pen-sub">Brands, stores and a World Cup game. Smaller pieces, same hand.</p>
          </header>
          <ul className="pen-tiles" data-pen="weave">
            {SKETCHBOOK.map((tile) => {
              const img = propsDeImagen({ src: tile.src, alt: tile.alt, fill: true, sizes: SIZES.tile, loading: "lazy" });
              return (
                <li className="pen-tile" key={tile.id} data-pen-tile>
                  <a href={`/trabajo#pieza=${tile.id}`}>
                    <div className="pen-shot">
                      {/* eslint-disable-next-line @next/next/no-img-element -- es el <img> de next/image, sin su JS */}
                      <img {...img} alt={tile.alt} />
                    </div>
                    <p className="pen-label">
                      {tile.kind} · {tile.status}
                    </p>
                    <h3 className="pen-tile-name">{tile.name}</h3>
                    <p className="pen-tile-line">{tile.line}</p>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="pen-section pen-turn" id="your-turn" aria-labelledby="pen-turn-title">
          <header className="pen-head">
            <p className="pen-label">Your turn</p>
            <h2 id="pen-turn-title" className="pen-h2">
              What eats <em>your</em> time?
            </h2>
            <p className="pen-sub">
              Tell the pen. It crosses your problem out and sketches what could replace it, while you watch.
            </p>
          </header>
          <PenSketch examples={SKETCH_EXAMPLES} />
        </section>

        <section className="pen-end" aria-labelledby="pen-end-title">
          <p className="pen-label">The line is still going</p>
          <h2 id="pen-end-title" className="pen-h2 is-big">
            Where should it go <em>next?</em>
          </h2>
          <a className="pen-btn is-big" data-pen="loop" href={wa} target="_blank" rel="noopener noreferrer">
            Message me on WhatsApp
          </a>
          <p className="pen-meter pen-label">
            One line, from the headline to this button · <span data-pen-meter>0.0 m</span> of ink
          </p>
        </section>
      </main>
    </div>
  );
}
