---
phase: 01-foundation
created: 2026-05-27
status: draft
---

# Walking Skeleton — Phase 01 Foundation

The thinnest end-to-end slice of the Kinetic Power website. After Plan 01 ships, a real user (the developer or stakeholder) can visit a Vercel preview URL on their phone and see all five routes resolve as dark-themed shell pages with Anton/Barlow Condensed/Hanken Grotesk fonts loaded. No nav, no footer yet — those are subsequent vertical slices in Plans 02 and 03.

## Architectural Decisions (locked by this skeleton)

These decisions are committed by the Walking Skeleton and will NOT be renegotiated in later phases unless an explicit re-architecture phase is run.

### Framework
- **Next.js 16.x App Router** (CLAUDE.md, CONTEXT.md, RESEARCH.md)
- `app/` directory only — no `pages/` directory ever
- All pages are React Server Components by default
- TypeScript is the only language; no plain `.js` files in `app/` or `components/`

### Styling
- **Tailwind CSS v4** with `@import "tailwindcss"` (single directive)
- `@theme` block in `app/globals.css` is the ONLY place design tokens are defined
- Token names mirror DESIGN.md verbatim (e.g. `--color-background`, `--color-primary-container`, `--color-surface-container-low`) — no aliases
- `next/font/google` injects font CSS variables; `@theme inline` resolves them
- No `tailwind.config.ts` — Tailwind v4 is CSS-first. If create-next-app generates one, delete it.

### Directory Layout
```
kinetic-power-web/
├── app/
│   ├── globals.css           # @import "tailwindcss" + @theme block
│   ├── layout.tsx            # Root layout: font injection + slots for TopNav/Footer
│   ├── page.tsx              # / shell
│   ├── amenities/page.tsx    # /amenities shell
│   ├── membership/page.tsx   # /membership shell
│   ├── schedule/page.tsx     # /schedule shell
│   └── contact/page.tsx      # /contact shell
├── components/               # TopNav (Plan 02), Footer (Plan 03) — empty in skeleton
├── lib/
│   └── fonts.ts              # next/font/google definitions
├── e2e/                      # Playwright tests (Plan 02 + 03 populate)
├── public/                   # Static assets
├── postcss.config.mjs        # { plugins: { "@tailwindcss/postcss": {} } }
├── next.config.ts            # Default from scaffold
├── playwright.config.ts      # Added in Plan 02
├── tsconfig.json             # Default from scaffold (baseUrl + @/* alias)
├── package.json
└── README.md
```

### Database / Backend
- **None in Phase 01 — Phase 05 only.** No Sanity install, no GROQ queries, no API routes.
- No `next-sanity` package, no Studio route, no environment variables for Sanity.

### Auth
- **None.** Public marketing site with no protected routes.

### Deployment
- **Vercel** via **GitHub integration** (D-03) — not Vercel CLI manual deploys
- GitHub repo: `kinetic-power-web` under developer's personal account (D-01)
- Vercel project under developer's personal account (D-02)
- Auto-deploy on push to `main`; preview URL per branch / PR
- Production URL pattern: `https://kinetic-power-web.vercel.app` (or assigned hash)

### Animation
- **Motion** package (`motion/react` import path) — used only in `components/TopNav.tsx` in Plan 02
- No animation library elsewhere

### Testing
- **Playwright** for E2E (added in Plan 02 — Wave 0 task within Plan 02)
- `e2e/` directory at project root
- Tests run against `http://localhost:3000` locally, `process.env.PLAYWRIGHT_BASE_URL` in CI
- `npm run build` is the per-task TS/build sanity check

### Constraints downstream phases inherit
- All pages remain Server Components unless they explicitly need client interactivity
- `'use client'` is allowed only on individual leaf components (e.g. nav, future forms) — never on `app/layout.tsx` or any `app/**/page.tsx`
- All UI must reference DESIGN.md tokens through Tailwind utilities — no inline hex codes
- All copy is hardcoded in Phases 1–4; Sanity wires in Phase 5

## What the Skeleton Delivers

After Plan 01 ships and is deployed to Vercel:

1. A live URL exists (Vercel auto-assigned preview/production)
2. Visiting `/`, `/amenities`, `/membership`, `/schedule`, `/contact` all return HTTP 200
3. Each page renders a dark `#131313` background body
4. Each page renders its title heading in Anton uppercase (e.g. "HOME", "AMENITIES")
5. Fonts (Anton, Barlow Condensed, Hanken Grotesk) load from self-hosted next/font output — no `fonts.googleapis.com` network requests in the browser
6. `npm run build` succeeds with zero TypeScript errors
7. Code lives in a public/private GitHub repo named `kinetic-power-web`
8. Push to `main` triggers Vercel auto-deploy

## What the Skeleton Does NOT Deliver (and why)

- **TopNav** — Plan 02 (separate slice because it adds client-side interactivity and Motion)
- **Footer** — Plan 03 (separate slice because it has its own layout and content surface)
- **E2E tests** — Plan 02 introduces Playwright + nav tests; Plan 03 adds footer + smoke tests
- **Lighthouse manual check** — phase gate after Plan 03 ships, on the deployed Vercel preview URL
