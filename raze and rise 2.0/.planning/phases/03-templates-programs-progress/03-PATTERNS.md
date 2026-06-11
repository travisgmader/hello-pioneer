# Phase 3: Templates, Programs & Progress - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 32 new/modified (per RESEARCH.md project structure + CONTEXT decisions)
**Analogs found:** 26 with strong matches / 32 total

> **How to read this map:** Every "new" capability in Phase 3 maps to an existing repo pattern (RESEARCH.md "Key insight"). The analogs below are real, verified files. Planner: reference the cited file + line numbers directly in each plan's action section. Where no analog exists, the file is listed under **No Analog Found** with the RESEARCH.md pattern to follow instead.

---

## File Classification

### Screens / Routes (`app/`)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(tabs)/workouts.tsx` (rewrite) | route/screen | CRUD + request-response | `app/(session)/index.tsx` | role-match (FlashList host) |
| `app/(tabs)/progress.tsx` (rewrite) | route/screen | request-response | `app/(session)/index.tsx` | role-match (segment host) |
| `app/(tabs)/split.tsx` (rewrite) | route/screen | CRUD | `app/(session)/index.tsx` | role-match |
| `app/template-builder/[id].tsx` (NEW) | route/screen | CRUD | `app/(session)/index.tsx` | exact (full-screen route + FlashList + Zustand init) |
| `app/history/[sessionId].tsx` (NEW) | route/screen | CRUD | `app/(session)/index.tsx` | exact (full-screen edit route) |
| `app/program-builder/[id].tsx` (NEW) | route/screen | CRUD | `app/(session)/index.tsx` | exact |
| `app/program-review.tsx` (NEW) | route/screen | request-response | `app/(session)/index.tsx` | role-match |

### Hooks (`src/hooks/`)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `useTemplates.ts` | hook | CRUD read | `src/hooks/useSessionData.ts` (`useTodaysTemplate`) | exact |
| `useExerciseLibrary.ts` | hook | request-response (search) | `src/hooks/useSessionData.ts` + `ExerciseSwapModal` query | exact |
| `useChartData.ts` | hook | transform/aggregate | `src/hooks/useSessionData.ts` (`usePreviousPerformance`) | role-match |
| `useMeasurements.ts` | hook | CRUD read | `src/hooks/useSessionData.ts` (`useLatestBodyweight`) | exact |
| `useProgressPhotos.ts` | hook | CRUD read | `src/hooks/useSessionData.ts` | role-match |
| `usePrograms.ts` | hook | CRUD read | `src/hooks/useSessionData.ts` | role-match |
| `useBadges.ts` | hook | CRUD read | `src/hooks/useSessionData.ts` | role-match |
| `useStreak.ts` | hook | transform | `src/lib/sessionStats.ts` (pure compute) + `useSessionData` query | role-match |

### Services (`src/services/`)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `templateService.ts` | service | CRUD write | `src/services/sessionService.ts` (`completeSession`) | exact |
| `historyService.ts` | service | CRUD write (atomic multi-table) | `src/services/sessionService.ts` (`completeSession`) | exact |
| `programService.ts` | service | CRUD write + counter increment | `src/services/sessionService.ts` (`skipDay` / `completeSession`) | exact |
| `photoService.ts` | service | file-I/O + write | `src/services/sessionService.ts` (write half only) + RESEARCH Pattern 7 | partial |

