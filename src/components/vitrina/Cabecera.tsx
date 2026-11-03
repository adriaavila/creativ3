import { WordmarkSvg } from "@/components/ak/Brand";

const NAV = [
  { href: "#trabajo", label: "Trabajo" },
  { href: "#por-dentro", label: "Por dentro" },
  { href: "#indice", label: "Índice" },
  { href: "#estudio", label: "Estudio" },
];

/** La cabecera del sistema: la marca a la izquierda, los enlaces y la acción a la derecha. Se aparta al bajar. */
export default function Cabecera() {
  return (
    <header className="header" data-hide-on-scroll>
      <a className="wordmark" href="#top" aria-label="allok, inicio">
        <WordmarkSvg />
      </a>
      <span />
      <nav className="header-end" aria-label="Principal">
        {NAV.map((n) => (
          <a key={n.href} className="btn btn-link" href={n.href}>
            {n.label}
          </a>
        ))}
        <a className="btn btn-primary" href="#contacto">
          Contacto
        </a>
      </nav>
    </header>
  );
}
