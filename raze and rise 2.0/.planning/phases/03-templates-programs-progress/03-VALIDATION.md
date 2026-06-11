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
| **Framework** | Jest (via Expo / React Native Testing Library) |
| **Config file** | `jest.config.js` (or `package.json` jest key) |
| **Quick run command** | `npx jest --testPathPattern=src/__tests__` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=src/__tests__`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 3-W0-schema | W0 | 0 | TEMPLATE-01–07, PROGRESS-02–04 | — | Schema migrations run without data loss | manual | `supabase db push` | ❌ W0 | ⬜ pending |
| 3-W0-skia | W0 | 0 | PROGRESS-02 | — | EAS dev build succeeds with Skia + media | manual | EAS build | ❌ W0 | ⬜ pending |
| 3-templates | 01 | 1 | TEMPLATE-01–07 | — | Template CRUD persists via PowerSync | unit | `npx jest --testPathPattern=template` | ❌ W0 | ⬜ pending |
| 3-exercise-library | 02 | 1 | TEMPLATE-02–04 | — | Exercise search returns from local cache only | unit | `npx jest --testPathPattern=exercise` | ❌ W0 | ⬜ pending |
| 3-programs | 03 | 2 | PROGRAM-01–07 | — | Program weeks advance correctly | unit | `npx jest --testPathPattern=program` | ❌ W0 | ⬜ pending |
| 3-ai-edge-fn | 04 | 2 | PROGRAM-02 | — | Edge function validates JWT before calling Claude | manual | `supabase functions invoke generate-program` | ❌ W0 | ⬜ pending |
| 3-progress-charts | 05 | 2 | PROGRESS-01–05 | — | Charts render with empty + populated data | unit | `npx jest --testPathPattern=progress` | ❌ W0 | ⬜ pending |
| 3-history-edit | 06 | 2 | HISTORY-01–03 | — | History edits are atomic via writeTransaction | unit | `npx jest --testPathPattern=history` | ❌ W0 | ⬜ pending |
| 3-photos | 07 | 3 | PHOTO-01–03 | — | Photos upload to correct Storage path | manual | device + Supabase dashboard | ❌ W0 | ⬜ pending |
| 3-badges | 08 | 3 | GAMIFY-01, GAMIFY-03 | — | Badge unlocks fire once on exact milestone | unit | `npx jest --testPathPattern=badge` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Supabase migration files for `programs`, `program_weeks`, `progress_photos`, `badges`, `user_stats` tables
- [ ] Fix `measurements` table — add `measured_at`, `hips_cm`, `arms_cm`, `thighs_cm`, `notes` columns
- [ ] Fix `template_exercises` table — add `exercise_type` column
- [ ] Fix latent bug: `useSessionData.ts` queries `ORDER BY logged_at` but column is `measured_at`
- [ ] PowerSync `schema.ts` updated to mirror all new/fixed tables
- [ ] EAS dev build with `@shopify/react-native-skia`, `expo-video`, `expo-image-picker` (all via `npx expo install` for SDK 55 pins)
- [ ] `npx expo install victory-native @shopify/react-native-skia expo-video expo-image-picker expo-image-manipulator` — SDK-55 versions

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AI program generation returns valid week grid | PROGRAM-02 | Requires live Anthropic API call via Edge Function | Deploy Edge Function, call with test payload, verify structured response |
| Progress photos upload + display | PHOTO-01–03 | Requires device camera/gallery + Supabase Storage | Upload photo on device, verify in Supabase Storage bucket, confirm display in app |
| ExerciseDB video/GIF playback in template builder | TEMPLATE-04 | Requires native video/image component on device | Open exercise detail in template builder, verify media loads from cached URL |
| Badge toast fires after AnubisOverlay completes | GAMIFY-01 | Requires full session completion flow | Complete a session that hits a badge milestone, verify toast appears post-animation |
| EAS dev build succeeds with all native deps | (all) | Native modules require build — not testable in Jest | Run `eas build --profile development --platform ios`, confirm build succeeds |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
