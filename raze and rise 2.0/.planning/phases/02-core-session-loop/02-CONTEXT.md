# Phase 2: Core Session Loop - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers the complete active workout logging experience: starting a session, logging sets (with weight input, go/no-go, previous performance visible), rest timer auto-firing with background notification, secondary per-set actions (RPE, warm-up flag, notes), supersets, bodyweight exercise type, body map injury flagging, progressive overload suggestions, exercise swap, session-level notes, and the Anubis completion animation — all persisted offline via PowerSync.

**Out of scope for Phase 2:** Template editing, exercise library search, program builder, progress charts, history editing, notifications infrastructure (Phase 5), wearable sync.

</domain>

<decisions>
## Implementation Decisions

### Session Screen Structure
- **D-01:** Active session lives in a **dedicated full-screen route** (`app/session.tsx` or `app/(session)/index.tsx`). Tab bar is hidden during an active workout. Same full-screen stack precedent as onboarding.
- **D-02:** Exercises are laid out as **scrollable stacked cards** using FlashList (mandatory — FlatList causes JS thread spikes on dense set-row lists per STATE.md). One card per exercise, all visible, user scrolls vertically through the full workout.
- **D-03:** Session header is **minimal**: day label · elapsed timer · Complete Workout button. No volume counter or set completion progress in the header.

### Rest Timer UX
- **D-04:** Rest timer appears as a **floating bottom pill** — a persistent overlay above the bottom of the screen (not full-screen). The exercise list remains visible and scrollable behind it while the timer runs.
- **D-05:** Timer pill controls: **countdown display + Skip + ±30s buttons**. The ±30s buttons let the user adjust mid-rest without navigating away.
- **D-06:** At zero: **vibrate + sound, pill turns accent color (#F2CA50), auto-dismisses after 3 seconds**. No user action required to clear it.

### Set Row Interaction
- **D-07:** Weight input is an **inline editable text field, always visible** on each set row. Pre-filled with the previous session's weight. Tapping it opens the keyboard. No modal, no scroll picker.
- **D-08:** Secondary actions (RPE 1–10, warm-up flag, set note) surface via an **expand chevron per set row**. Tapping the chevron expands an inline form below the row with an RPE slider, warm-up toggle, and note text field.
- **D-09:** Previous performance shown as **muted text below the weight input**: `185 lbs · ✓✓✓✗` (last session weight · go/no-go dots). Tapping it auto-fills the current weight input.
- **D-10:** Go/No-Go toggle follows the PracticeSetCard pattern from Phase 1: null → go → no-go → null. Tap "✓ Go" or "✗ No-go" buttons. Light haptic on each tap.

### Completion & Anubis Flow
- **D-11:** Tapping "Complete Workout" → **Anubis Lottie animation immediately full-screens** (no confirmation dialog, no summary screen). Session is committed to PowerSync history during the animation. After the animation completes, the app fades to the Dashboard.
- **D-12:** Anubis is implemented as a **Lottie animation** (`lottie-react-native`) loaded from a JSON asset in `assets/animations/anubis.json`. Plays once, no loop.
- **D-13:** After Anubis, the split **rotation pointer advances** and the Dashboard reflects the next day's workout.

### Claude's Discretion
- Exact exercise card visual design (spacing, typography hierarchy within the card) — follow NativeWind design tokens established in Phase 1
- Superset scroll behavior implementation details (auto-scroll to paired exercise after marking a set)
- Body map injury UI (muscle group tap targets — standard anatomical front/back view)
- WORKOUT-13 (Run exercise GPS) — implement the Settings toggle and Apple Health pull; device GPS fallback is lower priority

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/STATE.md` — Accumulated decisions, blockers, and project context (FlashList mandate, PowerSync listener pattern, design token rules)
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `.planning/REQUIREMENTS.md` — WORKOUT-01 through WORKOUT-18, DESIGN-02, DESIGN-03

### Existing Components (Phase 1)
- `src/components/PracticeSetCard/index.tsx` — Go/No-Go toggle pattern, haptics, set row visual structure to replicate and extend
- `src/components/Button/index.tsx` — Primary/ghost button variants
- `src/components/Chip/index.tsx` — Used for quick-tag notes (easy, hard, good form, bad form, pain)
- `src/components/ProgressBar/index.tsx` — Reanimated animated width pattern (reuse for timer countdown bar if needed)

### Data Layer
- `src/lib/powersync.ts` — getPowerSync() export, PowerSync instance for local DB writes
- `src/lib/supabase.ts` — Supabase client

### Phase 1 Screen Patterns
- `app/(onboarding)/practice-set.tsx` — Full-screen route pattern, no tab bar
- `app/(tabs)/index.tsx` — TanStack Query usage pattern, __DEV__ helpers

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PracticeSetCard` — Go/No-Go toggle state machine (null → go → no-go → null) can be extracted into a reusable hook `useSetResult`
- `Chip` component — already built; use for quick-tag set notes (easy, hard, good form, bad form, pain)
- `ProgressBar` — Reanimated `withTiming` animated width available for timer countdown visualization
- `OnboardingStepLayout` — Full-screen layout shell pattern; session screen needs its own layout but same safe-area approach

### Established Patterns
- **FlashList is mandatory** for any list with dense set rows — FlatList causes JS thread spikes (STATE.md blocker)
- **NativeWind className** for all styling — hex values only for ActivityIndicator color, placeholderTextColor, and Animated.View style (documented in STATE.md)
- **PowerSync + TanStack Query** — data reads via TanStack Query with PowerSync as the local source; writes go through PowerSync SQL
- **Haptics** — `Haptics.impactAsync(Light)` for taps, `Haptics.notificationAsync(Success)` for completions

### Integration Points
- Session starts from the Workouts tab (`app/(tabs)/workouts.tsx` — currently a placeholder)
- Session route receives today's template (day label, exercises, sets, rep ranges) from PowerSync
- On Complete: advances `split_settings.rotation_pointer` + inserts into `sessions` + `session_sets` tables
- Rotation pointer advance must be idempotent (session UUID generated client-side before session starts — DATA-02)

</code_context>

<specifics>
## Specific Ideas

- **Whoop/Strong aesthetic (DESIGN-02):** Dark, data-dense, serious athlete feel. Exercise cards should be compact — not card-with-heavy-padding lifestyle UI. Information density is a feature.
- **Anubis from v1:** The Anubis animation exists in v1 (`raze-and-rise.vercel.app`). The v1 implementation should be referenced for the animation asset; convert to Lottie JSON for v2.
- **Timer pill position:** Sits above the Complete Workout button at the bottom of the session screen. When no timer is active, the pill is hidden entirely (not a placeholder space).
- **Previous performance tap-to-fill:** Tapping the muted "185 lbs · ✓✓✓✗" text auto-fills the current session's weight input for that set with the previous value.

</specifics>

<deferred>
## Deferred Ideas

- Post-workout summary screen (PRs broken, total volume, go-rate) — user chose to go straight to Dashboard after Anubis; a summary screen can be added in Phase 3 or Phase 6 (Polish)
- Confirmation dialog before completing a workout — user chose no confirmation; can be added as a Settings toggle in Phase 6 if needed
- WORKOUT-13 Run exercise GPS fallback (device GPS) — device GPS toggle is lower priority; implement Apple Health pull first

</deferred>

---

*Phase: 2-core-session-loop*
*Context gathered: 2026-05-20*
