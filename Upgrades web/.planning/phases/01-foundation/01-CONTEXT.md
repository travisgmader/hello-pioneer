# Phase 1: Foundation - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the Next.js App Router project skeleton: Tailwind CSS v4 design system wired from DESIGN.md, shell layouts for all five pages, pixel-complete TopNav and Footer components, and a live Vercel deployment with GitHub CI integration. No content beyond nav/footer — page bodies are shells only.

</domain>

<decisions>
## Implementation Decisions

### Vercel + GitHub Setup
- **D-01:** GitHub repo does not exist yet — create `kinetic-power-web` as part of Phase 1 setup
- **D-02:** Vercel project lives under the developer's personal account during development
- **D-03:** Use GitHub → Vercel integration (auto-deploy on push to `main`; preview URL per PR/branch) — NOT Vercel CLI manual deploys

### Design Token Scope
- **D-04:** Map ALL tokens from DESIGN.md into the Tailwind v4 `@theme` block in Phase 1 — all colors, spacing, and type scale. Do not defer to later phases; single source of truth from day 1
- **D-05:** Token names must match DESIGN.md verbatim (e.g., `--color-background`, `--color-primary`, `--color-surface-container-high`). No abbreviations or aliases
- **D-06:** Include the full type scale in `@theme` — font sizes, line heights, and letter-spacing for `display-xl`, `headline-lg`, `title-md`, `body-lg`, `label-sm`
- **D-07:** Responsive type handled via Tailwind responsive prefixes (default = mobile size, scale up at `md:` breakpoint) or CSS `clamp()`. Do NOT create separate `display-xl-mobile` token names

### Mobile Nav Treatment
- **D-08:** Mobile nav opens as a **full-screen dark overlay** (covers full viewport, `z-50+`). Not a drawer or dropdown
- **D-09:** Overlay content: nav links in Anton uppercase, large, hard-left aligned + a red Primary button "Book a Session" pinned at the bottom
- **D-10:** Open/close animation: fade-in opacity `0→1` with a subtle upward translate (`y: 20→0`) at 200ms using Motion (`framer-motion`). Closes on X button tap or backdrop tap
- **D-11:** Desktop nav: logo left, horizontal nav links center or right, red "Book a Session" Primary button far right

### Footer Layout
- **D-12:** 3-column grid on desktop — Col 1: Brand name + tagline, Col 2: Page navigation links (Home, Amenities, Membership, Schedule, Contact), Col 3: Address + hours + social icons. Collapses to single-column stacked on mobile
- **D-13:** Social icons rendered as inline SVG components (Instagram, Facebook, TikTok). No icon font libraries
- **D-14:** Phase 1 uses structured placeholder content for address, hours, and social handles (realistic fake data). Real content swapped in when gym owner supplies it
- **D-15:** Footer is utility-only — no CTA button. Navigation, contact info, and social links only

### Claude's Discretion
- Exact nav link arrangement within the desktop bar (center vs right cluster) — Claude picks whichever reads most cleanly
- Exact placeholder text content for address and hours
- Hamburger icon style (three lines vs other) — Claude picks a clean SVG consistent with the brand

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `DESIGN.md` — The complete design system: color palette (40+ tokens), typography scale, spacing tokens, border radius, elevation rules, component specs (buttons, cards, inputs), and do/don't rules. ALL UI in every phase must follow this spec. It is the single source of truth for visual decisions.

### Project Scope & Stack
- `.planning/PROJECT.md` — Requirements, constraints, key decisions, and out-of-scope items
- `.planning/ROADMAP.md` — Phase goals, success criteria, and dependencies (Phase 1 success criteria define the deploy target)
- `CLAUDE.md` — Technology stack decisions: Next.js App Router, Tailwind CSS v4, Sanity v5, Vercel free tier, Motion (Framer Motion), React Hook Form + Zod, Resend — all versions locked

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — brand new project. All components will be created from scratch in this phase.

### Established Patterns
- Tailwind CSS v4 with `@theme` CSS variables block (no `tailwind.config.js`) — all tokens live in a global CSS file
- Next.js App Router conventions: `app/` directory, `layout.tsx` as root shell, `page.tsx` per route
- `next/font/google` for font loading (Anton, Barlow Condensed, Hanken Grotesk) — no npm font packages

### Integration Points
- Root `app/layout.tsx` — TopNav and Footer wrap every page; font CSS variables injected here
- `app/globals.css` — `@theme` block with all DESIGN.md tokens lives here
- Vercel project root will be this directory; Next.js detected automatically

</code_context>

<specifics>
## Specific Ideas

- Motion (Framer Motion) is in the stack — use it for the mobile nav overlay animation (fade + upward slide) rather than CSS transitions
- The hamburger → X icon swap on mobile nav open is expected behavior
- DESIGN.md calls out 45-degree diagonal cuts on container backgrounds implying "forward motion" — planner should consider applying this to a decorative element in the nav or footer, but only if it doesn't overcomplicate Phase 1's skeleton goal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation*
*Context gathered: 2026-05-22*
