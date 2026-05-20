---
phase: 01-foundation-walking-skeleton
plan: 01
subsystem: project-scaffold
tags: [vite, react19, typescript, vitest, playwright, css-variables, theme]
status: complete

dependency_graph:
  requires:
    - "Node.js + npm on PATH"
    - "CLAUDE.md pinned stack versions"
  provides:
    - "package.json with all Phase 1 pinned dependencies"
    - "Vite 8 SPA entry point at src/main.tsx"
    - "CSS variable theme system (Lavender + Midnight)"
    - "src/lib/env.ts, newId.ts, check.ts utility modules"
    - "Vitest + Playwright wired and configured"
    - "RED test stubs in tests/unit/, tests/integration/, tests/e2e/"
  affects:
    - "All downstream plans — build foundation they compile against"
    - "Plan 01-02 — schema.test.ts + rls-isolation.test.ts will turn GREEN after db push"
    - "Plan 01-03 — allowlist.test.ts added there; router.test.tsx turns GREEN after auth"
    - "Plan 01-06 — walking-skeleton.spec.ts E2E turns GREEN after PWA deploy"

tech_stack:
  added:
    - "react@^19.2.0 + react-dom@^19.2.0"
    - "react-router@^7.15.0 (data mode)"
    - "@tanstack/react-query@^5.100.0 + devtools"
    - "@supabase/supabase-js@^2.106.0"
    - "vite@^8.0.0 + @vitejs/plugin-react@^4.5.0"
    - "typescript@^5.7.0"
    - "vitest@^3.0.0 + @testing-library/react@^16.0.0 + msw@^2.7.0"
    - "playwright@^1.50.0"
  patterns:
    - "CSS custom properties in :root for theme tokens (Lavender + Midnight)"
    - "crypto.randomUUID() for client-side ID generation (src/lib/newId.ts)"
    - "import.meta.env type-safe wrapper (src/lib/env.ts)"

key_files:
  created:
    - path: "package.json"
      role: "Pinned dependency manifest for entire Phase 1 stack"
    - path: "vite.config.ts"
      role: "Vite 8 SPA config with @vitejs/plugin-react"
    - path: "tsconfig.json + tsconfig.node.json"
      role: "Strict TypeScript config targeting ES2022"
    - path: "index.html"
      role: "SPA shell with #root mount point"
    - path: "src/main.tsx"
      role: "Entry point — StrictMode wrapper, stub 'Loading...' until Plan 04 mounts RouterProvider"
    - path: "src/styles/globals.css"
      role: "CSS reset + layout primitives"
    - path: "src/theme/theme.css"
      role: "CSS variable theme tokens — Lavender (default) + Midnight, ported from v1"
    - path: "src/lib/env.ts"
      role: "Type-safe import.meta.env accessor"
    - path: "src/lib/newId.ts"
      role: "crypto.randomUUID() wrapper for client-side UUID generation"
    - path: "src/lib/check.ts"
      role: "Invariant assertion utility"
    - path: "vitest.config.ts"
      role: "Vitest config — jsdom environment, globals, test include patterns"
    - path: "vitest.setup.ts"
      role: "Testing Library jest-dom matchers setup"
    - path: "playwright.config.ts"
      role: "Playwright config — localhost:5173 base URL"
    - path: "tests/unit/router.test.tsx"
      role: "RED stub — turns GREEN in Plan 03/04 when router is wired"
    - path: "tests/unit/queryClient.test.ts"
      role: "RED stub — turns GREEN in Plan 04a when QueryClient ships"
    - path: "tests/unit/offline-banner.test.tsx"
      role: "RED stub — turns GREEN in Plan 04b when OfflineBanner ships"
    - path: "tests/unit/luxon-trial.test.ts"
      role: "RED stub — turns GREEN in Plan 05 when luxon is used"
    - path: "tests/unit/error-boundary.test.tsx"
      role: "RED stub — turns GREEN in Plan 04a when ErrorBoundary ships"
    - path: "tests/integration/schema.test.ts"
      role: "RED stub — turns GREEN after Plan 02 pushes schema"
    - path: "tests/integration/rls-isolation.test.ts"
      role: "RED stub — turns GREEN after Plan 02 + 03 are wired"
    - path: "tests/e2e/walking-skeleton.spec.ts"
      role: "RED Playwright E2E stub — turns GREEN in Plan 06 after PWA deploy"

decisions:
  - "Electric theme variant dropped (not in CLAUDE.md — Lavender + Midnight only)"
  - "src/main.tsx renders a stub 'Loading...' div until Plan 04 mounts RouterProvider"
  - "Client-side UUID via crypto.randomUUID() per CLAUDE.md spec (no uuid package needed)"

