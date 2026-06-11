# Phase 3: Templates, Programs & Progress - Research

**Researched:** 2026-06-10
**Domain:** React Native (Expo SDK 55 bare) data-dense UI — charts, media, offline-first CRUD, server-side AI generation
**Confidence:** HIGH (libraries, schema, PowerSync patterns) / MEDIUM (ExerciseDB field exactness, Anthropic structured-output runtime in Deno)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Workouts Tab Restructure**
- **D-01:** Template management lives in the **Workouts tab** (not Split tab).
- **D-02:** Workouts tab layout: **Today's workout card + Start button at top**, then template list scrolls below; today's template visually distinguished.
- **D-03:** Template builder opens as a **full-screen route** (`app/template-builder/[id].tsx`). No modal/sheet.
- **D-04:** Exercise search is **inline within the template builder**: search bar at top, muscle group Chip filters below, results list below. No separate modal layer.

**Progress Tab Layout**
- **D-05:** Progress tab uses **horizontal segment tabs**: Overview | Charts | Photos | Achievements.
- **D-06:** **Overview segment** (default): stats row (total workouts, current weekly streak, go-rate %, lifetime PRs count) + scrollable recent sessions list.
- **D-07:** **Charts segment**: exercise picker dropdown → weight progression chart (Victory Native XL) + volume bar chart → date range segmented control (30d / 90d / 1y / All). Measurement history chart is a separate section below.
- **D-08:** **History editing entry point**: tapping a session row in Overview opens a detail/edit view; edits sync via PowerSync and reflect in charts immediately.

**AI Program Generation**
- **D-09:** Phase 3 implements the **real Claude API call** for AI program generation — ungated, no premium check. Supabase Edge Function built and working. Phase 4 adds the premium gate on top.
- **D-10:** Programs live in the **Split tab** alongside split type, phase, rotation controls. A "Programs" section with "Create manually" and "Generate with AI" CTAs.
- **D-11:** AI program **review flow**: Claude returns the structure → review screen shows week-by-week grid → user taps **Accept** (applies immediately), **Regenerate** (same inputs, new call), or **Edit** (opens manual builder pre-filled).

**Gamification**
- **D-12:** Phase 3 ships **badges (GAMIFY-01) + streak counter (GAMIFY-03) only**. GAMIFY-02 (challenges) deferred to Phase 6.
- **D-13:** Badge **unlock notification**: after Anubis completes and session is committed, if a milestone was hit, a short animated toast appears. One-time display, no push.

### Claude's Discretion
- Badge and streak counter placement (Achievements segment vs. Dashboard header flame icon).
- ExerciseDB video embed approach (video player vs. GIF) — follow cache-first: seed to Supabase Storage at build time.
- Exact template card visual design within the Workouts tab list.
- Deload suggestion UI surface (Dashboard banner vs. session-start prompt). *(UI-SPEC resolves: Workouts tab placement below TodayCard.)*
- Progress photo upload UX (camera capture vs. gallery picker vs. both).

### Deferred Ideas (OUT OF SCOPE)
- **Challenges (GAMIFY-02)** — timed opt-in goals. Phase 6.
- **Template sharing links (TEMPLATE-08)** — shareable link + import. Phase 6.
- **Admin bulk upload (TEMPLATE-09)** — admin Excel/JSON/CSV upload. Phase 6.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEMPLATE-01 | Create template: day label + exercises from library | Template builder route + `templates`/`template_exercises` writes via `writeTransaction()` (Architecture Pattern 4) |
| TEMPLATE-02 | Curated built-in library, searchable by name/muscle group | `exercises` table seeded (36 exist; expand via ExerciseDB seed); `usePowerSyncQuery` LIKE filter (Code Example 2) |
| TEMPLATE-03 | Custom exercises scoped to account | `exercises.is_custom=1`, `created_by=userId` (pattern already in migrate-v1 function) |
| TEMPLATE-04 | Demo video/GIF from ExerciseDB | Cache-first seed to Supabase Storage; `expo-video` `VideoView` thumbnail (Standard Stack + Pattern 5) |
| TEMPLATE-05 | Sets, rep range, exercise type, rest override, superset pairing | Reuse Phase 2 `SetRow`/`ExpandedSetForm`/`SupersetPair`; **schema gap: `template_exercises.exercise_type` missing** (Schema Gaps) |
| TEMPLATE-06 | Edit template; no retroactive change to sessions | Sessions snapshot `exercise_name` already; template edits are independent rows (HISTORY isolation) |
| TEMPLATE-07 | Delete template; clear matching active session | Soft delete `templates.is_deleted=1`; check MMKV active session match |
| PROGRAM-01 | Manual multi-week program: name, weeks, template-per-week, deload flag | **Schema gap: `programs` + `program_weeks` tables needed** (Schema Gaps) |
| PROGRAM-02 | AI-generated program via Claude | Supabase Edge Function `generate-program` (Pattern 6, AI section) |
| PROGRAM-03 | Active program auto-advances week-over-week | `programs.current_week` increment in `completeSession` writeTransaction |
| PROGRAM-04 | Split phase system (Hypertrophy/Strength/Power) retained, shown in Split tab | `split_settings.phase` already exists (Phase 1 schema) |
| PROGRAM-05 | Deload detection after N weeks (default 4) | `split_settings.weeks_in_phase` already exists; MMKV `deload_suggested` flag (UI-SPEC) |
| PROGRAM-06 | Manual deload toggle overrides auto | `split_settings.deload_active` already exists |
| PROGRAM-07 | Deload mode reduces suggested weights to 60–70% | Extend Phase 2 `ProgressiveOverloadHint` to apply 0.65 multiplier |
| PROGRESS-01 | Total workouts, streak, go-rate %, PR grid | `usePowerSyncQuery` aggregates; reuse `sessionStats.computeGoRate` (Code Example 4) |
| PROGRESS-02 | Weight progression chart, date-range filterable | Victory Native XL `CartesianChart` + `Line` (Pattern 1) |
| PROGRESS-03 | Volume bar chart (sets × weight per week) | Victory Native XL `CartesianChart` + `Bar` (Pattern 2) |
| PROGRESS-04 | Measurement history timestamped + plotted | **Schema gap: PowerSync `measurements` table missing most columns** (Schema Gaps) |
| PROGRESS-05 | Recent workouts list: date, day label, go-rate | `usePowerSyncQuery` on `sessions` JOIN `session_sets`; FlashList |
| HISTORY-01 | View all completed sessions in scrollable list | `usePowerSyncQuery` sessions WHERE completed_at NOT NULL; FlashList |
| HISTORY-02 | Fully edit any completed session | `writeTransaction()` multi-table edit (Pattern 3, Pitfall 4) |
| HISTORY-03 | Edits synced + reflected in charts immediately | PowerSync reactive queries re-fire on local write (no extra wiring) |
| PHOTO-01 | Upload/take date-stamped photo to Supabase Storage | `expo-image-picker` + `expo-image-manipulator` + Storage upload (Pattern 7) |
| PHOTO-02 | Chronological timeline view | **Schema gap: `progress_photos` table needed** (Schema Gaps); FlashList grid |
| PHOTO-03 | Two-date side-by-side comparison | Read two storage URLs; `ProgressPhotoComparison` modal |
| GAMIFY-01 | Achievement badges for milestones | **Schema gap: `badges` table needed**; milestone check in `completeSession` (Pattern 8) |
| GAMIFY-03 | Weekly streak counter on Dashboard + Progress | Compute from `sessions.completed_at` (Code Example 5) |
</phase_requirements>

