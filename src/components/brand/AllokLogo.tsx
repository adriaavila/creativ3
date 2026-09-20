import { ACCENT, ACCENT_LIT, MARK_BAR, MARK_PATH, MARK_STROKE, STATES, type SystemState } from "@/lib/brand";

type Props = {
  className?: string;
  variant?: "mark" | "mark-bare" | "wordmark" | "lockup" | "lockup-bare";
  theme?: "light" | "dark" | "auto";
  /**
   * El punto detrás del logotipo ES el estado del sistema. Sin estado no hay
   * punto: un punto verde decorativo mentiría la primera vez que algo se caiga.
   */
  state?: SystemState;
};

const WORDMARK_FONT = "var(--font-grotesk), var(--font-instrument-sans), Inter, sans-serif";

function gradientId(variant: string) {
  return `allok-a-${variant}`;
}

function MarkGradient({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="10" y1="52" x2="54" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={ACCENT} />
        <stop offset="1" stopColor={ACCENT_LIT} />
      </linearGradient>
    </defs>
  );
}

function Mark({ paint, stroke = MARK_STROKE }: { paint: string; stroke?: number }) {
  return (
    <g fill="none" stroke={paint} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d={MARK_PATH} />
      <path d={MARK_BAR} />
    </g>
  );
}

/** El punto de estado, a la altura de la línea base del logotipo. */
function StateDot({ cx, cy, r, state }: { cx: number; cy: number; r: number; state: SystemState }) {
  return <circle cx={cx} cy={cy} r={r} fill={STATES[state].dot} />;
}

export default function AllokLogo({ className, variant = "lockup", theme = "auto", state }: Props) {
  const isDark = theme === "dark";
  const badgeBg = isDark ? "#111214" : "#0e1011";
  const id = gradientId(variant);
  const paint = `url(#${id})`;

  if (variant === "mark") {
    return (
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="allok">
        <rect width="64" height="64" rx="16" fill={badgeBg} />
        <MarkGradient id={id} />
        <Mark paint={paint} />
      </svg>
    );
  }

  if (variant === "mark-bare") {
    return (
      <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="allok">
        <MarkGradient id={id} />
        <Mark paint={paint} />
      </svg>
    );
  }

  if (variant === "wordmark") {
    return (
      <svg viewBox="0 0 104 44" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="allok">
        <text
          x="0" y="33" textLength="88" lengthAdjust="spacingAndGlyphs"
          fontFamily={WORDMARK_FONT} fontSize="34" fontWeight="700" letterSpacing="-1.5"
          fill="currentColor"
        >
          allok
        </text>
        {state ? <StateDot cx={96} cy={28} r={5.5} state={state} /> : null}
      </svg>
    );
  }

  if (variant === "lockup-bare") {
    return (
      <svg viewBox="0 0 160 56" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="allok">
        <MarkGradient id={id} />
        <g transform="translate(-4,2) scale(0.88)">
          <Mark paint={paint} />
        </g>
        <text
          x="56" y="37" textLength="88" lengthAdjust="spacingAndGlyphs"
          fontFamily={WORDMARK_FONT} fontSize="33" fontWeight="700" letterSpacing="-1.5"
          fill="currentColor"
        >
          allok
        </text>
        {state ? <StateDot cx={152} cy={32} r={5.5} state={state} /> : null}
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 166 56" xmlns="http://www.w3.org/2000/svg" className={className} role="img" aria-label="allok">
      <rect width="48" height="48" y="4" rx="14" fill={badgeBg} />
      <MarkGradient id={id} />
      <g transform="translate(4,8) scale(0.625)">
        <Mark paint={paint} stroke={MARK_STROKE + 1.4} />
      </g>
      <text
        x="60" y="37" textLength="88" lengthAdjust="spacingAndGlyphs"
        fontFamily={WORDMARK_FONT} fontSize="33" fontWeight="700" letterSpacing="-1.5"
        fill="currentColor"
      >
        allok
      </text>
      {state ? <StateDot cx={158} cy={32} r={5.5} state={state} /> : null}
    </svg>
  );
}
