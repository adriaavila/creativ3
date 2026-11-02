import Link from "next/link";
import { PIEZAS } from "@/lib/vitrina";

const CORREO = "hi@allok.fun";

/** El cielo, una vez, al final: solo una forma de escribir. */
export default function Cierre() {
  const nombres = PIEZAS.map((p) => p.name);
  return (
    <footer id="contacto" className="v-sky overflow-hidden">
      <div className="v-mono overflow-hidden border-b border-white/15 py-4 text-[11px] text-white/75" aria-hidden="true">
        <div className="v-marquee flex w-max gap-10 whitespace-nowrap">
          {[...nombres, ...nombres].map((n, i) => (
            <span key={i} className="flex items-center gap-10">
              {n} <span className="opacity-50">✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 pb-10 pt-24 sm:px-10 sm:pt-36">
        <p className="v-mono text-[11px] text-white/75">Contacto</p>
        <p className="v-display mt-6 text-[clamp(2.8rem,9vw,9rem)]">
          ¿Construimos
          <br />
          <span className="v-serif">algo bonito?</span>
        </p>
        <a
          href={`mailto:${CORREO}`}
          data-cursor="Escribir"
          className="group mt-12 inline-flex items-center gap-4 border-b-2 border-white/40 pb-2 text-[clamp(1.6rem,4.5vw,3.6rem)] font-semibold tracking-[-0.03em] transition-colors hover:border-white"
        >
          {CORREO}
          <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">
            ↗
          </span>
        </a>

        <div className="mt-28 flex flex-col gap-8 border-t border-white/20 pt-8 text-sm sm:flex-row sm:items-end sm:justify-between">
          <nav aria-label="Más" className="flex flex-wrap gap-x-6 gap-y-3 text-white/85">
            <Link href="/casos" className="hover:text-white">Casos</Link>
            <Link href="/work" className="hover:text-white">Archivo</Link>
            <Link href="/lab" className="hover:text-white">Laboratorio</Link>
            <Link href="/writing" className="hover:text-white">Escritos</Link>
            <a href="https://github.com/adriaavila" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              GitHub ↗
            </a>
            <Link href="/es/privacidad" className="hover:text-white">Privacidad</Link>
          </nav>
          <p className="v-mono text-[10px] text-white/70">© {new Date().getFullYear()} allok · hecho a mano, con ayuda de IA</p>
        </div>
      </div>
    </footer>
  );
}
