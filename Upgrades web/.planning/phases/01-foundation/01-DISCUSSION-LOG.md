# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 1-Foundation
**Areas discussed:** Vercel + GitHub setup, Design token scope, Mobile nav treatment, Footer layout

---

## Vercel + GitHub Setup

**Q1: Does a GitHub repository already exist?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, repo exists | Already on GitHub — connect to Vercel | |
| No, needs to be created | Create as part of Phase 1 setup | ✓ |

**Q2: Vercel account — personal or gym's?**

| Option | Description | Selected |
|--------|-------------|----------|
| Personal account | Developer owns during development | ✓ |
| Gym's account | Under gym owner's Vercel from day 1 | |

**Q3: How should deployments be triggered?**

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub → Vercel integration | Auto-deploy on push; preview per PR | ✓ |
| Vercel CLI manual deploys | Manual `vercel --prod` runs | |

**Q4: GitHub repo name?**

| Option | Description | Selected |
|--------|-------------|----------|
| kinetic-power-web | Clear, matches project | ✓ |
| kinetic-power-site | Slightly more general | |
| You decide | Claude's discretion | |

---

## Design Token Scope

**Q1: Map all DESIGN.md tokens upfront or only Phase 1 needs?**

| Option | Description | Selected |
|--------|-------------|----------|
| All tokens upfront | Single source of truth from day 1 | ✓ |
| Only Phase 1 needs | Minimal @theme, add per phase | |

**Q2: Token naming convention?**

| Option | Description | Selected |
|--------|-------------|----------|
| Direct mapping (DESIGN.md names verbatim) | Zero translation layer | ✓ |
| Abbreviated aliases | Shorter, but loses 1:1 correspondence | |

**Q3: Include type scale tokens in @theme?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include type scale tokens | All sizes/line-heights as CSS variables | ✓ |
| Inline with Tailwind utilities | Use built-in size utilities instead | |

**Q4: Responsive type handling?**

| Option | Description | Selected |
|--------|-------------|----------|
| Responsive CSS via clamp() or Tailwind responsive prefixes | Mobile default, scale at md: | ✓ |
| Separate mobile token names | display-xl + display-xl-mobile as distinct vars | |

---

## Mobile Nav Treatment

**Q1: Expanded mobile nav style?**

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen overlay | Dark overlay covers full viewport; Anton uppercase links + CTA | ✓ |
| Slide-in drawer (right) | Panel slides in from right edge | |
| Dropdown below navbar | Drops below top bar | |

**Q2: Include CTA button in mobile overlay?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — red primary button at bottom | Booking action accessible from any page | ✓ |
| No — nav links only | CTA lives on individual page sections | |

**Q3: Open/close animation?**

| Option | Description | Selected |
|--------|-------------|----------|
| Fade in + slight upward slide (200ms) | Opacity + Y-translate via Motion | ✓ |
| Instant (no animation) | Snaps in — maximum brutalism | |
| Slide from top | Panel slides down from navbar | |

**Q4: Desktop nav layout?**

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal links + right-aligned CTA button | Logo left, links center/right, red CTA far right | ✓ |
| Minimal — logo only + CTA button | Navigation in footer only | |
| You decide | Claude's discretion | |

---

## Footer Layout

**Q1: Desktop structure?**

| Option | Description | Selected |
|--------|-------------|----------|
| 3-column grid | Brand/tagline | Nav links | Address+hours+social | ✓ |
| 2-column split | Nav links left, contact+social right | |

**Q2: Social icons rendering?**

| Option | Description | Selected |
|--------|-------------|----------|
| SVG icon components | Inline SVGs, no extra deps, fully styleable | ✓ |
| lucide-react icons | May not cover all social platforms | |
| Text links only | No icons, zero overhead | |

**Q3: Placeholder content for Phase 1?**

| Option | Description | Selected |
|--------|-------------|----------|
| Structured placeholders | Realistic fake address/hours | ✓ |
| Empty slots with labels | [Address], [Hours] | |
| Skip contact info entirely | Add when real data arrives | |

**Q4: Include CTA button in footer?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — CTA button in footer | Extra conversion touch-point | |
| No — footer is utility only | Navigation, contact, social only | ✓ |

---

## Claude's Discretion

- Exact nav link arrangement within the desktop bar (center vs right cluster)
- Exact placeholder text content for address and hours
- Hamburger icon style

## Deferred Ideas

None — discussion stayed within phase scope.
