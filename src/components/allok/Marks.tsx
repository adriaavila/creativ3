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
  { offset: "0", color: "#1B3F96" },
  { offset: "0.42", color: "#67277D" },
  { offset: "0.76", color: "#B41065" },
  { offset: "1", color: "#FF9A3D" },
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

/** La onda de allok: amplitud que crece y decae. Sin contenedor — es la casa. */
export function AllokMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="allok">
      <defs>
        <SkyStroke id="mk-allok" x1={7} x2={57} />
      </defs>
      <rect width="64" height="64" rx="16" fill="#08090A" />
      <path
        d="M7 32 Q9.1 30.4 11.2 32 Q13.3 40.9 15.3 32 Q17.4 14.2 19.5 32 Q21.6 55.2 23.7 32 Q25.8 10.6 27.8 32 Q29.9 44.6 32 32 Q34.1 19.5 36.2 32 Q38.3 53.4 40.3 32 Q42.4 8.8 44.5 32 Q46.6 49.8 48.7 32 Q50.8 23.1 52.8 32 Q54.9 33.7 57 32"
        fill="none"
        stroke="url(#mk-allok)"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
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
      <rect x="4" y="4" width="56" height="48" rx="14" fill="#08090A" />
      <path d="M16 50 L13 62 L31 50 Z" fill="#08090A" />
      <path
        d="M12 28 Q14 23 16 28 Q18 37 20 28 Q22 15 24 28 Q26 42 28 28 Q30 13 32 28 Q34 39 36 28 Q38 24 40 28 L47 28"
        fill="none"
        stroke="url(#mk-rei)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50.5" cy="28" r="2.6" fill="#FF9A3D" />
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
      <rect width="64" height="64" rx="16" fill="#08090A" />
      <path
        d="M17 18 H11 V46 H17 M47 18 H53 V46 H47"
        fill="none"
        stroke="rgba(247,244,239,.55)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 32 Q22.5 27 25 32 Q27.5 42 30 32 Q32.5 16 35 32 Q37.5 45 40 32 Q42.5 28 45 32"
        fill="none"
        stroke="url(#mk-vocero)"
        strokeWidth="3.2"
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
}: {
  product?: Product;
  size?: number;
  onSky?: boolean;
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
          <span style={{ fontSize: size * 0.62, color: ink, fontWeight: 700 }}>allok</span>
        )}
      </span>
    </span>
  );
}
