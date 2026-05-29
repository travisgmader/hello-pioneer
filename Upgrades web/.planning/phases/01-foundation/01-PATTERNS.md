# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-05-27
**Files analyzed:** 10 new files (0 existing analogs in this repo — greenfield project)
**Analogs found:** 3 / 10 (from sibling project `/Family App 2.0`; remainder use canonical Next.js App Router patterns from RESEARCH.md)

---

## Codebase State

This is a greenfield project. The `Upgrades web/` directory contains only `CLAUDE.md`, `DESIGN.md`, and `.planning/`. No source files exist yet.

The sibling project `/Users/travismader/Desktop/Pioneer/Family App 2.0` uses Vite + React Router + CSS Modules — a different stack from this project's Next.js App Router + Tailwind v4 architecture. Analogs from that project apply only to structural/conceptual patterns (nav shape, layout shell, test config). All code excerpts below show Next.js App Router idioms, not the sibling's patterns.

**Primary pattern source:** `01-RESEARCH.md` — all patterns are sourced from official Next.js, Tailwind v4, and Motion docs and are marked with their source URL.

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `app/globals.css` | config | static | RESEARCH.md Pattern 1 | canonical (no repo analog) |
| `lib/fonts.ts` | utility | static | RESEARCH.md Pattern 2 | canonical (no repo analog) |
| `app/layout.tsx` | layout | request-response (SSR) | `/Family App 2.0/src/routes/RootLayout.tsx` | role-match (different stack) |
| `components/TopNav.tsx` | component | event-driven (client) | `/Family App 2.0/src/components/TopNav.tsx` | role-match (different stack) |
| `components/Footer.tsx` | component | static | none | no analog |
| `app/page.tsx` | page | request-response (SSG) | RESEARCH.md shell page pattern | canonical (no repo analog) |
| `app/amenities/page.tsx` | page | request-response (SSG) | RESEARCH.md shell page pattern | canonical (no repo analog) |
| `app/membership/page.tsx` | page | request-response (SSG) | RESEARCH.md shell page pattern | canonical (no repo analog) |
| `app/schedule/page.tsx` | page | request-response (SSG) | RESEARCH.md shell page pattern | canonical (no repo analog) |
| `app/contact/page.tsx` | page | request-response (SSG) | RESEARCH.md shell page pattern | canonical (no repo analog) |
| `postcss.config.mjs` | config | static | RESEARCH.md Code Examples | canonical (no repo analog) |
| `playwright.config.ts` | config | static | `/Family App 2.0/playwright.config.ts` | role-match (same tool, different framework) |
| `e2e/smoke.spec.ts` | test | event-driven | `/Family App 2.0/tests/e2e/walking-skeleton.spec.ts` | role-match |
| `e2e/nav.spec.ts` | test | event-driven | `/Family App 2.0/tests/e2e/walking-skeleton.spec.ts` | role-match |
| `e2e/footer.spec.ts` | test | event-driven | `/Family App 2.0/tests/e2e/walking-skeleton.spec.ts` | role-match |

---

## Pattern Assignments

### `app/globals.css` (config, static)

**Analog:** RESEARCH.md Pattern 1 (Tailwind v4 @theme block)
**Source URL:** https://tailwindcss.com/docs/theme + DESIGN.md

