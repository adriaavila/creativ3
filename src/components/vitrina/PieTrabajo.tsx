import Link from "next/link";
import { Outcome, Rise, WordmarkSvg, vars } from "@/components/ak/Brand";
import { CONTACT_EMAIL } from "@/lib/contact";
import Escribeme from "./Escribeme";

/**
 * El cierre de /work, en Ink: el que antes cerraba la portada. Una frase,
 * la salida por WhatsApp, el correo para quien lo prefiera, y el pie con lo
 * que salió de la portada: los enlaces y el colofón a la vista. La portada
 * tiene el suyo (Cierre y Pie); /work no los importa.
 */
export default function PieTrabajo() {
  return (
    <footer id="contacto" className="closer pie-trabajo" data-theme="ink" data-stagger>
      <p className="label" data-reveal="fade">
        Contacto
      </p>
      <h2 className="headline" data-reveal="rise">
        <Rise>Tell me what</Rise>
        <Rise line={1}>
          <Outcome>eats your time</Outcome>
        </Rise>
      </h2>
      <p className="lead" data-reveal style={vars({ "--d": "200ms" })}>
        Write me two lines. I&apos;ll answer myself, with the first thing I&apos;d build, or with a &ldquo;you don&apos;t need this&rdquo; if that&apos;s the case.
      </p>
      <Escribeme origen="cierre" data-reveal style={vars({ "--d": "300ms" })} />
      <p className="caption pie-trabajo-correo" data-reveal style={vars({ "--d": "360ms" })}>
        Prefer email? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <div className="closer-foot">
        <span className="wordmark">
          <WordmarkSvg />
        </span>
        <span className="caption">© {new Date().getFullYear()} allok · Made between Venezuela and Bolivia, with help from AI</span>
        <nav aria-label="More">
          <Link href="/work">All the work</Link>
          <Link href="/casos">Case studies</Link>
          <Link href="/agente-whatsapp">WhatsApp agent</Link>
          <Link href="/writing">Writing</Link>
          <Link href="/lab">Lab</Link>
          <a href="https://github.com/adriaavila" target="_blank" rel="noopener noreferrer">
            GitHub <span className="arw arw-ne" aria-hidden="true">↗</span>
          </a>
          <Link href="/en/privacy">Privacy</Link>
          <a href="#top">
            Top <span className="arw arw-up" aria-hidden="true">↑</span>
          </a>
        </nav>
        {/* El colofón, a la vista aquí; en la portada va como comentario en su pie. */}
        <p className="caption pie-trabajo-colofon">
          Geist by Vercel and basement.studio · three.js by Mr.doob · made with AI agents · Edition 2026
        </p>
      </div>
    </footer>
  );
}
