import { PIEZAS } from "@/lib/vitrina";
import Agente from "./Agente";
import BarraWhatsApp from "./BarraWhatsApp";
import CabeceraPortada from "./CabeceraPortada";
import Cierre, { Pie } from "./Cierre";
import Diecinueve from "./Diecinueve";
import Escribeme from "./Escribeme";
import FichaIsla from "./FichaIsla";
import Obras from "./Obras";
import Portada from "./Portada";

/**
 * «Te toca», la portada entera, pintada en el servidor: las manos que esperan
 * el toque, cuatro trabajos que terminan cada uno en su lazo, la fila con
 * todos, el agente para probar y el cierre con el lazo abierto. Lo que se mueve llega
 * en islas pequeñas (las manos, la hora, la barra, la ficha).
 *
 * `.lienzo` envuelve el contenido y el cierre, y la barra de WhatsApp es su
 * último hijo: `position: sticky` la deja al fondo de la pantalla todo el
 * camino y la atraca bajo el cierre, sin JavaScript. Por eso ni `.lienzo` ni
 * nada por encima lleva overflow hidden/auto ni transform. El pie va fuera,
 * después de donde atraca.
 *
 * La ficha se abre sobre la portada desde cualquier `[data-abrir-pieza]`;
 * aquí solo viajan los ids, PIEZAS se queda en el servidor.
 */
export default function Vitrina() {
  return (
    <>
      <CabeceraPortada />
      <div className="lienzo">
        <main id="contenido">
          <Portada />
          <Obras />
          <Diecinueve />
          <Agente />
        </main>
        <Cierre />
        <BarraWhatsApp>
          <Escribeme variante="barra" />
        </BarraWhatsApp>
      </div>
      <Pie />
      <FichaIsla ids={PIEZAS.map((p) => p.id)} />
    </>
  );
}
