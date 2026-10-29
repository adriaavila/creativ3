# allok redesign prototype

Image-first exploration, 28 October 2026. No production changes.

Open `concepts.html` for the three generated directions, or `index.html` for the responsive interactive prototype. All assets and the Geist font are local. Double-clicking either HTML file works; for browser development, run from this folder:

```sh
python3 -m http.server 4178 --bind 127.0.0.1
```

- Image review: http://127.0.0.1:4178/concepts.html
- A / Open Systems: http://127.0.0.1:4178/index.html?variant=A
- B / Proof First: http://127.0.0.1:4178/index.html?variant=B
- C / Blue Studio: http://127.0.0.1:4178/index.html?variant=C

Arrow buttons or left/right keyboard keys switch directions. Click project images for a lightbox; Escape closes it. Services expand. Contact opens an email draft, without sending anything. On mobile, the review toolbar occupies a reserved area below the scrollable page canvas.

The generated concepts are not production screenshots. The interactive version uses source project captures. No prices, outcomes or awards have been invented. See `STRATEGY.md` for positioning/search direction and `PROMPTS.md` for image provenance and prompts.

Recommended direction: **A / Open Systems**. Visual selection is still Adrian's decision. Do not promote this throwaway code directly to production.

## Verification

- `node --check app.js`: passed.
- HTML parsing and local reference checks: passed; no missing assets.
- Browser: visually inspected A/B/C at 1440px and 375px; no horizontal document overflow at either width.
- Project mapping: Mística opens Mística; shared Soapy card opens Soapy.
- Lightbox: Escape, Tab containment, background inertness, focus restoration and blocked variant switching exercised.
- Mobile: service expansion, primary contact anchor and email destination exercised; toolbar is outside the page canvas.
- Keyboard arrow cycling and variant URL state exercised. All visible project images loaded.
- Independent verification: tester reviewed code and desktop/mobile screenshots. Mobile toolbar overlap was corrected. The requested reviewer could not run because of a usage limit.
- Reduced motion: CSS reviewed; operating-system reduced-motion preference was not toggled.
- This is plain static HTML/CSS/JS; there is no TypeScript compilation, app bundling or framework lint script. The production Next.js application was not changed or built.

Screenshots are in `screenshots/`. The main deliverables are the generated images and local prototype; this is not a deployed site or a ranking result.
