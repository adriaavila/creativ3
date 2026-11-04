import { HISTORIAS } from "@/lib/historias";
import Obra from "./Obra";

/**
 * Los cuatro trabajos, uno por pantalla, como en una sala: la captura en su
 * marco abierto, la marca que lo cierra y una placa. Sin títulos ni números:
 * el nombre de la sección queda para quien lo oye (aria-label).
 */
export default function Obras() {
  return (
    <section id="obras" className="obras" data-theme="cloud" aria-label="Trabajos">
      {HISTORIAS.map((h) => (
        <Obra key={h.id} historia={h} />
      ))}
    </section>
  );
}