**Core pattern — full @theme structure:**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* === COLORS: Core palette === */
  --color-background: #131313;
  --color-surface: #131313;
  --color-surface-dim: #131313;
  --color-surface-bright: #393939;
  --color-on-background: #e2e2e2;
  --color-on-surface: #e2e2e2;
  --color-on-surface-variant: #e9bcb5;

  /* === COLORS: Surface containers === */
  --color-surface-container-lowest: #0e0e0e;
  --color-surface-container-low: #1b1b1b;
  --color-surface-container: #1f1f1f;
  --color-surface-container-high: #2a2a2a;
  --color-surface-container-highest: #353535;
  --color-surface-variant: #353535;

  /* === COLORS: Primary (Vengeance Red) === */
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

  /* === COLORS: Secondary === */
  --color-secondary: #c6c6c7;
  --color-on-secondary: #2f3131;
  --color-secondary-container: #454747;
  --color-on-secondary-container: #b4b5b5;
  --color-secondary-fixed: #e2e2e2;
  --color-secondary-fixed-dim: #c6c6c7;
  --color-on-secondary-fixed: #1a1c1c;
  --color-on-secondary-fixed-variant: #454747;

  /* === COLORS: Tertiary === */
  --color-tertiary: #c7c6c6;
  --color-on-tertiary: #303031;
  --color-tertiary-container: #727272;
  --color-on-tertiary-container: #faf8f8;
  --color-tertiary-fixed: #e3e2e2;
  --color-tertiary-fixed-dim: #c7c6c6;
  --color-on-tertiary-fixed: #1b1c1c;
  --color-on-tertiary-fixed-variant: #464747;

  /* === COLORS: Outline & Error === */
  --color-outline: #b08781;
  --color-outline-variant: #5f3f3a;
  --color-error: #ffb4ab;
  --color-on-error: #690005;
  --color-error-container: #93000a;
  --color-on-error-container: #ffdad6;

  /* === COLORS: Inverse === */
  --color-inverse-surface: #e2e2e2;
  --color-inverse-on-surface: #303030;

  /* === TYPOGRAPHY: Font families (via @theme inline) === */
  /* next/font injects runtime CSS vars; @theme inline avoids circular resolution */
  @theme inline {
    --font-anton: var(--font-anton-loaded);
    --font-barlow-condensed: var(--font-barlow-condensed-loaded);
    --font-hanken-grotesk: var(--font-hanken-grotesk-loaded);
  }

  /* === TYPOGRAPHY: Type scale (mobile-first defaults) === */
  /* D-07: No separate mobile token names. Override at md: breakpoint in JSX. */
  --text-display-xl: 4rem;           /* 64px mobile; use md:text-[6rem] for desktop 96px */
  --text-display-xl--line-height: 1;
  --text-headline-lg: 2rem;          /* 32px mobile; use md:text-[3rem] for desktop 48px */
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
  --spacing-xs: 0.25rem;             /* 4px */
  --spacing-base: 0.5rem;            /* 8px */
  --spacing-sm: 0.75rem;             /* 12px */
  --spacing-md: 1.5rem;              /* 24px */
  --spacing-lg: 3rem;                /* 48px */
  --spacing-xl: 5rem;                /* 80px */
  --spacing-gutter: 1.5rem;          /* 24px */
  --spacing-margin-mobile: 1rem;     /* 16px */
  --spacing-margin-desktop: 2.5rem;  /* 40px */
  --spacing-container-max: 80rem;    /* 1280px */

  /* === BORDER RADIUS === */
  --radius-sm: 0.125rem;             /* 2px */
  --radius-DEFAULT: 0.25rem;         /* 4px — DESIGN.md default */
  --radius-md: 0.375rem;             /* 6px */
  --radius-lg: 0.5rem;               /* 8px */
  --radius-xl: 0.75rem;              /* 12px */
  --radius-full: 9999px;
}
```

**Critical rules:**
- Token names must match DESIGN.md verbatim (D-05). No abbreviations.
- `@import "tailwindcss"` replaces the three v3 `@tailwind` directives.
- No `tailwind.config.ts` — delete if scaffold generates one (Pitfall 4 in RESEARCH.md).
- After build, verify with: `npx tailwindcss --input app/globals.css --output /tmp/tw-debug.css && grep 'bg-background' /tmp/tw-debug.css`

---

### `lib/fonts.ts` (utility, static)

**Analog:** RESEARCH.md Pattern 2
**Source URL:** https://nextjs.org/docs/app/api-reference/components/font#with-tailwind-css

**Core pattern:**
```typescript
// lib/fonts.ts
import { Anton, Barlow_Condensed, Hanken_Grotesk } from 'next/font/google'

export const anton = Anton({
  weight: '400',           // Anton is not a variable font; only 400 is available
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-anton-loaded',  // CSS var injected on <html> at runtime
})

export const barlowCondensed = Barlow_Condensed({
  weight: ['600', '700'],  // DESIGN.md: title-md 700, label-sm 600
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow-condensed-loaded',
})

