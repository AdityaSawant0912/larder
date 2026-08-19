# Design system — "Blackboard / Whiteboard"

Board and chalk, treated literally: the app background is a physical board
(dark chalkboard or light whiteboard), UI accents are chalk/ink marks on
it. Confirmed against a working preview (`palette-preview.html`, delivered
during planning), not chosen from swatches alone.

## Theming

- **Both dark and light shipped from v1**, not dark-only with light
  deferred.
- Implemented via **React Context**, app-wide (infrequent-update global
  state, per `05-frontend-state-motion.md`).
- Colors as CSS variables so both Framer Motion and Tailwind reference the
  same tokens without duplicating palette values per theme.
- Contrast floor: **WCAG AA** — 4.5:1 for body text, 3:1 specifically for
  the freshness-bar states (green/amber/rust), checked for colorblind
  distinguishability too, not just raw contrast against the background.

## Palette

Same six hues in both themes, shifted by value rather than swapped —
chalk is pale-on-dark, ink is deep-on-light, matching how the physical
materials actually behave. This also keeps both themes at solid WCAG AA
contrast without a separate check per color.

**Dark theme — Blackboard**
| Token | Hex | Use |
|---|---|---|
| Board | `#1E2420` | page background, faint grain texture |
| Chalk white | `#EDEAE0` | primary text |
| Chalk sage | `#A8CBB0` | fresh state |
| Chalk amber | `#E3BE7E` | warning state |
| Chalk coral | `#E2938A` | danger/expired state |
| Chalk dusty blue | `#9FC3D9` | interactive/accent |

**Light theme — Whiteboard**
| Token | Hex | Use |
|---|---|---|
| Board | `#F1F0EC` | page background, faint grain texture |
| Ink charcoal | `#2B2E2A` | primary text |
| Sage ink | `#4C7A57` | fresh state |
| Amber ink | `#96690F` | warning state |
| Coral ink | `#A6483B` | danger/expired state |
| Dusty blue ink | `#3E6C82` | interactive/accent |

## Texture

SVG fractal-noise grain overlay, ~5% opacity, applied only to the board
(page) background — never on cards, so text always sits on a clean flat
surface regardless of how much ambient texture the board has.

## Typography

- **Display** (item names, screen titles only): Caveat, weight 600/700 —
  reads as chalk lettering, used sparingly since it's a display face, not
  a body one.
- **Body** (UI copy, labels, buttons): IBM Plex Sans.
- **Data** (quantities, days-left, thresholds): IBM Plex Mono — precision
  and scannability for numbers, deliberately kept out of the handwritten
  face.

## Signature element

The freshness gauge is a loose, hand-wobbled SVG stroke in the state's
chalk/ink color — not a gradient progress bar. This is where the design's
"one bold move" is spent; cards, spacing, and layout stay quiet and
disciplined around it.
