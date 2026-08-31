/**
 * Sky Machine — the atmosphere the whole portfolio floats in.
 *
 * One number (`t`, 0 → 1) drives the entire palette: dawn cobalt at 0, dusk
 * magenta at 1. The site feeds it scroll progress; the /lab experiment feeds
 * it a knob. Everything else — sky gradient, cloud tint, glass tint, shadow
 * colour — is derived here so a single value moves the whole page at once.
 *
 * Two anchors, one lerp: that is what a real sunset does, and it means the
 * midpoints (indigo sky, peach clouds) come out physically plausible for free
 * instead of being hand-picked per section.
 */

export type Rgb = readonly [number, number, number];

export type SkyPalette = {
  /** Zenith — top of the fixed gradient. */
  high: Rgb;
  /** Body of the sky. */
  mid: Rgb;
  /** Haze at the horizon. */
  low: Rgb;
  /** Sunlit face of a cumulus. */
  cloudLit: Rgb;
  /** Shadowed underside. */
  cloudShade: Rgb;
};

const DAWN: SkyPalette = {
  high: [3, 18, 63],
  mid: [27, 63, 150],
  low: [74, 84, 128],
  cloudLit: [255, 154, 61],
  cloudShade: [57, 64, 107],
};

const DUSK: SkyPalette = {
  high: [74, 6, 48],
  mid: [180, 16, 101],
  low: [143, 74, 88],
  cloudLit: [255, 227, 194],
  cloudShade: [138, 74, 114],
};

/**
 * The one text colour, constant across the whole range. It does not
 * interpolate on purpose: type that changes contrast as you scroll is a
 * readability bug, not an effect. `sky.test.ts` asserts every sky colour
 * stays dark enough to carry it at WCAG AA.
 */
export const INK: Rgb = [247, 244, 239];

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

export const css = (c: Rgb) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
export const cssA = (c: Rgb, alpha: number) => `rgb(${c[0]} ${c[1]} ${c[2]} / ${alpha})`;

export function skyPalette(t: number): SkyPalette {
  const k = clamp01(t);
  return {
    high: mixRgb(DAWN.high, DUSK.high, k),
    mid: mixRgb(DAWN.mid, DUSK.mid, k),
    low: mixRgb(DAWN.low, DUSK.low, k),
    cloudLit: mixRgb(DAWN.cloudLit, DUSK.cloudLit, k),
    cloudShade: mixRgb(DAWN.cloudShade, DUSK.cloudShade, k),
  };
}

/**
 * The custom properties written onto `<html>` every frame. Every glass
 * surface, shadow and border in the app reads these, which is why the
 * interface re-tints itself as the sky moves without a single component
 * knowing about scroll.
 */
export function skyVars(t: number): Record<string, string> {
  const p = skyPalette(t);
  return {
    "--sky-t": String(clamp01(t)),
    "--sky-high": css(p.high),
    "--sky-mid": css(p.mid),
    "--sky-low": css(p.low),
    "--cloud-lit": css(p.cloudLit),
    "--cloud-shade": css(p.cloudShade),
    // Glass reads the sky it sits on: tint from the horizon haze, edge and
    // specular from the sunlit cloud face. This is the whole trick — the
    // buttons look expensive because they are lit by the same sun.
    "--glass-tint": cssA(p.low, 0.16),
    "--glass-tint-strong": cssA(p.mid, 0.34),
    "--glass-edge": cssA(p.cloudLit, 0.55),
    "--glass-spec": cssA(p.cloudLit, 0.9),
    "--glass-bloom": cssA(p.cloudLit, 0.42),
    "--glass-shadow": cssA(p.high, 0.55),
  };
}

/** WCAG relative luminance. Exported for the contrast assertions in the test. */
export function luminance([r, g, b]: Rgb): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