export const hankenGrotesk = Hanken_Grotesk({
  weight: ['400', '500'],  // DESIGN.md: body 400, medium 500
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-hanken-grotesk-loaded',
})
```

**Key constraint:** The variable names `--font-anton-loaded`, `--font-barlow-condensed-loaded`, `--font-hanken-grotesk-loaded` must exactly match what `@theme inline` references in `globals.css`. These are runtime-injected; the `-loaded` suffix is a deliberate naming convention to avoid collision with the `--font-*` Tailwind namespace.

**Verification:** After dev server starts, confirm no "Module not found" error for `Hanken_Grotesk` (Assumption A1 in RESEARCH.md — font name not formally verified against next/font source).

---

### `app/layout.tsx` (layout, SSR)

**Analog (structure):** `/Users/travismader/Desktop/Pioneer/Family App 2.0/src/routes/RootLayout.tsx`
**Stack difference:** Sibling uses Vite + React Router `<Outlet />`; this file uses Next.js App Router `{children}` prop.
**Source URL:** https://nextjs.org/docs/app/api-reference/components/font#with-tailwind-css

**Core pattern:**
```typescript
// app/layout.tsx
// Server Component — DO NOT add 'use client' here (Pitfall 5 in RESEARCH.md)
import type { Metadata } from 'next'
import { anton, barlowCondensed, hankenGrotesk } from '@/lib/fonts'
import { TopNav } from '@/components/TopNav'
import { Footer } from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kinetic Power',
  description: 'Elite training facility.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      // All three font variables applied to <html> so CSS vars are globally available
      className={`${anton.variable} ${barlowCondensed.variable} ${hankenGrotesk.variable}`}
    >
      <body className="bg-background text-on-surface min-h-screen">
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
```

**Structural pattern from sibling (`RootLayout.tsx` lines 35-51):**
- TopNav rendered before main content area
- Footer/BottomNav rendered after
- Shell component imports at top, children rendered in `<main>`

---

### `components/TopNav.tsx` (component, event-driven, client)

**Analog (structure):** `/Users/travismader/Desktop/Pioneer/Family App 2.0/src/components/TopNav.tsx`
**Stack difference:** Sibling uses React Router `<NavLink>` + CSS Modules; this uses Next.js `<Link>` + Tailwind + Motion.
**Source URL:** https://motion.dev/docs/react-animation (AnimatePresence pattern)

**`'use client'` placement (critical):**
```typescript
// components/TopNav.tsx
// ONLY this file gets 'use client' — not layout.tsx (Pitfall 5 in RESEARCH.md)
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'  // NOT 'framer-motion' (Pitfall 3)
import Link from 'next/link'
```

**Nav links array pattern (from sibling `TopNav.tsx` lines 15-22):**
```typescript
// Declare as a module-level constant — not inside the component function
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Amenities', href: '/amenities' },
  { label: 'Membership', href: '/membership' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Contact', href: '/contact' },
] as const
```

**State + desktop layout core pattern:**
```typescript
export function TopNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface-container-low border-b border-outline-variant">
      <div className="max-w-[var(--spacing-container-max)] mx-auto px-[var(--spacing-margin-desktop)] h-16 flex items-center justify-between">
        {/* Logo — far left */}
        <Link href="/" className="font-anton text-on-surface uppercase text-lg tracking-wider">
          Kinetic Power
        </Link>

        {/* Desktop nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="font-barlow-condensed text-on-surface uppercase tracking-title text-sm hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA — far right, hidden on mobile */}
        <Link
          href="/schedule"
          className="hidden md:inline-flex items-center px-5 py-2 bg-primary-container text-on-primary-container font-anton uppercase rounded text-sm tracking-wider"
        >
          Book a Session
        </Link>

        {/* Mobile hamburger — visible on mobile only */}
        <button
          className="md:hidden text-on-surface p-2"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          {/* Three-line SVG — clean, brand-consistent */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile overlay — AnimatePresence handles unmount animation */}
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
            {/* X close button — top-right */}
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

            {/* Overlay links — Anton uppercase, large, hard-left (D-09) */}
            <nav className="flex flex-col gap-8 mt-8">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-anton text-on-surface text-4xl uppercase"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Pinned CTA — bottom of overlay (D-09) */}
            <div className="mt-auto">
              <Link
                href="/schedule"
                className="block w-full text-center py-4 bg-primary-container text-on-primary-container font-anton uppercase text-xl rounded"
                onClick={() => setOpen(false)}
              >
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

