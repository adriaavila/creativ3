import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { traceLine, type Box, type Gesture, type GlyphId } from "@/lib/pen-linea";
import { OG_SIZE } from "./card";
import WIDTHS from "./widths.json";

// La imagen al compartir de /pen y de cada idea del cuaderno: papel blanco y
// la MISMA línea de la página (`traceLine`), de un solo trazo. En la de una
// idea, la línea tacha lo que se suele creer, dibuja y subraya la idea.
//
// Satori no deja medir texto, así que cada renglón se coloca a mano con el
// ancho de avance de cada letra (widths.json, sacado de los .ttf de esta
// carpeta): la línea sabe exactamente dónde termina cada palabra.
// Instrument Serif Italic: SIL OFL 1.1, igual que Geist (public/allok/OFL-Geist.txt).

const PAPER = "#ffffff";
const INK = "#0b0d0e";
const INK_60 = "#5b6167";
const INK_40 = "#8a9097";
const BLUE = "#1f4bff";
const M = 64;

type Face = keyof typeof WIDTHS;

const fonts = Promise.all(
  ["Geist-Medium.ttf", "Geist-SemiBold.ttf", "InstrumentSerif-Italic.ttf"].map((f) => readFile(join(process.cwd(), "src/lib/og", f))),
);

/** El ancho de un texto en píxeles: avance de cada letra más el interletrado. */
export function measure(text: string, face: Face, size: number, tracking = 0): number {
  const table = WIDTHS[face] as Record<string, number>;
  let em = 0;
  for (const ch of text) em += (table[ch] ?? 0.6) + tracking;
  return em * size;
}

/** Corta un texto en renglones que no pasen de `max` píxeles. */
export function wrap(text: string, face: Face, size: number, tracking: number, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next, face, size, tracking) > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

type Run = { text: string; x: number; y: number; size: number; face: Face; color?: string; tracking?: number };

const FACE: Record<Face, { family: string; weight: 400 | 500 | 600; style: "normal" | "italic" }> = {
  medium: { family: "Geist", weight: 500, style: "normal" },
  semibold: { family: "Geist", weight: 600, style: "normal" },
  serif: { family: "Instrument Serif", weight: 400, style: "italic" },
};

function Text({ run }: { run: Run }) {
  const face = FACE[run.face];
  return (
    <div
      style={{
        position: "absolute",
        left: run.x,
        top: run.y,
        display: "flex",
        whiteSpace: "nowrap",
        fontFamily: face.family,
        fontWeight: face.weight,
        fontStyle: face.style,
        fontSize: run.size,
        lineHeight: 1,
        letterSpacing: `${run.tracking ?? 0}em`,
        color: run.color ?? INK,
      }}
    >
      {run.text}
    </div>
  );
}

function Wordmark() {
  return (
    <svg width="112" height="46" viewBox="0 0 282 116" style={{ position: "absolute", left: M, top: 50 }}>
      <path
        d="M63 44V96 M63 70a26 26 0 1 1-52 0a26 26 0 1 1 52 0 M94 18V96 M125 18V96 M202.9 72.27A26 26 0 1 0 179.27 95.9 M231 18V96 M262 44L231 70L266 96"
        fill="none"
        stroke={INK}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="195.38" cy="88.38" r="6.5" fill={INK} />
    </svg>
  );
}

async function render(runs: Run[], gestures: Gesture[]): Promise<ImageResponse> {
  const [medium, semibold, serif] = await fonts;
  const strokes = traceLine(gestures, { pad: 14 });
  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: PAPER }}>
        <Wordmark />
        {runs.map((run, i) => (
          <Text key={i} run={run} />
        ))}
        <svg width={OG_SIZE.width} height={OG_SIZE.height} viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {strokes.map((s, i) => (
            <path key={i} d={s.d} fill="none" stroke={s.ink === "blue" ? BLUE : INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: medium!, style: "normal", weight: 500 },
        { name: "Geist", data: semibold!, style: "normal", weight: 600 },
        { name: "Instrument Serif", data: serif!, style: "italic", weight: 400 },
      ],
    },
  );
}

