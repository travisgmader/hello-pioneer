# Midnight Monolith — Design System

Architectural, editorial, and authoritative. Near-void dark backgrounds with warm gold as a reward accent, frosted obsidian navigation, and diffuse depth shadows. Activated by `data-theme="midnight"` on `<html>`.

## Color Palette

| Token | Value | Use |
|---|---|---|
| `--lavender` | `#e9c176` | Primary accent — gold, used sparingly (UI chrome, Stella) |
| `--lavender-light` | `#221c0d` | Dark golden surface for hovers/tints |
| `--lavender-dark` | `#f0d490` | Lighter gold for labels and emphasis |
| `--mint` | `#10b981` | Roman — emerald green |
| `--mint-light` | `#041a10` | Dark green surface |
| `--mint-dark` | `#6ee7b7` | Soft green for text |
| `--yellow` | `#f97316` | Layla — vivid orange (distinct from gold) |
| `--yellow-light` | `#1e0d03` | Dark orange surface |
| `--yellow-dark` | `#fdba74` | Soft orange for text |
| `--pink` | `#e879a0` | Mom — rose pink |
| `--pink-light` | `#1e0815` | Dark rose surface |
| `--pink-dark` | `#f9a8d4` | Soft pink for text |
| `--blue` | `#60a5fa` | Dad — sky blue |
| `--blue-light` | `#060f1e` | Dark blue surface |
| `--blue-dark` | `#93c5fd` | Soft blue for text |
| `--peach` | `#a78bfa` | Shared/unassigned events — soft violet |
| `--peach-light` | `#110e20` | Dark violet surface |
| `--peach-dark` | `#c4b5fd` | Soft violet for text |
| `--bg` | `#0c0b0f` | Page background — near void |
| `--card-bg` | `#16141f` | Card / nav / dialog background |
| `--text` | `#e5e2e1` | Warm off-white body text (never pure white) |
| `--text-muted` | `#8b8680` | Warm muted gray for labels |
| `--border` | `rgba(233,193,118,0.12)` | Ghost gold border — suggests, doesn't frame |
| `--shadow` | `0 8px 32px rgba(0,0,0,0.6)` | Deep diffuse shadow |
| `--shadow-hover` | `0 12px 40px rgba(0,0,0,0.7), 0 0 20px rgba(233,193,118,0.1)` | Gold glow on hover |
| `--radius` | `4px` | Sharp, architectural corners |
| `--radius-sm` | `2px` | Tighter sharp corners |

## Member Colors
- 👩 Mom → Rose Pink `#e879a0`
- 👨 Dad → Sky Blue `#60a5fa`
- 🌸 Stella → Warm Gold `#e9c176`
- 🦕 Roman → Emerald Green `#10b981`
- 🌻 Layla → Vivid Orange `#f97316`

## Typography
- Headlines: `'Noto Serif'` — 400/700 weight, tight letter-spacing (-0.02em), editorial authority
- Body / UI: `'Manrope'` — 400/500/600 weight, geometric precision
- Labels: `'Manrope'` — 700 weight, uppercase, wide tracking (0.1em) for sub-headers

## Shape
- Card radius: `4px` — sharp, architectural. No rounding on structural elements.
- Reserve full roundness (`9999px`) for chips and radio buttons only.

## Depth Principles
- **Surfaces define hierarchy** — `--card-bg` on `--bg` creates natural lift without borders.
- **No-Line Rule** — section separation comes from background tonal shifts, not 1px borders.
- **Frosted Obsidian Nav** — `rgba(22,20,31,0.82)` + `backdrop-filter: blur(24px)`.
- **Ghost Border** — `--border` at 12% opacity creates a "suggestion" of boundary.

## Gold Usage Rule
Gold (`#e9c176`) covers ≤5% of screen real estate. It is a reward, not a texture. Reserve for: active nav items, CTA buttons, selected state indicators, key icons.

## Reference
Designed from the "Midnight Monolith / Timber and Tar" creative north star.
Inspired by Material You dark surface hierarchy — void to container_highest — paired with metallic gold as the singular light source.