### Lib / pure helpers (`src/lib/`)

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/schema.ts` (MODIFY) | config/schema | — | self (extend in place) | exact |
| `src/lib/badgeRules.ts` (NEW) | utility (pure) | transform | `src/lib/sessionStats.ts` | exact |
| `src/lib/chartStyles.ts` (NEW) | config | — | `tailwind.config.js` color tokens | partial |
| `src/lib/exerciseMedia.ts` (NEW) | utility | transform | `src/lib/supabase.ts` (Storage URL build) | partial |
| `src/lib/__tests__/*.test.ts` (NEW) | test | — | (no analog — see No Analog Found) | none |

### Components (`src/components/` — ~25 new per UI-SPEC)

| New Component (representative) | Role | Data Flow | Closest Analog | Match Quality |
|--------------------------------|------|-----------|----------------|---------------|
| `TemplateCard` | component | request-response | `src/components/TemplateBuilder/index.tsx` (`TemplateDayCard`) | exact |
| `TodayCard` (Workouts top) | component | request-response | `src/components/TemplateBuilder/index.tsx` + `Chip` | role-match |
| Inline exercise search (in template-builder) | component | request-response (search) | `src/components/ExerciseSwapModal/index.tsx` | exact (strip the Modal wrapper) |
| Muscle-group filter chips | component | event-driven | `src/components/Chip/index.tsx` | exact |
| Template builder exercise row + set config | component | CRUD | `src/components/ExerciseCard/index.tsx` + `SetRow`/`ExpandedSetForm` | exact |
| `SegmentTabs` (Progress) | component | event-driven | `src/components/Chip/index.tsx` (selected/unselected pattern) | role-match |
| Recent sessions list row | component | request-response | `ExerciseSwapModal` `ExerciseRowItem` (FlashList row) | role-match |
| `WeightProgressionChart` / `VolumeChart` | component | streaming/render | (no analog — Victory Native XL, RESEARCH Patterns 1–2) | none |
| `ExerciseVideoPlayer` (demo) | component | file-I/O/media | (no analog — expo-video, RESEARCH Pattern 5) | none |
| `ProgressPhotoGallery` / comparison | component | file-I/O/media | `ExerciseSwapModal` (Modal + FlashList grid shell) | partial |
| `BadgeUnlockToast` | component | event-driven | `src/components/AnubisOverlay/index.tsx` (timed overlay) | role-match |
| `DeloadBanner` | component | request-response | `src/components/ProgressiveOverloadHint/index.tsx` (dismissible hint) | role-match |

### Backend (`supabase/`)

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `supabase/functions/generate-program/index.ts` (NEW) | Edge Function | request-response | `supabase/functions/migrate-v1-user/index.ts` | exact (JWT-validate skeleton) |
| `supabase/migrations/20260610000000_phase3_schema.sql` (NEW) | migration | — | `supabase/migrations/20260519000100_rls_policies.sql` + `..._initial_schema.sql` | exact |
| `scripts/seed-exercises.ts` (NEW) | utility/script | batch/file-I/O | `supabase/functions/migrate-v1-user/index.ts` (admin client + upsert loop) | partial |

---

## Pattern Assignments

### `src/services/templateService.ts`, `historyService.ts`, `programService.ts` (service, CRUD write)

**Analog:** `src/services/sessionService.ts`

This is the single most important analog for all Phase 3 write paths. Copy its exact structure: typed `Opts` interface, `getPowerSync()`, `INSERT OR REPLACE` for idempotency, `writeTransaction()` for multi-table atomicity, never check `rowsAffected`, non-blocking try/catch with `console.warn`.

**Imports + PowerSync access** (`sessionService.ts` lines 33–38, 188–189):
```ts
import * as Crypto from 'expo-crypto';
import { getPowerSync } from '@/lib/powersync';
// inside a function:
const ps = getPowerSync();
```

**Atomic multi-table write — THE template-save / history-edit pattern** (`sessionService.ts` lines 278–299):
```ts
const ps = getPowerSync();
await ps.writeTransaction(async (tx) => {
  await tx.execute(
    `INSERT OR REPLACE INTO sessions
     (id, user_id, template_id, day_label, started_at, completed_at, notes, is_deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [sessionId, userId, templateId, dayLabel, startedAt, new Date().toISOString(), sessionNotes],
  );
  await tx.execute(
    `UPDATE split_settings SET rotation_pointer = rotation_pointer + 1 WHERE user_id = ?`,
    [userId],
  );
  // Do NOT check rowsAffected — PowerSync JSON view returns 0 on success (Pitfall 4)
});
```
- **For `templateService.ts`:** inside one `writeTransaction`, `INSERT OR REPLACE` the `templates` row, then delete-then-insert (or `INSERT OR REPLACE` keyed by stable `template_exercises.id`) all `template_exercises` rows. Generate row UUIDs with `Crypto.randomUUID()` (line 145).
- **For `historyService.ts`:** copy RESEARCH Pattern 3 verbatim — `UPDATE sessions` + per-set `INSERT OR REPLACE INTO session_sets` + `DELETE FROM session_sets WHERE id = ?` for removed sets, all in one `writeTransaction`. Charts re-render for free (HISTORY-03) because reads are reactive.
- **For `programService.ts` week advance (PROGRAM-03):** add a `UPDATE programs SET current_week = current_week + 1 WHERE id = ?` statement INSIDE the existing `completeSession` `writeTransaction` (lines 284–299) so it co-commits with the session row.

**Single-statement counter write — the program-advance / skip pattern** (`sessionService.ts` lines 237–250):
```ts
export async function skipDay(userId: string): Promise<void> {
  try {
    const ps = getPowerSync();
    await ps.execute(
      `UPDATE split_settings SET rotation_pointer = rotation_pointer + 1 WHERE user_id = ?`,
      [userId],
    );
  } catch (err) {
    console.warn('[sessionService] skipDay failed — local SQLite error:', err);
  }
}
```

**Client-side UUID generation** (`sessionService.ts` line 145): `const id = Crypto.randomUUID();` — use for every new `templates`, `template_exercises`, `programs`, `program_weeks`, `progress_photos`, `badges` row.

---

### `src/hooks/useTemplates.ts`, `useMeasurements.ts`, `usePrograms.ts`, `useBadges.ts` (hook, CRUD read)

**Analog:** `src/hooks/useSessionData.ts`

Copy the reactive read pattern: `usePowerSyncQuery<RowType>(sql, params)`, declare a `RowType` interface per query, derive loading from `data === undefined`.

**Imports + typed reactive read** (`useSessionData.ts` lines 21, 90–95):
```ts
import { usePowerSyncQuery } from '@powersync/react-native';

const { data: splitRows } = usePowerSyncQuery<SplitSettingsRow>(
  `SELECT id, user_id, rotation_pointer, global_rest_seconds
   FROM split_settings
   WHERE user_id = ?`,
  [userId]
);
const splitSettings = splitRows?.[0] ?? null;
```

**JOIN read with library fallback** (`useSessionData.ts` lines 117–135) — copy for `useTemplates` exercise reads:
```ts
const { data: exerciseRows } = usePowerSyncQuery(
  `SELECT te.id, te.template_id, te.exercise_id, te.position, te.sets,
          te.rep_low, te.rep_high, te.superset_group, te.default_rest_seconds,
          e.name AS exercise_name_from_lib, e.type AS exercise_type
   FROM template_exercises te
   LEFT JOIN exercises e ON e.id = te.exercise_id
   WHERE te.template_id = ?
   ORDER BY te.position`,
  [template?.id ?? '']
);
```

**Loading derivation** (`useSessionData.ts` lines 198–205):
```ts
if (data === undefined) return { weightKg: null, loading: true };
return { weightKg: data[0]?.weight_kg ?? null, loading: false };
```

> **CARRY-FORWARD BUG (RESEARCH Pitfall 1):** `useSessionData.ts:184` queries `ORDER BY logged_at` against `measurements`, but the column is `measured_at` (confirmed: `migrate-v1-user/index.ts:246` writes `measured_at`; schema.ts:135 declares `measured_at`). `useMeasurements.ts` MUST use `measured_at`, and the existing `useLatestBodyweight` query should be fixed in the same wave.

---

### `src/hooks/useExerciseLibrary.ts` + inline exercise search component (TEMPLATE-02)

**Analog:** `src/components/ExerciseSwapModal/index.tsx`

The inline search in `template-builder` is `ExerciseSwapModal` with the `Modal`/backdrop/sheet wrapper removed — keep the search field + Chip filters + FlashList results.

**PowerSync exercise read + client filter** (`ExerciseSwapModal` lines 98–113):
```tsx
const { data: allExercises } = usePowerSyncQuery<ExerciseRow>(
  `SELECT id, name, primary_muscle FROM exercises ORDER BY primary_muscle, name`,
  []
);
const filteredExercises = React.useMemo(() => {
  const exercises = allExercises ?? [];
  if (!query.trim()) return exercises;
  const q = query.toLowerCase();
  return exercises.filter(
    (e) => e.name.toLowerCase().includes(q) || e.primary_muscle.toLowerCase().includes(q)
  );
}, [allExercises, query]);
```

> **BUG TO FIX (do not copy verbatim):** `ExerciseSwapModal` selects `primary_muscle`, but the column is `muscle_group` (verified `initial_schema.sql:54` and `schema.ts:62`). PowerSync silently returns `undefined` for the undeclared column. The new search must query `muscle_group` and also include `is_custom`/`created_by` scoping. Prefer the SQL-side filter from RESEARCH Code Example 2 (`name LIKE` + muscle filter + `is_custom = 0 OR created_by = ?`) over loading all rows and filtering in JS.

**FlashList row + haptic select** (`ExerciseSwapModal` lines 66–84, 115–132): copy `ExerciseRowItem` (56pt row, name `text-body`, muscle `text-caption text-fg-muted`) and the `Haptics.selectionAsync()` on tap. Adding an exercise to the template replaces "swap" semantics.

---

### Template builder set config (TEMPLATE-05)

**Analog:** `src/components/ExerciseCard/index.tsx` + `SetRow` + `ExpandedSetForm` + `SupersetPair`

Reuse the Phase 2 set-config components. `ExerciseCard` (lines 132–238) shows the card shell, header (name + set-count caption + icon button), and the `exercise.sets.map(...)` → `SetRow` pattern. Superset partner-lookup logic is at lines 170–191 — reuse for template-builder superset pairing.

> **SCHEMA GAP (RESEARCH Pitfall 3):** `template_exercises` has no `exercise_type` column (verified `schema.ts:86–98`). The UI-SPEC type toggle (standard/bodyweight/run) requires adding `template_exercises.exercise_type` in the Wave 0 migration. Currently type is derived only from the library JOIN (`useSessionData.ts:129`). Open Question 1 — resolve in Wave 0.

---

### `app/template-builder/[id].tsx`, `app/history/[sessionId].tsx`, `app/program-builder/[id].tsx` (full-screen routes)

**Analog:** `app/(session)/index.tsx`

This is the canonical full-screen route: `SafeAreaView` host, FlashList v2 body, Zustand-backed state, one-time init guard, `router.push`/`router.replace` navigation.

**Screen shell + auth + PowerSync read wiring** (`(session)/index.tsx` lines 77–85):
```tsx
const { session } = useSession();
const userId = session?.user?.id ?? '';
const { template, exercises: templateExercises, splitSettings, globalRestSeconds } = useTodaysTemplate(userId);
```

**One-time init guard** (`(session)/index.tsx` lines 124–125, 145–167) — use for builder screens that hydrate an existing row vs. start fresh (`id === 'new'` vs uuid):
```tsx
const initialized = useRef(false);
useEffect(() => {
  if (!userId || !template || initialized.current) return;
  initialized.current = true;
  // hydrate (existing id) OR seed empty (id === 'new')
}, [userId, template, ...]);
```

**FlashList v2 body** (`(session)/index.tsx` lines 380–389) — note: no `estimatedItemSize` in v2, `ItemSeparatorComponent` for gaps, generous `paddingBottom`:
```tsx
<FlashList
  ref={listRef}
  data={flashListData}
  keyExtractor={(item) => /* stable key */}
  renderItem={renderItem}
  ItemSeparatorComponent={() => <View className="h-md" />}
  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}
