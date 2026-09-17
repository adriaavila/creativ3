# Dawn → Dusk — la marca

Sistema publicado: https://claude.ai/artifact/YK8GAX6udVnCL3GpMsbaMK — tokens, componentes y los SVG de la marca. Los archivos de abajo están en `public/brand/`; el componente es `src/components/brand/DayArc.tsx`.


The day arc. One stroke rises from the horizon at dawn, crosses the sky and sets at dusk; the sun rides it just past noon. The stroke is the sky's own ramp — `sky-cobalt` → `sky-violet` → `sky-magenta` → `lit-dawn` — so the logo and the footer are the same object. Nothing about it is drawn: the arc is a half-ellipse (rx 20, ry 27 on a 64 grid), the horizon a rule, and the sun's place is a number.

## Construction

On a 64 × 64 grid:

| part | geometry | paint |
|---|---|---|
| horizon | `M5 46 H59`, 2.4 stroke, round caps | `ink` at 24% on paper, `ink` (void theme) at 24% on void |
| arc | `M12 46 A 20 27 0 0 1 52 46`, 5 stroke, round caps | linear gradient x 12 → 52: `sky-cobalt` 0, `sky-violet` .42, `sky-magenta` .76, `lit-dawn` 1 |
| sun | circle r 5.5 at *t* = 0.58 → (36.97, 19.85), 2.2 knockout stroke in the ground colour | `lit-dawn` |
| tile (badge only) | 64 × 64, `radius-lg` 16 | `ground` void |

The sun sits at *t* = 0.58 on purpose: past the apex, so the arc reads left-to-right — dawn → dusk — but high enough that the descending limb stays a clean line. *t* is the same `--sky-t` that drives the site's sky machine; `<DayArc t={…} />` in `src/components/brand/DayArc.tsx` moves the sun with the page. On void grounds the arc's first three stops lift one step (`#4f79d6`, `#9a4fb4`, `#e0388b`) so the dawn end does not sink into black; the favicon raises every stroke (arc 6.5, sun 6.5, horizon 3.2) to survive 16px.

## Files

- `dawn-dusk-mark.svg` — the badge: arc on its void tile. App icon, avatar, anywhere the ground is unknown.
- `dawn-dusk-mark-ink.svg` — bare, for paper grounds.
- `dawn-dusk-mark-paper.svg` — bare, for void and sky grounds.
- `dawn-dusk-favicon.svg` — the badge with heavier strokes for 16–32px.
- `dawn-dusk-seal.svg` — the stamp: the mark inside its own sentence.

## Lockups

- **House:** mark + `allok` in `display-sm` (Geist 700, lowercase), gap `space-2`, mark height = 1.3 × cap height. The header on every page.
- **Product:** mark + `allok` in `ink-40` + `×` + `rei` in `ink` at 1.35× the house size. The house yields, the product speaks.
- **Poster:** mark + `ALLOK` in `poster` (Archivo Black, uppercase, −0.05em). Footers, covers, the seal's neighbourhood. Never in a header.

## Clear space and minimums

Clear space is the sun's diameter (11 units on the 64 grid) on every side. Bare mark ≥ 24px, badge ≥ 20px, favicon file at 16px. Under 24px use the favicon file.

## Don't

- Don't recolour the arc; the ramp is the identity. On a single-ink context (embroidery, engraving) use the badge shape as a solid `ink` silhouette: horizon, arc and sun in one colour.
- Don't rotate, mirror or put the sun elsewhere than on the arc.
- Don't set the wordmark in Comfortaa; the round face is retired.
- Don't place the bare mark on the sky ramp in its ink version; use the paper version, or the seal.