## Summary

Phase 3 is the largest phase by surface area but builds almost entirely on the Phase 1/2 foundation already in the repo: PowerSync local SQLite, `usePowerSyncQuery` reactive reads, `writeTransaction()` atomic writes, FlashList, NativeWind tokens, and the Edge Function proxy pattern. The four genuinely new technical capabilities are (1) **charts** via Victory Native XL, which pulls in `@shopify/react-native-skia` as a hard new native dependency; (2) **media** via `expo-video` (demo videos) and `expo-image-picker`/`expo-image-manipulator` (progress photos to Supabase Storage); (3) a second **Supabase Edge Function** that calls Claude to generate a structured program; and (4) several **new database tables** that do not yet exist (`programs`, `program_weeks`, `progress_photos`, `badges`) plus column additions to `template_exercises` and the PowerSync `measurements` mirror.

The single biggest planning risk is **schema drift**: the current `src/lib/schema.ts` PowerSync mirror omits columns the UI-SPEC and requirements assume exist (full measurement columns, `template_exercises.exercise_type`), and there are no tables at all for programs, photos, or badges. A schema-migration plan (new Supabase migration + matching PowerSync `schema.ts` update + RLS policies in the same migration) must be Wave 0 of this phase, before any feature plan can read or write. The second risk is **Skia native compatibility** — Victory Native XL requires Skia and a TTF font loaded via `useFont`, and Skia is a New-Architecture-sensitive native module requiring an EAS dev build rebuild (it will not appear in the existing JS bundle via OTA).

**Primary recommendation:** Make schema + native-deps the first wave. Install `victory-native@41` + `@shopify/react-native-skia@2.6.x` + `expo-video` + `expo-image-picker` + `expo-image-manipulator`, bundle one TTF font for chart axes, and rebuild the EAS dev client before any chart/media feature plan. Use Victory Native XL's `CartesianChart` with `{ x, y }`-shaped numeric data (dates pre-converted to numeric timestamps). Build the `generate-program` Edge Function with the existing `esm.sh` import + JWT-validation pattern from `migrate-v1-user`, returning a Zod-validated structured program. Detect badge milestones inside the existing `completeSession` `writeTransaction` against cheap running counters — never scan full history per session.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Template browse/create/edit/delete | Client (PowerSync local) | Supabase (sync target) | Offline-first CRUD; writes go to local SQLite then sync via WAL |
| Exercise library search | Client (PowerSync local) | — | Seeded data lives locally; search is a local LIKE query, never a network call |
| ExerciseDB demo videos | CDN/Storage (Supabase Storage) | Build-time seed script | Cache-first mandate — videos served from Storage, ExerciseDB never called at runtime |
| Progress charts | Client (Skia render) | PowerSync local (data) | Pure client-side render of locally-queried data |
| Measurement history | Client (PowerSync local) | Supabase | Same offline-first read/write as workout data |
| Progress photo capture | Client (expo-image-picker) | Supabase Storage (upload) | Capture is native client; persistence is Storage (binary, not PowerSync) |
| Progress photo metadata | Client (PowerSync local) | Supabase | Photo row (user_id, date, storage path) is relational — PowerSync table |
| History editing | Client (writeTransaction) | Supabase | Atomic multi-table local write, syncs up |
| AI program generation | API/Backend (Edge Function) | Anthropic API | Claude SDK MUST NOT run on Hermes (D-09 / AI-01) — Edge Function only |
| Program week advancement | Client (writeTransaction) | Supabase | Pointer increment co-committed with session completion |
| Badge milestone detection | Client (writeTransaction) | Supabase | Computed at session-commit time against running counters |
| Deload detection | Client (MMKV flag + split_settings) | — | UI hint in MMKV; authoritative toggle in `split_settings` |

## Standard Stack

### Core (NEW for Phase 3)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `victory-native` | `41.26.0` | All charts (line, bar) | Locked by PROGRESS-02; "Victory Native XL" is the v40+ Skia-based rewrite — the current standard for performant RN charts `[VERIFIED: npm registry]` `[ASSUMED]` (registry-confirmed; not via Context7) |
| `@shopify/react-native-skia` | `2.6.4` (use latest 2.6.x) | Required peer dep of victory-native | Victory Native XL renders entirely on Skia canvas; peer range `>=1.2.3 <3.0.0` `[VERIFIED: npm registry]` |
| `expo-video` | `~55.0.17` (SDK 55 line) | ExerciseDB demo video playback | UI-SPEC mandates over deprecated `expo-av`; `useVideoPlayer` + `VideoView` `[CITED: docs.expo.dev/versions/v55.0.0/sdk/video]` |
| `expo-image-picker` | `~55.0.20` (SDK 55 line) | Progress photo camera + gallery (PHOTO-01) | Official Expo module, SDK-pinned `[VERIFIED: npm registry]` |
| `expo-image-manipulator` | `~55.0.17` (SDK 55 line) | Compress photo to ≤1200px JPEG before upload (UI-SPEC) | Official Expo module; UI-SPEC compression step `[VERIFIED: npm registry]` |