**Motion import rule:** Always `import { motion, AnimatePresence } from 'motion/react'` — never `from 'framer-motion'` (Pitfall 3 in RESEARCH.md).

---

### `components/Footer.tsx` (component, static)

**Analog:** None — no footer component in any sibling project.
**Source:** DESIGN.md D-12, D-13, D-14, D-15 + canonical Next.js Server Component pattern.

**Core pattern:**
```typescript
// components/Footer.tsx
// Server Component — no 'use client' needed (pure static markup)
import Link from 'next/link'

// Inline SVG icon components (D-13: no icon font libraries)
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Amenities', href: '/amenities' },
  { label: 'Membership', href: '/membership' },
  { label: 'Schedule', href: '/schedule' },
  { label: 'Contact', href: '/contact' },
]

export function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant mt-auto">
      <div className="max-w-[var(--spacing-container-max)] mx-auto px-[var(--spacing-margin-desktop)] py-[var(--spacing-lg)]">
        {/* 3-col desktop grid / 1-col mobile stack (D-12) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-lg)]">
          {/* Col 1: Brand name + tagline */}
          <div>
            <p className="font-anton text-on-surface uppercase text-lg tracking-wider">Kinetic Power</p>
            <p className="font-barlow-condensed text-on-surface-variant text-label-sm uppercase tracking-label mt-[var(--spacing-base)]">
              Uncompromising. Elite. High-Octane.
            </p>
          </div>

          {/* Col 2: Page navigation (D-12, D-15) */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-col gap-[var(--spacing-base)]">
              {NAV_LINKS.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-hanken-grotesk text-on-surface-variant text-body-md hover:text-on-surface transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Col 3: Address + hours + social icons (D-14 placeholder content) */}
          <div className="flex flex-col gap-[var(--spacing-md)]">
            <address className="font-hanken-grotesk text-on-surface-variant text-body-md not-italic">
              <p>1847 Industrial Blvd</p>
              <p>Phoenix, AZ 85001</p>
            </address>
            <div className="font-hanken-grotesk text-on-surface-variant text-body-md">
              <p>Mon–Fri: 5am – 10pm</p>
              <p>Sat–Sun: 6am – 8pm</p>
            </div>
            {/* Social icons — inline SVG, token-colored (D-13) */}
            <div className="flex gap-[var(--spacing-md)]">
              <a href="https://instagram.com/kineticpower" aria-label="Instagram" className="text-on-surface-variant hover:text-primary transition-colors">
                <InstagramIcon />
              </a>
              <a href="https://facebook.com/kineticpower" aria-label="Facebook" className="text-on-surface-variant hover:text-primary transition-colors">
                <FacebookIcon />
              </a>
              <a href="https://tiktok.com/@kineticpower" aria-label="TikTok" className="text-on-surface-variant hover:text-primary transition-colors">
                <TikTokIcon />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-outline-variant mt-[var(--spacing-lg)] pt-[var(--spacing-md)]">
          <p className="font-barlow-condensed text-on-surface-variant text-label-sm uppercase tracking-label">
            © {new Date().getFullYear()} Kinetic Power. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
```

---

### `app/page.tsx` and all shell pages (page, SSG)

**Analog:** RESEARCH.md shell page pattern + canonical Next.js App Router
**Source URL:** https://nextjs.org/docs/app/getting-started/installation

**Core pattern — copy for each of the 5 routes:**
```typescript
// app/page.tsx (Home)
// Server Component — no data fetching in Phase 1, SSG by default
export default function HomePage() {
  return (
    <main className="min-h-screen pt-16">
      {/* pt-16 offsets the fixed TopNav (h-16) */}
      <h1 className="font-anton uppercase text-display-xl md:text-[6rem] text-on-surface">
        Home
      </h1>
    </main>
  )
}
```

