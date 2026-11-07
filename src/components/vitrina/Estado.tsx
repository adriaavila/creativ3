import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import Reloj from "./Reloj";
import VozChip from "./VozChip";

// Lo personal entra solo si el archivo está en public/ al construir (la portada es estática). Si falta, queda el
// texto: nada se genera en su lugar como si fuera él.
const RETRATO = "/adrian/retrato-40.avif";
const NOTA = "/adrian/nota.opus";
const enPublic = (ruta: string) => join(process.cwd(), "public", ruta);

/**
 * Lo que dura la nota, leído del propio archivo (Ogg Opus): la posición de la
 * última página menos el pre-skip de la cabecera, a 48 kHz. Así la etiqueta
 * dice lo que dura de verdad; si no se puede leer, el botón va sin número.
 */
function duracion(ruta: string): string | null {
  try {
    const b = readFileSync(enPublic(ruta));
    const cabeza = b.indexOf("OpusHead");
    if (cabeza < 0) return null;
    const preskip = b.readUInt16LE(cabeza + 10);
    // La última página de verdad: «OggS» y la versión 0 (los mismos bytes podrían caer dentro del audio).
    for (let i = b.lastIndexOf("OggS"); i > cabeza; i = b.lastIndexOf("OggS", i - 1)) {
      if (b[i + 4] !== 0 || i + 14 > b.length) continue;
      const total = Math.round((Number(b.readBigUInt64LE(i + 6)) - preskip) / 48_000);
      return total > 0 ? `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}` : null;
    }
  } catch {
    // Sin poder leerla, la nota igual se escucha.
  }
  return null;
}

/**
 * La fila de quién contesta, bajo las manos, como el renglón de un contacto
 * en WhatsApp: [su foto] ● «Te contesto yo · 7:42 p. m. en Venezuela» [su
 * voz]. El ● es el punto del lazo: llega con el mismo asentarse de 400 ms
 * cuando las manos lo cierran (CSS sobre `#inicio[data-cerrado]`). La hora la
 * pone Reloj en el cliente; sin JavaScript la fila dice «Venezuela y
 * Bolivia» (CSS, `scripting: none`), sin hora que no se podría poner.
 */
export default function Estado() {
  const retrato = existsSync(enPublic(RETRATO));
  const nota = existsSync(enPublic(NOTA));

  return (
    <div className="estado">
      {retrato ? (
        // Ya viene a 40 px: el optimizador de imágenes solo sumaría un viaje.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="estado-foto" src={RETRATO} width={40} height={40} alt="Adrián Avila" decoding="async" />
      ) : null}
      <p className="estado-linea">
        <span className="estado-punto" aria-hidden="true">
          ●
        </span>{" "}
        <span className="estado-quien">Te contesto yo</span>
        {/* El separador va con lo que separa: sin hora (o sin JavaScript) no queda un «·» colgando. */}
        <span className="estado-hora">
          {" "}
          <span aria-hidden="true">·</span> <Reloj /> en Venezuela
        </span>
        <span className="estado-lugar">
          {" "}
          <span aria-hidden="true">·</span> Venezuela y Bolivia
        </span>
      </p>
      {nota ? <VozChip src={NOTA} duracion={duracion(NOTA)} /> : null}
    </div>
  );
}
