import { wavePath } from "@/lib/waveform";

type Props = {
  className?: string;
  /** Oscillation count. 20+ is the dense album-cover read; keep marks under 8. */
  cycles?: number;
  /** Stroke width in viewBox units (viewBox is 1000×160). */
  weight?: number;
  /** Envelope height at the waist, as a fraction of peak. */
  waist?: number;
  /** Tail runs to the accent instead of staying single-colour. */
  accentTail?: boolean;
  id?: string;
};

const ACCENT = "#c5f04a";

/**
 * The brand's full-width signal. Sits under section headings and across the
 * ops chrome so every surface carries the same mark at a different scale.
 * `currentColor` by default — the caller owns the colour.
 */
export default function Waveform({
  className,
  cycles = 26,
  weight = 3.4,
  waist = 0.22,
  accentTail = false,
  id = "releva-wave",
}: Props) {
  const d = wavePath({ cycles, width: 1000, amp: 62, midY: 80, waist });

  return (
    <svg
      viewBox="0 0 1000 160"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {accentTail && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0.55" stopColor="currentColor" />
            <stop offset="1" stopColor={ACCENT} />
          </linearGradient>
        </defs>
      )}
      <path
        d={d}
        fill="none"
        stroke={accentTail ? `url(#${id})` : "currentColor"}
        strokeWidth={weight}
        strokeLinecap="round"
      />
    </svg>
  );
}
