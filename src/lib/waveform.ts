/**
 * allok's one mark: an amplitude-modulated sine. Dense carrier, envelope that
 * swells, waists in the middle and dies at both ends — the shape of a signal
 * that got picked up, not a decoration.
 *
 * Each half-cycle is a single quadratic. A Bézier from (0,0) to (w,0) with its
 * control at (w/2, 2A) passes through exactly (w/2, A), so parabolic arcs read
 * as a sine at a fraction of the path data — 52 segments for the wide banner
 * instead of ~500 sampled points.
 *
 * Pure and deterministic: server and client render byte-identical `d`, so no
 * hydration mismatch.
 */
export type WaveOptions = {
  /** Full oscillations across the width. 6-9 stays legible at favicon size; 20+ is the album-cover density. */
  cycles: number;
  width: number;
  /** Peak amplitude at the envelope's tallest lobe. */
  amp: number;
  /** Centre line. */
  midY: number;
  /** Envelope height at the waist, as a fraction of peak. 0 pinches shut. */
  waist?: number;
};

export function wavePath({ cycles, width, amp, midY, waist = 0.22 }: WaveOptions): string {
  const halves = Math.max(2, Math.round(cycles * 2));
  const step = width / halves;
  let d = `M0 ${round(midY)}`;

  for (let i = 0; i < halves; i += 1) {
    const t = (i + 0.5) / halves;
    const env =
      Math.sin(Math.PI * t) * (waist + (1 - waist) * Math.abs(Math.sin(2 * Math.PI * t)));
    // SVG y grows downward; negate so the first lobe rises.
    const peak = -amp * env * (i % 2 === 0 ? 1 : -1);
    const ctrlX = i * step + step / 2;
    const endX = (i + 1) * step;
    d += ` Q${round(ctrlX)} ${round(midY + 2 * peak)} ${round(endX)} ${round(midY)}`;
  }

  return d;
}

function round(n: number) {
  return Number(n.toFixed(2));
}
