# Phase 3: Templates, Programs & Progress - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 delivers the engagement layer *between* sessions: a full template management system (browse, create, edit, delete) in the Workouts tab; a searchable exercise library with ExerciseDB demo videos; multi-week program building (manual + AI-generated via Claude); deload detection and manual override; the Progress tab rebuilt with segment navigation (Overview | Charts | Photos | Achievements); per-exercise progression and volume charts using Victory Native XL; measurement history charts; progress photos with before/after comparison; editable workout history; and gamification (badges + streak counter). Challenges (GAMIFY-02) are deferred to Phase 6.

**Out of scope for Phase 3:** Premium gating (Phase 4), AI coach chat (Phase 4), wearable sync (Phase 5), push notifications infrastructure (Phase 5), template sharing links (Phase 6), challenges (GAMIFY-02, Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Workouts Tab Restructure
- **D-01:** Template management lives in the **Workouts tab** (not Split tab). The tab becomes the primary surface for browsing, creating, and editing templates.
- **D-02:** Workouts tab layout: **Today's workout card + Start button at the top**, then the full template list scrolls below. Today's template is visually distinguished in the list (e.g., "Today" badge or highlighted border).
- **D-03:** Template builder opens as a **full-screen route** (`app/template-builder/[id].tsx` pattern — same as the session screen). No modal/sheet.
- **D-04:** Exercise search is **inline within the template builder** screen: search bar at the top, muscle group Chip filters below it (Chest, Back, Legs, Shoulders, Arms, Core), results list below. Tapping an exercise adds it to the template. No separate modal layer.

### Progress Tab Layout
- **D-05:** Progress tab uses **horizontal segment tabs** within the screen: Overview | Charts | Photos | Achievements. The segment row sits at the top; content below swaps based on active segment.
- **D-06:** **Overview segment** (default): stats row at top (total workouts, current weekly streak, go-rate %, lifetime PRs count) + scrollable recent sessions list below (date, day label, go-rate per session).
- **D-07:** **Charts segment**: exercise picker dropdown at the top → weight progression chart (Victory Native XL) + volume bar chart below it → date range segmented control (30d / 90d / 1y / All time). Measurement history chart (weight, body fat) is a separate section below the exercise charts.
- **D-08:** **History editing entry point**: tapping a session row in the Overview recent sessions list opens a detail/edit view where user can change weights, go/no-go, add/remove exercises, edit notes. Edits sync to Supabase via PowerSync and are reflected in charts immediately.

### AI Program Generation
- **D-09:** Phase 3 implements the **real Claude API call** for AI program generation — ungated, no premium check. The Supabase Edge Function is built and working. Phase 4 adds the premium gate on top without rebuilding the Edge Function.
- **D-10:** Programs live in the **Split tab** alongside split type, phase (Hypertrophy/Strength/Power), and rotation controls. A "Programs" section within Split tab has "Create manually" and "Generate with AI" CTAs.
- **D-11:** AI program **review flow**: Claude returns the program structure → a review screen shows it as a week-by-week grid (Week 1: Push / Pull / Legs / Rest / ...) → user taps **Accept** (applies immediately, program goes active), **Regenerate** (same inputs, new Claude call), or **Edit** (opens manual program builder pre-filled with the generated structure).

### Gamification
- **D-12:** Phase 3 ships **badges (GAMIFY-01) + streak counter (GAMIFY-03) only**. Challenge system (GAMIFY-02) is deferred to Phase 6 — it requires timed goal tracking, opt-in enrollment flow, and automated progress polling that exceeds Phase 3 scope.
- **D-13:** Badge **unlock notification**: after the Anubis animation completes and the session is committed, if a milestone was hit, a short animated toast/banner appears ("100 workouts! Badge unlocked."). One-time display, no push notification.

### Claude's Discretion
- Badge and streak counter placement in the UI (segment choice between Achievements in Progress vs. Dashboard header flame icon — planner/researcher decide based on screen real estate)
- ExerciseDB video embed approach (YouTube embed vs. direct video player vs. GIF — follow the cache-first strategy: seed to Supabase Storage at build time)
- Exact template card visual design within the Workouts tab list
- Deload suggestion UI surface (Dashboard banner vs. prompt on session start — either works)
- Progress photo upload UX (camera capture vs. gallery picker vs. both)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/STATE.md` — Accumulated decisions, blockers, cross-cutting constraints (FlashList mandate, PowerSync listener pattern, NativeWind hex exceptions, ExerciseDB cache-first strategy)
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, and requirement list
- `.planning/REQUIREMENTS.md` — TEMPLATE-01 through TEMPLATE-09, PROGRAM-01 through PROGRAM-07, PROGRESS-01 through PROGRESS-05, HISTORY-01 through HISTORY-03, PHOTO-01 through PHOTO-03, GAMIFY-01, GAMIFY-03

### Phase 2 Context (prior decisions to carry forward)
- `.planning/phases/02-core-session-loop/02-CONTEXT.md` — Session screen patterns, FlashList mandate, NativeWind rules, PowerSync atomicity, design token decisions

### Existing Components (reuse in Phase 3)
- `src/components/ExerciseSwapModal/index.tsx` — Exercise search pattern (adapt for template builder inline search)
- `src/components/Chip/index.tsx` — Muscle group filter chips in template builder search
- `src/components/ExerciseCard/index.tsx` — Exercise card pattern to extend for template builder view
- `src/components/SetRow/index.tsx` + `src/components/SetRow/ExpandedSetForm.tsx` — Set configuration pattern for template builder set/rep/rest config
- `src/components/SupersetPair/index.tsx` — Superset pairing UI to reuse in template builder
- `src/components/ProgressBar/index.tsx` — Reanimated animated width pattern
- `src/components/Button/index.tsx` — Primary/ghost button variants
- `src/components/AnubisOverlay/index.tsx` — Post-session animation; badge toast fires after this

### Data Layer
- `src/lib/powersync.ts` — getPowerSync() export; use writeTransaction() for all session edits
- `src/lib/supabase.ts` — Supabase client for Storage (progress photos) and Edge Functions (AI program gen)

### External APIs
- **ExerciseDB / RapidAPI** — 10 req/day free tier; seed exercise library to Supabase at build time. Never call live during a session or on app launch. Cache-first strategy mandatory.
- **Victory Native XL** — chart library for weight progression and volume charts (locked in PROGRESS-02)
- **Claude API via Supabase Edge Function** — `@anthropic-ai/sdk` must never run client-side (Hermes runtime); all AI calls go through Edge Functions (AI-01)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ExerciseSwapModal` — Already has exercise search by name + muscle category grouping. The template builder inline search can reuse this logic without the modal wrapper.
- `Chip` — Built and styled; use for muscle group filter chips in template builder search
- `SupersetPair` — Superset UI already exists from Phase 2; reuse in template builder for pairing exercises
- `SetRow` + `ExpandedSetForm` — Set configuration UI pattern to adapt for template builder (sets, rep range low/high, rest override, exercise type)
- `ProgressBar` + Reanimated `withTiming` — Available for any progress visualization in the gamification system

### Established Patterns
- **FlashList is mandatory** for template list, exercise search results, recent sessions list, and any dense scrollable list (FlatList causes JS thread spikes — STATE.md blocker)
- **Full-screen routes** for complex multi-step flows (session screen, onboarding — now template builder follows the same pattern)
- **PowerSync writeTransaction()** for all multi-table writes — history edits (exercises + sets) must be atomic
- **NativeWind className** for all styling; hex style= exceptions: `placeholderTextColor="#99907C"`, `#F2CA50` accent, `#0A0A0B` bg for ActivityIndicator, SVG fills, `fontVariant: ['tabular-nums']`
- **TanStack Query + PowerSync** for reactive data reads

### Integration Points
- Workouts tab (`app/(tabs)/workouts.tsx`) — currently minimal; needs full restructure to template list + Today's card
- Progress tab (`app/(tabs)/progress.tsx`) — currently placeholder; builds out entirely in Phase 3
- Split tab (`app/(tabs)/split.tsx`) — gets Programs section added (Create manually / Generate with AI)
- Session complete flow (`app/(session)/index.tsx`) — badge unlock toast fires after AnubisOverlay completes
- Supabase Edge Function — new function for AI program generation; follow the proxy pattern established by AI-01

</code_context>

<specifics>
## Specific Ideas

- **ExerciseDB videos:** Cache-first is mandatory (10 req/day free tier). Seed the built-in exercise library to Supabase at build time. Never call ExerciseDB live during a session or on demand in the app.
- **AI program gen ungated in Phase 3:** The Edge Function is built, tested, and callable. Phase 4 adds `if (!isPremium) return 402` to the Edge Function without other changes.
- **Program review week grid:** Shows the full multi-week structure at a glance. Accept applies it immediately — the split rotation switches to program-guided. Edit drops into manual builder pre-filled with Claude's output.
- **Badge toast:** Fires after AnubisOverlay animation completes (after `router.replace('/(tabs)/')`) — not during it. One badge toast max per session.
- **Deload suggestion:** Auto-detects after N weeks (default 4) in the same phase. Manual override toggle in Split settings. When active, weights shown at 60–70% of normal — no separate "deload workout" screen needed.
- **Apply for Garmin + Whoop developer access during this phase** — 2–4 week approval lead time required before Phase 5 Terra API work. This is a non-blocking parallel track.

</specifics>

<deferred>
## Deferred Ideas

- **Challenges (GAMIFY-02)** — timed opt-in goals (e.g., "30 workouts in 30 days") deferred to Phase 6 (Polish). Requires timed goal tracking, enrollment flow, and automated progress polling.
- **Template sharing links (TEMPLATE-08)** — generate shareable link for a template; recipient can import it. Deferred to Phase 6 per roadmap.
- **Admin bulk upload (TEMPLATE-09)** — admin panel Excel/JSON/CSV template upload. Deferred to Phase 6.

</deferred>

---

*Phase: 3-templates-programs-progress*
*Context gathered: 2026-05-27*
