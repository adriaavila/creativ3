import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// La imagen que se ve al compartir allok.fun por WhatsApp o Facebook: la misma
// frase que abre la portada, con el sistema de la portada (Ink, Cloud y Blue,
// Geist, sin degradados). Casi todos llegan por un enlace que alguien les pasó,
// así que esta tarjeta es lo primero que ven.
export const alt = "allok · Hago el software con el que trabaja tu negocio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Los valores de src/styles/allok/tokens.json. Blue sobre Ink solo en letra
// grande (3,8:1), como pide el sistema.
const INK = "#0b0d0e";
const CLOUD = "#f7f8f8";
const BLUE = "#315cff";
const MUTED = "#9da6ab";

// Geist en dos pesos fijos, recortados al latín, sacados de
// public/allok/Geist-Variable.woff2: ImageResponse no lee woff2 ni fuentes
// variables. Licencia OFL al lado.
const fuentes = Promise.all([
  readFile(join(process.cwd(), "src/assets/og/Geist-SemiBold.ttf")),
  readFile(join(process.cwd(), "src/assets/og/Geist-Regular.ttf")),
]);

// Node runtime on purpose: this app ships as a standalone container, and
// ImageResponse needs no edge runtime to render.
export default async function Image() {
  const [semibold, regular] = await fuentes;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px 60px",
          background: INK,
          color: CLOUD,
          fontFamily: "Geist",
        }}
      >
        {/* El logotipo dibujado, del mismo master que WordmarkSvg (components/ak/Brand.tsx). */}
        <svg width="141" height="58" viewBox="0 0 282 116">
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 100,
            fontWeight: 600,
            lineHeight: 0.94,
            letterSpacing: "-0.05em",
          }}
        >
          <span>Hago el software</span>
          <span style={{ color: BLUE }}>con el que trabaja</span>
          <span style={{ color: BLUE }}>tu negocio.</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            fontSize: 22,
            fontWeight: 400,
            color: MUTED,
          }}
        >
          <span style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 19 }}>
            Adrián Avila · Venezuela y Bolivia
          </span>
          <span style={{ color: CLOUD }}>allok.fun</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
