# Phase 1: Foundation - Research

**Researched:** 2026-05-22
**Domain:** Next.js 16 App Router scaffold, Tailwind CSS v4 design token system, Motion overlay animation, Vercel/GitHub CI integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Vercel + GitHub Setup**
- D-01: GitHub repo does not exist yet — create `kinetic-power-web` as part of Phase 1 setup
- D-02: Vercel project lives under the developer's personal account during development
- D-03: Use GitHub → Vercel integration (auto-deploy on push to `main`; preview URL per PR/branch) — NOT Vercel CLI manual deploys

**Design Token Scope**
- D-04: Map ALL tokens from DESIGN.md into the Tailwind v4 `@theme` block in Phase 1 — all colors, spacing, and type scale. Do not defer to later phases; single source of truth from day 1
- D-05: Token names must match DESIGN.md verbatim (e.g., `--color-background`, `--color-primary`, `--color-surface-container-high`). No abbreviations or aliases
- D-06: Include the full type scale in `@theme` — font sizes, line heights, and letter-spacing for `display-xl`, `headline-lg`, `title-md`, `body-lg`, `label-sm`
- D-07: Responsive type handled via Tailwind responsive prefixes (default = mobile size, scale up at `md:` breakpoint) or CSS `clamp()`. Do NOT create separate `display-xl-mobile` token names

**Mobile Nav Treatment**
- D-08: Mobile nav opens as a full-screen dark overlay (covers full viewport, `z-50+`). Not a drawer or dropdown
- D-09: Overlay content: nav links in Anton uppercase, large, hard-left aligned + a red Primary button "Book a Session" pinned at the bottom
- D-10: Open/close animation: fade-in opacity `0→1` with a subtle upward translate (`y: 20→0`) at 200ms using Motion (`framer-motion`). Closes on X button tap or backdrop tap
- D-11: Desktop nav: logo left, horizontal nav links center or right, red "Book a Session" Primary button far right

**Footer Layout**
- D-12: 3-column grid on desktop — Col 1: Brand name + tagline, Col 2: Page navigation links (Home, Amenities, Membership, Schedule, Contact), Col 3: Address + hours + social icons. Collapses to single-column stacked on mobile
- D-13: Social icons rendered as inline SVG components (Instagram, Facebook, TikTok). No icon font libraries
- D-14: Phase 1 uses structured placeholder content for address, hours, and social handles (realistic fake data). Real content swapped in when gym owner supplies it
- D-15: Footer is utility-only — no CTA button. Navigation, contact info, and social links only

### Claude's Discretion
- Exact nav link arrangement within the desktop bar (center vs right cluster) — Claude picks whichever reads most cleanly
- Exact placeholder text content for address and hours
- Hamburger icon style (three lines vs other) — Claude picks a clean SVG consistent with the brand

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GLOB-01 | Site has a responsive top navigation bar with a mobile hamburger menu on small screens | TopNav component with Motion overlay; hamburger/X icon swap; `'use client'` boundary on nav |
| GLOB-03 | Every page has a footer with address, hours, social links, and quick page navigation | Footer component in root layout; 3-col/1-col responsive grid; inline SVG icons |
| GLOB-04 | All UI follows DESIGN.md exactly — colors, typography (Anton/Barlow Condensed/Hanken Grotesk), spacing, and component rules | Full @theme block in globals.css; next/font/google CSS variables; all 40+ tokens mapped |
| GLOB-05 | Site is deployed to Vercel and loads in under 3 seconds on mobile | Static shell pages = near-zero TTFB; App Router SSG by default; next/font self-hosting eliminates font network round-trip |
</phase_requirements>

---

## Summary

Phase 1 is a pure scaffolding phase: create the Next.js project, wire the design system, build shell layouts for five routes, build pixel-complete TopNav and Footer components, and connect the repo to Vercel for auto-deploy. No Sanity CMS is touched in this phase — all content is hardcoded placeholders.

The technical work divides into four sequential zones: (1) project creation and GitHub/Vercel pipeline, (2) Tailwind v4 `@theme` block with all DESIGN.md tokens, (3) font loading via `next/font/google` exposed as CSS variables, and (4) TopNav and Footer components. The nav requires a `'use client'` boundary specifically for the Motion animation and `useState` toggle — the rest of the app can remain React Server Components.

The most common pitfall in this phase is token naming collision between Tailwind v4's built-in namespace (`--color-*`, `--text-*`, `--spacing-*`) and the DESIGN.md token names. Carefully map DESIGN.md names into the correct Tailwind namespace prefixes so utilities like `bg-background`, `text-primary`, `text-display-xl` are generated automatically.

