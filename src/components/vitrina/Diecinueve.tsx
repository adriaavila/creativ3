import { vars } from "@/components/ak/Brand";
import { ESTADO, PIEZAS, claseEstado, type Pieza } from "@/lib/vitrina";
import DiecinueveLuz from "./DiecinueveLuz";

// Primero lo que está en uso, después lo que crece, al final demos y prototipos: se encienden en ese orden.
const ORDEN: Record<Pieza["status"], number> = { launched: 0, improving: 1, demo: 2, prototype: 3 };

/**
 * Todos los trabajos en una fila: una marca por pieza, con la forma de su
 * estado (punto lleno en uso, anillo en evolución, raya si es demo o
 * prototipo). Se encienden de izquierda a derecha con el scroll, lineal
 * (--p de 0 a 1). Sin línea de tiempo de scroll lo hace DiecinueveLuz; con
 * movimiento reducido o sin JavaScript, todas encendidas. Las cuentas salen
 * de PIEZAS, nunca escritas a mano.
 */
export default function Diecinueve() {
  const marcas = [...PIEZAS].sort((a, b) => ORDEN[a.status] - ORDEN[b.status]);
  return (
    <section id="diecinueve" className="diecinueve-sala" data-theme="cloud">
      <div className="diecinueve-caja">
        <ol className="diecinueve" aria-label={`Los ${marcas.length} trabajos, por estado`} style={vars({ "--n": marcas.length })}>
          {marcas.map((p, k) => (
            <li key={p.id} className={`marca-estado ${claseEstado(p.status)}`} style={vars({ "--k": k })}>
              <span role="img" aria-label={`${p.name}: ${ESTADO[p.status]}`} />
            </li>
          ))}
        </ol>
        {/* Un <a> simple, sin next/link: nada que precargar y nada que sumar al JS de la portada. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a propósito, ver la línea de arriba */}
        <a href="/trabajo" className="btn btn-link diecinueve-enlace">
          Los {marcas.length} trabajos <span className="arw arw-r" aria-hidden="true">→</span>
        </a>
      </div>
      <DiecinueveLuz />
    </section>
  );
}
