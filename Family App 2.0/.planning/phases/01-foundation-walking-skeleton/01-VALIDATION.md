---
phase: 1
slug: foundation-walking-skeleton
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 (unit/integration) + Playwright 1.60 (E2E) |
| **Config file** | `vitest.config.ts` + `playwright.config.ts` — both created in Wave 0 |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run && npm run test:e2e` |
| **Estimated runtime** | ~15s (unit) + ~60s (E2E smoke) |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run --changed`
- **After every plan wave:** Run `npm test -- --run && npm run lint && npm run build`
- **Before `/gsd:verify-work`:** Full suite green + Playwright smoke on Vercel preview URL + manual checks for realtime + Stripe
- **Max feedback latency:** 15 seconds (unit only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-xx-01 | schema | 1 | ARCH-01 | Cross-tenant read | RLS blocks family_id mismatch | integration | `npm test -- tests/integration/rls-isolation.test.ts` | ❌ Wave 0 | ⬜ pending |
| 1-xx-02 | scaffold | 1 | ARCH-02 | — | N/A | unit | `npm test -- tests/unit/router.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 1-xx-03 | data layer | 1 | ARCH-03 | — | N/A | unit | `npm test -- tests/unit/queryClient.test.ts` | ❌ Wave 0 | ⬜ pending |
| 1-xx-04 | pwa | 2 | ARCH-04 | SW caches auth responses | Phase 1 SW is precache-only; no fetch handlers | smoke | `npm run build && test -f dist/sw.js && test -f dist/manifest.webmanifest` | ❌ Wave 0 | ⬜ pending |
| 1-xx-05 | schema | 1 | ARCH-05 | — | All tables have RLS enabled | integration | `npm test -- tests/integration/schema.test.ts` | ❌ Wave 0 | ⬜ pending |
| 1-xx-06 | schema | 1 | ARCH-06 | — | N/A | integration | included in `schema.test.ts` | ❌ Wave 0 | ⬜ pending |
| 1-xx-07 | realtime | 2 | ARCH-07 | Realtime channel hijack | RLS enforced server-side on postgres_changes | manual+E2E | `npm run test:e2e -- realtime-bridge` | ❌ Wave 0 | ⬜ pending |
| 1-xx-08 | routing | 1 | ARCH-08 | — | N/A | unit | `npm test -- tests/unit/error-boundary.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 1-xx-09 | offline | 2 | ARCH-09 | — | N/A | unit | `npm test -- tests/unit/offline-banner.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 1-xx-10 | stripe | 3 | ARCH-10 | Webhook replay/spoofing | Stripe signature + shared secret on DB webhook | integration | `supabase functions invoke stripe-create-customer --no-verify-jwt` with fixture | ❌ Wave 0 | ⬜ pending |
| 1-xx-11 | schema | 1 | ARCH-11 | — | N/A | integration | included in `schema.test.ts` | ❌ Wave 0 | ⬜ pending |
| 1-xx-12 | data layer | 2 | ARCH-13 | — | N/A | unit | `npm test -- tests/unit/luxon-trial.test.ts` | ❌ Wave 0 | ⬜ pending |
| 1-xx-13 | e2e | 4 | ONBD-01 | Open redirect | `redirectTo` uses `window.location.origin` only | E2E | `npm run test:e2e -- walking-skeleton.spec.ts` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — vitest + jsdom + setup file reference
- [ ] `vitest.setup.ts` — `@testing-library/jest-dom` import
- [ ] `playwright.config.ts` — points at preview URL via `PLAYWRIGHT_BASE_URL` env
- [ ] `tests/unit/router.test.tsx` — covers ARCH-02 + ARCH-08
- [ ] `tests/unit/queryClient.test.ts` — covers ARCH-03 + ARCH-09 (paused mutations)
- [ ] `tests/unit/offline-banner.test.tsx` — covers ARCH-09 UI
- [ ] `tests/unit/luxon-trial.test.ts` — covers ARCH-13
- [ ] `tests/integration/schema.test.ts` — covers ARCH-01, ARCH-05, ARCH-06, ARCH-11
- [ ] `tests/integration/rls-isolation.test.ts` — covers ARCH-01 strict cross-family isolation
- [ ] `tests/e2e/walking-skeleton.spec.ts` — covers ONBD-01 end-to-end smoke
- [ ] `package.json` scripts: `test`, `test:e2e`, `lint`, `build`, `preview`, `db:push`, `db:types`, `functions:deploy`
- [ ] Framework install: `vitest@^4 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25 playwright@^1.60 @playwright/test@^1.60 msw@^2.14`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Realtime bridge invalidates queries on Supabase INSERT | ARCH-07 | Requires live Supabase + WebSocket — cannot mock in unit tests cost-effectively in Phase 1 | Open app on two browser tabs; insert a row directly via Supabase Studio; verify both tabs refresh without page reload |
| Stripe customer is created on family INSERT | ARCH-10 | Requires live Stripe + Supabase Edge Function pair | Create a family in the app; check Stripe Dashboard for new Customer with metadata `family_id` |
| Stripe webhook delivers `customer.subscription.updated` | ARCH-10 | Requires Stripe → Supabase network path | Use Stripe Dashboard "Send test webhook" to fire `customer.subscription.updated`; verify Edge Function logs receipt |
| Theme persists across family devices | ARCH-08 (family_settings) | Requires two sign-in sessions | Set theme on one device; sign in on another; verify same theme loads |
| iOS PWA install path | ARCH-04 | iOS Safari required | Open on iPhone Safari; verify manifest is recognized; Add to Home Screen; verify app opens in standalone mode |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
