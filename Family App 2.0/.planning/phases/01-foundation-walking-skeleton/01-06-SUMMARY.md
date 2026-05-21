---
phase: 01-foundation-walking-skeleton
plan: "06"
subsystem: infra
tags: [vite-plugin-pwa, workbox, service-worker, pwa, vercel, playwright, e2e]

requires:
  - phase: 01-05
    provides: Family creation wizard and full app shell with real Supabase backend

provides:
  - vite-plugin-pwa with injectManifest strategy wired into the build
  - precache-only service worker (src/sw.ts) — scaffold for Phase 6 push handlers
  - PWA icons (192x192, 512x512, 512x512-maskable) as lavender placeholder PNGs
  - PWA manifest served at /manifest.webmanifest with Family Hub branding
  - vercel.json with SPA rewrites + SW-safe cache headers
  - Updated E2E walking-skeleton test with Apple + Google sign-in assertions and skip guard

affects: [phase-06-push-notifications, deployment, ci-smoke-tests]

tech-stack:
  added:
    - vite-plugin-pwa@^1.3.0
    - workbox-precaching@^7.4.0
    - workbox-routing@^7.4.0
  patterns:
    - injectManifest strategy (custom src/sw.ts compiled by VitePWA at build time)
    - PWA precache-only in Phase 1; push handlers deferred to Phase 6
    - vercel.json Cache-Control max-age=0 on /sw.js to prevent stale SW at CDN edge
    - PLAYWRIGHT_BASE_URL env var pattern for Vercel preview URL smoke tests

key-files:
  created:
    - src/sw.ts
    - public/icons/192.png
    - public/icons/512.png
    - public/icons/512-maskable.png
    - public/favicon.svg
    - vercel.json
  modified:
    - vite.config.ts
    - package.json
    - package-lock.json
    - tests/e2e/walking-skeleton.spec.ts

key-decisions:
  - "injectManifest strategy chosen (not generateSW) because Phase 6 needs custom push/notificationclick handlers in the SW"
  - "devOptions.enabled: false to prevent SW interfering with HMR in development (Pitfall 4)"
  - "No registerRoute/fetch handlers in Phase 1 SW — precache-only avoids Supabase response caching creating stale-auth (Pitfall 10)"
  - "registerType: autoUpdate + cleanupOutdatedCaches + clients.claim mitigates stuck-SW risk after deploy (T-06-02, T-06-06)"
  - "Icons generated as solid lavender (#c9a8e0) PNGs via Node.js raw PNG writer — ImageMagick not available; Phase 6 will refine icon design"
  - "RevenueCat replaces Stripe as billing layer — Task 6.4 smoke test step 9 (Stripe customer ID check) is obsolete and will not be verified"
  - "E2E test asserts both Sign in with Apple and Sign in with Google per App Store two-button requirement"

patterns-established:
  - "PWA build: vite.config.ts VitePWA plugin with strategies: injectManifest, filename: sw.ts"
  - "Service worker: import precacheAndRoute + cleanupOutdatedCaches from workbox-precaching only; Phase 6 extends"
  - "Vercel SPA deploy: vercel --prod from /Users/travismader/Desktop/Pioneer (NOT inside project folder)"
  - "E2E smoke tests: PLAYWRIGHT_BASE_URL=<preview-url> npm run test:e2e targets Vercel preview"

requirements-completed: [ARCH-04]

duration: 35min
completed: 2026-05-21
---

# Phase 1 Plan 6: PWA + Vercel Config + E2E Smoke Test Summary

**vite-plugin-pwa with injectManifest strategy wired, precache-only service worker scaffolded, vercel.json shipping SPA rewrites + SW-safe cache headers, E2E test updated with Apple + Google sign-in assertions**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-05-21T03:25:00Z
- **Completed:** 2026-05-21T04:01:35Z
- **Tasks:** 3 of 4 completed autonomously (Task 6.4 is the human-verify gate)
- **Files modified:** 10

## Accomplishments

- vite-plugin-pwa 1.3.0 installed and wired with `strategies: 'injectManifest'` — `dist/sw.js` and `dist/manifest.webmanifest` emitted on every production build
- Precache-only `src/sw.ts` service worker created — no push/notificationclick handlers (Phase 6 territory); mitigates T-06-01 (no Supabase response caching), T-06-02 (stale SW), T-06-06 (stuck SW)
- `vercel.json` created with SPA rewrites + `/sw.js` no-cache headers + `Service-Worker-Allowed: /` header
- E2E walking-skeleton test updated to assert Apple + Google sign-in buttons, login card copy, and full authenticated shell path (guarded by `test.skip(!PLAYWRIGHT_GOOGLE_AUTH)`)
- Local E2E run: 1 passed (unauthenticated), 1 skipped (authenticated gate)

## Task Commits

1. **Task 6.1: vite-plugin-pwa + src/sw.ts + PWA icons** - `caf701c` (feat)
2. **Task 6.2: vercel.json** - `67b5dd9` (feat)
3. **Task 6.3: E2E test update** - `091a077` (feat)

## Files Created/Modified

