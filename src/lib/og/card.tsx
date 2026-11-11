import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// La imagen al compartir cada página, en el sistema de diseño de la portada
// (src/styles/allok/tokens.json): campo Ink, el logotipo dibujado en Cloud, el
// titular en Geist 600 con su segunda línea en Electric Blue (el «resultado»;
// en Ink, Blue solo vale desde 24 px, aquí va a 84), la etiqueta y la dirección
// en Steel claro, y el símbolo abajo a la derecha. Sin degradados ni sombras.
//
// Las letras son instancias estáticas de /allok/Geist-Variable.woff2 a 500 y 600
// (Satori no lee woff2 ni fuentes variables), en latín y sin GPOS: Satori mide
// la palabra sin kerning y la pinta con él, y los espacios salían desparejos.
// Licencia: public/allok/OFL-Geist.txt.
// El texto sale de cada página (su H1 o su título): aquí no se escribe copy.

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#0b0d0e";
const CLOUD = "#f7f8f8";
const BLUE = "#315cff";
const STEEL_ON_INK = "#9da6ab";

const fonts = Promise.all([
  readFile(join(process.cwd(), "src/lib/og/Geist-Medium.ttf")),
  readFile(join(process.cwd(), "src/lib/og/Geist-SemiBold.ttf")),
]);

export type OgCard = {
  /** La etiqueta de arriba a la derecha, en versalitas: la sección. */
  label: string;
  /** El titular: la primera línea en Cloud y, si hay, la segunda en Blue. */
  title: string;
  accent?: string;
  /** La dirección que se lee abajo, sin el dominio: `/agente-whatsapp`. */
  path: string;
};

function fit(text: string): number {
  // El titular se achica con el largo para no pasar de tres líneas a 1072 px.
  const n = text.length;
  if (n <= 26) return 96;
  if (n <= 40) return 84;
  if (n <= 56) return 72;
  return 62;
}

// Una palabra por caja y el espacio como hueco fijo, para que el corte de línea
// y el aire entre palabras no dependan de cómo Satori mide el espacio.
function Line({ text, color }: { text: string; color?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.24em", color }}>
      {text.split(/\s+/).map((word, i) => (
        <span key={i}>{word}</span>
      ))}
    </div>
  );
}

export async function ogCard({ label, title, accent, path }: OgCard): Promise<ImageResponse> {
  const [medium, semibold] = await fonts;
  const size = fit(`${title} ${accent ?? ""}`.trim());
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 64px 56px",
          background: INK,
          color: CLOUD,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <svg width="136" height="56" viewBox="0 0 282 116">
            <path
              d="M63 44V96 M63 70a26 26 0 1 1-52 0a26 26 0 1 1 52 0 M94 18V96 M125 18V96 M202.9 72.27A26 26 0 1 0 179.27 95.9 M231 18V96 M262 44L231 70L266 96"
              fill="none"
              stroke={CLOUD}
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="195.38" cy="88.38" r="6.5" fill={CLOUD} />
          </svg>
          <div style={{ display: "flex", fontSize: 18, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", color: STEEL_ON_INK }}>
            <Line text={label} />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: size,
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: "-0.05em",
            maxWidth: 1000,
          }}
        >
          <Line text={title} />
          {accent ? <Line text={accent} color={BLUE} /> : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 500, color: STEEL_ON_INK }}>allok.fun{path === "/" ? "" : path}</div>
          <svg width="64" height="64" viewBox="10 10 60 60">
            <path d="M63.909 42.092A24 24 0 1 0 42.092 63.909" fill="none" stroke={CLOUD} strokeWidth="12" strokeLinecap="round" />
            <circle cx="56.971" cy="56.971" r="6" fill={BLUE} />
          </svg>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: medium, style: "normal", weight: 500 },
        { name: "Geist", data: semibold, style: "normal", weight: 600 },
      ],
    },
  );
}
