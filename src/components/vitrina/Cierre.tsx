import Link from "next/link";
import { Outcome, Rise, WordmarkSvg, vars } from "@/components/ak/Brand";

const CORREO = "hi@allok.fun";

/** El cierre, en Ink: una forma de escribir, un botón, el pie. */
export default function Cierre() {
  return (
    <footer id="contacto" className="closer" data-theme="ink" data-stagger>
      <p className="label" data-reveal="fade">Contacto</p>
      <h2 className="headline" data-reveal="rise">
        <Rise>Cuéntame qué</Rise>
        <Rise line={1}>
          <Outcome>te quita el tiempo</Outcome>
        </Rise>
      </h2>
      <a className="btn btn-primary" href={`mailto:${CORREO}`} data-reveal style={vars({ "--d": "300ms" })}>
        {CORREO} <span className="arw arw-ne" aria-hidden="true">↗</span>
      </a>
      <div className="closer-foot">
        <span className="wordmark">
          <WordmarkSvg />
        </span>
        <span className="caption">© {new Date().getFullYear()} allok · hecho a mano, con ayuda de IA</span>
        <nav aria-label="Más">
          <Link href="/casos">Casos</Link>
          <Link href="/work">Archivo</Link>
          <Link href="/lab">Laboratorio</Link>
          <Link href="/writing">Escritos</Link>
          <a href="https://github.com/adriaavila" target="_blank" rel="noopener noreferrer">
            GitHub <span className="arw arw-ne" aria-hidden="true">↗</span>
          </a>
          <Link href="/es/privacidad">Privacidad</Link>
          <a href="#top">
            Arriba <span className="arw arw-up" aria-hidden="true">↑</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
