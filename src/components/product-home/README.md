# Creativv cinematic homepage

## Run

```bash
npm run dev
npm run lint
npm run build
```

The homepage shell remains server rendered. `CinematicStage.tsx` is the only client-side motion world; it uses native scrolling, a sticky viewport and one GSAP/ScrollTrigger timeline. The project rail and service rail use native overflow and scroll snap.

## Production asset manifest

| Asset | Size | Scene role | Anchor / depth |
| --- | ---: | --- | --- |
| `public/cinematic/atelier-establishing-desktop-v2.webp` | 1672×941 | Opening blue-hour atelier, combined background/midground/core plate | Optical chamber at 72% 54%; far + mid |
| `public/cinematic/atelier-establishing-mobile-v2.webp` | 941×1672 | Portrait opening composition | Installation in lower 58%; far + mid |
| `public/cinematic/atelier-panorama-desktop-v2.webp` | 1672×941 | Revealed warm atelier | Gallery axis at 58% 50%; far + mid |
| `public/cinematic/atelier-panorama-mobile-v2.webp` | 941×1672 | Portrait revealed composition | Daylight architecture centered; far + mid |
| CSS `.leftWing` / `.rightWing` | vector CSS | Foreground shutters / occluders | viewport edges; near |
| CSS vignette and grain | vector CSS | Lighting continuity and material texture | full viewport; overlay |

All raster masters are text-free WebP files. The four cinematic files total roughly 380 KB. Product screenshots remain real evidence and are loaded after the opening.

## Timeline map

The desktop scroll runway is 5,000 px and the compact runway is 4,200 px.

- 0–18%: promise, CTA and dormant optical chamber.
- 14–29%: foreground shutters split; the first problem statement appears.
- 40–51%: blue-hour world crossfades into the warm interior panorama.
- 49–71%: the business-result statement settles over the revealed system.
- 66–81%: the camera refocuses and the panorama darkens for legibility.
- 72–96%: the four service offers enter as a horizontal, keyboard-operable rail.
- 90–100%: controls and the conversational CTA become available before the page releases into project proof.

Reduced motion removes the runway and presents the same beats in normal document flow.

## Image generation record

Mode: built-in Codex image generation (`imagegen`). The prompt set asked for one coherent, text-free architectural product atelier across desktop and portrait art direction: midnight mineral blue exterior; black chrome, smoked glass, porcelain planes and restrained aged-brass inlays; asymmetric negative space for semantic copy; then the same installation opened into champagne daylight with a distant blue optical portal. It explicitly excluded logos, UI, gradients, neon, cyberpunk clutter and flattened website screenshots.

## Verification

- `npm run lint -- src/components/product-home src/lib/projects.ts src/app/page.tsx`
- `npm run build`
- Browser checkpoints: 1440×900, 1280×720, 1024×768, 768×1024 and 390×844; hero, problem, reveal, service catalog, project proof and final CTA were captured under `output/playwright/`.
- The service rail was exercised with keyboard focus and `End` (531 px scroll travel at 1440 px); mobile controls and native scroll snap remain visible at the final beat.
- Reduced-motion emulation removes sticky positioning and collapses the mobile cinematic runway from 4,200 px to a 2,067 px document-flow sequence.
- Accessibility: one H1, ordered section headings, semantic tab/tabpanel project proof, labeled service controls, arrow/Home/End handling and reduced-motion document flow.
