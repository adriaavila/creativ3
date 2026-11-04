import Link from "next/link";
import { Outcome, Rise, WordmarkSvg, vars } from "@/components/ak/Brand";
import { CONTACT_EMAIL } from "@/lib/contact";
import Escribeme from "./Escribeme";

/**
 * El cierre de /trabajo, en Ink: el que antes cerraba la portada. Una frase,
 * la salida por WhatsApp, el correo para quien lo prefiera, y el pie con lo
 * que salió de la portada: los enlaces y el colofón a la vista. La portada
 * tiene el suyo (Cierre y Pie); /trabajo no los importa.
 */
export default function PieTrabajo() {
  return (
    <footer id="contacto" className="closer pie-trabajo" data-theme="ink" data-stagger>
      <p className="label" data-reveal="fade">
        Contacto
      </p>
      <h2 className="headline" data-reveal="rise">
        <Rise>Cuéntame qué</Rise>
        <Rise line={1}>
          <Outcome>te quita el tiempo</Outcome>
        </Rise>
      </h2>
      <p className="lead" data-reveal style={vars({ "--d": "200ms" })}>
        Escríbeme en dos líneas. Te respondo yo, con lo primero que construiría o con un «esto no te hace falta» si es el caso.
      </p>
      <Escribeme origen="cierre" data-reveal style={vars({ "--d": "300ms" })} />
      <p className="caption pie-trabajo-correo" data-reveal style={vars({ "--d": "360ms" })}>
        ¿Prefieres correo? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <div className="closer-foot">
        <span className="wordmark">
          <WordmarkSvg />
        </span>
        <span className="caption">© {new Date().getFullYear()} allok · Hecho entre Venezuela y Bolivia, con ayuda de IA</span>
        <nav aria-label="Más">
          <Link href="/trabajo">Todo el trabajo</Link>
          <Link href="/casos">Casos</Link>
          <Link href="/agente-whatsapp">Agente de WhatsApp</Link>
          <Link href="/writing">Escritos</Link>
          <Link href="/lab">Laboratorio</Link>
          <a href="https://github.com/adriaavila" target="_blank" rel="noopener noreferrer">
            GitHub <span className="arw arw-ne" aria-hidden="true">↗</span>
          </a>
          <Link href="/es/privacidad">Privacidad</Link>
          <a href="#top">
            Arriba <span className="arw arw-up" aria-hidden="true">↑</span>
          </a>
        </nav>
        {/* El colofón, a la vista aquí; en la portada va como comentario en su pie. */}
        <p className="caption pie-trabajo-colofon">
          Geist by Vercel and basement.studio · three.js by Mr.doob · hecho con agentes de IA · Edición 2026
        </p>
      </div>
    </footer>
  );
}