**Primary recommendation:** Scaffold with `npx create-next-app@latest kinetic-power-web --yes`, then replace the default Tailwind config with the full `@theme` block from DESIGN.md. Add Motion only to the `TopNav` client component — keep everything else as Server Components.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Route shells (/home, /amenities, /membership, /schedule, /contact) | Frontend Server (SSR/SSG) | — | App Router pages are Server Components; static by default with no data dependencies |
| Root layout (html, body, font injection) | Frontend Server (SSR) | — | `app/layout.tsx` is the SSR boundary for fonts and global nav/footer |
| TopNav — desktop render, link list | Frontend Server (SSG) | — | Static markup, no interactivity — stays Server Component |
| TopNav — mobile overlay animation | Browser / Client | Frontend Server | Requires `useState` + Motion; `'use client'` boundary on the nav component only |
| Footer | Frontend Server (SSG) | — | Pure static markup; no client-side behavior needed |
| Design tokens (@theme block) | CDN / Static | — | Lives in `globals.css`; built at compile time into static CSS |
| Font loading | CDN / Static | — | `next/font` self-hosts at build time; no runtime network call |
| Vercel CI/CD | CDN / Static | — | Auto-deploy on push; preview per branch |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.2.6 | App Router framework, SSG/SSR, image opt | Vercel-native; Sanity next-sanity v13 targets App Router |
| react | 19.2.6 | UI rendering | Bundled with Next.js 16 |
| react-dom | 19.2.6 | DOM rendering | Bundled with Next.js 16 |
| typescript | 6.0.3 | Static typing | Scaffolded by create-next-app; Sanity TypeGen requires TS |
| tailwindcss | 4.3.0 | Utility CSS + design tokens via @theme | v4 is CSS-first; no tailwind.config.js; built into create-next-app scaffold |
| @tailwindcss/postcss | 4.3.0 | PostCSS plugin for Tailwind v4 | Required adapter for v4 in Next.js (PostCSS pipeline) |
| postcss | 8.5.15 | CSS transformation pipeline | Required by @tailwindcss/postcss |
| motion | 12.40.0 | Mobile nav overlay animation | Locks to `motion/react` import path; AnimatePresence + motion.div |

### Supporting (Phase 1 dev tooling)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/react | 19.2.15 | TypeScript types for React | Always — scaffolded by create-next-app |
| @types/node | 25.9.1 | TypeScript types for Node.js | Always — scaffolded by create-next-app |
| eslint | (scaffolded) | Linting | create-next-app installs with recommended Next.js config |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `motion` (12.40.0) | `framer-motion` | `framer-motion` is now an alias for `motion`; same package at same version — use `motion` import path (`motion/react`) per current docs |
| `@tailwindcss/postcss` | CSS Modules | CSS Modules require per-component files; no shared token system; excluded by CLAUDE.md |
| `@tailwindcss/postcss` | `tailwindcss` (Webpack plugin) | Next.js uses PostCSS pipeline; `@tailwindcss/postcss` is the correct adapter for this stack |

**Installation (Phase 1 only — after scaffold):**
```bash
# create-next-app scaffolds next, react, react-dom, typescript, tailwindcss, @tailwindcss/postcss, postcss, eslint automatically
npx create-next-app@latest kinetic-power-web --yes

# Add Motion for nav animation (not in scaffold)
npm install motion
```

**Version verification:** All versions confirmed against npm registry on 2026-05-22. [VERIFIED: npm registry]

---

## Package Legitimacy Audit

> slopcheck was unavailable at research time. All packages are tagged `[ASSUMED]` per protocol. However, every package below is a well-known, high-download-count package from major organizations (Vercel, Tailwind Labs, Motion) with years of production use. The planner should proceed; no `checkpoint:human-verify` blocker is expected.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| next | npm | 10+ yrs | 10M+/wk | github.com/vercel/next.js | [ASSUMED] | Approved |
| react | npm | 10+ yrs | 50M+/wk | github.com/facebook/react | [ASSUMED] | Approved |
| tailwindcss | npm | 7 yrs | 15M+/wk | github.com/tailwindlabs/tailwindcss | [ASSUMED] | Approved |
| @tailwindcss/postcss | npm | ~1 yr (v4 era) | 5M+/wk | github.com/tailwindlabs/tailwindcss | [ASSUMED] | Approved |
| motion | npm | 8+ yrs (prev. framer-motion) | 8M+/wk | github.com/framer/motion | [ASSUMED] | Approved |
| typescript | npm | 10+ yrs | 50M+/wk | github.com/microsoft/TypeScript | [ASSUMED] | Approved |
| postcss | npm | 10+ yrs | 60M+/wk | github.com/postcss/postcss | [ASSUMED] | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*slopcheck was unavailable at research time — all packages tagged `[ASSUMED]`. Planner may proceed without human-verify checkpoints given all packages are from major, well-established organizations.*