> **SDK 55 pin warning:** npm `latest` for the three Expo modules is the SDK 56 line (`56.x`). This project is on `expo ~55.0.25`. **Install with `npx expo install expo-video expo-image-picker expo-image-manipulator`** so Expo resolves the SDK-55-compatible `55.x` build — do NOT `npm install` the bare name (it pulls `56.x` and breaks the native build). `[VERIFIED: npm registry — 55.x line confirmed present]`

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@anthropic-ai/sdk` | `0.104.1` | Claude call inside Edge Function (PROGRAM-02) | **Server-only** — imported in the Deno Edge Function via `npm:@anthropic-ai/sdk@0.104.1`. Never bundled into the RN client (AI-01 / D-09) `[VERIFIED: npm registry]` `[ASSUMED]` |
| `date-fns` | `4.4.0` | Date-range filtering, week bucketing for volume chart, streak day math | Optional but recommended over hand-rolled date math; tree-shakable `[VERIFIED: npm registry]` `[ASSUMED]` |
| `zod` | `4.4.3` (already installed) | Validate Claude's structured program output | Already a dependency; use in Edge Function with `zodOutputFormat` helper |

**Already present and reused (no install):** `@shopify/flash-list@2.0.2`, `@powersync/react-native@1.35.1`, `react-native-reanimated@4.2.1`, `react-native-svg@15.15.3` (badge SVG icons), `lucide-react-native@1.16.0`, `nativewind@4.2.4`, `lottie-react-native`, `react-native-mmkv@4.3.1`, `expo-haptics`.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `victory-native@41` (Skia) | `react-native-gifted-charts` / `react-native-chart-kit` | Decision is LOCKED to Victory Native XL (PROGRESS-02). Alternatives avoid the Skia dependency but the decision is not open. |
| `expo-video` | `expo-av` Video | `expo-av` Video is deprecated/removed in recent SDKs; `expo-video` is the supported path. No reason to revisit. |
| `@anthropic-ai/sdk` in Edge Function | Raw `fetch` to `api.anthropic.com/v1/messages` | Raw fetch avoids the npm-in-Deno import and is lighter; SDK gives typed structured-output helpers. Either works — see Open Question 2. |

**Installation:**
```bash
# Native deps — use expo install so SDK 55 versions resolve, then EAS rebuild
npx expo install expo-video expo-image-picker expo-image-manipulator
# Charts — Skia is a peer dep of victory-native; install with --legacy-peer-deps (project-wide flag, STATE.md)
npm install victory-native @shopify/react-native-skia --legacy-peer-deps
npm install date-fns --legacy-peer-deps
# A TTF font for chart axes (Victory Native XL useFont requires a font file) —
# Manrope is already the project sans font; reuse the existing .ttf asset, no install.
```

> **Rebuild required:** `@shopify/react-native-skia`, `expo-video`, and `expo-image-picker` are native modules. After install you MUST run a new EAS dev build (or `expo run:ios`/`expo run:android`) — they will not load via OTA into the existing dev client. This is a Wave 0 gate.

## Package Legitimacy Audit

> slopcheck was **not available** at research time (`pip install slopcheck` failed in sandbox). Per protocol, all newly-installed packages are tagged `[ASSUMED]` and the planner should gate each install behind a `checkpoint:human-verify` task. Registry existence + known source repos verified manually below.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `victory-native` | npm | ~9 yrs | ~250k/wk (est.) | github.com/FormidableLabs/victory-native-xl | n/a (unavailable) | Approved (locked decision) — verify before install |
| `@shopify/react-native-skia` | npm | ~4 yrs | ~400k/wk (est.) | github.com/Shopify/react-native-skia | n/a | Approved — verify before install |
| `expo-video` | npm | Expo monorepo | high | github.com/expo/expo | n/a | Approved — `expo install` |
| `expo-image-picker` | npm | Expo monorepo | very high | github.com/expo/expo | n/a | Approved — `expo install` |
| `expo-image-manipulator` | npm | Expo monorepo | high | github.com/expo/expo | n/a | Approved — `expo install` |
| `@anthropic-ai/sdk` | npm | ~2 yrs | very high | github.com/anthropics/anthropic-sdk-typescript | n/a | Approved (server-only) — verify before install |
| `date-fns` | npm | ~9 yrs | ~25M/wk | github.com/date-fns/date-fns | n/a | Approved — verify before install |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*Because slopcheck was unavailable, the planner must gate each install behind a `checkpoint:human-verify` task confirming the exact package name and version against the source repos above before running `npm install` / `expo install`.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────── DEVICE (Hermes / React Native) ────────────────────────────┐
│                                                                                         │
│  Workouts Tab          Progress Tab            Split Tab           Session complete     │
│  ├ TodayCard           ├ SegmentTabs           ├ ProgramSection    (Phase 2)            │
│  ├ TemplateCard list   │  ├ Overview (stats)   │  ├ Create manual   │                   │
│  └ DeloadBanner        │  ├ Charts ──────┐     │  └ Generate AI ─┐  ▼                   │
│        │               │  ├ Photos       │     │       │         │  completeSession()   │
│        ▼               │  └ Achievements │     │       ▼         │  writeTransaction:   │
│  template-builder/[id] │        │        │     │  AIGenerationSheet  ├ sessions upsert   │
│  (full-screen route)   │        │        │     │       │         │  ├ rotation++         │
│        │               │        │        │     │       │         │  ├ program week++     │
│        │               │        ▼        ▼     │       │         │  └ badge milestone    │
│        │      ProgressPhotoGallery  Victory    │       │         │       check           │
│        │      (expo-image-picker)   Native XL  │       │         │         │             │
│        │               │          (Skia canvas)│       │         │         ▼             │
│        ▼               │                ▲      │       │         │   BadgeUnlockToast    │
│  ┌─────────────────────┴────────────────┴──────┴───────┴─────────┴───────────────────┐ │
│  │            PowerSync local SQLite  (usePowerSyncQuery reads / writeTransaction)     │ │
│  │  templates · template_exercises · exercises · sessions · session_sets ·            │ │
│  │  measurements · split_settings · [NEW] programs · program_weeks ·                  │ │
│  │  [NEW] progress_photos · [NEW] badges                                              │ │
│  └────────────────────────────────────┬─────────────────────────┬────────────────────┘ │
└───────────────────────────────────────┼─────────────────────────┼──────────────────────┘
                                         │ WAL sync (relational)   │ HTTPS (binary + AI)
                                         ▼                         ▼
                            ┌────────────────────────┐   ┌──────────────────────────────┐
                            │   Supabase Postgres     │   │ Supabase Storage              │
                            │   (RLS per user_id)     │   │  progress-photos/{uid}/{date} │
                            │                         │   │  exercise-media/{slug}.mp4    │
                            └────────────────────────┘   └──────────────────────────────┘
                                         ▲                         ▲
                                         │ service role            │ build-time seed
              ┌──────────────────────────┴───────────┐   ┌─────────┴─────────────────┐
              │ Edge Function: generate-program       │   │ Build-time seed script     │
              │ (Deno) JWT validate → Anthropic API   │   │ ExerciseDB → Storage + rows│
              │ → Zod-validated program JSON → client  │   │ (≤10 req/day, run once)    │
              └────────────────────────────────────────┘   └────────────────────────────┘
                              │ HTTPS
                              ▼
                    ┌───────────────────┐
                    │  Anthropic Claude  │
                    │  (server-side only)│
                    └───────────────────┘
```

