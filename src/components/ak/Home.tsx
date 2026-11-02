import {
  BUILDS,
  GITHUB,
  SAY_HI,
  formatDate,
  isNew,
  logOrder,
  nextShip,
  reservedSlot,
  showcaseOrder,
  today,
  type Build,
} from "@/lib/builds";
import { Outcome, Rise, WordmarkSvg, vars } from "./Brand";
import { Capture } from "./Demos";

// The allok.fun home, built only from the design system's pieces, in its
// order: Header, Hero, one Showcase per build, Log, Principles, Closer.
// Markup and classes are the system's cards 1:1; content comes from
// src/lib/builds.ts.

function Header() {
  return (
    <header className="header" data-hide-on-scroll>
      <a className="wordmark" href="#top" aria-label="allok, home">
        <WordmarkSvg />
      </a>
      <span />
      <div className="header-end">
        <a className="btn btn-link" href="#work">Work</a>
        <a className="btn btn-link" href="#principles">Principles</a>
        <a className="btn btn-primary" href={SAY_HI}>Say hi</a>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" data-theme="cloud" data-stagger>
      <p className="label" data-reveal="fade">Adrián · allok</p>
      <h1 className="statement" data-reveal="rise" style={vars({ "--d": "120ms" })}>
        <Rise>All business</Rise>
        <Rise line={1}>
          <Outcome>OK</Outcome>
        </Rise>
      </h1>
      <div className="hero-foot">
        <p className="lead" data-reveal style={vars({ "--d": "520ms" })}>
          I&apos;m Adrián. I build AI systems that take the busywork off your business — one every two weeks, in public,
          with the code.
        </p>
        <a className="btn btn-link" href="#work" data-reveal style={vars({ "--d": "620ms" })}>
          See the work <span className="arw arw-down" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}

function Status({ status }: { status: Build["status"] }) {
  return <span className={`status ${status}`}>{status === "live" ? "Live" : status === "building" ? "Building" : "Archived"}</span>;
}

function Showcase({ build, now }: { build: Build; now: string }) {
  const featured = !!build.featured;
  const shipped = build.status === "live" && build.date <= now;
  return (
    <section
      className="show"
      data-theme={featured ? "blue" : "cloud"}
      data-reveal={featured ? "field" : undefined}
      data-stagger
      id={build.slug}
    >
      <div className="show-stage" data-reveal={featured ? undefined : "stage"}>
        <Capture build={build} />
      </div>
      <div className="show-cap">
        <div>
          <h2 className="show-name" data-reveal="rise" style={vars({ "--d": "150ms" })}>
            <Rise>{build.name}</Rise>
          </h2>
          <p className="show-line" data-reveal style={vars({ "--d": "200ms" })}>
            {build.line}
          </p>
        </div>
        <div className="show-meta" data-reveal style={vars({ "--d": "250ms" })}>
          <span className="caption">
            {shipped ? formatDate(build.date) : `Ships ${formatDate(build.date)}`}
            {isNew(build, now) ? (
              <>
                {" · "}
                <span className="is-new">New</span>
              </>
            ) : null}
          </span>
          <Status status={build.status} />
          {build.tryIt ? (
            <a className="btn btn-solid" href={build.tryIt.url}>
              {build.tryIt.label} <span className="arw arw-ne" aria-hidden="true">↗</span>
            </a>
          ) : null}
          {build.code ? (
            <a className={build.tryIt ? "btn btn-link" : "btn btn-solid"} href={build.code}>
              Code <span className="arw arw-ne" aria-hidden="true">↗</span>
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Log({ now, next }: { now: string; next: string | null }) {
  return (
    <section className="section" data-theme="cloud" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">Every two weeks</p>
        <h2 className="headline" data-reveal="rise">
          <Rise>Shipped.</Rise>
        </h2>
        <p data-reveal>
          One new build every two weeks, with the code.{next ? ` Next: ${formatDate(next)}.` : ""}
        </p>
      </div>
      <div className="log" role="list" data-stagger>
        <div className="log-row slot" role="listitem" data-reveal="row">
          <span className="log-date">{formatDate(reservedSlot())}</span>
          <span className="log-what">
            <span className="log-name">Next build</span>
            <span className="log-line">Announced when it hits the workshop.</span>
          </span>
          <span aria-hidden="true" />
          <span className="log-code" style={{ color: "var(--text-muted)" }}>—</span>
        </div>
        {logOrder().map((b) => (
          <a className="log-row" role="listitem" href={`#${b.slug}`} data-reveal="row" key={b.slug}>
            <span className="log-date">
              {formatDate(b.date)}
              {isNew(b, now) ? (
                <>
                  {" · "}
                  <span className="is-new">New</span>
                </>
              ) : null}
            </span>
            <span className="log-what">
              <span className="log-name">{b.name}</span>
              <span className="log-line">
                {b.problem} → {b.does}
              </span>
            </span>
            <Status status={b.status} />
            {b.code ? (
              <span className="log-code">
                Code <span className="arw arw-ne" aria-hidden="true">↗</span>
              </span>
            ) : (
              <span className="log-code" style={{ color: "var(--text-muted)" }}>—</span>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}

const PRINCIPLES: [string, string][] = [
  ["Show the work.", "If it isn't working, it isn't real. A link you can try beats a deck you have to believe."],
  ["Start from first principles.", "Not “where does AI fit?” but “what is this person actually trying to do?” Build only that."],
  ["Machines do machine work.", "Repetition belongs to software. People get their time back for what only people can do."],
  ["Superpowers are for everyone.", "What only big companies could afford a few years ago should fit any business, anywhere."],
  ["Open by default.", "Every build ships with its code. Read it, fork it, own it."],
  ["Small, real, often.", "One working thing every two weeks beats a perfect plan next year."],
  ["All business OK.", "Good technology is calm. The business just runs, and nobody has to think about the system."],
];

function Principles() {
  return (
    <section className="section" id="principles" data-theme="ink" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">Principles</p>
        <h2 className="headline" data-reveal="rise">
          <Rise>What I</Rise>
          <Rise line={1}>believe.</Rise>
        </h2>
        <p data-reveal>Every build has to pass all seven before it ships.</p>
      </div>
      <ol className="principles" data-stagger data-reading>
        {PRINCIPLES.map(([name, line]) => (
          <li data-reveal="row" key={name}>
            <b>{name}</b>
            <span>{line}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Closer({ next }: { next: string | null }) {
  return (
    <footer className="closer" id="contacto" data-theme="ink" data-stagger>
      <p className="label" data-reveal="fade">Adrián · allok</p>
      {next ? (
        <>
          <h2 className="headline" data-reveal="rise">
            <Rise>Next one ships</Rise>
            <Rise line={1}>
              <Outcome>{formatDate(next)}</Outcome>
            </Rise>
          </h2>
          <p className="caption tick" data-reveal style={vars({ "--d": "300ms" })}>
            In{" "}
            <span data-tick={`${next}T12:00:00-04:00`} data-tick-done="today">
              {Math.max(0, Math.round((Date.parse(`${next}T12:00:00Z`) - Date.parse(`${today()}T12:00:00Z`)) / 86_400_000))}d
            </span>
          </p>
        </>
      ) : (
        <h2 className="headline" data-reveal="rise">
          <Rise>Next one is</Rise>
          <Rise line={1}>
            <Outcome>in the workshop</Outcome>
          </Rise>
        </h2>
      )}
      <p className="lead" data-reveal style={vars({ "--d": "300ms" })}>
        Follow along, fork the code, or tell me which busywork to end next.
      </p>
      <a className="btn btn-primary" href={SAY_HI} data-reveal style={vars({ "--d": "300ms" })}>
        Say hi <span className="arw arw-ne" aria-hidden="true">↗</span>
      </a>
      <div className="closer-foot">
        <span className="wordmark">
          <WordmarkSvg />
        </span>
        <span>All business OK.</span>
        <nav>
          <a href={SAY_HI}>
            hi@allok.fun <span className="arw arw-ne" aria-hidden="true">↗</span>
          </a>
          <a href={GITHUB}>
            GitHub <span className="arw arw-ne" aria-hidden="true">↗</span>
          </a>
          <a href="#top">
            Top <span className="arw arw-up" aria-hidden="true">↑</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default function AllokHome() {
  const now = today();
  const next = nextShip(BUILDS, now);
  return (
    <>
      <Header />
      <Hero />
      <div id="work">
        {showcaseOrder().map((b) => (
          <Showcase build={b} now={now} key={b.slug} />
        ))}
      </div>
      <Log now={now} next={next} />
      <Principles />
      <Closer next={next} />
    </>
  );
}