---

## Architecture Patterns

### System Architecture Diagram

```
GitHub push (main/branch)
         │
         ▼
   Vercel CI/CD
   auto-detects Next.js
         │
    ┌────┴────┐
    │  build  │  (next build → static SSG for all shell pages)
    └────┬────┘
         │
    ┌────▼────────────────────────────────┐
    │  app/layout.tsx  (Root Layout)      │
    │  • Injects Anton/Barlow/Hanken CSS  │
    │    variables via next/font/google   │
    │  • Renders <TopNav /> + {children} │
    │    + <Footer />                     │
    └────┬──────────────────┬────────────┘
         │                  │
    ┌────▼────┐        ┌────▼────────┐
    │ <TopNav>│        │  <Footer>   │
    │ (client)│        │  (server)   │
    │         │        │             │
    │ desktop:│        │ 3-col grid  │
    │  static │        │ desktop /   │
    │  links  │        │ 1-col mobile│
    │         │        │             │
    │ mobile: │        │ inline SVG  │
    │ hamburger        │ social icons│
    │ → Motion│        └─────────────┘
    │ overlay │
    └─────────┘
         │
    ┌────▼─────────────────────────────────┐
    │  Route pages (all Server Components) │
    │  app/page.tsx         → /            │
    │  app/amenities/page.tsx → /amenities │
    │  app/membership/page.tsx             │
    │  app/schedule/page.tsx               │
    │  app/contact/page.tsx                │
    │  (all render shell: page title only) │
    └──────────────────────────────────────┘
         │
    ┌────▼───────────────────┐
    │  app/globals.css        │
    │  @import "tailwindcss"  │
    │  @theme { ... }         │
    │  All 40+ DESIGN.md      │
    │  tokens as CSS vars     │
    └─────────────────────────┘
```

### Recommended Project Structure

```
kinetic-power-web/
├── app/
│   ├── globals.css          # @import "tailwindcss" + @theme block (ALL tokens)
│   ├── layout.tsx           # Root layout: font injection, TopNav, Footer
│   ├── page.tsx             # Home shell (/)
│   ├── amenities/
│   │   └── page.tsx         # Amenities shell
│   ├── membership/
│   │   └── page.tsx         # Membership shell
│   ├── schedule/
│   │   └── page.tsx         # Schedule shell
│   └── contact/
│       └── page.tsx         # Contact shell
├── components/
│   ├── TopNav.tsx           # 'use client' — hamburger toggle + Motion overlay
│   └── Footer.tsx           # Server Component — static markup
├── lib/
│   └── fonts.ts             # next/font/google definitions exported for reuse
├── public/
│   └── logo.svg             # Kinetic Power wordmark (placeholder)
├── postcss.config.mjs       # { plugins: { "@tailwindcss/postcss": {} } }
├── next.config.ts           # Default from scaffold
├── tsconfig.json            # Default from scaffold (baseUrl + @/* alias)
└── package.json
```

### Pattern 1: Tailwind v4 @theme Block with DESIGN.md Tokens

**What:** All DESIGN.md color, spacing, typography, and radius tokens declared as CSS variables inside `@theme` in `globals.css`. Tailwind generates utilities from them automatically.

**When to use:** Everywhere — this is the single source of truth, wired once in Phase 1.