### Recommended Project Structure
```
app/
├── (tabs)/
│   ├── workouts.tsx          # restructure: TodayCard + DeloadBanner + template FlashList
│   ├── progress.tsx          # rebuild: SegmentTabs host
│   └── split.tsx             # add ProgramSection
├── template-builder/[id].tsx # NEW full-screen route (id="new" | uuid)
├── history/[sessionId].tsx   # NEW full-screen history edit route (D-08)
├── program-review.tsx        # NEW full-screen AI review route (D-11)
└── program-builder/[id].tsx  # NEW manual program builder (id="new" | uuid)
src/
├── components/               # ~25 new components per UI-SPEC inventory
├── hooks/
│   ├── useTemplates.ts       # CRUD + list reads
│   ├── useExerciseLibrary.ts # search + custom exercise create
│   ├── useChartData.ts       # weight progression + volume aggregation
│   ├── useMeasurements.ts    # measurement history read/write
│   ├── useProgressPhotos.ts  # Storage upload + metadata rows
│   ├── usePrograms.ts        # program CRUD + week advance
│   ├── useBadges.ts          # badge state read
│   └── useStreak.ts          # streak computation (GAMIFY-03)
├── lib/
│   ├── chartStyles.ts        # NEW — Victory axis/grid style constants (UI-SPEC)
│   ├── tokens.ts             # ADD Phase 3 chart color constants (UI-SPEC)
│   ├── badgeRules.ts         # milestone definitions + detection
│   └── exerciseMedia.ts      # Storage URL resolution for demo videos
├── services/
│   ├── templateService.ts    # writeTransaction template save/delete
│   ├── historyService.ts     # writeTransaction session edit
│   ├── programService.ts     # writeTransaction program save + week advance
│   └── photoService.ts       # image-manipulator + Storage upload
supabase/
├── migrations/
│   └── 20260610000000_phase3_schema.sql  # NEW tables + columns + RLS in ONE migration
└── functions/
    └── generate-program/index.ts          # NEW Edge Function
scripts/
└── seed-exercises.ts          # build-time ExerciseDB → Storage + rows (run manually)
```

### Pattern 1: Victory Native XL Line Chart (weight progression — PROGRESS-02)
**What:** `CartesianChart` with numeric x/y data; a TTF font loaded via Skia's `useFont` is required for axis labels.
**When to use:** Weight progression per exercise.
**Example:**
```tsx
// Source: https://nearform.com/open-source/victory-native/docs/cartesian/cartesian-chart [CITED]
import { CartesianChart, Line } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import Manrope from '@/assets/fonts/Manrope-Medium.ttf'; // reuse existing project font asset
import { COLOR_CHART_LINE, COLOR_FG_MUTED, COLOR_CHART_GRID, FONT_SIZE_CAPTION } from '@/lib/tokens';

// Data shape: array of objects; x and y are NUMERIC keys (yKeys must be numbers).
// Dates MUST be pre-converted to a numeric (epoch ms or session index) — Victory yKeys reject strings.
const data = sessions.map((s) => ({ x: new Date(s.completed_at).getTime(), y: s.maxWeightKg }));

function WeightProgressionChart({ animate }: { animate: boolean }) {
  const font = useFont(Manrope, FONT_SIZE_CAPTION); // font is null on first render — guard the chart
  return (
    <CartesianChart
      data={data}
      xKey="x"
      yKeys={['y']}
      xAxis={{ font, labelColor: COLOR_FG_MUTED, lineColor: COLOR_CHART_GRID,
               formatXLabel: (ms) => formatShortDate(ms) }}
      yAxis={[{ font, labelColor: COLOR_FG_MUTED, lineColor: COLOR_CHART_GRID }]}
    >
      {({ points }) => (
        <Line points={points.y} color={COLOR_CHART_LINE} strokeWidth={2}
              animate={animate ? { type: 'timing', duration: 400 } : undefined} />
      )}
    </CartesianChart>
  );
}
```

### Pattern 2: Victory Native XL Bar Chart (volume — PROGRESS-03)
**What:** Same `CartesianChart` host, `Bar` child. Volume = Σ(weight × reps) bucketed per ISO week.
**Example:**
```tsx
// Source: https://nearform.com/open-source/victory-native/docs/cartesian/cartesian-chart [CITED]
import { CartesianChart, Bar } from 'victory-native';
import { COLOR_CHART_BAR } from '@/lib/tokens';

// weekBuckets: { x: number (week index), y: number (total volume kg) }[]
<CartesianChart data={weekBuckets} xKey="x" yKeys={['y']} xAxis={{ font }} yAxis={[{ font }]}>
  {({ points, chartBounds }) => (
    <Bar points={points.y} chartBounds={chartBounds} color={COLOR_CHART_BAR} roundedCorners={{ topLeft: 2, topRight: 2 }} />
  )}
</CartesianChart>
```
**Note:** `Bar` requires `chartBounds` from the render-prop context (line chart does not). Confirm exact prop against installed version's types.

