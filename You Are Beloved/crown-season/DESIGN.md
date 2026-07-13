# The Crown Season — Design System

Synthesized from the provided Stitch design (a dark "sovereign luxury" system).
The Egyptian/Anubis theming from the source template is **intentionally excluded** —
it is inappropriate for this Christian men's-group content. We keep the *aesthetic*:
obsidian black, solar gold, regal serif, gold-framed panels.

## Mood

Regal, masculine, quiet luxury. Deep obsidian fields, gold as the single precious
accent, serif headlines with reverence. Restrained motion, generous space, hairline
gold rules. The crowned stag is the emblem.

## Color (dark theme)

| Token | Value | Use |
|---|---|---|
| `--bg` / surface | `#131313` | app background |
| `--surface` | `#201f1f` | cards / panels |
| `--surface-alt` | `#1c1b1b` | insets, inputs |
| `--surface-hi` | `#2a2a2a` | raised / hover |
| `--surface-lowest` | `#0e0e0e` | bars, footer |
| `--gold` (primary) | `#f2ca50` | primary accent, CTAs |
| `--gold-deep` | `#d4af37` | button fills, frames |
| `--gold-soft` | `#ffe088` | highlights |
| `--teal` (tertiary) | `#46e4d4` | sparing secondary accent |
| `--text` | `#e5e2e1` | on-surface |
| `--text-soft` | `#d0c5af` | body / on-surface-variant |
| `--text-faint` | `#99907c` | outline / meta |
| `--line` | `rgba(212,175,55,0.22)` | gold hairlines |
| `--line-dim` | `#4d4635` | outline-variant |

Scripture and reflection sit on `--surface-alt` with a gold left rule.

## Type

- **Headlines** — `Noto Serif`. xl 48/1.1 (-0.02em), lg 32/1.2 (0.05em), md 24/1.3.
- **Body** — `Manrope`. lg 18/1.6, md 16/1.5.
- **Label caps** — `Space Grotesk`, 12px, uppercase, `0.2em` tracking, 600. Used for
  eyebrows, section labels, buttons, nav.

## Signature treatments

- **Gold frame** — 1px `rgba(212,175,55,.3)` border with small gold corner brackets
  (top-left, bottom-right) on hero / feature panels.
- **Obsidian texture** — `linear-gradient(145deg,#1c1b1b,#0e0e0e)` panel fill.
- **Hierarchical pattern** — faint gold dot grid (32px), ~5% opacity, fixed behind app.
- **Notch corner** — clipped corners on the primary CTA (`polygon(10% 0,100% 0,100% 70%,90% 100%,0 100%,0 30%)`).
- **Ornate divider** — hairline gradient rule flanking three 45°-rotated gold pips.
- Radius: DEFAULT 4px, lg 8px, xl 12px, full 9999px. Spacing unit 8px, gutter 24px.

## Components

- **Top bar** — `#0e0e0e/95` blurred, sticky, gold bottom hairline, brand in caps gold.
- **Bottom nav** — obsidian, active item gold with soft glow, inactive `--text-faint`.
- **Cards** — obsidian-texture fill, gold hairline, gold caps label + serif title.
- **Buttons** — primary = gold-deep fill / dark text, notch corner; outline = gold hairline.
- **Progress** — thin track on `--surface-alt`, gold gradient fill.

All values live as CSS custom properties at the top of `src/styles.css`; reskinning
is a matter of editing those tokens.