/>
```

> **FlashList recycling constraint (cross-cutting):** `ExerciseCard` header (lines 14–21) documents the mandate — NO local `useState` for per-row selection/expanded state; drive it from a store keyed by row UUID (Zustand `sessionStore.ts`). Apply to template-builder rows, recent-sessions rows, and photo-grid cells.

**`history/[sessionId].tsx` save:** wires the screen's edit buffer into `historyService.ts` (see service section). Entry point is a Progress Overview recent-session row tap (D-08).

---

### `app/(tabs)/workouts.tsx` (rewrite — Today card + template FlashList)

**Analog (current):** `app/(tabs)/workouts.tsx` (existing branching) + `app/(session)/index.tsx` (FlashList host)

Keep the existing auth + `useTodaysTemplate` wiring (current lines 24–34) and the `router.push('/(session)/body-map')` start flow (line 64). Add: `TodayCard` at top, `DeloadBanner` below it (Discretion resolved to Workouts-tab placement per RESEARCH), then a `FlashList` of `TemplateCard`s. The Today template is visually distinguished — reuse the `Chip`/`TemplateDayCard` "selected" treatment (`bg-accent-dim border-border-strong`).

---

### `supabase/functions/generate-program/index.ts` (Edge Function, request-response)

**Analog:** `supabase/functions/migrate-v1-user/index.ts`

Copy the JWT-validation skeleton exactly. The only new part is the Anthropic call + Zod validation.

**Deno serve + auth header guard** (`migrate-v1-user` lines 117–148):
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  // Phase 4 inserts here: if (!isPremium) return 402  (D-09)
  // ... Anthropic call + zod-validate (RESEARCH Pattern 6) ...
});
```

