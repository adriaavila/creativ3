import { vars } from "@/components/ak/Brand";
import type { Historia } from "@/lib/historias";

/**
 * Un trazo del dibujo, en el orden en que lo haría una mano: `d` en la
 * rejilla de 48, `en` cuándo empieza y `dura` cuánto tarda, los dos en
 * fracciones de --duration-slow (el dibujo entero dura eso). Así, con
 * movimiento reducido los tokens valen 0 y todo queda dibujado de una vez.
 */
type Trazo = { d: string; en: number; dura: number };

// Las ventanas de un edificio, de abajo arriba y de izquierda a derecha: se llena como se habita.
function ventanas(columnas: number, filas: number, x0: number, y0: number, ancho: number, alto: number, hueco: [number, number]): string[] {
  const out: string[] = [];
  for (let f = filas - 1; f >= 0; f--) {
    for (let c = 0; c < columnas; c++) out.push(`M${x0 + c * (ancho + hueco[0])} ${y0 + f * (alto + hueco[1])}h${ancho}v${alto}h${-ancho}Z`);
  }
  return out;
}

// El agua de un carril, de pared a pared y de izquierda a derecha: media onda por curva, `alto` sobre y bajo `y`.
function ola(y: number, x0: number, x1: number, ondas: number, alto: number): string {
  const w = (x1 - x0) / (2 * ondas);
  const c = (s: number) => `c${+(w * 0.36).toFixed(2)} ${+(s * alto * 1.33).toFixed(2)} ${+(w * 0.64).toFixed(2)} ${+(s * alto * 1.33).toFixed(2)} ${+w.toFixed(2)} 0`;
  return `M${x0} ${y}` + Array.from({ length: 2 * ondas }, (_, k) => c(k % 2 ? 1 : -1)).join("");
}

// En fila: cada trazo arranca `paso` después del anterior y dura `dura`; el último acaba en `fin`.
function enFila(ds: string[], desde: number, fin: number, dura: number): Trazo[] {
  const paso = ds.length > 1 ? (fin - desde - dura) / (ds.length - 1) : 0;
  return ds.map((d, k) => ({ d, en: +(desde + k * paso).toFixed(3), dura }));
}

const UNIDADES = ventanas(2, 3, 17, 11, 5, 4, [4, 3.5]);
// Dos olas y no tres filas de flotadores: con flotadores, a 48 px la piscina se leía como un teclado.
const OLAS = [20, 28].map((y) => ola(y, 9, 39, 3, 1.8));

/**
 * Los cuatro dibujos de la portada, uno por trabajo, con una sola pluma: la
 * línea de la marca (puntas y uniones redondas, el mismo grueso en todos).
 * · casa: SAMER vende casas; el contorno de un trazo y después la puerta.
 * · unidades: REI administra edificios; el edificio, la puerta y sus unidades, de abajo arriba.
 * · recibo: Cuadra cobra en dos monedas; el ticket, y en él la columna de $ y la de Bs.
 * · carriles: Mística es una escuela de natación; la piscina y el agua de sus carriles, de izquierda a derecha.
 */
const DIBUJOS: Record<Historia["glifo"], Trazo[]> = {
  casa: [
    { d: "M13 40V23H9L24 8L39 23H35V40Z", en: 0, dura: 0.72 },
    { d: "M20.5 40V31.5H27.5V40", en: 0.62, dura: 0.38 },
  ],
  unidades: [
    { d: "M7 41H41", en: 0, dura: 0.3 },
    { d: "M13 41V7H35V41", en: 0.12, dura: 0.4 },
    { d: "M21 41V34H27V41", en: 0.4, dura: 0.2 },
    ...enFila(UNIDADES, 0.5, 1, 0.16),
  ],
  recibo: [
    // El ticket, desde su esquina de arriba a la izquierda, con el borde de abajo cortado en dientes.
    { d: "M9 5H39V39L35.25 42.5L31.5 39L27.75 42.5L24 39L20.25 42.5L16.5 39L12.75 42.5L9 39Z", en: 0, dura: 0.48 },
    // $: la S y su barra.
    { d: "M19.6 11.6C19.2 10.4 18.1 9.6 16.6 9.6C14.9 9.6 13.7 10.6 13.7 12C13.7 13.6 15.2 14 16.6 14.4C18.1 14.8 19.6 15.3 19.6 16.9C19.6 18.4 18.3 19.4 16.6 19.4C15 19.4 13.8 18.6 13.5 17.3", en: 0.36, dura: 0.26 },
    { d: "M16.6 7.4V21.6", en: 0.56, dura: 0.12 },
    // Bs: la B de un solo trazo (desde el medio del asta: la panza de arriba, el asta, la de abajo), y la s.
    { d: "M24.7 14.4H28.1C29.5 14.4 30.4 13.4 30.4 11.9C30.4 10.5 29.5 9.6 28.1 9.6H24.7V19.4H28.5C30.2 19.4 31.1 18.3 31.1 16.9C31.1 15.5 30.2 14.4 28.5 14.4H28.1", en: 0.42, dura: 0.28 },
    { d: "M36.1 13.4C35.8 12.5 35.1 12 34.2 12C33.2 12 32.5 12.7 32.5 13.6C32.5 14.7 33.4 15.1 34.3 15.4C35.3 15.7 36.3 16.1 36.3 17.3C36.3 18.5 35.4 19.4 34.2 19.4C33.2 19.4 32.4 18.9 32.2 18", en: 0.56, dura: 0.2 },
    // Las cifras de cada columna.
    ...enFila(["M12.5 26.5H20.5", "M27.5 26.5H35.5", "M12.5 32.5H18.5", "M27.5 32.5H33.5"], 0.66, 1, 0.14),
  ],
  carriles: [{ d: "M5 12H43V36H5Z", en: 0, dura: 0.44 }, ...enFila(OLAS, 0.36, 1, 0.5)],
};

/**
 * El dibujo de 48 px junto al nombre de cada trabajo. Se dibuja solo
 * (`data-reveal="draw"`, 200 ms después del marco): cada trazo lleva
 * pathLength 1 y la clase `trazo`, y su turno en --trazo-0 / --trazo-f.
 */
export default function Glifo({ tipo, retraso = 200 }: { tipo: Historia["glifo"]; retraso?: number }) {
  return (
    <svg
      className="glifo"
      viewBox="0 0 48 48"
      width={48}
      height={48}
      aria-hidden="true"
      focusable="false"
      data-reveal="draw"
      style={vars({ "--d": `${retraso}ms`, "--i": 0 })}
    >
      {DIBUJOS[tipo].map((t) => (
        <path key={t.d} className="trazo" pathLength={1} d={t.d} style={vars({ "--trazo-0": t.en, "--trazo-f": t.dura })} />
      ))}
    </svg>
  );
}
