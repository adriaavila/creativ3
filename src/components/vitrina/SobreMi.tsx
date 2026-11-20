import { Outcome, Rise } from "@/components/ak/Brand";

/**
 * Quién lo hace, en Ink: la regla del ok primero, después de dónde viene.
 * Sin foto todavía: cuando la haya, entra como un hijo más de `.sobre-mi`,
 * antes del texto, sin tocar el resto.
 */
export default function SobreMi() {
  return (
    <section id="sobre-mi" aria-labelledby="sobre-mi-titulo" className="section" data-theme="ink" data-stagger>
      <div className="section-title">
        <p className="label" data-reveal="fade">
          About me
        </p>
        <h2 id="sobre-mi-titulo" className="headline" data-reveal="rise">
          <Rise>Nothing ships without my ok.</Rise>
          <Rise line={1}>
            <Outcome>Or without yours</Outcome>
          </Rise>
        </h2>
      </div>
      <div className="sobre-mi">
        <p className="subhead" data-reveal>
          I decide what gets built and review every screen before you see it. You decide what reaches your customers.
        </p>
        <p className="body" data-reveal>
          I&apos;m Adrián Avila, an industrial engineer. I started out measuring output at a ceramics factory in Tarija, then
          spent three years at SAMER, the construction company, making its purchases, costs and the progress of every project
          visible with data. That&apos;s where I learned to see a business as a system: where it gets stuck, where work repeats,
          where money leaks.
        </p>
        <p className="body" data-reveal>
          Today, from Venezuela, I design and build the software that unblocks it. I work alone, with AI agents that write a
          good part of the code, so from the first conversation to delivery you talk to me.
        </p>
        <a className="btn btn-link" href="#empezar" data-reveal>
          How we start <span className="arw arw-down" aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}