**try/catch envelope** (`migrate-v1-user` lines 154, 393–408): wrap the body in try/catch and return `{ error: String(err) }` with a 500 (use 422 on Zod validation failure per RESEARCH Pitfall 5).

- **Secrets:** `ANTHROPIC_API_KEY` via `supabase secrets set` — env-read exactly like `SUPABASE_SERVICE_ROLE_KEY` (line 128). Never client-side (AI-01).
- **Client invocation:** `supabase.functions.invoke('generate-program', { body })` using the `supabase` singleton (`src/lib/supabase.ts:19`).
- **Anthropic import:** `import Anthropic from 'npm:@anthropic-ai/sdk@0.104.1';` OR raw `fetch` to `api.anthropic.com/v1/messages` (Open Question 2 — verify Deno npm compat in Wave 0).

---

### `supabase/migrations/20260610000000_phase3_schema.sql` (migration)

**Analog:** `supabase/migrations/20260519000100_rls_policies.sql` + `20260519000000_initial_schema.sql`

Each new table (`programs`, `program_weeks`, `progress_photos`, `badges`) needs ALL FOUR CRUD policies in the SAME migration (RESEARCH Pitfall 7 — missing SELECT policy = silent empty sync).

**Cached-auth RLS pattern** (`rls_policies.sql` lines 14–33) — copy verbatim per new table, using the `(SELECT auth.uid())` cached form:
```sql
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY programs_select_own ON public.programs FOR SELECT
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY programs_insert_own ON public.programs FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY programs_update_own ON public.programs FOR UPDATE
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY programs_delete_own ON public.programs FOR DELETE
  USING (user_id = (SELECT auth.uid()));
```

