# Raze and Rise — App Handoff

Use this document to rebuild the app from scratch in a new session. It captures every feature, data model, pattern, and design decision in the current codebase.

---

## Overview

**Raze and Rise** is a personal workout tracker and template manager built as a mobile-first React SPA. It lets the user run a structured training split (Push/Pull/Legs, Body-Part, Hybrid, Full Body, or AF PT Prep), track sets per session, log history, view progress analytics, calculate macros, and export workouts to Garmin Connect.

**Deployed at:** https://raze-and-rise.vercel.app  
**Vercel project:** `raze-and-rise` (run `vercel --prod` from `/Users/travismader/Desktop/Pioneer`, NOT from inside the project folder)  
**Supabase project ID:** `jmtogdlsgpfoefbgdubm` (named "Clay and Steel" in dashboard)  
**Admin email:** `travis.g.mader@gmail.com`

---

## Tech Stack

- **React 19 + Vite** — functional components, hooks only
- **CSS Modules** — one `.module.css` per component/page, no Tailwind classes used in practice
- **Supabase** — auth (email/password) + single `user_state` table for all persistence
- **No router** — page state managed via `useState('dashboard')` in App.jsx
- **No state management library** — all state flows down from App.jsx via props
- **XLSX** — for Excel template upload/parse
- **No external icon library** — SVGs are inline or omitted

---

## State Shape

All user data lives in a single JSON blob upserted to the `user_state` Supabase table on every state change.

```js
{
  onboarded: false,          // boolean — hides Onboarding overlay when true
  settings: {
    split: 'ppl',            // 'body-part' | 'ppl' | 'hybrid' | 'full-body' | 'af-pt'
    hybridSequence: ['Push', 'Pull', 'Legs'],   // array of string|string[] for hybrid mode
    weightMethod: 'manual',  // 'manual' | 'orm'
    splitStartedAt: null,    // ISO string — when current split was started
    splitPhase: 0,           // 0=Hypertrophy, 1=Strength, 2=Power
    fullBodyDays: 3,         // 2|3|4 — only for full-body split
  },
  exerciseOrm: {},           // { [exerciseName]: number } — stored 1RMs
  profile: {
    name: '', age: '', height: '', sex: '',
  },
  measurements: {
    weight: '', bodyFat: '', chest: '', waist: '', hips: '', arms: '', thighs: '',
  },
  oneRepMax: {
    benchPress: '', squat: '', deadlift: '', overheadPress: '', barbellRow: '', pullUp: '',
  },
  macroGoal: {
    goal: '',           // 'aggressive_cut' | 'cut' | 'lean_bulk' | 'bulk' | 'maintain' | 'recomp' | 'athlete'
    activityLevel: '',  // 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  },
  templates: {
    // keyed by dayLabel e.g. 'Push', 'Pull + Legs'
    [dayLabel]: {
      id: uuid,
      dayLabel: string,
      exercises: [{ id: uuid, name: string, sets: number, repLow: number, repHigh: number, type?: 'run' }]
    }
  },
  rotation: { pointer: 0 }, // index into the current split's day order
  session: null | {          // in-progress workout session
    dayLabel: string,
    startedAt: ISO,
    sets: {
      [exerciseId]: {
        name: string,          // may differ from template if exercise was swapped
        weight: number | null,
        orm: number | null,
        pct: number,           // % of ORM to use (default 70)
        results: (null | 'go' | 'no-go')[],  // one entry per set
      }
    }
  },
  history: [{                // completed workouts, appended on Complete
    id: uuid,
    dayLabel: string,
    startedAt: ISO,
    completedAt: ISO,
    sets: { [exerciseId]: { name, weight, results, ... } }
  }]
}
```

---

## Supabase Setup

Table: `user_state`
```sql
create table user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table user_state enable row level security;
create policy "Users manage own state" on user_state
  for all using (auth.uid() = user_id);
```

Auth: email + password only. No OAuth. `emailRedirectTo: window.location.origin` on signup.

---

## Pages

### Dashboard (default page)
- Shows today's workout based on `rotation.pointer` and the active split
- Builds a "composite template" — if split is PPL and pointer=0, loads the Push template
- Hybrid split supports multi-label days (e.g. Push+Pull combined)
- Renders one `ExerciseCard` per exercise in the template
- **Weight method: manual** — user types the weight per exercise
- **Weight method: ORM** — user enters their 1RM, slider for % (default 70%), weight auto-calculated
- Smart weight suggestion: checks last 3 sessions for that exercise name, suggests highest weight used if all sets were 'go'
- Exercise swap: tap swap icon → SwapModal opens → pick a substitution from 17 muscle-group categories
- Hero banner with motivational phrase (cycles through `lib/phrases.js` based on workout count)
- Garmin export: downloads a `.fit` file for the current day's exercises
- "Complete Workout" → WorkoutCompleteOverlay animation → appends to history, advances rotation pointer
- Skip day button when template is missing for current day