```typescript
// app/amenities/page.tsx
export default function AmenitiesPage() {
  return (
    <main className="min-h-screen pt-16">
      <h1 className="font-anton uppercase text-display-xl md:text-[6rem] text-on-surface">
        Amenities
      </h1>
    </main>
  )
}
```

**Repeat pattern** for `app/membership/page.tsx`, `app/schedule/page.tsx`, `app/contact/page.tsx` — change the function name and heading text only.

**Responsive type rule (D-07):** `text-display-xl` = 64px (mobile default from token). `md:text-[6rem]` = 96px (desktop). No separate token for the desktop size.

---

### `postcss.config.mjs` (config, static)

**Analog:** RESEARCH.md Code Examples
**Source URL:** https://tailwindcss.com/docs/guides/nextjs

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**Note:** This file is typically scaffolded by `create-next-app`. If generated, verify it matches this exactly. If `tailwind.config.ts` also exists after scaffolding, delete it — Tailwind v4 is CSS-first only (Pitfall 4 in RESEARCH.md).

---

### `playwright.config.ts` (config, static)

**Analog:** `/Users/travismader/Desktop/Pioneer/Family App 2.0/playwright.config.ts` (lines 1-43)
**Match quality:** Role-match — same tool (Playwright), different framework and port.

**Core pattern (adapt from sibling):**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

// Supports running against Vercel preview URL in CI (same pattern as sibling)
const usingExternalUrl = !!process.env['PLAYWRIGHT_BASE_URL']

export default defineConfig({
  testDir: './e2e',           // Next.js convention: e2e/ at project root
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:3000',  // Next.js port (not 5173)
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },    // Mobile viewport for hamburger nav tests
    },
  ],
  ...(usingExternalUrl
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          port: 3000,                    // Next.js default port
          reuseExistingServer: !process.env['CI'],
          timeout: 120_000,
        },
      }),
})
```

**Key difference from sibling:** Port is `3000` (Next.js) not `5173` (Vite). Added `mobile-chrome` project for hamburger nav testing.

---

### `e2e/smoke.spec.ts` (test, event-driven)

**Analog:** `/Users/travismader/Desktop/Pioneer/Family App 2.0/tests/e2e/walking-skeleton.spec.ts` (lines 1-34)

**Core pattern — adapted for Next.js public marketing site:**
```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test'

const ROUTES = ['/', '/amenities', '/membership', '/schedule', '/contact']

test.describe('Smoke — all routes render', () => {
  for (const route of ROUTES) {
    test(`${route} returns 200 and has dark background`, async ({ page }) => {
      await page.goto(route)
      // Verify page loaded (no error page)
      await expect(page).not.toHaveTitle(/Error|404/)
      // Verify dark background token applied (GLOB-04)
      const bg = await page.evaluate(() =>
        getComputedStyle(document.body).backgroundColor
      )
      // #131313 = rgb(19, 19, 19)
      expect(bg).toBe('rgb(19, 19, 19)')
    })
  }
})
```

---

### `e2e/nav.spec.ts` (test, event-driven)

**Analog:** `/Users/travismader/Desktop/Pioneer/Family App 2.0/tests/e2e/walking-skeleton.spec.ts` (lines 15-33)

**Core pattern:**
```typescript
// e2e/nav.spec.ts
import { test, expect } from '@playwright/test'

test.describe('TopNav', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('desktop nav renders logo and CTA button', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByText('Kinetic Power').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Book a Session' }).first()).toBeVisible()
  })

  test('mobile: hamburger visible, nav links hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
  })

  test('mobile: overlay opens on hamburger click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Book a Session' }).last()).toBeVisible()
  })

  test('mobile: overlay closes on X button tap', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('button', { name: 'Close menu' }).click()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
  })
})
```

---

### `e2e/footer.spec.ts` (test, event-driven)

**Analog:** `/Users/travismader/Desktop/Pioneer/Family App 2.0/tests/e2e/walking-skeleton.spec.ts`

**Core pattern:**
```typescript
// e2e/footer.spec.ts
import { test, expect } from '@playwright/test'