- `vite.config.ts` - Added VitePWA plugin with injectManifest strategy, PWA manifest config
- `src/sw.ts` - Precache-only service worker (workbox-precaching); Phase 6 extends with push handlers
- `public/icons/192.png` - PWA icon 192x192, solid lavender (#c9a8e0) placeholder
- `public/icons/512.png` - PWA icon 512x512, solid lavender (#c9a8e0) placeholder
- `public/icons/512-maskable.png` - PWA icon 512x512 maskable variant
- `public/favicon.svg` - Lavender rounded square with F lettermark
- `vercel.json` - SPA rewrites (all paths -> /index.html), SW cache headers
- `package.json` - Added vite-plugin-pwa, workbox-precaching, workbox-routing
- `tests/e2e/walking-skeleton.spec.ts` - Full spec: unauthenticated + authenticated (gated)

## Decisions Made

- **RevenueCat replaces Stripe**: Task 6.4 smoke test step 9 ("Stripe sanity: confirm families.stripe_customer_id populated") is obsolete. RevenueCat is the billing layer — do not verify Stripe customer ID creation.
- **Icons as Node-generated PNGs**: ImageMagick not available on dev machine. Generated valid RGB PNGs with Node.js zlib/raw-PNG writer. Solid lavender background, no text (text rendering requires native deps). Phase 6 will refine.
- **'push' in comment is acceptable**: src/sw.ts contains the word "push" in a Phase 6 forward-reference comment. The file contains no push event listener registration. The plan's intent (no Push API handlers) is met.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Environment] Used Node.js PNG writer instead of ImageMagick for icons**
- **Found during:** Task 6.1 (icon generation)
- **Issue:** ImageMagick (`convert` and `magick` commands) not available; `node-canvas` and `sharp` not installed
- **Fix:** Generated valid PNG files using Node.js built-in `zlib` module with raw PNG format (RGB, no compression artifacts). Lavender (#c9a8e0) solid fill, correct dimensions (192x192, 512x512)
- **Files modified:** public/icons/192.png, 512.png, 512-maskable.png
- **Verification:** `file` command confirms valid PNG format at correct dimensions
- **Committed in:** caf701c (Task 6.1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — image tool unavailable)
**Impact on plan:** Icons are functional placeholder PNGs, valid for PWA install. Design refinement deferred to Phase 6.

## Issues Encountered

- **Port 5173 conflict during E2E run**: First E2E test run connected to a Raze & Rise dev server that was running on port 5173 (Playwright `reuseExistingServer: true`). After killing the conflicting process, the Family Hub dev server started correctly and the E2E test passed.

## User Setup Required — Task 6.4 Human Smoke Test Gate

Task 6.4 is the human-verify checkpoint that closes Phase 1. The automated executor stops here.

### Deploy Step

Run from the **parent directory** (not inside the project folder — see Project Memory):
```bash
cd /Users/travismader/Desktop/Pioneer
vercel --prod
```

Vercel's `rootDirectory` setting points at `Family App 2.0/` — running from inside doubles the path.

### Vercel Environment Variables to Add

In Vercel Dashboard -> Project Settings -> Environment Variables (add to Preview + Production):
| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Copy from `.env.local` |
| `VITE_SUPABASE_ANON_KEY` | Copy from `.env.local` |
| `VITE_VAPID_PUBLIC_KEY` | Leave blank for Phase 1; set in Phase 6 |

### Supabase OAuth Redirect URL Update

After deploy, add the preview URL pattern to:
- Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs
- Google Cloud Console -> OAuth Client -> Authorized JavaScript Origins

Pattern: `https://family-hub-2-*.vercel.app/*`

### E2E Smoke Test Against Preview

```bash
PLAYWRIGHT_BASE_URL=<your-vercel-preview-url> npm run test:e2e -- tests/e2e/walking-skeleton.spec.ts
```

The unauthenticated test must pass. The authenticated test requires `PLAYWRIGHT_GOOGLE_AUTH=true` plus a stored auth state at `tests/.auth/user.json`.

### Task 6.4 Verification Checklist

1. DevTools -> Application -> Service Workers: worker registered, source `/sw.js`, status "activated and running"
2. DevTools -> Application -> Manifest: name "Family Hub", display "standalone", icons present, theme_color #c9a8e0
3. Chrome install prompt visible (address bar install icon)
4. iOS Safari: Share -> Add to Home Screen -> icon + "Family Hub" name appears
5. Full sign-in flow: `/` -> `/login` -> Google OAuth -> wizard (if no family) -> `/dashboard`
6. All 6 BottomNav tabs functional (Home, Chores, Calendar, Meals, Groceries, Notes)
7. Offline banner appears when network throttled to offline
8. Reconnected toast appears (~3s) when network restored
9. ~~Stripe customer ID check~~ — **SKIP THIS STEP: RevenueCat is the billing layer, not Stripe**
10. Playwright unauthenticated test passes against the preview URL

Type "approved" when all checks pass to close Phase 1.

## Known Stubs

None introduced in this plan. Icons are placeholder quality but are valid PWA icons — they serve the functional purpose (PWA install eligibility) and will be refined in Phase 6.

## Next Phase Readiness

- Phase 1 Foundation & Walking Skeleton is complete pending human smoke test (Task 6.4)
- Phase 6 (Push Notifications) will extend `src/sw.ts` by adding `push` and `notificationclick` event listeners
- The `workbox-routing` package was installed alongside workbox-precaching — available for Phase 6 runtime caching if needed (currently unused per Pitfall 10)
- ARCH-04 delivered: vite-plugin-pwa injectManifest custom service worker in place

---
*Phase: 01-foundation-walking-skeleton*
*Completed: 2026-05-21*
