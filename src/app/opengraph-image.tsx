import { readFile } from "node:fs/promises";
import { join } from "node:path";

// La imagen que se ve al compartir allok.fun por WhatsApp o Facebook: el
// cuadro cerrado de la escena de la portada («Te toca»), las dos manos con el
// lazo cerrado entre las yemas, sobre Ink y con «allok» pequeño en Steel abajo
// a la izquierda. Es la escena real, no un dibujo aparte: se renderizó una vez
// con Playwright (window.__manos("cerrado") en desarrollo) a
// public/og/te-toca.png, y esta ruta la sirve tal cual. La ruta sigue siendo
// /opengraph-image porque /trabajo la enlaza.
export const alt = "Te toca, 2026. Adrián Avila.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Se lee una vez: no depende de la petición.
const png = readFile(join(process.cwd(), "public/og/te-toca.png"));

export default async function Image() {
  return new Response(new Uint8Array(await png), { headers: { "Content-Type": contentType } });
}
