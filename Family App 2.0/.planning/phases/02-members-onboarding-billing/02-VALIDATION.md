---
phase: 2
slug: members-onboarding-billing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.0 + @testing-library/react ^16.0.0 (unit/component) + Playwright ^1.60.0 (E2E) |
| **Config file** | `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts` (all exist from Phase 1) |
| **Quick run command** | `npx vitest run <pattern>` |
| **Full suite command** | `npm test` (Vitest) + `npm run test:e2e` (Playwright) |
| **Estimated runtime** | ~60s (unit) + ~120s (E2E) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run <changed-file-pattern>` + `npm run typecheck`
- **After every plan wave:** Run `npm test` (full Vitest) + targeted Playwright specs for that wave
- **Before `/gsd:verify-work`:** Full suite must be green (`npm test && npm run test:e2e`)
- **Max feedback latency:** ~60 seconds (unit), ~180 seconds (E2E)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | MEMB-07 | service-role-leak | trigger swallows errors, never blocks signup | integration | `npx vitest run tests/integration/handle-new-user.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | ONBD-03 | code-brute-force | 6-digit code one-time use + 7d expiry | integration | `npx vitest run tests/integration/claim-invite.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | MEMB-01/MEMB-02 | cross-family-read | RLS enforces family_id scope on members | integration | `npx vitest run tests/integration/handle-new-user.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | ONBD-05 | premium-gate-bypass | useTier returns premium during trial, free after expiry | unit | `npx vitest run src/data/useTier.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | MEMB-06 | acting-as-repudiation | actingAsId persists in sessionStorage, cleared on logout | unit | `npx vitest run src/auth/useActingAs.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | MEMB-01 | N/A | optimistic update + rollback on error | unit | `npx vitest run src/data/useUpsertMember.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | MEMB-04/MEMB-05 | N/A | form persists name/emoji/color/visible_sections | component | `npx vitest run src/components/members/AddEditMemberSheet.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | MEMB-05 | N/A | visible_sections filter hides nav tabs for children | component | `npx vitest run src/components/BottomNav.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 3 | MEMB-01 | N/A | member CRUD round trip in UI | E2E | `npx playwright test tests/members-crud.spec.ts` | ❌ W0 | ⬜ pending |
| 02-04-01 | 04 | 4 | ONBD-02 | service-role-leak | Edge Function uses service_role only server-side | integration | `npx vitest run tests/integration/invite-member.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 4 | ONBD-03 | N/A | /join route claim happy path | E2E | `npx playwright test tests/join-flow.spec.ts` | ❌ W0 | ⬜ pending |
| 02-05-01 | 05 | 5 | ONBD-04 | N/A | COPPA consent gate blocks child create without confirm | component | `npx vitest run src/components/members/CoppaConsentSheet.test.tsx` | ❌ W0 | ⬜ pending |
| 02-05-02 | 05 | 5 | ONBD-05/MEMB-01 | premium-gate-bypass | premium gate sheet blocks invite when trial expired | E2E | `npx playwright test tests/premium-gate.spec.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/integration/handle-new-user.test.ts` — stubs for MEMB-02, MEMB-07
- [ ] `tests/integration/claim-invite.test.ts` — stubs for ONBD-03
- [ ] `tests/integration/invite-member.test.ts` — stubs for ONBD-02
- [ ] `tests/members-crud.spec.ts` (Playwright) — stub for MEMB-01
- [ ] `tests/join-flow.spec.ts` (Playwright) — stub for ONBD-03
- [ ] `tests/premium-gate.spec.ts` (Playwright) — stub for ONBD-05
- [ ] `src/data/useTier.test.ts` — unit stubs for ONBD-05
- [ ] `src/data/useUpsertMember.test.ts` — unit stubs for MEMB-01, MEMB-03
- [ ] `src/auth/useActingAs.test.tsx` — unit stubs for MEMB-06
- [ ] `src/components/members/AddEditMemberSheet.test.tsx` — component stubs for MEMB-04
- [ ] `src/components/members/CoppaConsentSheet.test.tsx` — component stubs for ONBD-04
- [ ] `src/components/BottomNav.test.tsx` — extend for MEMB-05 (visible_sections)

*All test files are new (Wave 0 creates stubs; Wave N fills implementations).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Email invite arrives in inbox with correct link | ONBD-02 | Requires real SMTP / Supabase email delivery | Parent enters email on /members, tap Invite; check inbox for Supabase invite email within 2 min |
| `handle_new_user()` trigger links member row via Google OAuth | MEMB-02/MEMB-07 | Requires real Google OAuth flow in browser | Sign in fresh Google account whose email matches a pre-seeded member; verify member card shows linked avatar chip |
| RevenueCat webhook updates subscription_status | ONBD-05 | Requires RevenueCat → Supabase webhook in production | Trigger test event from RevenueCat dashboard; verify `family_settings.subscription_status` updates in Supabase Studio |
| Native Web Share sheet opens on mobile | ONBD-03 | Requires real device + Web Share API | Open /members on mobile Chrome/Safari; tap code copy button; verify share sheet appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s (unit), 180s (E2E)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
