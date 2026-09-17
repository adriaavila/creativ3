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