### Pattern 3: Atomic multi-table history edit (HISTORY-02 / writeTransaction)
**What:** All edits to a completed session (sets, weights, go/no-go, exercises add/remove, notes) commit in one transaction.
**Example:**
```ts
// Source: src/services/sessionService.ts completeSession() pattern [VERIFIED: codebase]
await ps.writeTransaction(async (tx) => {
  await tx.execute(`UPDATE sessions SET notes = ? WHERE id = ?`, [notes, sessionId]);
  for (const set of editedSets) {
    await tx.execute(
      `INSERT OR REPLACE INTO session_sets
       (id, session_id, exercise_id, exercise_name, set_number, weight_kg, reps_target, result, rpe, is_warmup, notes, logged_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [set.id, sessionId, set.exerciseId, set.exerciseName, set.setNumber, set.weightKg,
       set.repsTarget, set.result, set.rpe, set.isWarmup ? 1 : 0, set.notes, set.loggedAt]);
  }
  for (const removedId of removedSetIds) {
    await tx.execute(`DELETE FROM session_sets WHERE id = ?`, [removedId]); // hard delete OK for sets
  }
});
// Do NOT check rowsAffected — PowerSync JSON view returns 0 on success (Pitfall 4 — confirmed in sessionService.ts)
```
Charts re-render automatically because `usePowerSyncQuery` is reactive — no manual cache invalidation (HISTORY-03 satisfied for free).

### Pattern 4: Template save (TEMPLATE-01/05/06)
Use `writeTransaction` to upsert the `templates` row + replace all `template_exercises` rows (delete-then-insert by template_id, or INSERT OR REPLACE keyed by stable `template_exercises.id`). Generate UUIDs client-side with `expo-crypto.randomUUID()` (same as `startSession`). Editing reuses the same path; sessions are unaffected because `session_sets` snapshot `exercise_name` at log time (TEMPLATE-06).

### Pattern 5: ExerciseDB demo video (cache-first — TEMPLATE-04)
**Build-time seed (run once, ≤10 req/day budget):** `scripts/seed-exercises.ts` fetches exercise data + media, uploads media to Supabase Storage bucket `exercise-media/{slug}.mp4|.gif`, and inserts/updates `exercises` rows with the storage object path in `exercisedb_video_id`. **Runtime never calls ExerciseDB.** The app resolves a Supabase Storage public URL from `exercisedb_video_id` and feeds it to `expo-video`:
```tsx
// Source: https://docs.expo.dev/versions/v55.0.0/sdk/video [CITED]
const player = useVideoPlayer(storageUrl, (p) => { p.loop = true; p.muted = true; p.play(); });
return <VideoView player={player} style={{ width: 48, height: 48 }} contentFit="cover" nativeControls={false} />;
```

### Pattern 6: AI program generation Edge Function (PROGRAM-02 / D-09)
**What:** Deno Edge Function mirroring the `migrate-v1-user` structure: validate JWT with anon client, then call Claude. Use the project's established `esm.sh` import style for consistency, OR `npm:` specifier (both work in Deno; see Open Question 2).
**Example skeleton:**
```ts
// Source: existing supabase/functions/migrate-v1-user/index.ts pattern [VERIFIED: codebase]
//         + Anthropic structured outputs [CITED: platform.claude.com/docs/.../structured-outputs]
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.104.1';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return json({ error: 'Unauthorized' }, 401);

  // Phase 4 will add: if (!isPremium(user)) return json({ error: 'premium_required' }, 402);  (D-09)

  const { goal, currentLifts, weeks } = await req.json();
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',          // current Sonnet ID [CITED]
    max_tokens: 4096,
    messages: [{ role: 'user', content: buildProgramPrompt(goal, currentLifts, weeks) }],
    // Structured output: either output_config.format (zodOutputFormat) OR a forced tool_choice.
    // Fallback that always works: instruct JSON-only in the prompt + JSON.parse + zod validate.
  });
  // Validate against zod ProgramSchema before returning (reject malformed Claude output).
  return json(parseAndValidateProgram(msg), 200);
});
```
**Program JSON schema (recommended shape the client expects — D-11 week grid):**
```ts
const ProgramSchema = z.object({
  name: z.string(),
  weeks: z.array(z.object({
    weekNumber: z.number(),
    isDeload: z.boolean(),
    days: z.array(z.object({ dayLabel: z.string(), templateName: z.string().nullable() })), // null = rest
  })),
});
```
**Secrets:** `ANTHROPIC_API_KEY` set via `supabase secrets set` — never in client bundle (AI-01). The RN client invokes via `supabase.functions.invoke('generate-program', { body })`.

### Pattern 7: Progress photo upload (PHOTO-01)
**What:** Pick/capture → compress → upload to Storage → insert metadata row.
**Example:**
```ts
// Source: Expo image-picker + Supabase Storage upload [ASSUMED — composed from official module APIs]
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
if (res.canceled) return;
const manip = await ImageManipulator.manipulateAsync(res.assets[0].uri,
  [{ resize: { width: 1200 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
const isoDate = new Date().toISOString().slice(0, 10);
const path = `${userId}/${isoDate}.jpg`;
const arrayBuffer = await (await fetch(manip.uri)).arrayBuffer();
await supabase.storage.from('progress-photos')
  .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
// Then INSERT a progress_photos row (id, user_id, taken_on, storage_path) via PowerSync writeTransaction.
```
**Storage bucket:** `progress-photos`, **private**, RLS policy keyed on `(storage.foldername(name))[1] = auth.uid()::text` so users only access their own folder.

### Pattern 8: Badge milestone detection (GAMIFY-01)
**What:** Detect milestones inside `completeSession`'s existing `writeTransaction`, using cheap counters — never a full-history scan per session.
**Strategy:**
- Maintain running aggregates queryable in O(1)/O(log n): total completed sessions (`COUNT(*) FROM sessions WHERE completed_at NOT NULL AND is_deleted=0`), total volume (could store a `lifetime_volume_kg` accumulator on `split_settings` or a dedicated `user_stats` row, incremented per session), streak (computed from session dates — see Code Example 5).
- On completion, compute the new counters, compare against `badgeRules.ts` thresholds (100 workouts, 10,000 lbs, 30-day streak, first PR), and for any newly-crossed threshold INSERT a `badges` row (idempotent by `(user_id, badge_key)` unique constraint — `INSERT ... ON CONFLICT DO NOTHING`).
- Pass the first newly-unlocked badge key through navigation params to the Dashboard so `BadgeUnlockToast` fires after Anubis (D-13).
**Avoid:** Recomputing all-time aggregates by scanning `session_sets` on every Progress tab load. Cache totals; only the streak (cheap, date-only) and live go-rate recompute on read.

### Anti-Patterns to Avoid
- **Calling ExerciseDB at runtime** — 10 req/day kills the app instantly. Seed once, serve from Storage. (STATE.md blocker)
- **FlatList for any dense list** — FlashList is MANDATORY for template list, exercise results, recent sessions, photo grid. (STATE.md blocker)
- **Local `useState` for selection/expanded state in FlashList rows** — FlashList recycles; drive from a store keyed by row UUID (Phase 2 cross-cutting constraint).
- **`@anthropic-ai/sdk` on the client** — Hermes lacks Node globals; it MUST be Edge-Function-only (AI-01).
- **Checking `rowsAffected` after PowerSync writes** — always 0 on success; use INSERT OR REPLACE for idempotency. (confirmed in `sessionService.ts`)
- **Passing string/date x-values to Victory yKeys** — `yKeys` must be numeric; pre-convert dates to epoch ms or index, format back via `formatXLabel`.
- **Rendering a chart before `useFont` resolves** — `useFont` returns `null` on first render; guard with a spinner/empty state until the font loads or axes will throw.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Charts | Custom SVG path math | `victory-native` (Skia) | Axis scaling, ticks, animation, gesture — locked decision anyway |
| Image compression | Manual canvas resize | `expo-image-manipulator` | Native resize/compress; correct EXIF handling |
| Camera/gallery access | Native module bridging | `expo-image-picker` | Permissions, action sheet, cross-platform |
| Video playback | WebView/`<video>` hacks | `expo-video` | Native player, loop/mute control, lifecycle |
| Reactive data reads | Manual SQLite subscriptions | `usePowerSyncQuery` | Auto re-fires on local write (HISTORY-03 for free) |
| Atomic multi-table writes | Sequential `execute()` calls | `writeTransaction()` | All-or-nothing; partial writes corrupt history |
| Claude JSON parsing reliability | Regex on free text | Structured outputs / forced tool / zod-validate | Schema enforcement; reject malformed output |
| Date range / week bucketing | Hand-rolled date math | `date-fns` | DST/timezone correctness for streak + week buckets |

**Key insight:** Every "new" capability in Phase 3 maps to an established library or an existing repo pattern. The only genuinely bespoke logic is badge milestone rules and program-week advancement — both small, pure functions over data you already have.

## Runtime State Inventory

> Not a rename/refactor phase, but Phase 3 introduces persistent state (Storage buckets, new tables, MMKV flags) that downstream phases will reference. Documented for completeness.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | NEW tables `programs`, `program_weeks`, `progress_photos`, `badges`; column adds `template_exercises.exercise_type`, `template_exercises.default_rest_seconds` (exists), full `measurements` columns in PowerSync mirror | Supabase migration + matching `schema.ts` update (Wave 0) |
| Live service config | Supabase Storage buckets `progress-photos` (private) + `exercise-media` (public-read) must be created with RLS policies — NOT in git, created via dashboard/CLI | Create buckets + storage RLS in migration or `supabase` CLI |
| OS-registered state | None | None — no OS-level registration in this phase |
| Secrets/env vars | NEW Edge Function secret `ANTHROPIC_API_KEY`; ExerciseDB `RAPIDAPI_KEY` for the one-time seed script (local only, never shipped) | `supabase secrets set ANTHROPIC_API_KEY=...`; RAPIDAPI key as local env for seed script |
| Build artifacts | New native modules (Skia, expo-video, expo-image-picker) require a fresh EAS dev build — existing dev client will not load them | Rebuild dev client before chart/media plans run |

## Common Pitfalls

### Pitfall 1: Schema mirror drift (PowerSync `schema.ts` vs Supabase)
**What goes wrong:** A feature reads `measurements.body_fat_pct` or `measurements.measured_at`, but the PowerSync `schema.ts` `measurementsTable` only declares `weight_kg, body_fat_pct, chest_cm, waist_cm` — missing `measured_at`, `hips_cm`, `arms_cm`, `thighs_cm`, `notes`. PowerSync silently returns `undefined` for undeclared columns; queries appear to "work" but data is missing.
**Why it happens:** The PowerSync mirror is hand-maintained and was trimmed in Phase 1.
**How to avoid:** Wave 0 reconciles `schema.ts` against the Supabase migration column-for-column. **Also fix the existing latent bug:** `useSessionData.ts:184/194` queries `ORDER BY logged_at` on `measurements`, but the column is `measured_at` — this is already broken and must be corrected when measurements are read for PROGRESS-04.
**Warning signs:** Chart shows no data despite rows existing; `undefined` weight values.

### Pitfall 2: Skia not in the running dev client
**What goes wrong:** Charts render blank or the app crashes with a missing-native-module error after `npm install victory-native` but before rebuilding.
**Why it happens:** Skia is native; OTA/Metro reload does not include new native code.
**How to avoid:** Treat install + EAS rebuild as a single Wave 0 gate; verify with a trivial chart before building real charts.
**Warning signs:** `Cannot read property 'Skia' of undefined`; blank Canvas.

### Pitfall 3: `template_exercises.exercise_type` does not exist
**What goes wrong:** TEMPLATE-05 requires per-exercise type (standard/bodyweight/run) in the template builder, but `template_exercises` has no `exercise_type` column. `useSessionData.ts` currently derives type from the *library* `exercises.type` via JOIN — which means a template cannot override type per-instance.
**Why it happens:** Phase 1 schema modeled type only on the library exercise, not the template instance.
**How to avoid:** Decide in Wave 0 whether per-template type override is required (UI-SPEC's exercise-type toggle implies yes → add `template_exercises.exercise_type`) or whether type stays library-level (then the UI-SPEC toggle edits the library row, with side effects). Flag to discuss — see Open Question 1.

### Pitfall 4: PowerSync `rowsAffected` always 0
**What goes wrong:** Code branches on `result.rowsAffected > 0` to confirm a write; it's always 0, so success looks like failure.
**Why it happens:** PowerSync's JSON view system returns 0 regardless.
**How to avoid:** Never check `rowsAffected`. Use INSERT OR REPLACE keyed by client UUID for idempotency. (Already documented in `sessionService.ts`.)

### Pitfall 5: Claude returns prose around the JSON
**What goes wrong:** `JSON.parse(msg.content[0].text)` throws because Claude wrapped the program in explanation.
**Why it happens:** Without structured outputs / forced tool use, the model may add commentary.
**How to avoid:** Use `output_config.format: zodOutputFormat(ProgramSchema)` (model `claude-sonnet-4-6` supports it) OR a forced `tool_choice` with a named tool whose input schema is the program. Always zod-validate server-side and return a clean 422 on validation failure so the client can show "generation failed, try again" (UI-SPEC error state).

### Pitfall 6: Storage RLS lets users read others' photos
**What goes wrong:** A misconfigured public bucket or missing storage policy exposes private progress photos.
**Why it happens:** Storage RLS is separate from table RLS and easy to forget.
**How to avoid:** `progress-photos` bucket must be **private** with a policy restricting `(storage.foldername(name))[1] = auth.uid()::text`. `exercise-media` is public-read (non-sensitive demo content) and write-restricted to the seed service role.

### Pitfall 7: Realtime/RLS SELECT policy gap (carried from STATE.md)
**What goes wrong:** New tables added without an explicit SELECT RLS policy in the same migration — PowerSync sync silently drops rows.
**Why it happens:** Documented blocker (supabase/supabase#35282); RLS + sync requires all four CRUD policies at creation.
**How to avoid:** Every new table (`programs`, `program_weeks`, `progress_photos`, `badges`) gets RLS + all four CRUD policies in the same migration that creates it.

## Code Examples

### Code Example 2: Exercise library search (TEMPLATE-02)
```ts
// Source: usePowerSyncQuery pattern from useSessionData.ts [VERIFIED: codebase]
const { data } = usePowerSyncQuery<ExerciseRow>(
  `SELECT id, name, muscle_group, type, exercisedb_video_id, is_custom
   FROM exercises
   WHERE (is_custom = 0 OR created_by = ?)
     AND (? = '' OR name LIKE '%' || ? || '%')
     AND (? = 'All' OR muscle_group = ?)
   ORDER BY name
   LIMIT 100`,
  [userId, search, search, muscleFilter, muscleFilter]
);
```

### Code Example 3: Volume per ISO week (PROGRESS-03)
```ts
// Source: composed from session_sets schema + date-fns [ASSUMED]
import { startOfISOWeek } from 'date-fns';
// Query raw working sets in range, then bucket in JS:
const rows = usePowerSyncQuery(
  `SELECT ss.weight_kg, ss.reps_target, s.completed_at
   FROM session_sets ss JOIN sessions s ON s.id = ss.session_id
   WHERE s.user_id = ? AND ss.is_warmup = 0 AND s.completed_at >= ?`, [userId, sinceIso]);
// volume = weight_kg * reps_target, sum by startOfISOWeek(completed_at)
```

### Code Example 4: Progress stats (PROGRESS-01)
```ts
// Source: sessionStats.computeGoRate is reusable [VERIFIED: codebase src/lib/sessionStats.ts]
// total workouts:
`SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND completed_at IS NOT NULL AND is_deleted = 0`
// lifetime go-rate: pull all non-warmup completed session_sets, reuse computeGoRate()
```

### Code Example 5: Weekly streak (GAMIFY-03)
```ts
// Source: composed [ASSUMED] — "weekly streak" = consecutive ISO weeks with >=1 completed session
import { startOfISOWeek, differenceInCalendarISOWeeks } from 'date-fns';
// 1. SELECT DISTINCT completed_at dates DESC. 2. Map to startOfISOWeek. 3. Walk back from current
//    week; streak increments while each prior week has a session; breaks on the first gap.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `victory-native` <40 (SVG/`VictoryChart`) | Victory Native XL 40+ (`CartesianChart` + Skia) | v40, 2024 | Different API entirely — training data for old Victory is WRONG. Use `CartesianChart`/`Line`/`Bar` render-prop, not `VictoryLine` JSX. |
| `expo-av` `Video` | `expo-video` (`useVideoPlayer`/`VideoView`) | SDK 52+ | `expo-av` Video removed; `expo-video` is the only supported path |
| Anthropic `output_format` | `output_config.format` | 2026 | Old param still works in transition; new code uses `output_config.format` |
| Claude `claude-3-5-sonnet` | `claude-sonnet-4-6` | 2025–2026 | Use current model ID; verify availability against the account at build time |

**Deprecated/outdated:**
- `VictoryChart`/`VictoryLine`/`VictoryAxis` JSX components — replaced by the Skia `CartesianChart` render-prop API in Victory Native XL.
- `expo-av` for video — use `expo-video`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Victory Native XL exact `Line`/`Bar` props (`animate`, `roundedCorners`, `chartBounds` requirement) | Patterns 1–2 | Chart renders but prop names differ — verify against installed `victory-native@41` types during Wave 0 |
| A2 | ExerciseDB response fields (`gifUrl`, `bodyPart`, `target`, `equipment`, `secondaryMuscles`, `instructions`, `id`) and whether it returns video (vs GIF only) | Pattern 5 | Seed script field mapping wrong; may be GIF-only (then use `Image`, not `expo-video`). RapidAPI ExerciseDB historically returns `gifUrl` (GIF), not MP4 — **video may need a different source or GIF fallback** |
| A3 | `claude-sonnet-4-6` is available on the project's Anthropic account | Pattern 6 | Edge Function 404s on model; confirm account access, fall back to an available Sonnet ID |
| A4 | `@anthropic-ai/sdk@0.104.1` structured-output helpers work under Deno `npm:` import | Pattern 6 | If Deno compat issues, fall back to raw `fetch` + prompt-enforced JSON + zod validate (Open Question 2) |
| A5 | `date-fns@4` chosen for date math | Standard Stack | Low — could hand-roll, but DST/ISO-week bugs likely |
| A6 | Per-template `exercise_type` override is desired (UI-SPEC toggle) | Pitfall 3 | Schema add unnecessary if type stays library-level — confirm with user (Open Question 1) |
| A7 | Progress photo Storage path `progress-photos/{userId}/{iso-date}.jpg` and private bucket | Pattern 7 | UI-SPEC specifies this exactly; low risk |
| A8 | ExerciseDB data licensing permits bundling into Supabase Storage | Pattern 5 | STATE.md flags this as an open todo — confirm before seeding (legal, not technical) |

## Open Questions (RESOLVED)

1. **Per-template exercise type override** — Does TEMPLATE-05's exercise-type toggle set the type on the template instance (`template_exercises.exercise_type`, new column) or mutate the shared library exercise (`exercises.type`, with cross-template side effects)?
   - What we know: UI-SPEC shows a Standard/Bodyweight/Run toggle in the template builder; `useSessionData` currently reads type from the library JOIN.
   - Recommendation: Add `template_exercises.exercise_type` (instance-level override, falling back to library type when null). Confirm with user in discuss-phase.
   - **RESOLVED:** 03-01 adds `template_exercises.exercise_type` column (instance-level override); 03-02 writes it in the template builder. Matches recommendation.

2. **Anthropic in Edge Function: SDK vs raw fetch** — The repo uses `esm.sh` imports; the Anthropic SDK is cleanest via `npm:`. Mixed import styles in one function are fine in Deno but worth a deliberate choice.
   - Recommendation: Use raw `fetch` to `https://api.anthropic.com/v1/messages` with prompt-enforced JSON + zod validation as the robust baseline (no npm-in-Deno surprises), and treat the SDK + structured outputs as an enhancement if it imports cleanly. Verify in Wave 0.
   - **RESOLVED:** 03-07 uses raw `fetch` baseline with zod-validated JSON response. Matches recommendation.

3. **ExerciseDB video vs GIF** — RapidAPI ExerciseDB classically returns animated **GIF** URLs (`gifUrl`), not MP4. The UI-SPEC's `ExerciseVideoPlayer` uses `expo-video` (MP4) with a GIF/`Image` fallback.
   - Recommendation: Plan for GIF rendering via `Image` as the primary path (seed `.gif` to Storage); keep `expo-video` for any true-video source. Confirm the exact ExerciseDB media format during the seed-script spike.
   - **RESOLVED:** 03-08 plans GIF-via-`Image` as primary path, seeded to Supabase Storage; `expo-video` retained for any true-video source. Matches recommendation.

4. **Lifetime aggregate storage for badges** — Where do running totals (lifetime volume) live to avoid full scans? A `user_stats` table, columns on `split_settings`, or recompute-on-read?
   - Recommendation: Add a lightweight `user_stats` row (or reuse `profiles`) with `total_sessions`, `lifetime_volume_kg`, incremented in `completeSession`. Decide in Wave 0 schema.
   - **RESOLVED:** 03-01 adds `user_stats` table with `total_sessions`, `lifetime_volume_kg` columns; 03-06 increments them inside `completeSession` writeTransaction. Matches recommendation.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| EAS Build / native rebuild | Skia, expo-video, expo-image-picker | ✓ (configured Phase 1) | eas.json profiles exist | none — required |
| Supabase project | Storage buckets, Edge Function, migration | ✓ | project jmtogdlsgpfoefbgdubm (package.json) | none |
| Supabase CLI | migrations, `secrets set`, functions deploy | ✓ assumed (Phase 1 used it) | — | dashboard UI |
| Anthropic API key | generate-program Edge Function | ✗ (not yet set) | — | none — must obtain + `secrets set` |
| RapidAPI ExerciseDB key | one-time seed script | ✗ (not yet obtained) | — | use existing 36 seeded exercises only; expand later |
| Manrope TTF asset | Victory Native XL `useFont` | ✓ (project sans font) | — | bundle any TTF |

**Missing dependencies with no fallback:**
- Anthropic API key — PROGRAM-02 cannot function without it; obtain and `supabase secrets set ANTHROPIC_API_KEY` before the Edge Function plan.

**Missing dependencies with fallback:**
- RapidAPI ExerciseDB key — without it, ship with the 36 already-seeded exercises (TEMPLATE-02 still works); demo videos (TEMPLATE-04) degrade to the static muscle-illustration fallback the UI-SPEC already specifies. Seeding can be a parallel/later task.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 (unit + integration), Maestro (e2e) |
| Config file | `package.json` scripts; `tests/integration` dir |
| Quick run command | `npm run test:unit` (`vitest run`) |
| Full suite command | `npm run test:all` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEMPLATE-02 | Search filters by name + muscle group | unit | `vitest run src/lib/__tests__/exerciseSearch.test.ts` | ❌ Wave 0 |
| PROGRESS-01 | Stats aggregation (go-rate reuse) | unit | `vitest run src/lib/__tests__/sessionStats.test.ts` | likely exists (Phase 2) — extend |
| PROGRESS-03 | Volume week bucketing correct | unit | `vitest run src/lib/__tests__/volumeBucket.test.ts` | ❌ Wave 0 |
| GAMIFY-01 | Milestone thresholds cross correctly | unit | `vitest run src/lib/__tests__/badgeRules.test.ts` | ❌ Wave 0 |
| GAMIFY-03 | Streak math (consecutive ISO weeks, gap breaks) | unit | `vitest run src/lib/__tests__/streak.test.ts` | ❌ Wave 0 |
| HISTORY-02 | Edit session writeTransaction atomicity | integration | `vitest run tests/integration/historyEdit.test.ts` | ❌ Wave 0 |
| PROGRAM-02 | Edge Function returns schema-valid program | integration | (Deno test for Edge Function) | ❌ Wave 0 |
| PHOTO-01 | Upload path + metadata row created | integration | `vitest run tests/integration/photoUpload.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm run test:all`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/badgeRules.ts` + `__tests__/badgeRules.test.ts` — covers GAMIFY-01
- [ ] `src/lib/__tests__/streak.test.ts` — covers GAMIFY-03
- [ ] `src/lib/__tests__/volumeBucket.test.ts` — covers PROGRESS-03
- [ ] `src/lib/__tests__/exerciseSearch.test.ts` — covers TEMPLATE-02
- [ ] `tests/integration/historyEdit.test.ts` — covers HISTORY-02/03
- [ ] Edge Function test harness for `generate-program` (Deno) — covers PROGRAM-02
- [ ] Pure helpers (badge rules, streak, volume bucketing, search predicate) should be extracted as pure functions so they are unit-testable without PowerSync/Skia

## Security Domain

> `security_enforcement` not present in config — treated as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Edge Function validates user JWT via anon client (existing `migrate-v1-user` pattern); RN uses existing Supabase session |
| V3 Session Management | no | Handled in Phase 1 (MMKV/SecureStore) — unchanged |
| V4 Access Control | yes | RLS on every new table (`programs`, `program_weeks`, `progress_photos`, `badges`); Storage RLS on `progress-photos` keyed to `auth.uid()` |
| V5 Input Validation | yes | zod-validate Claude output server-side; validate/sanitize program inputs (goal, lifts) before prompt; clamp weeks to a sane range to bound `max_tokens` |
| V6 Cryptography | no | No new crypto; UUIDs via `expo-crypto.randomUUID()` (existing) |

### Known Threat Patterns for React Native + Supabase Edge + Storage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Cross-user photo access via Storage | Information Disclosure | Private bucket + folder-scoped RLS `(storage.foldername(name))[1] = auth.uid()::text` |
| Cross-user table reads (new tables) | Information Disclosure | RLS SELECT policy (+ all CRUD) in the same migration (Pitfall 7) |
| Anthropic key leakage | Information Disclosure | Key only in Edge Function secret; never client bundle (AI-01) |
| Prompt injection via user goal/lifts | Tampering | Treat Claude output as untrusted: zod-validate, never `eval`/execute; clamp `weeks`/`max_tokens` to bound cost (DoS) |
| Unbounded AI cost / abuse | Denial of Service | Phase 4 adds premium gate + rate limit; Phase 3 ungated — consider a soft per-user daily cap even now |
| Malformed image upload | Tampering | `expo-image-manipulator` re-encodes to JPEG (strips arbitrary payloads); set `contentType` explicitly |

## Sources

### Primary (HIGH confidence)
- Codebase: `src/lib/schema.ts`, `src/services/sessionService.ts`, `src/lib/sessionStats.ts`, `src/hooks/useSessionData.ts`, `supabase/migrations/20260519000000_initial_schema.sql`, `supabase/functions/migrate-v1-user/index.ts`, `package.json` — VERIFIED schema, patterns, deps
- npm registry: victory-native 41.26.0 (peer deps), @shopify/react-native-skia 2.6.4, expo-video/expo-image-picker/expo-image-manipulator 55.x line, @anthropic-ai/sdk 0.104.1, date-fns 4.4.0 — VERIFIED versions
- https://nearform.com/open-source/victory-native/docs/cartesian/cartesian-chart — CartesianChart/Line/Bar API
- https://docs.expo.dev/versions/v55.0.0/sdk/video — expo-video useVideoPlayer/VideoView
- https://platform.claude.com/docs/en/build-with-claude/structured-outputs — output_config.format, model IDs

### Secondary (MEDIUM confidence)
- RapidAPI ExerciseDB listing + GitHub ExerciseDB/exercisedb-api — response fields, 10 req/day free tier (field exactness unverified against live API — A2)
- Supabase Edge Functions npm/Deno docs — npm: import specifier pattern

### Tertiary (LOW confidence)
- WebSearch summaries of Claude model availability — confirm `claude-sonnet-4-6` against the actual account (A3)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions registry-verified; SDK-55 pin caveat documented
- Architecture/PowerSync patterns: HIGH — read directly from existing repo code
- Charts (Victory Native XL API): MEDIUM-HIGH — official docs confirm shape; exact props verify against installed types (A1)
- ExerciseDB: MEDIUM — fields and GIF-vs-video need a live-API spike (A2/A3)
- AI Edge Function: MEDIUM — pattern proven by existing function; Anthropic-in-Deno + model ID need Wave 0 verification (A3/A4)
- Schema gaps: HIGH — confirmed by reading schema.ts + migration against requirements

**Research date:** 2026-06-10
**Valid until:** 2026-07-10 (libraries stable; re-verify Expo SDK pin + Claude model ID if planning slips)
