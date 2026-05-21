---
phase: 2
slug: core-session-loop
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.6 |
| **Config file** | `vitest.config.ts` (exists — `environment: 'node'`) |
| **Quick run command** | `npm run test:unit` |
| **Full suite command** | `npm run test:all` |
| **Estimated runtime** | ~15 seconds (unit only) |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:unit`
- **After every plan wave:** Run `npm run test:all`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-set-result-01 | set-row | 1 | WORKOUT-03 | — | N/A | unit | `npm run test:unit -- tests/unit/useSetResult.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-session-stats-01 | set-row | 1 | WORKOUT-05 | — | Warm-up sets excluded from go-rate | unit | `npm run test:unit -- tests/unit/sessionStats.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-timer-01 | rest-timer | 1 | WORKOUT-06 | — | N/A | unit | `npm run test:unit -- tests/unit/useRestTimer.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-superset-01 | superset | 2 | WORKOUT-11 | — | N/A | unit | `npm run test:unit -- tests/unit/supersetLogic.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-overload-01 | session | 2 | WORKOUT-14 | — | N/A | unit | `npm run test:unit -- tests/unit/progressiveOverload.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-session-commit-01 | session | 2 | WORKOUT-17 | T-02-01 | writeTransaction wraps session + rotation pointer | unit (mock PS) | `npm run test:unit -- tests/unit/sessionService.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-session-persist-01 | session | 2 | WORKOUT-18 | — | N/A | unit | `npm run test:unit -- tests/unit/sessionPersistence.test.ts` | ❌ Wave 0 | ⬜ pending |
| 02-anubis-01 | completion | 2 | DESIGN-03 | T-02-02 | anubis.json must not contain `expressions` field | manual | — | Manual audit | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/unit/useSetResult.test.ts` — stubs for WORKOUT-03 (go/no-go state machine: null → go → no-go → null)
- [ ] `tests/unit/sessionStats.test.ts` — stubs for WORKOUT-05 (warm-up exclusion from go-rate totals)
- [ ] `tests/unit/useRestTimer.test.ts` — stubs for WORKOUT-06 (schedule notification on set complete; cancel on skip)
- [ ] `tests/unit/supersetLogic.test.ts` — stubs for WORKOUT-11 (superset round complete → timer fires only after both sets marked)
- [ ] `tests/unit/progressiveOverload.test.ts` — stubs for WORKOUT-14 (overload hint shown when all sets completed at current weight)
- [ ] `tests/unit/sessionService.test.ts` — stubs for WORKOUT-17 (writeTransaction covers session, session_sets, split_settings.rotation_pointer)
- [ ] `tests/unit/sessionPersistence.test.ts` — stubs for WORKOUT-18 (MMKV session metadata written on start, cleared on complete)
- [ ] Acquire `assets/animations/anubis.json` — Lottie JSON asset; blocks AnubisOverlay. Audit for `"expressions"` before committing.
- [ ] Acquire `assets/sounds/timer-complete.wav` — timer tone; blocks RestTimerPill audio feedback

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Anubis animation plays once and navigates to Dashboard | DESIGN-03 | Lottie `onAnimationFinish` callback cannot be meaningfully mocked in Vitest node environment | Start a session, complete all sets, tap Complete Workout — verify Anubis plays once, fades to Dashboard |
| Rest timer notification fires when app is backgrounded | WORKOUT-06 | expo-notifications background delivery requires a physical device; cannot test in emulator or node | Start a set timer, background the app, wait for notification — verify notification appears on lock screen at timer zero |
| Vibration fires at rest timer zero | WORKOUT-06 | Haptics/vibration API has no testable output in node env | On device: confirm device vibrates when countdown reaches 0 |
| Superset auto-scroll to paired exercise | WORKOUT-11 | FlashList `scrollToIndex` is a UI behavior — no DOM in node env | Log set A in a superset pair — verify FlashList scrolls to exercise B card |
| Keep-awake active during session | WORKOUT-15 | `expo-keep-awake` affects OS screen-off behavior; not observable in tests | Start a session, leave phone idle — verify screen stays on beyond normal timeout |
| Body map muscle tap records injury | WORKOUT-16 | SVG `Pressable` interaction in React Native — not testable in Vitest node env | Tap a muscle group on body map — verify it highlights and session notes record the injury |
| MMKV session data survives app kill and relaunch | WORKOUT-18 | Requires process kill and restart on a real device | Start a session, force-kill the app, reopen — verify the in-progress session is restored |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