**Column conventions** (`initial_schema.sql` — verified): timestamps as `text` ISO strings, booleans as `0/1` integers, soft-delete via `is_deleted` integer, index on `user_id` / FK columns.

- **PowerSync publication is `FOR ALL TABLES`** (`powersync_setup.sql:34`) and default privileges grant SELECT on future tables (line 30) — so new tables auto-publish; you do NOT add them to the publication, you ONLY add RLS policies.
- **MIRROR REQUIREMENT:** every column added here must be added to `src/lib/schema.ts` in the same wave (RESEARCH Pitfall 1 — schema drift). Add `measurements` missing columns (`measured_at` already present; add `hips_cm`, `arms_cm`, `thighs_cm`, `notes`), `template_exercises.exercise_type`, and the four new tables.
- **Storage:** `progress-photos` (private, RLS `(storage.foldername(name))[1] = auth.uid()::text`) + `exercise-media` (public-read) buckets — created via CLI/dashboard, not auto-published.

---

### `src/lib/badgeRules.ts` + `useStreak.ts` (pure utilities)

**Analog:** `src/lib/sessionStats.ts`

Copy the "pure functions over plain arrays, no PowerSync coupling, divide-by-zero-safe, fully unit-testable" structure. `computeGoRate` (lines 44–49) is directly reusable for the Progress go-rate stat (PROGRESS-01).

