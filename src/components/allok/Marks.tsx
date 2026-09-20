import { ACCENT, ACCENT_LIT, MARK_BAR, MARK_PATH, MARK_STROKE, STATES, type SystemState } from "@/lib/brand";
/**
 * Las tres marcas de la casa, dibujadas con el mismo trazo.
 *
 * allok es una onda de voz. REI la encierra en un globo de conversación y la
 * resuelve en línea recta: el ruido convertido en respuesta. Vocero la pone
 * entre corchetes: la misma voz, ajustada a la medida de un negocio.
 *
 * El degradado es el del cielo — el mismo que pinta el pie de página — así que
 * el logo y el sitio son el mismo objeto.
 */

const STOPS = [
  { offset: "0", color: ACCENT },
  { offset: "1", color: ACCENT_LIT },
] as const;

function SkyStroke({ id, x1, x2 }: { id: string; x1: number; x2: number }) {
  return (
    <linearGradient id={id} x1={x1} y1="0" x2={x2} y2="0" gradientUnits="userSpaceOnUse">
      {STOPS.map((s) => (
        <stop key={s.offset} offset={s.offset} stopColor={s.color} />
      ))}
    </linearGradient>
  );
}

/** allok: la señal que se pone de pie y se vuelve A. Misma geometría que
 *  `AllokLogo` — las dos leen `MARK_PATH`, así que no pueden separarse. */
export function AllokMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="allok">
      <defs>
        <SkyStroke id="mk-allok" x1={10} x2={54} />
      </defs>
      <rect width="64" height="64" rx="16" fill="#0e1011" />
      <g fill="none" stroke="url(#mk-allok)" strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round">
        <path d={MARK_PATH} />
        <path d={MARK_BAR} />
      </g>
    </svg>
  );
}

/** REI: la onda dentro de un globo, terminando en línea recta y un punto. */
export function ReiMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="REI">
      <defs>
        <SkyStroke id="mk-rei" x1={12} x2={52} />
      </defs>
      <rect x="4" y="4" width="56" height="48" rx="14" fill="#0e1011" />
      <path d="M16 50 L13 62 L31 50 Z" fill="#0e1011" />
      <path
        d={MARK_PATH}
        transform="translate(0,-6) scale(0.78) translate(6,6)"
        fill="none"
        stroke="url(#mk-rei)"
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50.5" cy="28" r="2.6" fill={STATES.activo.dot} />
    </svg>
  );
}

/** Vocero: la onda entre corchetes — recortada al tamaño de un negocio. */
export function VoceroMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Vocero">
      <defs>
        <SkyStroke id="mk-vocero" x1={20} x2={46} />
      </defs>
      <rect width="64" height="64" rx="16" fill="#0e1011" />
      <path
        d="M17 18 H11 V46 H17 M47 18 H53 V46 H47"
        fill="none"
        stroke="rgba(247,244,239,.55)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={MARK_PATH}
        transform="translate(10,2) scale(0.68)"
        fill="none"
        stroke="url(#mk-vocero)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const MARKS = { allok: AllokMark, rei: ReiMark, vocero: VoceroMark } as const;

export type Product = keyof typeof MARKS;

/**
 * La firma. Sola (`allok`) en la casa; con el producto delante en cada
 * subpágina — `allok × rei` — donde la casa va en peso bajo y el producto
 * manda. Es la misma regla que usa cualquier marca con submarcas: quien
 * compra REI compra a allok, pero en esa página el que habla es REI.
 */
export function Lockup({
  product,
  size = 30,
  onSky = true,
  state,
}: {
  product?: Product;
  size?: number;
  onSky?: boolean;
  /** El punto detrás del nombre: el estado real, o nada. */
  state?: SystemState;
}) {
  const Mark = MARKS[product ?? "allok"];
  const dim = onSky ? "rgba(247,244,239,.6)" : "rgba(16,17,18,.45)";
  const ink = onSky ? "rgb(247 244 239)" : "#101112";

  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={size} />
      <span className="display-sm inline-flex items-baseline gap-1.5">
        {product ? (
          <>
            <span style={{ fontSize: size * 0.46, color: dim }}>allok</span>
            <span style={{ fontSize: size * 0.4, color: dim }} aria-hidden="true">
              ×
            </span>
            <span style={{ fontSize: size * 0.62, color: ink, fontWeight: 700 }}>{product}</span>
          </>
        ) : (
          <span className="inline-flex items-baseline" style={{ fontSize: size * 0.62, color: ink, fontWeight: 700 }}>
            allok
            {state ? (
              <span
                aria-label={STATES[state].label}
                title={STATES[state].label}
                style={{
                  width: size * 0.19, height: size * 0.19, marginLeft: size * 0.07,
                  borderRadius: 999, background: STATES[state].dot, display: "inline-block",
                }}
              />
            ) : null}
          </span>
        )}
      </span>
    </span>
  );
}