```css
/* app/globals.css */
/* Source: https://tailwindcss.com/docs/theme and DESIGN.md */

@import "tailwindcss";

@theme {
  /* === COLORS === */
  /* Core palette */
  --color-background: #131313;
  --color-surface: #131313;
  --color-surface-dim: #131313;
  --color-surface-bright: #393939;
  --color-on-background: #e2e2e2;
  --color-on-surface: #e2e2e2;
  --color-on-surface-variant: #e9bcb5;

  /* Surface containers */
  --color-surface-container-lowest: #0e0e0e;
  --color-surface-container-low: #1b1b1b;
  --color-surface-container: #1f1f1f;
  --color-surface-container-high: #2a2a2a;
  --color-surface-container-highest: #353535;
  --color-surface-variant: #353535;

  /* Primary (Vengeance Red) */
  --color-primary: #ffb4a8;
  --color-on-primary: #690000;
  --color-primary-container: #e60000;
  --color-on-primary-container: #fff7f5;
  --color-inverse-primary: #c00000;
  --color-surface-tint: #ffb4a8;
  --color-primary-fixed: #ffdad4;
  --color-primary-fixed-dim: #ffb4a8;
  --color-on-primary-fixed: #410000;
  --color-on-primary-fixed-variant: #930100;

  /* Secondary */
  --color-secondary: #c6c6c7;
  --color-on-secondary: #2f3131;
  --color-secondary-container: #454747;
  --color-on-secondary-container: #b4b5b5;
  --color-secondary-fixed: #e2e2e2;
  --color-secondary-fixed-dim: #c6c6c7;
  --color-on-secondary-fixed: #1a1c1c;
  --color-on-secondary-fixed-variant: #454747;

  /* Tertiary */
  --color-tertiary: #c7c6c6;
  --color-on-tertiary: #303031;
  --color-tertiary-container: #727272;
  --color-on-tertiary-container: #faf8f8;
  --color-tertiary-fixed: #e3e2e2;
  --color-tertiary-fixed-dim: #c7c6c6;
  --color-on-tertiary-fixed: #1b1c1c;
  --color-on-tertiary-fixed-variant: #464747;

  /* Outline & Error */
  --color-outline: #b08781;
  --color-outline-variant: #5f3f3a;
  --color-error: #ffb4ab;
  --color-on-error: #690005;
  --color-error-container: #93000a;
  --color-on-error-container: #ffdad6;

  /* Inverse */
  --color-inverse-surface: #e2e2e2;
  --color-inverse-on-surface: #303030;

  /* === TYPOGRAPHY: Font families === */
  /* These reference CSS variables injected by next/font/google */
  @theme inline {
    --font-anton: var(--font-anton-loaded);
    --font-barlow-condensed: var(--font-barlow-condensed-loaded);
    --font-hanken-grotesk: var(--font-hanken-grotesk-loaded);
  }

  /* === TYPOGRAPHY: Type scale sizes === */
  /* Mobile-first defaults; scale up via md: responsive prefix */
  --text-display-xl: 4rem;           /* 64px mobile */
  --text-display-xl--line-height: 1;
  --text-headline-lg: 2rem;          /* 32px mobile */
  --text-headline-lg--line-height: 1.1;
  --text-title-md: 1.5rem;           /* 24px */
  --text-title-md--line-height: 1.2;
  --text-body-lg: 1.125rem;          /* 18px */
  --text-body-lg--line-height: 1.6;
  --text-body-md: 1rem;              /* 16px */
  --text-body-md--line-height: 1.5;
  --text-label-sm: 0.75rem;          /* 12px */
  --text-label-sm--line-height: 1;

  /* === TYPOGRAPHY: Letter spacing === */
  --tracking-headline: 0.02em;
  --tracking-title: 0.05em;
  --tracking-label: 0.1em;

  /* === SPACING === */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-base: 0.5rem;   /* 8px */
  --spacing-sm: 0.75rem;    /* 12px */
  --spacing-md: 1.5rem;     /* 24px */
  --spacing-lg: 3rem;       /* 48px */
  --spacing-xl: 5rem;       /* 80px */
  --spacing-gutter: 1.5rem; /* 24px */
  --spacing-margin-mobile: 1rem;    /* 16px */
  --spacing-margin-desktop: 2.5rem; /* 40px */
  --spacing-container-max: 80rem;   /* 1280px */

  /* === BORDER RADIUS === */
  --radius-sm: 0.125rem;    /* 2px */
  --radius-DEFAULT: 0.25rem; /* 4px */
  --radius-md: 0.375rem;    /* 6px */
  --radius-lg: 0.5rem;      /* 8px */
  --radius-xl: 0.75rem;     /* 12px */
  --radius-full: 9999px;
}
```

> **Note on responsive type (D-07):** Mobile sizes are the default in `@theme`. Desktop sizes are applied via `md:` Tailwind prefix. Example: `text-display-xl` = 64px mobile. At `md:` breakpoint, override inline or create `md:text-[6rem]` (96px). The token approach avoids creating `display-xl-mobile` as a separate token.

### Pattern 2: Font Loading with next/font/google + CSS Variables

**What:** Load three non-variable Google Fonts, expose each as a CSS variable, apply all three classes to the `<html>` element in root layout.

**When to use:** In `app/layout.tsx` and referenced throughout @theme.

```typescript
// lib/fonts.ts
// Source: https://nextjs.org/docs/app/api-reference/components/font#with-tailwind-css
import { Anton, Barlow_Condensed, Hanken_Grotesk } from 'next/font/google'

export const anton = Anton({
  weight: '400',           // Anton is not a variable font; only 400 is available
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-anton-loaded',
})

export const barlowCondensed = Barlow_Condensed({
  weight: ['600', '700'],  // Bold weights for title-md and label-sm
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow-condensed-loaded',
})

export const hankenGrotesk = Hanken_Grotesk({
  weight: ['400', '500'],  // Regular + medium for body
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hanken-grotesk-loaded',
})
```