```ts
export interface SetRowForStats { result: 'go' | 'no-go' | null; is_warmup: boolean; }
export function computeGoRate(sets: SetRowForStats[]): number {
  const working = sets.filter((s) => !s.is_warmup && s.result !== null);
  if (working.length === 0) return 0;
  const goCount = working.filter((s) => s.result === 'go').length;
  return Math.round((goCount / working.length) * 10000) / 100;
}
```
- `badgeRules.ts`: pure threshold-crossing functions (100 workouts, 30-day streak, first PR) — counters passed in, no DB scan (RESEARCH Pattern 8). Detection is called inside `completeSession`'s `writeTransaction`.
- `useStreak.ts`: thin hook that queries distinct `sessions.completed_at` then delegates to a pure `computeStreak(dates)` helper (RESEARCH Code Example 5 + `date-fns`).

---

## Shared Patterns

### PowerSync write (idempotency + atomicity)
**Source:** `src/services/sessionService.ts` lines 188–217 (single write), 278–299 (transaction)
**Apply to:** ALL service files (`templateService`, `historyService`, `programService`, photo metadata writes, badge inserts)
- `getPowerSync()` → `ps.execute()` for single statements, `ps.writeTransaction()` for multi-table.
- `INSERT OR REPLACE` keyed by client-generated UUID = idempotency.
- NEVER read `rowsAffected` (always 0 on success — Pitfall 4).
- Non-blocking try/catch + `console.warn` for local-SQLite writes; user flow never blocks.

### Reactive PowerSync read
**Source:** `src/hooks/useSessionData.ts` lines 21, 90–95, 198–205
**Apply to:** ALL read hooks. `usePowerSyncQuery<RowType>` re-fires on any local write — no manual invalidation. This is why HISTORY-03 (edits reflect in charts immediately) is free.

### Edge Function JWT validation
**Source:** `supabase/functions/migrate-v1-user/index.ts` lines 117–152
**Apply to:** `generate-program` Edge Function. anon client + `auth.getUser()` BEFORE any privileged work; service-role key never leaves the function.

### NativeWind styling + accessibility
**Source:** `src/components/Chip/index.tsx`, `src/components/ExerciseCard/index.tsx`
**Apply to:** ALL new components.
- `className` for everything; selected/active = `bg-accent-dim border-border-strong`, base = `bg-bg-elevated border-border`.
- `allowFontScaling={false}` on EVERY `<Text>`.
- `accessibilityRole` + `accessibilityState={{ selected }}` + `accessibilityLabel`.
- Hex `style=` only for documented exceptions: `#F2CA50` accent (verified `tailwind.config.js:22`), `#99907C` placeholder/muted icons, `#0A0A0B` bg (SafeAreaView/ActivityIndicator), SVG fills, `fontVariant: ['tabular-nums']`.

