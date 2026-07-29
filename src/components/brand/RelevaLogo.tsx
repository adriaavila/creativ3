import { wavePath } from "@/lib/waveform";

type Props = {
  className?: string;
  variant?: "mark" | "mark-bare" | "wordmark" | "lockup" | "lockup-bare";
  theme?: "light" | "dark" | "auto";
};

/*
 * The mark is an amplitude-modulated sine: six oscillations, envelope swelling
 * and waisting across the width. Six is the ceiling — seven still reads at 64px
 * but mushes into a grey smear at favicon size, and the mark has to survive 20px.
 *
 * Generated, not hand-drawn, so the wide `Waveform` banner is provably the same
 * curve at another scale rather than a lookalike.
 */
const WAVE_INSET = 7;
const WAVE_WIDTH = 64 - WAVE_INSET * 2;
const MARK_PATH = wavePath({ cycles: 6, width: WAVE_WIDTH, amp: 15, midY: 32 });

const ACCENT = "#c5f04a";

// One id per variant. Two logos of the same variant on a page resolve to the
// first definition, which is byte-identical — same paint, no visual drift.
function gradientId(variant: string) {
  return `releva-stroke-${variant}`;
}

function StrokeGradient({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient
        id={id}
        x1={WAVE_INSET}
        y1="0"
        x2={WAVE_INSET + WAVE_WIDTH}
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0.5" stopColor="currentColor" />
        <stop offset="1" stopColor={ACCENT} />
      </linearGradient>
    </defs>
  );
}

function Mark({ id, strokeWidth = 2.6 }: { id: string; strokeWidth?: number }) {
  return (
    <path
      d={MARK_PATH}
      transform={`translate(${WAVE_INSET},0)`}
      fill="none"
      stroke={`url(#${id})`}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  );
}

const WORDMARK_FONT =
  "var(--font-grotesk), var(--font-instrument-sans), Inter, sans-serif";

export default function RelevaLogo({
  className,
  variant = "lockup",
  theme = "auto",
}: Props) {
  const isDark = theme === "dark";
  const badgeBg = isDark ? "#111214" : "#08090a";
  const id = gradientId(variant);

  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Releva"
      >
        <rect width="64" height="64" rx="16" fill={badgeBg} />
        <g className="text-white">
          <StrokeGradient id={id} />
          <Mark id={id} />
        </g>
      </svg>
    );
  }

  if (variant === "mark-bare") {
    return (
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Releva"
      >
        <StrokeGradient id={id} />
        <Mark id={id} />
      </svg>
    );
  }

  if (variant === "wordmark") {
    return (
      <svg
        viewBox="0 0 116 44"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Releva"
      >
        <text
          x="0"
          y="33"
          textLength="112"
          lengthAdjust="spacingAndGlyphs"
          fontFamily={WORDMARK_FONT}
          fontSize="34"
          fontWeight="600"
          letterSpacing="-1.3"
          fill="currentColor"
        >
          releva
        </text>
      </svg>
    );
  }

  if (variant === "lockup-bare") {
    return (
      <svg
        viewBox="0 0 172 56"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="Releva"
      >
        <StrokeGradient id={id} />
        <g transform="translate(-2,1) scale(0.85)">
          <Mark id={id} strokeWidth={3.1} />
        </g>
        <text
          x="54"
          y="37"
          textLength="112"
          lengthAdjust="spacingAndGlyphs"
          fontFamily={WORDMARK_FONT}
          fontSize="33"
          fontWeight="600"
          letterSpacing="-1.4"
          fill="currentColor"
        >
          releva
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 178 56"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Releva"
    >
      <rect width="48" height="48" y="4" rx="14" fill={badgeBg} />
      <g className="text-white">
        <StrokeGradient id={id} />
        <g transform="translate(4,8) scale(0.625)">
          <Mark id={id} strokeWidth={3.6} />
        </g>
      </g>
      <text
        x="60"
        y="37"
        textLength="112"
        lengthAdjust="spacingAndGlyphs"
        fontFamily={WORDMARK_FONT}
        fontSize="33"
        fontWeight="600"
        letterSpacing="-1.4"
        fill="currentColor"
      >
        releva
      </text>
    </svg>
  );
}
