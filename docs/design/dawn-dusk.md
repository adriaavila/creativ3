# Dawn → Dusk — las marcas

Sistema publicado: https://claude.ai/artifact/YK8GAX6udVnCL3GpMsbaMK — tokens, componentes del producto y los SVG. Los archivos de abajo están en `public/brand/`; los componentes son `DayArc`, `CrmMark` y `AgentMark` en `src/components/brand/DayArc.tsx`.

One stroke, three containers. **The day arc** is the house: a stroke rises from the horizon at dawn, crosses the sky and sets at dusk, with the sun riding it just past noon. The **CRM** puts the same day inside a conversation bubble. The **agent** puts it between brackets — the same day, cut to the size of one business's systems. That is the logic the old marks already had (wave, wave in a bubble, wave in brackets); the stroke is new, the grammar is kept.

The arc is the sky's own ramp — `sky-cobalt` → `sky-violet` → `sky-magenta` → `lit-dawn` — so the logo and the footer are the same object. Nothing is drawn: the arc is a half-ellipse, the horizon a rule, and the sun's place is a number.

## Construction — the house mark

On a 64 × 64 grid:

| part | geometry | paint |
|---|---|---|
| horizon | `M5 46 H59`, 2.4 stroke, round caps | `ink` at 24% |
| arc | `M12 46 A 20 27 0 0 1 52 46`, 5 stroke, round caps | gradient x 12 → 52: `sky-cobalt` 0, `sky-violet` .42, `sky-magenta` .76, `lit-dawn` 1 |
| sun | circle r 5.5 at *t* = 0.58 → (36.97, 19.85), 2.2 knockout in the ground colour | `lit-dawn` |
| tile (badge) | 64 × 64, `radius-lg` | `ground` void |

*t* = 0.58 sits past the apex so the arc reads dawn → dusk, high enough that the descending limb stays a clean line. It is the same `--sky-t` that drives the sky machine: `<DayArc t={…} />` moves the sun with the page. On void the arc's cool stops lift one step (`#4f79d6`, `#9a4fb4`, `#e0388b`) so dawn does not sink into black; the favicon raises every stroke to survive 16px.

## The product marks

Both use a smaller day (horizon `M14 40 H50`, arc `M18 40 A 14 19 0 0 1 46 40`, sun r 4.2 at (35.48, 21.6)) inside a container drawn in `ink` (void value) at 55%, 2.4–2.6 stroke, on the void tile:

- **CRM** — a bubble: `M20 8 H44 A12 12 0 0 1 56 20 V38 A12 12 0 0 1 44 50 H24 L13 58 L16 50 A12 12 0 0 1 8 38 V20 A12 12 0 0 1 20 8 Z`, tail bottom-left. The allok app icon and the `allok × rei` lockup's mark.
- **Agent** — brackets: `M15 14 H9 V50 H15 M49 14 H55 V50 H49`. Vocero's mark.

They ship as badges only: the product UI is void, and a bare product mark on paper has no job yet.

## Files

- `dawn-dusk-mark.svg` — the house badge. App icon, avatar, unknown grounds.
- `dawn-dusk-mark-ink.svg` / `dawn-dusk-mark-paper.svg` — bare, for paper / for void and sky.
- `dawn-dusk-favicon.svg` — heavier strokes for 16–32px.
- `dawn-dusk-crm.svg` — the CRM badge. `dawn-dusk-agent.svg` — the agent badge.
- `dawn-dusk-seal.svg` — the stamp, for the sky footer.

## Lockups

- **House:** house mark + `allok` in `display-sm` (Geist 700, lowercase), gap `space-2`, mark height 1.3 × cap height. Every header.
- **Product:** CRM or agent mark + `allok` in `ink-40` + `×` + `rei` / `vocero` in `ink` at 1.35× the house size. The house yields, the product speaks.
- **Poster:** house mark + `ALLOK` in `poster`. Footers and covers, never a header.

## Clear space and minimums

One sun diameter (11 units on the 64 grid) on every side. Bare mark ≥ 24px, badges ≥ 20px, favicon file at 16px.

## Don't

- Don't recolour the arc. Single-ink contexts use the badge as a solid `ink` silhouette.
- Don't rotate, mirror, or move the sun off the arc.
- Don't set the word in Comfortaa; the round face is retired.
- Don't put a product mark on paper or in the header — the house signs the header, the product signs its page.
