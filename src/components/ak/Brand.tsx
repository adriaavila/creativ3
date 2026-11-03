import type { CSSProperties } from "react";

// The wordmark's geometry, inline, from the design system's vector master
// (282 × 116 grid, stroke 13). Never typed in Geist; it is drawn.
export function WordmarkSvg() {
  return (
    <svg viewBox="0 0 282 116" role="img" aria-label="allok">
      <path
        d="M63 44V96 M63 70a26 26 0 1 1-52 0a26 26 0 1 1 52 0 M94 18V96 M125 18V96 M202.9 72.27A26 26 0 1 0 179.27 95.9 M231 18V96 M262 44L231 70L266 96"
        fill="none"
        stroke="currentColor"
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="195.38" cy="88.38" r="6.5" fill="currentColor" />
    </svg>
  );
}

/**
 * The mark alone, from the same master: on an 80 grid, a circle of radius 24
 * and stroke 12, open from 5° to 85° in the lower right, and a dot of radius
 * 6 at 45°. Inside `data-reveal="close"` the arc draws and the dot lands.
 */
export function MarkSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" aria-hidden="true">
      <path className="close-arc" pathLength={1} d="M63.909 42.092A24 24 0 1 0 42.092 63.909" />
      <circle className="close-dot" cx="56.971" cy="56.971" r="6" />
    </svg>
  );
}

/** Custom properties in a style prop (`--d`, `--l`, `--h`…). */
export function vars(v: Record<string, string | number>): CSSProperties {
  return v as CSSProperties;
}

/** A line of display type that rises from behind its own edge. */
export function Rise({ children, line = 0 }: { children: React.ReactNode; line?: number }) {
  return (
    <span className="rise" style={line ? vars({ "--l": line }) : undefined}>
      <span>{children}</span>
    </span>
  );
}

/** The outcome, in accent, with its period landing last like the mark's dot. */
export function Outcome({ children }: { children: React.ReactNode }) {
  return (
    <span className="outcome">
      {children}
      <span className="land">.</span>
    </span>
  );
}
