# allok brand concept

Reviewable identity proposal, 29 October 2026. No production changes.

## Open

Open `index.html` in a browser, or serve the parent folder with `python3 -m http.server 4179 --bind 127.0.0.1`. The presentation is at `/allok-brand/` and the download button expects `allok-brand-kit.zip` beside the folder. The extracted presentation works offline; individual asset downloads remain available.

## Included

- Custom wordmark and loop symbol as editable SVG and transparent PNG, in Ink, White and Electric Blue.
- Application icon and 16/32/64px favicon candidates.
- Brand overview image, responsive presentation, voice and logo guidance in `DIRECTION.md`.
- Shared CSS tokens actually used by the presentation.
- Local Geist variable webfont with its SIL Open Font License in `assets/OFL-Geist.txt`. Source: https://github.com/vercel/geist-font/blob/main/OFL.txt
- `PROMPT.md` records the generation brief. The board is a generated concept illustration; use the SVG masters for actual brand applications.

## Decision before rollout

The proposed wordmark retains a recognizable o. Identity color stays stable, with service state shown separately in the interface. This changes the existing state-dependent logo rule and remains a taste decision for Adrian. Website directions A/B/C remain unselected.

## Verification

The native vector files parse correctly and their PNG exports preserve aspect ratios. Presentation checked in the browser at 375px and desktop, with local images/fonts, semantic headings, visible keyboard focus and minimum 44px controls. Reduced-motion CSS disables smooth scrolling. This static HTML/CSS deliverable has no build step or application logic.