metrics:
  duration_minutes: 25
  tasks_completed: 3
  tasks_total: 3
  files_created: 20
  files_modified: 0
  commits_added: 3
  completed: "2026-05-20T15:10:00Z"
---

# Phase 1 Plan 01: Project Scaffold Summary

**One-liner:** Bootstrapped Family Hub 2.0 with the full pinned stack (React 19, Vite 8, TypeScript strict, React Router v7, TanStack Query v5, Supabase client), ported the v1 CSS variable theme system, and planted RED test stubs that downstream plans will turn GREEN.

## What Was Built

### Task 1 — Vite + React 19 + TypeScript scaffold
`package.json` pinned to every version in CLAUDE.md's stack table. `vite.config.ts`, `tsconfig.json` (strict, ES2022, path aliases), `index.html` SPA shell, `src/main.tsx` entry with a stub "Loading Family Hub 2.0…" div — Plan 04 replaces this with `RouterProvider`. `src/vite-env.d.ts` for Vite types.

### Task 2 — CSS variable theme system + shared utilities
`src/styles/globals.css` — CSS reset and flex layout primitives. `src/theme/theme.css` — full set of CSS custom properties ported from v1 for Lavender (default) and Midnight themes. Electric variant dropped as specified in CLAUDE.md.

`src/lib/env.ts` — `getEnv()` typed wrapper around `import.meta.env` that throws at startup if required keys are missing. `src/lib/newId.ts` — `crypto.randomUUID()` wrapper supporting optimistic update IDs without a UUID package. `src/lib/check.ts` — invariant assertion for defensive programming.

### Task 3 — Vitest + Playwright + RED test stubs
`vitest.config.ts` wired to jsdom environment with Testing Library. `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`. `playwright.config.ts` targeting `http://localhost:5173`.

Seven RED test stubs planted:
- `tests/unit/router.test.tsx` — expects `createBrowserRouter` export
- `tests/unit/queryClient.test.ts` — expects singleton QueryClient export
- `tests/unit/offline-banner.test.tsx` — expects OfflineBanner component
- `tests/unit/luxon-trial.test.ts` — expects luxon DateTime formatting
- `tests/unit/error-boundary.test.tsx` — expects ErrorBoundary component
- `tests/integration/schema.test.ts` — expects Supabase tables to exist
- `tests/integration/rls-isolation.test.ts` — expects RLS to block cross-family reads
- `tests/e2e/walking-skeleton.spec.ts` — Playwright smoke: title, login UI, unauthed redirect

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| All CLAUDE.md stack packages installed at pinned versions | PASS |
| TypeScript strict mode, ESM-native | PASS |
| src/main.tsx mounts stub "Loading…" component | PASS |
| CSS variable theme system (Lavender + Midnight) | PASS — Electric dropped per spec |
| Vitest configured + running | PASS |
| Playwright configured | PASS |
| RED test stubs for all downstream plans | PASS — 8 stubs across unit/integration/e2e |
| No Electric theme variant | PASS |

## Deviations from Plan

None material. The E2E stub (`tests/e2e/walking-skeleton.spec.ts`) was the last file created, completed by the orchestrator after a transient 529 API overload cut off the executor at the very end.

## Commits

| Commit | Task | Files |
|--------|------|-------|
| e83b13d | feat(01-01): scaffold Vite + React 19 + TS strict project | package.json, vite.config.ts, tsconfig.*, index.html, src/main.tsx, src/vite-env.d.ts, .env.example, .gitignore, .npmrc |
| 69fcead | feat(01-01): port v1 CSS theme + shared utility modules | src/styles/globals.css, src/theme/theme.css, src/lib/env.ts, src/lib/newId.ts, src/lib/check.ts |
| 8a4491e | feat(01-01): add Vitest + Playwright config and RED test stubs | vitest.config.ts, vitest.setup.ts, playwright.config.ts, tests/* (8 files) |

## Self-Check

- File `package.json` — FOUND
- File `vite.config.ts` — FOUND
- File `src/main.tsx` — FOUND (StrictMode + stub div)
- File `src/theme/theme.css` — FOUND (CSS variables)
- File `src/lib/newId.ts` — FOUND (crypto.randomUUID)
- File `vitest.config.ts` — FOUND
- File `playwright.config.ts` — FOUND
- File `tests/e2e/walking-skeleton.spec.ts` — FOUND
- Commits e83b13d, 69fcead, 8a4491e — FOUND in git log

## Self-Check: PASSED
