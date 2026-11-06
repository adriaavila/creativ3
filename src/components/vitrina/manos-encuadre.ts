// Where everything sits. The scene (manos-escena.ts) frames the hands with
// these numbers and scripts/manos-trazo.ts projects the 2D sketch with the
// very same ones, so the pencil drawing lands under the fibers. Apart from
// the geometry (manos-geometria.ts re-exports it), so the scene's module
// arrives without the code that builds the hands, which runs in a worker.

type V3 = [number, number, number];

/** Field of view of the camera, vertical, in degrees. */
export const FOV = 30;
/** The camera looks a little under the fingertips: the arms come in from below. */
export const AIM = -0.07;
/** How far apart the fingertips sit in height, like two people reaching. */
const LIFT = 0.035;
/** Each group's turn (x, y, z), so the arms come toward the viewer from either side. */
export const GIRO_HUMANA: V3 = [0.1, 0.26, 0];
export const GIRO_MAQUINA: V3 = [0.1, -0.26, 0];
/** The least the camera keeps in view on the plane of the fingertips: 2.1 units of width and 1.12 of height. */
export const VISTA = { ancho: 2.1, alto: 1.12 } as const;
/**
 * On a phone the camera comes closer (1.75 units of width) and the pair turns
 * on a diagonal, corner to corner: a phone's strip is about as tall as it is
 * wide, and side by side the hands were two brushes at the edges. The
 * diagonal and the line under it (the hint, then the reply) need 1.9 units of
 * height: on a strip shorter than the reference phone's (390 × 424) the hands
 * get smaller instead of being cut by its top and bottom, which are not the
 * screen's edges.
 */
export const VISTA_COMPACTA = { ancho: 1.75, alto: 1.9 } as const;
/** The pair's turn about the camera's axis on a phone, in radians (about 29°): the human hand comes up from the lower left. */
const DIAGONAL = 0.5;
/**
 * The mark's proportions, as shares of its outer diameter (Brand, on the 80
 * grid: 60 across, the ring's centre line at r 24, the dot r 6 at 45°). The
 * scene's shader, the sketch and the visitor's dot all land on these.
 */
export const LAZO = { anillo: 0.4, punto: 0.1 } as const;

export type Encuadre = {
  /** A phone-sized strip: the lighter hands and the bigger mark. */
  compact: boolean;
  /** The mark's outer diameter, in units. */
  size: number;
  /** The mark quad's scale (the ring is 0.75 of it). */
  mark: number;
  /** The least the camera keeps in view (VISTA, or VISTA_COMPACTA on a phone). */
  vista: { ancho: number; alto: number };
  /**
   * Gap between the fingertips while the hands wait, reaching, with just the
   * room the loop needs between them (they come in from 1.4 times it), and
   * once the loop closes.
   */
  espera: number;
  shut: number;
  /** The pair's turn about the camera's axis, in radians (0 on a wide strip). */
  giro: number;
  /** Height of the human fingertip (the machine's is the opposite). */
  lift: number;
  /** Camera distance with the dolly done. */
  z: number;
  /** CSS pixels per unit on the plane of the fingertips. */
  px: number;
};

/**
 * The framing for a strip of `width` × `height` CSS pixels. The camera fits
 * about 1.12 units of height and never less than 2.1 of width (1.9 and 1.75
 * on a phone, where the pair meets on a diagonal): either way the arms leave
 * the frame. The mark fits between the fingertips with a little more than its
 * clear space (Brand: the o's inner radius, 0.6 of its outer one).
 */
export function encuadre(width: number, height: number): Encuadre {
  const compact = width < 760;
  const vista = compact ? VISTA_COMPACTA : VISTA;
  const size = compact ? 0.2 : 0.15;
  const reach = size / 2 + 0.8 * (size / 2) + 0.005;
  const half = Math.tan((FOV * Math.PI) / 360);
  const aspect = width / (height || 1);
  return {
    compact,
    vista,
    size,
    mark: size * (32 / 30),
    espera: compact ? 0.54 : 0.56,
    shut: 2 * Math.sqrt(reach * reach - LIFT * LIFT),
    lift: -LIFT,
    giro: compact ? DIAGONAL : 0,
    z: Math.max(vista.alto / (2 * half), vista.ancho / (2 * half * aspect)),
    px: Math.min(width / vista.ancho, height / vista.alto),
  };
}