```typescript
// app/layout.tsx
// Source: https://nextjs.org/docs/app/api-reference/components/font#with-tailwind-css
import { anton, barlowCondensed, hankenGrotesk } from '@/lib/fonts'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${barlowCondensed.variable} ${hankenGrotesk.variable}`}
    >
      <body className="bg-background text-on-surface">
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

### Pattern 3: TopNav with Motion Overlay

**What:** Server-safe nav component with a `'use client'` boundary. Uses `useState` for open/close, `AnimatePresence` + `motion.div` for the overlay fade+translate.

**When to use:** `components/TopNav.tsx` only — keep the `'use client'` boundary tight.

```typescript
// components/TopNav.tsx
// Source: https://motion.dev/docs/react-animation (AnimatePresence pattern)
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Amenities', href: '/amenities' },
  { label: 'Membership', href: '/membership' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Contact', href: '/contact' },
]

export function TopNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-low border-b border-outline-variant">
      {/* Desktop nav */}
      <div className="max-w-[var(--spacing-container-max)] mx-auto px-[var(--spacing-margin-desktop)] h-16 flex items-center justify-between">
        <Link href="/" className="font-anton text-on-surface uppercase text-lg tracking-wider">
          Kinetic Power
        </Link>
        {/* Desktop links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href}
              className="font-barlow-condensed text-on-surface uppercase tracking-title text-sm hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        {/* Desktop CTA */}
        <Link href="/schedule"
          className="hidden md:inline-flex items-center px-5 py-2 bg-primary-container text-on-primary-container font-anton uppercase rounded text-sm tracking-wider">
          Book a Session
        </Link>
        {/* Mobile hamburger */}
        <button
          className="md:hidden text-on-surface p-2"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          {/* Three-bar SVG */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background flex flex-col px-[var(--spacing-margin-mobile)] pt-16 pb-8"
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
          >
            {/* X close button */}
            <button
              className="absolute top-4 right-4 text-on-surface p-2"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            {/* Overlay nav links */}
            <nav className="flex flex-col gap-8 mt-8">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className="font-anton text-on-surface text-4xl uppercase"
                  onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </nav>
            {/* Pinned CTA */}
            <div className="mt-auto">
              <Link href="/schedule"
                className="block w-full text-center py-4 bg-primary-container text-on-primary-container font-anton uppercase text-xl rounded"
                onClick={() => setOpen(false)}>
                Book a Session
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
```

### Anti-Patterns to Avoid

- **Using `framer-motion` as the import package name:** The package is now `motion`, imported from `motion/react`. `framer-motion` exists as an alias at the same version but official docs use `motion/react`.
- **Putting `'use client'` on the root layout:** Root layout must remain a Server Component. Only `TopNav.tsx` needs the directive.
- **Using `--font-anton` directly in @theme without `@theme inline`:** The `next/font` variable is injected at runtime as a class on `<html>`. Referencing it in `@theme` requires `@theme inline { --font-X: var(--font-X-loaded); }` to avoid circular resolution.
- **Creating separate mobile token names (D-07 violation):** Do not add `--text-display-xl-mobile`. Use `text-display-xl` as the mobile default and override at `md:`.
- **Wiring Sanity in Phase 1:** No `next-sanity`, no schema, no GROQ. Sanity is Phase 5 only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Font self-hosting | Manual `@font-face` declarations | `next/font/google` | Automatic subset download, CLS prevention, no Google network call from browser |
| CSS variables from design tokens | Manual `:root {}` file | Tailwind v4 `@theme {}` block | `@theme` generates utility classes automatically; `:root` alone does not |
| Overlay entry/exit animation | CSS `transition` on `display: none` | Motion `AnimatePresence` + `motion.div` | CSS cannot animate `display`; `AnimatePresence` handles the unmount animation cleanly |
| GitHub → Vercel webhook | GitHub Actions workflow | Vercel GitHub integration (dashboard connect) | Native integration handles preview URLs, PR comments, production promotions — zero config |
| Responsive breakpoints | Custom CSS `@media` queries | Tailwind `md:` / `lg:` prefixes | Breakpoints are already in `@theme`; no duplication needed |
| Social icon fonts | `react-icons`, FontAwesome | Inline SVG components | Icon fonts add ~50 KB; inline SVG is accessible, token-colored, zero bundle cost |

**Key insight:** The Tailwind v4 `@theme` block is the highest-leverage single file in this phase. Getting it right once eliminates all one-off CSS variable definitions throughout the codebase.

