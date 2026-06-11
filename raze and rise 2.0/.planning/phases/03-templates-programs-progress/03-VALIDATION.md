---
phase: 3
slug: 03-templates-programs-progress
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-10
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 (unit + integration), Maestro (e2e) |
| **Config file** | `package.json` scripts; `tests/integration/` dir |
| **Quick run command** | `npm run test:unit` (`vitest run`) |
| **Full suite command** | `npm run test:all` |
| **Estimated runtime** | ~30 seconds (unit); ~90 seconds (all) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:all`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-T1 | 03-01 | 0 | all | T-03-SC | Schema migrations run without data loss; RLS isolates rows by user_id | manual | `supabase db push` | ❌ W0 | ⬜ pending |
| 03-01-T2 | 03-01 | 0 | PROGRESS-03 | — | Volume bucketing pure function tested RED | unit | `vitest run src/lib/__tests__/volumeBucket.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-T3 | 03-01 | 0 | GAMIFY-01/03 | — | Badge rules + streak math tested RED | unit | `vitest run src/lib/__tests__/badgeRules.test.ts src/lib/__tests__/streak.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-T4 | 03-01 | 0 | TEMPLATE-02 | — | Exercise search predicate tested RED | unit | `vitest run src/lib/__tests__/exerciseSearch.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-T1 | 03-02 | 1 | TEMPLATE-01/02/03 | — | Template CRUD persists via PowerSync; exercise search uses `muscle_group` | unit | `vitest run src/lib/__tests__/exerciseSearch.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-T2 | 03-02 | 1 | TEMPLATE-05/06/07 | — | Template builder saves set config + edit/delete work | unit | `npm run test:unit` | ✅ | ⬜ pending |
| 03-03-T1 | 03-03 | 1 | PROGRESS-01/05 | — | Overview stats aggregate correctly | unit | `vitest run src/lib/__tests__/sessionStats.test.ts` | ✅ (Phase 2 — extend) | ⬜ pending |
| 03-03-T2 | 03-03 | 1 | HISTORY-01/02/03 | — | History edit writeTransaction is atomic | integration | `vitest run tests/integration/historyEdit.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-T3 | 03-03 | 1 | GAMIFY-03 | — | Streak counter increments + breaks on missed week | unit | `vitest run src/lib/__tests__/streak.test.ts` | ❌ W0 | ⬜ pending |
| 03-04-T1 | 03-04 | 2 | PROGRESS-02/03/04 | — | Charts render with empty + populated data; volume buckets match test | unit | `vitest run src/lib/__tests__/volumeBucket.test.ts` | ❌ W0 | ⬜ pending |
| 03-05-T1 | 03-05 | 2 | PHOTO-01/02/03 | — | Photo uploads to correct Storage path; metadata row created | integration | `vitest run tests/integration/photoUpload.test.ts` | ❌ W0 | ⬜ pending |
| 03-06-T1 | 03-06 | 2 | GAMIFY-01/03 | — | Badge milestones fire once on exact threshold | unit | `vitest run src/lib/__tests__/badgeRules.test.ts` | ❌ W0 | ⬜ pending |
| 03-07-T1 | 03-07 | 3 | PROGRAM-02 | T-03-P2 | Edge Function validates JWT before calling Claude; never leaks API key | integration | Deno test for `generate-program` Edge Function | ❌ W0 | ⬜ pending |
| 03-07-T2 | 03-07 | 3 | PROGRAM-01/03/04/05/06/07 | — | Program week-advance and deload weight reduction correct | unit | `npm run test:unit` | ✅ | ⬜ pending |
| 03-08-T1 | 03-08 | 3 | TEMPLATE-04 | — | App never calls ExerciseDB live; all media served from Supabase Storage | manual | check `exercises` table + network log | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Supabase migration files for `programs`, `program_weeks`, `progress_photos`, `badges`, `user_stats` tables
- [ ] Fix `measurements` table — add `measured_at`, `hips_cm`, `arms_cm`, `thighs_cm`, `notes` columns
- [ ] Fix `template_exercises` table — add `exercise_type` column; update PowerSync `schema.ts`
- [ ] Fix latent bug: `useSessionData.ts` orders measurements by `logged_at` → rename to `measured_at`
- [ ] Fix latent bug: `ExerciseSwapModal` reads `primary_muscle` → update to `muscle_group`
- [ ] EAS dev build with `@shopify/react-native-skia`, `expo-video`, `expo-image-picker` (via `npx expo install` for SDK 55 pins)
- [ ] Bundle Manrope TTF font asset for Victory Native XL `useFont` loader
- [ ] RED test stubs: `exerciseSearch.test.ts`, `volumeBucket.test.ts`, `badgeRules.test.ts`, `streak.test.ts`, `historyEdit.test.ts`, `photoUpload.test.ts`
- [ ] `supabase db push` completes without error (BLOCKING gate before Wave 1)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI program generation returns valid week grid | PROGRAM-02 | Requires live Anthropic API call via Edge Function | Deploy Edge Function, invoke with test payload, verify structured week-array JSON |
| Progress photos upload + display | PHOTO-01–03 | Requires device camera/gallery + Supabase Storage | Upload photo on device; verify in Supabase Storage at `progress-photos/{user_id}/`; confirm timeline display |
| ExerciseDB GIF/video playback in template builder | TEMPLATE-04 | Requires native media component on device | Open exercise detail in template builder; verify media loads from Supabase Storage (not ExerciseDB CDN) |
| Badge toast fires after AnubisOverlay completes | GAMIFY-01 | Requires full session completion flow on device | Complete a session that hits a badge milestone; verify toast appears post-animation, not during |
| EAS dev build succeeds with all native deps | (all) | Native modules require build step | Run `eas build --profile development --platform ios`; confirm successful |
| Deload weight reduction shown at 60–70% | PROGRAM-07 | Requires active deload state on device | Enable deload; open session with active template; verify suggested weights are 60–70% of normal |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