### Workouts
- Lists all saved workout templates
- "New Workout" builder: select day label(s), auto-populates with default exercises from `lib/defaults.js`
- Exercise rows: name input, sets number, rep range (low–high)
- Save validates: name not empty, sets 1–10, repLow ≤ repHigh
- Edit existing template in same builder UI
- Delete template (clears in-progress session if it matches)
- Tap any exercise name in template list to swap it via SwapModal (persists to template)
- Admin-only: bulk upload tab (Excel/JSON/CSV), parses via `lib/upload.js`

### Split (Settings → accessed via nav "gear" → then "Configure Split")
- Select split type: Body-Part (5 days), PPL (3), Hybrid (custom), Full Body (2–4 days), AF PT Prep (5 days)
- Hybrid builder: drag or pick sequence of day types
- Phase selector: Hypertrophy / Strength / Power (affects rep range guidance shown in Dashboard)
- Weight method toggle: Manual vs ORM
- "Start Split" button sets `splitStartedAt`
- Shows days on current split

### Progress
- Reads `state.history` to display:
  - Total workouts count
  - Current weekly streak (consecutive weeks with ≥1 workout)
  - Go-rate % across all sets
  - Personal records grid: best weight per exercise name across history
  - Recent workouts list: date, day label, go-rate
  - Weight progression line chart (SVG, no chart library)
  - Volume bar chart: sets × weight per session (SVG)

### Settings (gear page)
- Profile: name, age, height, sex
- Measurements: weight, body fat %, chest/waist/hips/arms/thighs
- One-rep maxes: 6 compound lifts
- **Macro calculator**: Mifflin-St Jeor BMR → TDEE with activity multiplier → adjusts for goal
  - 7 diet goals × 5 activity levels
  - LBM-based protein target (1g/lb lean body mass)
  - Displays: calories, protein, carbs, fat, fiber
  - Disclaimer shown below results
- Sign out button

### AuthPage
- Email + password login and signup on the same card
- Toggle between modes
- No OAuth, no "forgot password" flow currently

### AdminPanel (admin only, email === `travis.g.mader@gmail.com`)
- Reads all users' states from Supabase
- Shows: each user's email, total workouts, last active date, top 3 exercises by frequency

---

## Components

### Nav
- Bottom fixed bar with 5 tabs: Dashboard (home), Workouts (dumbbell), Split/Settings (calendar), Progress (chart), Gear (settings)
- Active tab highlighted
- Mobile-first, full-width

### ExerciseCard
- Shows exercise name, sets × rep range
- Weight input (manual mode) or ORM + % slider (ORM mode)
- Per-set go/no-go buttons (one per set, toggleable: null → 'go' → 'no-go' → null)
- Swap button (hidden for type='run' exercises)

### SwapModal
- Bottom sheet modal
- Groups alternative exercises by muscle category (17 groups in `lib/substitutions.js`)
- Search/filter by name
- Tap to select and close

### WorkoutCompleteOverlay
- Full-screen animation on workout complete
- Two variants: 'subtle' (currently used — gentle fade/text animation)
- Calls `onDone` to commit the session to history

### LoadingScreen
- Shown on first app load while Supabase session is checked
- Animated, calls `onDone` after animation completes

### Onboarding
- Multi-step wizard shown when `state.onboarded === false`
- Collects: name, split type, starting weight
- Sets `onboarded: true` on finish

---

## Key Library Files

### `lib/split.js`
- `VALID_LABELS` — `['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Push', 'Pull']`
- `deriveDayOrder(settings)` — returns array of label arrays for the active split
- `currentDayLabels(state)` — returns today's labels based on rotation pointer
- `PHASE_META` — names/descriptions for Hypertrophy, Strength, Power phases
- `SPLIT_OPTIONS` — the 5 split types available in UI

### `lib/defaults.js`
- `DEFAULTS` — default exercise lists keyed by day label
- Provides starting exercises when user creates a new template

### `lib/progress.js`
- `suggestWeight(exerciseName, history)` — looks at last 3 sessions, returns highest weight if all sets were 'go', else null

### `lib/substitutions.js`
- 17 muscle-group categories, each with a list of interchangeable exercise names
- Used by SwapModal to show relevant alternatives

### `lib/macros.js`
- Full macro calculator: BMR → TDEE → goal adjustment → macros
- `calculateMacros({ weight, height, age, sex, activityLevel, goal, bodyFat })`

### `lib/upload.js`
- `validateTemplate(raw)` — validates and normalizes a template object
- `parseUpload(file)` — parses Excel/JSON/CSV to array of template objects

### `lib/garmin.js`
- `downloadWorkoutFit(dayLabel, exercises)` — generates a binary `.fit` file and triggers download
- Uses FIT protocol binary encoding with no external dependencies

### `lib/afpt.js`
- Air Force PT scoring tables (age/sex specific)
- 6-week progressive program builder
- HAMR shuttle run + 2-mile run cardio options
- HR zone calculations

### `lib/phrases.js`
- `getPhraseForWorkout(workoutCount)` — returns a motivational phrase based on milestone

---

## Known Shortfalls / Things to Improve