---

## Common Pitfalls

### Pitfall 1: next-sanity version mismatch

**What goes wrong:** CLAUDE.md documents `next-sanity@12.4.5` but the registry current is `13.0.3` with breaking API changes (`revalidateSyncTags` replaced, `stega` and `fetchOptions` removed from `defineLive`).
**Why it happens:** CLAUDE.md was written before next-sanity v13 shipped (2026-05-21).
**How to avoid:** Phase 1 does NOT install next-sanity. When Phase 5 wires Sanity, use `next-sanity@13.0.3` and expect v13 API. [VERIFIED: npm registry]
**Warning signs:** Build error mentioning `revalidateSyncTags` or `fetchOptions` prop.

### Pitfall 2: Tailwind v4 @theme namespace collision

**What goes wrong:** Using `--color-primary` generates `bg-primary` and `text-primary` — but Tailwind v4 also has its own internal `--color-*` namespace. If you accidentally override a core Tailwind utility name, styles break silently.
**Why it happens:** DESIGN.md tokens like `primary`, `secondary`, `background` are semantically generic and overlap with potential Tailwind defaults.
**How to avoid:** In v4 the default palette is NOT included by default in `@theme` (you only get what you declare). Verify output with `npx tailwindcss --input globals.css --output debug.css` and spot-check that `bg-background` resolves to `#131313`.
**Warning signs:** Utility class applies but color is wrong.

### Pitfall 3: Motion import path

**What goes wrong:** Importing from `framer-motion` instead of `motion/react` — both work at identical versions but `framer-motion` is the legacy alias and may diverge.
**Why it happens:** Training data and many tutorials still reference `framer-motion`.
**How to avoid:** Always `import { motion, AnimatePresence } from 'motion/react'`. Confirm package.json shows `motion` (not `framer-motion`) after install. [VERIFIED: npm registry]
**Warning signs:** Import resolves but IDE types show `framer-motion` in the type path.

### Pitfall 4: create-next-app scaffolds Tailwind v4 but still generates tailwind.config.ts

**What goes wrong:** The scaffold adds a `tailwind.config.ts` alongside the v4 setup, confusing two config systems.
**Why it happens:** Some versions of the scaffold template transition period may include residual v3 config.
**How to avoid:** After scaffolding, delete `tailwind.config.ts` if present. Tailwind v4 is entirely CSS-first — `tailwind.config.js/ts` is unused and ignored.
**Warning signs:** `tailwind.config.ts` exists in project root.

### Pitfall 5: 'use client' placement on layout vs component