const ROUTES = ['/', '/amenities', '/membership', '/schedule', '/contact']

test.describe('Footer', () => {
  for (const route of ROUTES) {
    test(`footer present on ${route}`, async ({ page }) => {
      await page.goto(route)
      // Footer nav links present (GLOB-03)
      await expect(page.getByRole('navigation', { name: 'Footer navigation' })).toBeVisible()
      // Social links present
      await expect(page.getByRole('link', { name: 'Instagram' })).toBeVisible()
    })
  }
})
```

---

## Shared Patterns

### Font utility classes
**Apply to:** All JSX/TSX files that render text.

| DESIGN.md role | Tailwind utility | Font | Notes |
|----------------|-----------------|------|-------|
| Display headings | `font-anton uppercase` | Anton | Always uppercase — DESIGN.md rule |
| Sub-headers / metrics | `font-barlow-condensed uppercase tracking-title` | Barlow Condensed | |
| Body text | `font-hanken-grotesk` | Hanken Grotesk | |
| Labels | `font-barlow-condensed uppercase tracking-label text-label-sm` | Barlow Condensed | |

### Button variants
**Apply to:** TopNav "Book a Session" CTA, Footer (no CTA — D-15), all future phase pages.

| Variant | Classes |
|---------|---------|
| Primary | `bg-primary-container text-on-primary-container font-anton uppercase rounded px-5 py-2 text-sm tracking-wider` |
| Secondary | `bg-transparent text-on-surface border-2 border-on-surface font-anton uppercase rounded px-5 py-2` |
| Ghost | `bg-transparent text-on-surface font-barlow-condensed uppercase hover:underline decoration-primary` |

### Container / max-width wrapper
**Apply to:** Every page section, TopNav inner div, Footer inner div.
```
max-w-[var(--spacing-container-max)] mx-auto px-[var(--spacing-margin-mobile)] md:px-[var(--spacing-margin-desktop)]
```

### Fixed nav offset
**Apply to:** All `<main>` elements in shell pages.
```
pt-16   /* offsets the fixed TopNav which is h-16 */
```

### Section spacing
**Apply to:** Section dividers within pages (Phase 2+).
```
py-[var(--spacing-xl)]   /* 80px top/bottom — DESIGN.md section-spacing */
```

---

## No Analog Found

All files in this phase have either a canonical Next.js App Router pattern (from RESEARCH.md) or a structural role-match in the sibling project. None require a human-verify checkpoint.

| File | Role | Reason |
|------|------|--------|
| `components/Footer.tsx` | component | No footer component exists in any sibling project. Pattern constructed from DESIGN.md D-12–D-15 + Next.js Server Component conventions. |

---

## Anti-Patterns (from RESEARCH.md — enforce during plan review)

| Anti-Pattern | Where It Bites | Correct Pattern |
|---|---|---|
| `import { motion } from 'framer-motion'` | `TopNav.tsx` | `import { motion, AnimatePresence } from 'motion/react'` |
| `'use client'` on `app/layout.tsx` | Root layout | Only `components/TopNav.tsx` gets `'use client'` |
| `@theme inline` omitted for font vars | `globals.css` | Wrap font `@theme` references in `@theme inline { }` block |
| `tailwind.config.ts` left in place after scaffold | Project root | Delete it — v4 is CSS-first only |
| Separate `--text-display-xl-mobile` token | `globals.css` | Use `text-display-xl` default + `md:text-[6rem]` override |
| `@tailwind base/components/utilities` (v3 syntax) | `globals.css` | Replace with `@import "tailwindcss"` |

---

## Metadata

**Analog search scope:** `/Users/travismader/Desktop/Pioneer/Upgrades web/` (empty), `/Users/travismader/Desktop/Pioneer/Family App 2.0/` (Vite/React sibling)
**Files scanned:** 8 source files in sibling project
**Pattern extraction date:** 2026-05-27
**Primary source for all canonical patterns:** `01-RESEARCH.md` (patterns from official Next.js, Tailwind v4, Motion docs)