### Haptics on interaction
**Source:** `src/components/Chip/index.tsx` lines 39–44, `ExerciseSwapModal` lines 115–125
**Apply to:** all tappable rows/cards — `Haptics.impactAsync(Light)` for selection cards, `Haptics.selectionAsync()` for list-row taps, `Haptics.notificationAsync(Success)` for commit actions.

### FlashList for dense lists (MANDATE)
**Source:** `src/components/ExerciseSwapModal/index.tsx` lines 192–207, `app/(session)/index.tsx` lines 380–389
**Apply to:** template list, exercise search results, recent sessions list, photo grid, week grid. FlatList is a STATE.md blocker. v2: no `estimatedItemSize`. Never nest a FlashList inside a FlashList row (ExerciseCard:163 uses plain `View` children).

### Timed overlay → navigation handoff (badge toast)
**Source:** `src/components/AnubisOverlay/index.tsx` + `app/(session)/index.tsx` lines 204–240, 402–407
**Apply to:** `BadgeUnlockToast`. The badge key is detected in `completeSession`'s transaction, passed via navigation params, and the toast fires AFTER `AnubisOverlay.onFadeOutComplete → router.replace('/(tabs)/')` (D-13) — not during the Lottie.

---

## No Analog Found

Files with no close match — planner uses the cited RESEARCH.md pattern instead:

| File | Role | Data Flow | RESEARCH reference | Reason |
|------|------|-----------|--------------------|--------|
| `WeightProgressionChart` / `VolumeChart` components | component | render | Patterns 1 & 2 | No chart library used before; Victory Native XL + Skia is new. Verify `Line`/`Bar` props against installed `victory-native@41` types (A1). |
| `ExerciseVideoPlayer` (demo media) | component | media | Pattern 5 + Open Question 3 | No `expo-video` usage exists. ExerciseDB likely returns GIF not MP4 — plan `Image` (GIF) primary path. |
| `photoService.ts` (capture→compress→upload) | service | file-I/O | Pattern 7 | No `expo-image-picker`/`expo-image-manipulator`/Storage-upload precedent; metadata-write half copies `sessionService`. |
| `src/lib/chartStyles.ts` + chart tokens | config | — | RESEARCH structure | No `tokens.ts` exists yet; color constants currently live only in `tailwind.config.js`. Skia needs JS color constants (className doesn't reach the canvas). |
| `scripts/seed-exercises.ts` | script | batch | Pattern 5 | No build-time seed script exists; admin-client upsert loop borrows from `migrate-v1-user`. |
| `src/lib/__tests__/*.test.ts` (badgeRules, streak, volumeBucket, exerciseSearch) | test | — | Validation Architecture | No `src/lib/__tests__` dir exists yet (Wave 0 test gaps). |
| Font asset for Victory `useFont` | config/asset | — | A1 / Environment | `fontFamily: 'Manrope'` is referenced by string but NO `.ttf` asset or `useFonts` loader exists in the repo. Victory's `useFont(require('...ttf'))` needs a real bundled TTF — add as a Wave 0 asset. |

---

## Metadata

**Analog search scope:** `app/`, `src/components/`, `src/hooks/`, `src/services/`, `src/lib/`, `supabase/functions/`, `supabase/migrations/`, `tailwind.config.js`
**Files scanned:** ~20 read in full; full directory listing of all component/hook/service/lib dirs
**Verified facts:**
- `exercises` column is `muscle_group` not `primary_muscle` (migration:54, schema.ts:62) — `ExerciseSwapModal` has a latent bug.
- `measurements` order column is `measured_at` not `logged_at` — `useSessionData.ts:184` is a latent bug (RESEARCH Pitfall 1 confirmed).
- PowerSync publication is `FOR ALL TABLES` with default-privilege SELECT grant — new tables need RLS only, not publication edits.
- No `.ttf` font asset / `useFonts` loader in repo — Victory `useFont` is a real Wave 0 gap.
- `src/lib/tokens.ts` does NOT exist yet (RESEARCH structure assumes it as NEW).
**Pattern extraction date:** 2026-06-10
