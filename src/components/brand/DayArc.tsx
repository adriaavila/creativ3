/**
 * The day arc — the mark of the Dawn → Dusk system.
 *
 * One stroke rises from the horizon at dawn, crosses the sky and sets at
 * dusk; the sun rides it just past noon. The stroke is the sky's own ramp
 * (the same stops as `Marks.tsx` and `--sky-stops`), so the logo and the
 * footer are the same object. Nothing is drawn: the arc is a half-ellipse,
 * the horizon a rule, and the sun's place is a number — the same `t` that
 * drives `src/lib/sky.ts`, so a footer may hand it `--sky-t` and the sun
 * moves with the page.
 *
 * The products keep the grammar the old marks had — same stroke, three
 * containers: `CrmMark` puts the day inside a conversation bubble,
 * `AgentMark` between brackets, the same day cut to the size of one
 * business's systems. Both ship as badges only: the product UI is void.
 *
 * Static files of every variant live in `public/brand/` for contexts
 * outside the site. Spec: docs/design/dawn-dusk.md.
 */

const RX = 20;
const RY = 27;
const CX = 32;
const HORIZON = 46;

/** Sun position on the arc for `t` in 0 (dawn) → 1 (dusk). */
export function sunAt(t: number): { x: number; y: number } {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const phi = (1 - k) * Math.PI;
  return {
    x: Number((CX + RX * Math.cos(phi)).toFixed(2)),
    y: Number((HORIZON - RY * Math.sin(phi)).toFixed(2)),
  };
}

/** The arc's ramp. `paper` (for void and sky grounds) lifts the cool stops one step so dawn does not sink into black. */
const STOPS = {
  ink: ["#1b3f96", "#67277d", "#b41065", "#ff9a3d"],
  paper: ["#4f79d6", "#9a4fb4", "#e0388b", "#ffb066"],
} as const;
const OFFSETS = ["0", "0.42", "0.76", "1"] as const;

const GROUND = {
  badge: { tile: "#08090a", horizon: "#f5f4f0", knockout: "#08090a", ramp: "paper" },
  ink: { tile: null, horizon: "#101112", knockout: "#f5f4f0", ramp: "ink" },
  paper: { tile: null, horizon: "#f5f4f0", knockout: "#08090a", ramp: "paper" },
} as const;

export type DayArcVariant = keyof typeof GROUND;

export function DayArc({
  size = 32,
  t = 0.58,
  variant = "badge",
  className,
}: {
  size?: number;
  /** 0 = dawn, 1 = dusk. The brand rests at 0.58: past the apex, so the arc reads left to right. */
  t?: number;
  variant?: DayArcVariant;
  className?: string;
}) {
  const g = GROUND[variant];
  const sun = sunAt(t);
  const id = `day-arc-${variant}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="allok"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="12" y1="0" x2="52" y2="0" gradientUnits="userSpaceOnUse">
          {STOPS[g.ramp].map((c, i) => (
            <stop key={c} offset={OFFSETS[i]} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      {g.tile && <rect width="64" height="64" rx="16" fill={g.tile} />}
      <path
        d={`M5 ${HORIZON} H59`}
        fill="none"
        stroke={g.horizon}
        strokeOpacity="0.24"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d={`M12 ${HORIZON} A ${RX} ${RY} 0 0 1 52 ${HORIZON}`}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx={sun.x} cy={sun.y} r="5.5" fill="#ff9a3d" stroke={g.knockout} strokeWidth="2.2" />
    </svg>
  );
}

/* ── Product marks: a smaller day inside a container, on the void tile. ── */

const INNER_RX = 14;
const INNER_RY = 19;
const INNER_HORIZON = 40;

function innerSunAt(t: number): { x: number; y: number } {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const phi = (1 - k) * Math.PI;
  return {
    x: Number((CX + INNER_RX * Math.cos(phi)).toFixed(2)),
    y: Number((INNER_HORIZON - INNER_RY * Math.sin(phi)).toFixed(2)),
  };
}

function ProductBadge({
  id,
  size,
  t,
  label,
  className,
  children,
}: {
  id: string;
  size: number;
  t: number;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const sun = innerSunAt(t);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label} className={className}>
      <defs>
        <linearGradient id={id} x1="18" y1="0" x2="46" y2="0" gradientUnits="userSpaceOnUse">
          {STOPS.paper.map((c, i) => (
            <stop key={c} offset={OFFSETS[i]} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#08090a" />
      {children}
      <path d="M14 40 H50" fill="none" stroke="#f5f4f0" strokeOpacity="0.24" strokeWidth="2" strokeLinecap="round" />
      <path
        d={`M18 ${INNER_HORIZON} A ${INNER_RX} ${INNER_RY} 0 0 1 46 ${INNER_HORIZON}`}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx={sun.x} cy={sun.y} r="4.2" fill="#ff9a3d" stroke="#08090a" strokeWidth="1.8" />
    </svg>
  );
}

/** The CRM: the day inside a conversation. The allok app icon and the `allok × rei` lockup's mark. */
export function CrmMark({ size = 32, t = 0.58, className }: { size?: number; t?: number; className?: string }) {
  return (
    <ProductBadge id="day-arc-crm" size={size} t={t} label="allok CRM" className={className}>
      <path
        d="M20 8 H44 A12 12 0 0 1 56 20 V38 A12 12 0 0 1 44 50 H24 L13 58 L16 50 A12 12 0 0 1 8 38 V20 A12 12 0 0 1 20 8 Z"
        fill="none"
        stroke="#f5f4f0"
        strokeOpacity="0.55"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
    </ProductBadge>
  );
}

/** The agent: the same day between brackets — cut to the size of one business's systems. Vocero's mark. */
export function AgentMark({ size = 32, t = 0.58, className }: { size?: number; t?: number; className?: string }) {
  return (
    <ProductBadge id="day-arc-agent" size={size} t={t} label="vocero" className={className}>
      <path
        d="M15 14 H9 V50 H15 M49 14 H55 V50 H49"
        fill="none"
        stroke="#f5f4f0"
        strokeOpacity="0.55"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </ProductBadge>
  );
}