**What goes wrong:** Adding `'use client'` to `app/layout.tsx` forces the entire page tree to be client-side rendered, eliminating SSG benefits and breaking the performance target (GLOB-05).
**Why it happens:** Developers put the directive high up to stop TypeScript errors from `useState` in a nested component.
**How to avoid:** `'use client'` belongs ONLY in `components/TopNav.tsx`. All page layouts and shell pages remain Server Components. [CITED: https://nextjs.org/docs/app/getting-started/installation]
**Warning signs:** Lighthouse shows high JS hydration time on a shell page.

### Pitfall 6: Node.js version

**What goes wrong:** Next.js 16 requires Node.js >= 20.9. Running on an older version causes cryptic build errors.
**Why it happens:** Developers on older LTS versions.
**How to avoid:** `node --version` — confirm >= 20.9 before scaffolding. Current environment: v24.14.1 (passes). [VERIFIED: npm registry + official docs]
**Warning signs:** `create-next-app` fails with unsupported engine error.

### Pitfall 7: TypeScript 6.0 — CLAUDE.md says ~5.x

**What goes wrong:** CLAUDE.md states TypeScript `~5.x` but the npm registry current is `6.0.3` (released 2026-04-16). The scaffold will install TS 6.x.
**Why it happens:** CLAUDE.md was written before TS 6 shipped. Next.js peerDeps don't specify an upper TS bound.
**How to avoid:** Use the scaffolded TS version (6.0.3). No action required — this is a non-breaking version bump for this stack. [VERIFIED: npm registry]
**Warning signs:** None expected.

---

## Code Examples

### postcss.config.mjs (required for Tailwind v4 in Next.js)

```javascript
// Source: https://tailwindcss.com/docs/guides/nextjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### Shell page pattern (Server Component)

```typescript
// app/amenities/page.tsx
// Source: https://nextjs.org/docs/app/getting-started/installation
export default function AmenitiesPage() {
  return (
    <main className="min-h-screen pt-16">
      <h1 className="font-anton uppercase text-display-xl text-on-surface">
        Amenities
      </h1>
    </main>
  )
}
```

### Verifying token → utility generation

After building, check that design tokens resolve correctly:
```bash
npx tailwindcss --input app/globals.css --output /tmp/tw-debug.css
grep 'bg-background\|text-primary\|text-display-xl' /tmp/tw-debug.css
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` with `theme.extend` | CSS-first `@theme {}` block in globals.css | Tailwind v4 (2025) | No JS config file; tokens are CSS variables that generate utilities |
| `@tailwind base/components/utilities` (3 directives) | `@import "tailwindcss"` (single import) | Tailwind v4 (2025) | Simpler, works with Turbopack without extra config |
| `framer-motion` package | `motion` package (`motion/react` import) | Motion v11 (2024) | New package name; `framer-motion` is now an alias |
| `next-sanity@12.x` | `next-sanity@13.x` | 2026-05-21 | `revalidateSyncTags` → `action` prop; `stega`/`fetchOptions` removed from `defineLive` |
| TypeScript 5.x | TypeScript 6.0.3 | 2026-04-16 | Non-breaking for this stack; scaffold will install 6.x |
| `next build` runs ESLint | ESLint must be run separately via npm script | Next.js 16.0.0 | `next build` no longer auto-lints |
| Pages Router | App Router | Next.js 13+ | App Router is the only supported path; Pages Router is deprecated |

**Deprecated/outdated:**
- `tailwind.config.js/ts`: Unused in v4; delete if scaffold generates one
- `@tailwind base; @tailwind components; @tailwind utilities` (v3 CSS syntax): Replaced by single `@import "tailwindcss"`
- `next-sanity@12.4.5`: Listed in CLAUDE.md but superseded by v13.0.3 with breaking changes. Phase 1 does not install next-sanity.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Anton, Barlow_Condensed, Hanken_Grotesk are available in `next/font/google` under those exact import names | Standard Stack / Pattern 2 | Font loading fails; fallback to system fonts | 
| A2 | `create-next-app@latest --yes` scaffolds Tailwind v4 (not v3) as of Next.js 15.2+ | Standard Stack | Developer must manually upgrade Tailwind after scaffold |
| A3 | All package download counts and ages (presented in Package Legitimacy Audit) | Package Legitimacy Audit | No material risk — packages are from major orgs |

> A1 note: Google Fonts lists Anton, Barlow Condensed, and Hanken Grotesk. `next/font/google` exports match Google Fonts names with spaces replaced by underscores. High confidence this is correct based on training knowledge, but not verified via official source in this session.

> A2 note: A GitHub discussion confirms Tailwind v4 support landed in Next.js 15.2. One web search result suggests v3 may remain default with `--yes`. The safest plan task: after scaffold, verify `tailwindcss` version in package.json and upgrade to v4 if needed.

---

## Open Questions

1. **Is `Hanken_Grotesk` the exact export name in `next/font/google`?**
   - What we know: Google Fonts has "Hanken Grotesk"; `next/font/google` uses underscores for spaces
   - What's unclear: Some fonts have minor name differences; "Hanken_Grotesk" vs "Hanken_Grotesk" — needs live verification
   - Recommendation: First implementation task should run `import { Hanken_Grotesk } from 'next/font/google'` and confirm no "module not found" error at dev server start

2. **Does `create-next-app --yes` scaffold Tailwind v4 or v3?**
   - What we know: Tailwind v4 support was added in Next.js 15.2; current scaffold is 16.2.6
   - What's unclear: Whether `--yes` (defaults) uses v4 or whether it still falls back to v3
   - Recommendation: Plan task should check `package.json` after scaffold and install `tailwindcss@latest @tailwindcss/postcss@latest` explicitly if the scaffold generates v3

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js >= 20.9 | Next.js 16.x | ✓ | v24.14.1 | — |
| npm | Package installation | ✓ | 11.11.0 | — |
| git | GitHub repo creation | ✓ | 2.50.1 | — |
| gh CLI | GitHub repo creation via CLI | ✓ | 2.90.0 | Create repo via github.com UI |
| vercel CLI | Optional — not needed for GitHub integration deploy | ✓ | 51.8.0 | Not needed; GitHub integration is primary path |

**Missing dependencies with no fallback:** None — all required tools are available.

**Missing dependencies with fallback:** None applicable to Phase 1.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None established yet — Phase 1 Wave 0 must scaffold test infrastructure |
| Config file | None — will create `jest.config.ts` or use Next.js built-in (Playwright for E2E) |
| Quick run command | `npm run test` (once configured) |
| Full suite command | `npm run test:e2e` (once configured) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GLOB-01 | Nav renders on all pages with hamburger below md breakpoint | smoke/visual | Playwright: `playwright test nav.spec.ts` | ❌ Wave 0 |
| GLOB-01 | Mobile overlay opens on hamburger click, closes on X | E2E interaction | Playwright: `playwright test nav.spec.ts` | ❌ Wave 0 |
| GLOB-03 | Footer renders on all pages | smoke | Playwright: `playwright test footer.spec.ts` | ❌ Wave 0 |
| GLOB-04 | Background is #131313 (dark theme applied) | visual/smoke | Playwright CSS assertion | ❌ Wave 0 |
| GLOB-05 | Vercel preview URL loads; shell pages return 200 | smoke | Playwright: visit all 5 routes | ❌ Wave 0 |

> **Note:** GLOB-05 (under 3 second load) requires a deployed URL. The Lighthouse mobile performance test must be run against the live Vercel preview URL, not localhost. This is a manual check at phase gate.

### Sampling Rate

- **Per task commit:** `npm run build` (confirms no TS/build errors)
- **Per wave merge:** Playwright smoke suite green
- **Phase gate:** All 5 routes render on Vercel preview URL with correct dark background + fonts visible; Lighthouse mobile ≥ passing

### Wave 0 Gaps

- [ ] `e2e/nav.spec.ts` — covers GLOB-01 (hamburger toggle, overlay, close)
- [ ] `e2e/footer.spec.ts` — covers GLOB-03 (footer present on all pages)
- [ ] `e2e/smoke.spec.ts` — covers GLOB-04 + GLOB-05 (dark background, all routes 200)
- [ ] `playwright.config.ts` — baseURL pointing to localhost:3000
- [ ] Playwright install: `npm install -D @playwright/test && npx playwright install chromium`

---

## Security Domain

> GLOB-05 (performance) and GLOB-04 (design system) have no direct security surface. GLOB-01/GLOB-03 are purely structural. Phase 1 has minimal security attack surface — no forms, no auth, no data input. Noting relevant ASVS categories for completeness.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 1 |
| V3 Session Management | No | No sessions in Phase 1 |
| V4 Access Control | No | Public marketing site, no protected routes |
| V5 Input Validation | No | No forms in Phase 1 |
| V6 Cryptography | No | No secrets handled in Phase 1 |
| V14 Configuration | Partial | Vercel env vars should be empty for Phase 1; no secrets committed to GitHub |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Secrets in git | Information disclosure | `.env.local` in `.gitignore` (create-next-app handles this); no secrets exist in Phase 1 |
| Vercel project exposure | — | Vercel project on personal account; no sensitive env vars configured in Phase 1 |

---

## Sources

### Primary (HIGH confidence)

- [Next.js 16.2.6 Installation Docs](https://nextjs.org/docs/app/getting-started/installation) — create-next-app command, App Router conventions, minimum Node.js version
- [Next.js Font Module Docs](https://nextjs.org/docs/app/api-reference/components/font) — next/font/google multi-font setup, CSS variable pattern with Tailwind, `variable` option
- [Tailwind CSS v4 @theme Docs](https://tailwindcss.com/docs/theme) — @theme block syntax, namespaces, inline variant, CSS variable generation
- [Tailwind CSS v4 + Next.js Guide](https://tailwindcss.com/docs/guides/nextjs) — postcss.config.mjs setup, @tailwindcss/postcss package
- [Motion Animation Docs](https://motion.dev/docs/react-animation) — AnimatePresence, motion.div, exit animations
- [Vercel for GitHub Docs](https://vercel.com/docs/git/vercel-for-github) — auto-deploy on push, preview URLs per branch
- [next-sanity v13 Release Notes](https://github.com/sanity-io/next-sanity/releases) — breaking changes from v12 to v13
- npm registry — version verification for all packages (2026-05-22)

### Secondary (MEDIUM confidence)

- [GitHub Discussion: Tailwind v4 in create-next-app](https://github.com/vercel/next.js/discussions/75320) — confirmed v4 support as of Next.js 15.2
- WebSearch results — confirmed create-next-app defaults to Tailwind v4 in Next.js 15.2+

### Tertiary (LOW confidence)

- Training knowledge — Font names `Anton`, `Barlow_Condensed`, `Hanken_Grotesk` in `next/font/google`; flagged as A1 in Assumptions Log

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry on research date
- Architecture patterns: HIGH — sourced from official Next.js and Tailwind docs
- Pitfalls: HIGH — sourced from official docs + confirmed behavioral knowledge of v4/v13 breaking changes
- Font names: MEDIUM — training knowledge, not verified against official source (flagged A1)

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (stable stack — all packages are recent, fast-moving only on next-sanity which is Phase 5)
