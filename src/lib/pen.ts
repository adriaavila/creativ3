import { AGENTE, HISTORIAS, type Historia } from "./historias";
import type { GlyphId } from "./pen-linea";
import { ESTADO, PIEZAS, type Pieza } from "./vitrina";

/**
 * Lo que cuenta /pen. Nada nuevo que mantener: cada historia sale de
 * `historias.ts` (el problema del dueño, lo que cambió, la captura) y cada
 * pieza chica, de `vitrina.ts`. Esta página solo decide qué dibuja la línea
 * junto a cada una.
 */

/** El dibujo de un trazo que acompaña a cada historia de la portada. */
const GLYPH: Record<Historia["glifo"], GlyphId> = {
  casa: "house",
  unidades: "building",
  recibo: "receipt",
  carriles: "lanes",
};

export type Story = {
  id: string;
  n: string;
  name: string;
  /** «Client» o «Mine», y dónde. */
  label: string;
  /** El problema, en la voz del dueño: lo que la línea tacha. */
  before: string;
  /** Lo que cambió: lo que la línea subraya. */
  after: string;
  body: string;
  glyph: GlyphId;
  image: { src: string; alt: string; ratio: number; phone: boolean };
  note?: string;
  link?: { text: string; href: string };
};

export const STORIES: Story[] = HISTORIAS.map((h) => {
  const shot = h.capturas[0]!;
  const web = h.acciones.find((a) => a.tipo === "web");
  const caso = h.acciones.find((a) => a.tipo === "caso");
  const link = web && "href" in web ? web : caso && "href" in caso ? caso : undefined;
  return {
    id: h.id,
    n: h.n,
    name: h.nombre,
    label: `${h.tag} · ${h.donde}`,
    before: h.escena,
    after: h.linea,
    body: h.cuerpo,
    glyph: GLYPH[h.glifo],
    image: { src: shot.src, alt: shot.alt, ratio: shot.ratio, phone: shot.celular },
    note: h.nota,
    link: link ? { text: link.texto, href: link.href } : undefined,
  };
});

/** El agente de allok: la misma forma, sin captura. La línea dibuja el globo en grande. */
export const AGENT = {
  label: AGENTE.kicker,
  before: AGENTE.escena,
  after: "Your WhatsApp answers and books, even when you’re closed.",
  body: AGENTE.cuerpo,
  link: { text: AGENTE.enlace.texto, href: AGENTE.enlace.href },
} as const;

/** El trabajo más de diseño: marcas, tiendas y un juego. Solo las que tienen su captura de escritorio. */
const SKETCHBOOK_IDS = ["kawsay", "artistheway", "parley-mundial", "viaja-ven", "dream-drop", "vistacampo"];

export type Tile = { id: string; name: string; kind: string; line: string; status: string; src: string; alt: string };

export const SKETCHBOOK: Tile[] = SKETCHBOOK_IDS.flatMap((id) => {
  const p: Pieza | undefined = PIEZAS.find((x) => x.id === id);
  const img = p?.images.find((i) => !i.mobile) ?? p?.images[0];
  if (!p || !img) return [];
  return [{ id: p.id, name: p.name, kind: p.tipo, line: p.linea, status: ESTADO[p.status], src: img.src, alt: img.alt }];
});

const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

/** «Four problems, crossed out.»: el número se cuenta de los datos, nunca se escribe a mano. */
export function countWord(count: number): string {
  return WORDS[count] ?? String(count);
}

/** Tres maneras de empezar, para quien no sabe qué escribir. Son ejemplos, no casos de clientes. */
export const SKETCH_EXAMPLES = [
  "I answer the same WhatsApp questions all day.",
  "Payments live in a spreadsheet nobody trusts.",
  "Sending a quote takes me two days.",
] as const;
