---
phase: 01
slug: foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-19
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework (unit/component)** | Vitest 2.x + `@testing-library/react-native` 13.x |
| **Framework (E2E mobile)** | Maestro (YAML-based, no native build changes) |
| **Framework (E2E web)** | Playwright (against Vercel preview URL, placeholder) |
| **Config file** | `vitest.config.ts`, `.maestro/*.yaml`, `playwright.config.ts` — Wave 0 installs |
| **Quick run command** | `npm run test:unit -- --run` |
| **Full suite command** | `npm run test:unit && npm run test:integration` |
| **Estimated runtime** | ~30 seconds (unit); ~5 min (full with Maestro E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit -- --run` (Vitest single-run, < 30s)
- **After every plan wave:** Run `npm run test:unit && npm run test:integration` (adds RLS + migration tests)
- **Before `/gsd:verify-work`:** Full Vitest + Maestro E2E + manual checklist green
- **Max feedback latency:** 30 seconds (unit), 5 minutes (wave gate)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-??-01 | 01 | 1 | FOUND-01 | — | App scaffold launches without crash | smoke | `eas build --profile development --platform ios --local` | ❌ Wave 0 | ⬜ pending |
| 01-??-02 | 01 | 1 | FOUND-02 | — | TypeScript strict passes | unit | `npx tsc --noEmit` | ❌ Wave 0 | ⬜ pending |
| 01-??-03 | 01 | 1 | FOUND-03 | — | Expo Router renders all routes | unit | `vitest run tests/unit/router.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 01-??-04 | 01 | 1 | FOUND-04 | — | NativeWind compiles dark theme | unit | `vitest run tests/unit/theme.test.tsx` | ❌ Wave 0 | ⬜ pending |
| 01-??-05 | 01 | 1 | FOUND-05 | — | EAS profiles validate | smoke | `eas build:configure --check` | ❌ Wave 0 | ⬜ pending |
| 01-??-06 | 01 | 2 | FOUND-06 | — | PowerSync local SQLite created | integration | `maestro test .maestro/powersync-init.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-07 | 01 | 2 | FOUND-07 | T-RLS-01 | RLS denies cross-user access | integration | `vitest run tests/integration/rls.test.ts` | ❌ Wave 0 | ⬜ pending |
| 01-??-08 | 01 | 3 | FOUND-08 | T-sess-01 | Session survives kill + relaunch | E2E | `maestro test .maestro/session-persistence.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-09 | 01 | 3 | FOUND-09 | — | OTA delivers only to compatible fingerprints | manual | document procedure in PLAN | manual-only | ⬜ pending |
| 01-??-10 | 02 | 2 | AUTH-01 | T-auth-01 | Sign up + sign in with email | E2E | `maestro test .maestro/auth-email.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-11 | 02 | 3 | AUTH-02 | T-auth-02 | Google OAuth completes | E2E (manual — real device) | `maestro test .maestro/auth-google.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-12 | 02 | 3 | AUTH-03 | T-auth-03 | Apple Sign-In completes | manual-only (Apple anti-automation) | document procedure | manual-only | ⬜ pending |
| 01-??-13 | 02 | 2 | AUTH-04 | — | Password reset link sent | unit + manual | `vitest run tests/unit/auth/reset.test.ts` + manual email check | ❌ Wave 0 | ⬜ pending |
| 01-??-14 | 02 | 3 | AUTH-05 | — | Change password from Settings | E2E | `maestro test .maestro/change-password.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-15 | 02 | 3 | AUTH-06 | — | SMS MFA enrolls + challenges | manual-only | document procedure | manual-only | ⬜ pending |
| 01-??-16 | 02 | 3 | AUTH-08 | T-sess-02 | Sign out clears session | E2E | `maestro test .maestro/sign-out.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-17 | 03 | 2 | NAV-01,02,03 | — | All 5 tabs render; active highlighted; offline nav works | E2E | `maestro test .maestro/tabs.yaml` (airplane mode toggle) | ❌ Wave 0 | ⬜ pending |
| 01-??-18 | 04 | 3 | ONBOARD-01–06 | — | Onboarding flow completable | E2E | `maestro test .maestro/onboarding.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-19 | 05 | 3 | DATA-01 | T-mig-01 | v1 migration produces v2 rows | integration | `vitest run tests/integration/migrate.test.ts` | ❌ Wave 0 | ⬜ pending |
| 01-??-20 | 05 | 3 | DATA-02 | T-mig-01 | Idempotent re-run safe | integration | same file, runs migration twice | ❌ Wave 0 | ⬜ pending |
| 01-??-21 | 05 | 3 | DATA-03 | — | v2 deploy URL parallel to v1 | manual | document procedure | manual-only | ⬜ pending |
| 01-??-22 | 03 | 2 | DESIGN-01 | — | Dark default + Settings toggle | E2E | `maestro test .maestro/theme-toggle.yaml` | ❌ Wave 0 | ⬜ pending |
| 01-??-23 | 03 | 3 | DESIGN-04 | — | 150ms transitions | manual / visual | document procedure | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `tests/unit/router.test.tsx` — Expo Router snapshot tests
- [ ] `tests/unit/theme.test.tsx` — NativeWind dark mode test
- [ ] `tests/unit/auth/reset.test.ts` — Password reset unit test
- [ ] `tests/integration/rls.test.ts` — Two-user RLS verification (requires test Supabase project or seeded local)
- [ ] `tests/integration/migrate.test.ts` — Migration function test against fixture v1 blob
- [ ] `.maestro/auth-email.yaml` — Email auth E2E flow
- [ ] `.maestro/auth-google.yaml` — Google OAuth E2E flow (real device)
- [ ] `.maestro/change-password.yaml` — Change password E2E
- [ ] `.maestro/sign-out.yaml` — Sign-out E2E
- [ ] `.maestro/tabs.yaml` — 5-tab navigation E2E (airplane mode toggle)
- [ ] `.maestro/onboarding.yaml` — Full onboarding flow E2E
- [ ] `.maestro/session-persistence.yaml` — Session survives kill + relaunch
- [ ] `.maestro/powersync-init.yaml` — PowerSync local SQLite init
- [ ] `.maestro/theme-toggle.yaml` — Dark mode toggle E2E
- [ ] `playwright.config.ts` — Web E2E config (placeholder)
- [ ] Framework install: `npm install --save-dev vitest @testing-library/react-native @vitest/browser` + `brew install maestro`
- [ ] `package.json` test scripts: `test:unit`, `test:integration`, `test:e2e`, `test:all`
- [ ] CI workflow `.github/workflows/test.yml` — runs Vitest + tsc on PR

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OTA updates only reach compatible fingerprints | FOUND-09 | Requires staged OTA + device matrix | Document procedure: publish OTA via `eas update`, verify older build does not receive incompatible update |
| Apple Sign-In completes end-to-end | AUTH-03 | Apple's automation-prevention makes Maestro unreliable; real device required | Sign in on physical iOS device; verify session created in Supabase dashboard |
| SMS MFA enrollment + challenge | AUTH-06 | SMS provider (Twilio/Vonage) required; cannot automate OTP receipt | Enable phone factor in Supabase dashboard; enroll a test number; verify challenge fires |
| v2 deploy URL works parallel to v1 | DATA-03 | Requires two live Supabase projects and manual DNS/URL verification | Document cutover procedure and verify v1 continues writing `user_state` while v2 reads from it |
| 150ms screen transitions (visual) | DESIGN-04 | No automated visual timing tool configured | Record transition with slow-motion camera or Maestro video; review frame count |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (created in 01-scaffold-init-PLAN.md Task 1)
- [x] No watch-mode flags
- [x] Feedback latency < 30s (unit)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-05-19