1. **No rest timer** — no countdown between sets; users have to use their phone clock
2. **No notes per set** — can't annotate a specific set (e.g. "felt easy", form cue)
3. **No bodyweight/assisted exercise handling** — weight field is just a number, no "+BW" option
4. **Onboarding is thin** — only captures name + split; doesn't walk through creating a first template
5. **No superset support** — exercises are always sequential, no pairing
6. **History can't be edited** — if you complete with wrong data, no way to correct it
7. **No deload week logic** — phase cycling is manual; no auto-deload after N weeks
8. **Progress charts are SVG-only** — no date filtering, no zoom, no export
9. **Split page is confusingly named** — accessed via "Settings" nav but labeled "Split"
10. **No push notifications or reminders** — no "time to work out" prompts
11. **No offline support** — fully dependent on Supabase being reachable
12. **Anubis secondary app** — exists in the codebase (`AnubisApp.jsx`, `SplashScreen`, `GrandHall`, `ArtifactDetail`) but is a separate, unrelated UI and can be removed in a rebuild

---

## Auth & Persistence Pattern

```js
// App.jsx pattern — replicate exactly in any rebuild
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
    setAuthReady(true)
  })
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const next = session?.user ?? null
    setUser(next)
    if (!next) { stateLoaded.current = false; setState(defaultState()) }
  })
  return () => subscription.unsubscribe()
}, [])

// Load on login
useEffect(() => {
  if (!user) return
  supabase.from('user_state').select('state').eq('user_id', user.id).maybeSingle()
    .then(({ data }) => {
      if (data?.state) setState({ ...defaultState(), ...data.state })
      stateLoaded.current = true
    })
}, [user?.id])

// Persist on every change (guard: only after initial load)
useEffect(() => {
  if (!user || !stateLoaded.current) return
  supabase.from('user_state').upsert({ user_id: user.id, state, updated_at: new Date().toISOString() }).then()
}, [state])
```

---

## Design

- **Dark theme** with CSS custom properties on `:root`
- **Mobile-first**, optimized for ~390px width (iPhone)
- **Fixed bottom nav**, page content padded to avoid overlap
- CSS Modules — classes are local, no global class collisions
- Transitions on buttons (150ms ease), subtle hover states
- No external design system or component library

---

## User Data Migration

All user data lives in the `user_state` table in the Supabase project `jmtogdlsgpfoefbgdubm`. Each row is one user: `user_id` (uuid) + `state` (jsonb blob).

### If the rebuilt app keeps the same state shape

No migration needed. Point the new app at the same Supabase project and table. Existing users log in and their history, templates, settings, and measurements load immediately.

### If the rebuilt app changes the state shape

Run a migration script **before** deploying the new app. The script reads every user's old state, transforms it, and writes it back. Use the Supabase service role key (not the anon key) so RLS is bypassed.

**Migration script template (Node.js):**

```js
// migrate.mjs
// Run with: node migrate.mjs
// Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS
)

function migrate(oldState) {
  // TODO: transform oldState to new shape here
  // Example: rename a field
  //   const { oldField, ...rest } = oldState
  //   return { ...rest, newField: oldField }
  return oldState
}

async function run() {
  // Fetch all rows
  const { data: rows, error } = await supabase
    .from('user_state')
    .select('user_id, state')

  if (error) { console.error('Fetch failed:', error); process.exit(1) }

  console.log(`Migrating ${rows.length} users…`)

  for (const row of rows) {
    const newState = migrate(row.state)
    const { error: writeErr } = await supabase
      .from('user_state')
      .update({ state: newState, updated_at: new Date().toISOString() })
      .eq('user_id', row.user_id)

    if (writeErr) {
      console.error(`Failed for user ${row.user_id}:`, writeErr)
    } else {
      console.log(`✓ ${row.user_id}`)
    }
  }

  console.log('Done.')
}

run()
```

**To get the service role key:** Supabase dashboard → Project Settings → API → `service_role` secret key. Never expose this in client-side code or commit it.

### Fields most likely to need migration

If the rebuild changes these, update the `migrate()` function above:

| Field | Current shape | Notes |
|---|---|---|
| `history[].sets` | `{ [exerciseId]: { name, weight, results, pct, orm } }` | exerciseId keys are UUIDs from the template at session time |
| `templates` | `{ [dayLabel]: { id, dayLabel, exercises[] } }` | dayLabel is the string key e.g. `"Push"` |
| `settings.split` | `'ppl' \| 'body-part' \| 'hybrid' \| 'full-body' \| 'af-pt'` | If new splits are added, old users default to their stored value |
| `session` | in-progress workout or `null` | Safe to null out during migration if structure changes |
| `rotation.pointer` | integer index | Safe to reset to 0 if split structure changes |

### Safe defaults for new fields

When the new app loads an old state blob, spread it over `defaultState()` so any new fields the old blob is missing get their default values:

```js
const loaded = { ...defaultState(), ...data.state }
```

This is already the pattern in the current `App.jsx` and should be kept in any rebuild.

---

## Environment

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Stored in `.env` at project root. Vercel has these set via the dashboard for the `raze-and-rise` project.

Deploy command: `vercel --prod` run from `/Users/travismader/Desktop/Pioneer/` (NOT from inside `Raze and Rise/` — rootDirectory is set in vercel.json and doubles the path if you're already in the subfolder).