/** Un renglón puesto a mano y su caja, para que la línea lo encuentre. */
function place(text: string, x: number, y: number, face: Face, size: number, tracking = 0, color?: string): { run: Run; box: Box } {
  return {
    run: { text, x, y, size, face, tracking, color },
    // La caja va sobre el cuerpo de la letra (sin el aire de arriba), para que tachar pase por el medio.
    box: { x, y: y + size * 0.18, w: measure(text, face, size, tracking) - tracking * size, h: size * 0.94 },
  };
}

function footer(left: string, right: string): Run[] {
  const size = 22;
  return [
    { text: left, x: M, y: 558, size, face: "medium", color: INK_60 },
    { text: right, x: OG_SIZE.width - M - measure(right, "medium", size), y: 558, size, face: "medium", color: INK_40 },
  ];
}

function label(text: string): Run {
  const size = 18;
  const upper = text.toUpperCase();
  return { text: upper, x: OG_SIZE.width - M - measure(upper, "medium", size, 0.06), y: 64, size, face: "medium", color: INK_40, tracking: 0.06 };
}

/** La imagen de una idea: lo tachado, el dibujo, la idea subrayada. */
export function penIdeaCard(idea: { n: string; belief: string; title: string; glyph: GlyphId; path: string }): Promise<ImageResponse> {
  const tracking = -0.035;
  const X = M + 36;
  const max = OG_SIZE.width - X - M - 20;
  // El titular más grande que entre en dos renglones; si no, tres más chicos.
  let size = 56;
  let lines = wrap(idea.title, "semibold", size, tracking, max);
  for (const s of [84, 76, 68, 60]) {
    const l = wrap(idea.title, "semibold", s, tracking, max);
    if (l.length <= 2) {
      size = s;
      lines = l;
      break;
    }
  }
  const lead = size * 1.06;
  const bottom = 506;
  const top = bottom - lines.length * lead;
  const glyphSize = 92;
  const glyphY = top - glyphSize - 34;
  const beliefSize = 32;
  const belief = place(idea.belief, X, Math.min(150, glyphY - beliefSize - 26), "medium", beliefSize, 0, INK_40);
  const title = lines.map((text, i) => place(text, X, top + i * lead, "semibold", size, tracking));
  const last = title[title.length - 1]!;
  return render(
    [label(`Notebook · ${idea.n}`), belief.run, ...title.map((t) => t.run), ...footer("Adrián Ávila", `allok.fun${idea.path}`)],
    [
      { kind: "strike", lines: [belief.box] },
      { kind: "draw", box: { x: X + 4, y: glyphY, w: glyphSize, h: glyphSize }, glyph: idea.glyph },
      { kind: "underline", line: last.box, top: title[0]!.box.y },
    ],
  );
}

/** La imagen de /pen: el titular con su rúbrica y la línea que sigue de largo. */
export function penHomeCard(): Promise<ImageResponse> {
  const size = 128;
  const tracking = -0.045;
  const lead = size * 0.98;
  const top = 170;
  const one = place("I never lift", M, top, "semibold", size, tracking);
  const the = place("the ", M, top + lead, "semibold", size, tracking);
  const serifSize = size * 1.12;
  const pen = place("pen.", M + the.box.w + size * 0.24, top + lead - size * 0.1, "serif", serifSize, -0.01);
  const box: Box = { x: M, y: top, w: Math.max(one.box.w, pen.box.x + pen.box.w - M), h: lead + size };
  const g = 104;
  const gy = 330;
  const gx = [742, 892, 1032];
  return render(
    [label("Engineer & artist"), one.run, the.run, pen.run, ...footer("Adrián Ávila · Websites, systems and AI agents", "allok.fun")],
    [
      { kind: "start", box, word: { ...pen.box, y: top + lead, h: size } },
      { kind: "draw", box: { x: gx[0]!, y: gy, w: g, h: g }, glyph: "house" },
      { kind: "draw", box: { x: gx[1]!, y: gy, w: g, h: g }, glyph: "receipt" },
      { kind: "draw", box: { x: gx[2]!, y: gy, w: g, h: g }, glyph: "bubble" },
    ],
  );
}
