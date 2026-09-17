# DESIGN.md

The agent-readable design system for allok.fun, in the DESIGN.md convention (see [voltagent/awesome-design-md](https://github.com/voltagent/awesome-design-md)). Tell your coding agent *"build this page in the allok design language"* and it has everything it needs. Token names in `{braces}` resolve to the custom properties in `src/app/globals.css`.

Full system, with live component previews: https://claude.ai/artifact/YK8GAX6udVnCL3GpMsbaMK · marks and construction: [`docs/design/dawn-dusk.md`](docs/design/dawn-dusk.md) · the existing two-system split: [`docs/design/README.md`](docs/design/README.md).

## Visual Theme & Atmosphere

A WhatsApp CRM with an agent inside it, sold by showing the conversation. Pages open on black (`{ground}` void), where the headline is a promise in the customer's time — *Tu negocio contesta. Aunque no estés.* — and the product sits lit beneath it. The middle is paper (`{ground}` paper) with generous air and hairline rules. Every page closes once on the sky: a dawn → dusk gradient (`{sky-night}` → `{sky-cobalt}` → `{sky-violet}` → `{sky-magenta}` → `{sky-ember}`) with two blurred glows (`{lit-dawn}`, `{lit-dusk}`). The sky is the brand and it is spent once per page, never as wallpaper. Mood: quiet, factual, a little irreverent in asides. Numbers are real. No emoji, no illustration — the product is the picture.

## Color Palette & Roles

| role | paper theme | void theme | use |
|---|---|---|---|
| `{ground}` | #f5f4f0 | #08090a | page ground |
| `{ground-2}` / `{ground-3}` / `{ground-4}` | #f1efeb / #eae8e3 / #dedbd4 | #101214 / #141517 / #1b1c1f | section · card · raised (hierarchy by step, not colour) |
| `{ink}` | #101112 | #f5f4f0 | headings, body, controls |
| `{ink-60}` | #6b6d70 | #9a9a97 | supporting copy — most paragraphs |
| `{ink-40}` | #9a9c9f | #6c6c69 | labels only (2.8:1 on paper) |
| `{hairline}` / `{rule}` / `{rule-hard}` | 10% / 20% / 85% ink | 12% / 20% / 85% | borders · dividers · the 2px opener |
| `{sky-magenta}` | #b41065 | — | THE accent on paper: numbering, bullets, links, focus. ~5% of a screen |
| `{lit-dawn}` | #ff9a3d | | accent on void; the sun of the mark; the featured plan's arrows |
| `{on-sky}` / `{lit-dusk}` | #f7f4ef / #ffe3c2 | | text / titles on the sky, never elsewhere |
| `{wa-green}` `{wa-screen}` `{wa-in}` `{wa-out}` `{wa-ink}` `{wa-ticks}` | #008069 #ece5dd #fff #d9fdd3 #111b21 #53bdeb | | inside the phone only |
| `{agent-out}` | #e7f3ec | | the agent's turn in a thread card on paper |
| `{assist}` / `{assist-dim}` | #c5f04a / 14% | | the assistant's voice in the app: ✦, *Sugerencia*, unread, value |
| `{status-ok}` `{status-info}` `{status-warn}` `{status-risk}` `{status-lost}` | #7ee0a8 #6cc7e8 #f0c04a #f08a5a #e0687a | | state badges: colour at 15% as ground, full as text, always beside the word |

## Typography Rules

- `{grotesk}` Geist for every word. Display by weight and tracking, never by face: `{hero}` 700 / −0.042em / 0.98, `{statement}` 600 / −0.035em, `{display}` 700 / −0.03em, `{display-sm}` 600 / −0.025em. Body `{body}` 16/1.6, `{lede}` 21/1.55 in `{ink-60}`.
- `{poster}` Archivo Black only for `{macro}` — the footer address, the poster lockup. Uppercase, one weight, leading 0.8.
- `{mono}` JetBrains Mono 11px, +0.14em, uppercase for labels ≤ 4 words; `{mono-time}` 11px, no tracking, `tabular-nums` for times and counts.
- Sizes on the site are `clamp()` over `vw`; token values are ceilings. `text-wrap: balance` on `{hero}`/`{statement}`, `pretty` on `{lede}`.
- Inside the product: `{bubble}` 13.5, `{thread}` 14.5, `{inbox}` 14/500 (600 unread), 12px previews.
- Comfortaa is retired. Do not reintroduce a rounded display face.

## Component Stylings

**Button** — `{radius-btn}` 14px, padding `0.9rem 1.6rem`, Geist 500 16px, gap 8px.
- `solid`: `{ink}` on `{ground}` (inverts per theme; on a sky plate `{on-sky}` with #101112 text). Hover opacity .92 (pointer only). Pressed `scale(0.96)`, 160ms `cubic-bezier(.23,1,.32,1)`. Focus 2px `{sky-magenta}` ring, offset 2px (`{lit-dawn}` on void). Disabled opacity .45, no press.
- `sky`: the ramp at 96° as fill, `{on-sky}` text. One per screen — the highlighted action.
- `outline`: transparent, 1px `{rule}` border, hover border `{rule-hard}`. Header pill variant: `!rounded-full`, `px-4 py-2.5`, 14px, `backdrop-blur-sm`.

**Product card** (thread, board) — white, `{radius-card}` 20px, 1px `{hairline}`, `{shadow-card}`, padding 16–24. Breaks the hero's bottom edge: hero `pb` = `{space-hero-tail}` 150px, card `-mt` 130px.

**Phone** — `{radius-device}` 46px bezel, 10px padding, gradient bezel `170deg #2b2e33 → #121417 38% → #1e2126`, `{shadow-device}`; screen `{radius-screen}` 37px on `{wa-screen}`; island 84×22 #0b0d0f. Bubbles `{radius-bubble}` 13px, 86% max, `8px 10px 16px`, time 10px bottom-right at 45%, ✓✓ `{wa-ticks}`. Enter in sequence: 420ms, 520ms apart, once.

**Stage board** — columns `{ground-2}` `{radius-md}` p10; head 12.5/600 with a `{mono-time}` count badge (8% ink, 6px radius); won column `{stage-won}` with `{stage-won-ink}` badge; deal cards white, 10px radius, 1px 7% ink, name 13/500, meta 11.5 `{ink-60}`.

**Inbox item** — `{radius-md}`, p `10px 12px`, avatar 36px `{ground-4}` initials 12/500 `{ink-60}`; name `{inbox}`; time `{mono-time}` `{ink-40}`; channel label 10px +0.06em uppercase with a 6px status dot. Active: `{ground-4}` + `{rule}` border. Hover `{ground-3}` (pointer only). Unread: name 600 + 8px `{assist}` dot.

**Assistant suggestion** — `{ground-2}`, `{radius-md}`, p12, 1px `{hairline}`. Header: ✦ 14px `{assist}` + *Asistente* 12/500 `{ink-40}`; state badge `{radius-sm}` `2px 8px` 12/500 — *Sugerencia* `{assist}` on `{assist-dim}`, *Revisar antes de enviar* warn, *Programado* info, *Enviado* ok, *Requiere atención* risk. Text 14/1.6 `{ink}`. The badge is mandatory.

**Plan card** — `{radius-xl}` 22px, p28, 1px `{hairline}`; name `{display-sm}`, price 44/700 tabular + `/ mes` 14, line 15 `{ink-60}`, `→` feature list over a `{hairline}`. Featured: `{ink}` ground, `{ground}` text, `{lit-dawn}` arrows. Exactly one featured.

**Sky plate** — the ramp at 96°, `background-size 200% 100%`, panned by `--sky-t`; `::before` `{lit-dawn}` glow left, `::after` `{lit-dusk}` right, both `blur({blur-glow})`; children `.sky-over` (z 1). As a card: `{radius-plate}` 26px.

**Marks** — house = day arc; CRM = arc in a bubble; agent = arc in brackets. Badges on the void tile, `{radius-lg}`. House signs the header; a product signs its own page as `allok × rei`.

## Layout Principles

Gutters `{space-5}` 20px → `{space-10}` 40px from `sm`. Sections `{space-16}` 64 → `{space-24}` 96. Content max 1100–1200px, centred. **One object per section**: a headline (promise), one line of support, one product object — the phone, the board, the thread, the plans. Never two objects in a section; never an object without the sentence that names what it proves. Hero text is centred over the object on `/`; left-aligned with the object right on product pages. The CTA is one sentence — *Probar el agente en WhatsApp* — and it repeats in the header pill, the hero and the sky closer; secondary actions are outline.

## Depth & Elevation

Paper carries hierarchy with `{ground}` → `{ground-4}` steps and hairlines, not shadows. Two shadows exist on paper: `{shadow-card}` under the product card that breaks the hero, and `{shadow-paper}` (barely there). On void, `{shadow-1..3}` for cards, popovers, modals, and `{shadow-device}` for the phone. The sky's depth is blur, not shadow: `{blur-glow}` 42px on the glows, `{blur-bloom}` 80px on the hero's bloom.

## Do's and Don'ts

- **Do** open on void and close on sky, once. **Don't** put a sky plate anywhere else on the page.
- **Do** show the product with real-looking data labelled as an example. **Don't** invent a price, a count or a rate — `PLANS`, `META_RATES` and data are the source.
- **Do** carry a state word on every assistant rendering. **Don't** imply an autonomous send, ever.
- **Do** use `{sky-magenta}` for ~5% of a paper screen. **Don't** use it on void (3.5:1) — use `{lit-dawn}`.
- **Do** keep WhatsApp's colours inside the phone. **Don't** let `{wa-green}` leak into buttons or links.
- **Do** set every number `tabular-nums`. **Don't** let a count jitter as it changes.
- **Do** name `transition-property`. **Don't** write `transition: all`, and don't animate anything but the press, the thread and the sky.
- **Do** write one CTA sentence per page and repeat it. **Don't** put two sky buttons on a screen.
- **Don't** use emoji, illustration, a rounded display face, or a gradient that isn't the sky.

## Responsive Behavior

Tailwind breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. Header navigation collapses below `md` to mark + one pill CTA. Plan row 3-up → 1-up below `md`. Stage board 5 → 2 columns below `lg`. Product card breaks the hero at every width; on mobile the hero `pb`/card `-mt` pair shrinks together. The phone is `max-width 340px`, full width below. `{hero}` runs `clamp(2.75rem, 7.4vw, 6.5rem)`. Touch targets ≥ 44px (range inputs set `min-height: 44px`). Test at 375px: no horizontal scroll.

## Agent Prompt Guide

- *"Build a landing section in the allok system: `{hero}` headline on void, one `{lede}` in `{ink-60}`, the phone (`Conversation`) in a `Void` bloom, one `solid` button 'Probar el agente en WhatsApp'."*
- *"Add a feature section on paper: `{display}` headline, one line, the `StageBoard` as the only object, `{space-24}` above and below."*
- *"Render an inbox list on void with `Inbox` items; the active one on `{ground-4}`; unread names 600 with the `{assist}` dot."*
- *"Show the agent proposing a reply: `AssistantSuggestion` in state 'Revisar antes de enviar'."*
- *"Close the page with a `SkyPlate`: `{mono}` label, `{macro}` address hi@allok.fun in `{on-sky}`, footer links in `{mono}`."*
- Always: tokens by name, never hex; Geist for words; `→` for direction; Spanish, second person; label examples as examples.
