# Architecture Research — Raze and Rise v2

**Researched:** 2026-05-18
**Overall confidence:** HIGH for core patterns, MEDIUM for wearable APIs, LOW for Apple Watch native module specifics

---

## Data Model

### Design Principle

Normalized tables — one row per atomic fact. This unlocks: offline conflict resolution by session ID, editable history, per-exercise analytics, and RLS-enforced premium gating. The v1 JSON blob cannot do any of these.

### Core Tables

```sql
-- Identity
profiles (
  user_id uuid PK references auth.users,
  name text,
  age int,
  height_cm real,
  sex text,
  created_at timestamptz,
  updated_at timestamptz
)

-- Subscription (synced from Stripe webhook)
subscriptions (
  user_id uuid PK references auth.users,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text CHECK(tier IN ('free', 'premium')),
  status text, -- active | canceled | past_due | trialing
  current_period_end timestamptz,
  updated_at timestamptz
)

-- Exercise library (shared across users, admin-managed)
exercises (
  id uuid PK,
  name text NOT NULL,
  muscle_group text,   -- chest | back | legs | shoulders | arms | core | cardio
  equipment text,      -- barbell | dumbbell | cable | bodyweight | machine | cardio
  type text,           -- strength | bodyweight | run | cardio
  exercisedb_video_id text,  -- ExerciseDB API reference
  is_custom boolean DEFAULT false,
  created_by uuid references auth.users,  -- null = built-in
  created_at timestamptz
)

-- User's custom exercises inherit the exercises table via created_by
-- RLS: SELECT where is_custom = false OR created_by = auth.uid()

-- Workout templates
templates (
  id uuid PK,
  user_id uuid references auth.users,
  day_label text NOT NULL,   -- Push | Pull | Legs | Chest | etc.
  name text,
  created_at timestamptz,
  updated_at timestamptz
)

-- Exercises within a template (ordered list)
template_exercises (
  id uuid PK,
  template_id uuid references templates,
  exercise_id uuid references exercises,
  position int NOT NULL,     -- display order
  sets int NOT NULL,
  rep_low int,
  rep_high int,
  superset_group int,        -- null = solo; same int = paired superset
  default_rest_seconds int,  -- per-exercise rest override; null = use global default
  created_at timestamptz
)

-- Multi-week programs
programs (
  id uuid PK,
  user_id uuid references auth.users,
  name text,
  description text,
  weeks int,
  is_ai_generated boolean DEFAULT false,
  created_at timestamptz
)

program_weeks (
  id uuid PK,
  program_id uuid references programs,
  week_number int,
  phase text   -- hypertrophy | strength | power | deload
)

program_days (
  id uuid PK,
  program_week_id uuid references program_weeks,
  day_of_week int,   -- 0=Mon ... 6=Sun
  template_id uuid references templates
)

-- User split settings (single active row per user)
split_settings (
  user_id uuid PK references auth.users,
  split_type text,          -- ppl | body-part | hybrid | full-body | af-pt
  rotation_pointer int DEFAULT 0,
  phase int DEFAULT 0,      -- 0=hypertrophy 1=strength 2=power
  phase_started_at timestamptz,
  weeks_in_phase int DEFAULT 0,
  deload_active boolean DEFAULT false,
  global_rest_seconds int DEFAULT 90,
  weight_method text DEFAULT 'manual',
  updated_at timestamptz
)

-- Active/in-progress workout session (at most one per user)
sessions (
  id uuid PK,               -- THIS is the conflict resolution key
  user_id uuid references auth.users,
  template_id uuid references templates,
  day_label text,
  started_at timestamptz,
  completed_at timestamptz,  -- null = in progress
  notes text,
  is_deleted boolean DEFAULT false,
  synced_at timestamptz      -- last sync timestamp (offline-first tracking)
)

-- Sets within a session
session_sets (
  id uuid PK,
  session_id uuid references sessions,
  exercise_id uuid references exercises,
  exercise_name text,        -- snapshot at session time (exercise may rename later)
  set_number int,
  weight_kg real,
  reps_target int,
  result text CHECK(result IN ('go', 'no-go', NULL)),
  rpe int CHECK(rpe BETWEEN 1 AND 10),
  is_warmup boolean DEFAULT false,
  is_superset boolean DEFAULT false,
  notes text,                -- quick tags and free text
  logged_at timestamptz
)

-- Bodyweight measurements (timestamped history)
measurements (
  id uuid PK,
  user_id uuid references auth.users,
  measured_at timestamptz NOT NULL,
  weight_kg real,
  body_fat_pct real,
  chest_cm real,
  waist_cm real,
  hips_cm real,
  arms_cm real,
  thighs_cm real,
  notes text
)

-- 1RMs per exercise (timestamped)
one_rep_maxes (
  id uuid PK,
  user_id uuid references auth.users,
  exercise_id uuid references exercises,
  weight_kg real,
  measured_at timestamptz
)

-- Progress photos
progress_photos (
  id uuid PK,
  user_id uuid references auth.users,
  storage_path text NOT NULL,  -- Supabase Storage path
  thumbnail_path text,
  taken_at timestamptz,
  notes text,
  created_at timestamptz
)

-- Meal plans (AI-generated, cached for offline)
meal_plans (
  id uuid PK,
  user_id uuid references auth.users,
  week_start date,
  generated_at timestamptz,
  content jsonb,    -- structured: { days: [{ meals: [{ name, macros, recipe }] }] }
  macro_targets jsonb
)

-- Supplements
supplements (
  id uuid PK,
  user_id uuid references auth.users,
  name text,
  timing text,       -- morning | pre-workout | post-workout | evening
  reminder_time time,
  active boolean DEFAULT true
)

supplement_logs (
  id uuid PK,
  supplement_id uuid references supplements,
  user_id uuid references auth.users,
  logged_date date,
  taken boolean DEFAULT false
)

-- Habits (sleep, steps, recovery)
habit_logs (
  id uuid PK,
  user_id uuid references auth.users,
  logged_date date NOT NULL,
  steps int,
  sleep_hours real,
  recovery_score real,   -- 0-100, sourced from wearable or manual
  recovery_source text,  -- whoop | hrv | manual
  UNIQUE(user_id, logged_date)
)

-- AI coach conversation history
coach_conversations (
  id uuid PK,
  user_id uuid references auth.users,
  started_at timestamptz
)

coach_messages (
  id uuid PK,
  conversation_id uuid references coach_conversations,
  role text CHECK(role IN ('user', 'assistant')),
  content text,
  token_count int,
  created_at timestamptz
)

-- Wearable connections
wearable_connections (
  id uuid PK,
  user_id uuid references auth.users,
  provider text CHECK(provider IN ('apple_health', 'garmin', 'whoop', 'fitbit', 'suunto')),
  access_token text,     -- encrypted at rest
  refresh_token text,    -- encrypted at rest
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  scopes jsonb,
  active boolean DEFAULT true
)

-- Notification preferences
notification_preferences (
  user_id uuid PK references auth.users,
  workout_reminder_enabled boolean DEFAULT true,
  workout_reminder_time time,   -- seed; smart timing overrides over time
  pr_alerts_enabled boolean DEFAULT true,
  weekly_summary_enabled boolean DEFAULT true,
  meal_reminders_enabled boolean DEFAULT false,
  updated_at timestamptz
)
```

### Key Relationships

```
profiles 1---1 subscriptions
profiles 1---N templates ---N template_exercises N---1 exercises
profiles 1---N sessions ---N session_sets N---1 exercises
profiles 1---N measurements
profiles 1---N one_rep_maxes N---1 exercises
profiles 1---N progress_photos
profiles 1---N meal_plans
profiles 1---N supplements ---N supplement_logs
profiles 1---N habit_logs
profiles 1---N coach_conversations ---N coach_messages
profiles 1---N wearable_connections
profiles 1---1 split_settings
profiles 1---N programs ---N program_weeks ---N program_days N---1 templates
```

### RLS Patterns

Every user-scoped table gets: `USING (user_id = auth.uid())`.

The `exercises` table uses a union policy: built-in exercises visible to all authenticated users, custom exercises only visible to their creator.

Premium tables (`meal_plans`, `coach_conversations`, `coach_messages`) enforce premium status via a helper function:

```sql
CREATE OR REPLACE FUNCTION is_premium()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'subscription_tier') = 'premium'
$$ LANGUAGE sql STABLE;

-- Applied to meal_plans
CREATE POLICY "premium_only" ON meal_plans
  FOR ALL USING (user_id = auth.uid() AND is_premium());
```

---

## Offline Sync Pattern

### Recommendation: PowerSync over WatermelonDB

**Use PowerSync** (`@powersync/react-native` + OP-SQLite adapter).

Rationale vs WatermelonDB:
- PowerSync reads Postgres WAL directly — no backend sync functions to write or maintain
- WatermelonDB requires three schemas to stay in sync (Supabase, WatermelonDB, sync RPCs) — a maintenance burden when the data model is still evolving in early phases
- PowerSync is schemaless on the client — no client-side migrations during rapid development
- PowerSync has causal+ consistency; WatermelonDB uses "latest write wins" which can lose data
- PowerSync has a native Expo + Supabase example with background sync support via `powersync-react-native-expo-background-sync`

**Limitation:** PowerSync is a paid service (free tier available). For a single-user app the free tier is more than sufficient.

### Sync Architecture

```
Device (Expo app)
  └── PowerSync SQLite (local DB)
        ├── READ: all queries go to local SQLite — instant, offline-capable
        └── WRITE: writes go to local SQLite first, then:
              └── uploadData() → Supabase REST/RPC (when online)

PowerSync Service
  └── Reads Postgres WAL from Supabase
  └── Streams scoped updates down to device via sync rules
```

### Session-ID Conflict Resolution

Each workout session gets a `uuid` generated client-side at session start. This is the primary conflict resolution mechanism:

- Session rows are immutable once `completed_at` is set. A second device uploading the same session ID is a no-op (idempotent upsert).
- In-progress session conflicts (two devices, same in-progress session): last-write-wins is acceptable since a user won't simultaneously log sets on two devices in practice.
- `session_sets` are keyed by their own UUID. If the same set is logged twice with the same ID, the upsert updates it. Different IDs = two different set records (user error, resolvable via history edit).

PowerSync's `uploadData()` method handles the write queue with automatic retry. Configure it to use Supabase's `upsert` with `on_conflict` on the session's `id`:

```typescript
// backend connector
async uploadData(database: AbstractPowerSyncDatabase) {
  const tx = await database.getNextCrudTransaction();
  for (const op of tx.crud) {
    if (op.op === 'PUT') {
      await supabase.from(op.table).upsert(op.opData, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    } else if (op.op === 'DELETE') {
      // Soft-delete: set is_deleted = true, never hard delete
      await supabase.from(op.table)
        .update({ is_deleted: true })
        .eq('id', op.id);
    }
  }
  await tx.complete();
}
```

**Soft deletes are mandatory** — hard deletes cause divergence between devices and are not recoverable in PowerSync's model.

### Offline Coverage

- All workout logging: fully offline
- Weight suggestions, PR calculations: fully offline (computed from local SQLite)
- AI features: require connection (Claude API calls cannot be cached meaningfully)
- Wearable sync: on-demand when online; cached locally after first pull

---

## API Integration Layer

### Claude API — Use Supabase Edge Functions as Proxy (Not Direct from Client)

Never call the Claude API directly from React Native. Reasons:

1. **API key exposure**: Any key in client bundle is extractable, even in production builds
2. **Rate limiting**: Edge Function can enforce per-user request limits against Upstash Redis
3. **Cost control**: Edge Function validates premium status before issuing Claude requests
4. **Token budget enforcement**: Edge Function trims context before sending to stay within budget
5. **Streaming**: Edge Function streams SSE back to the client; Supabase Edge Functions support this natively

### Edge Function Architecture

```
Client (React Native)
  └── POST /functions/v1/ai-chat
        Headers: Authorization: Bearer <supabase_jwt>
        Body: { conversationId, message, context }

Edge Function: ai-chat
  1. Verify JWT (supabase-js validates automatically)
  2. Check subscription tier from JWT app_metadata.subscription_tier
  3. Rate limit check via Upstash Redis (N requests/day per user)
  4. Fetch conversation history from coach_messages (last N messages)
  5. Build context bundle (workout summary, measurements)
  6. POST to api.anthropic.com/v1/messages with stream: true
  7. Stream SSE response back to client
  8. Persist assistant message to coach_messages on completion
```

### Streaming in React Native

React Native does not have native SSE (`EventSource`) support. Use `expo-fetch` or a polyfill:

```typescript
// Using fetch with streaming text decoder
const response = await fetch(edgeFunctionUrl, {
  method: 'POST',
  headers: { Authorization: `Bearer ${session.access_token}` },
  body: JSON.stringify(payload)
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  // Parse SSE lines: "data: {...}\n\n"
  const lines = buffer.split('\n\n');
  buffer = lines.pop() ?? '';
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = JSON.parse(line.slice(6));
      if (json.type === 'content_block_delta') {
        appendTokenToUI(json.delta.text);
      }
    }
  }
}
```

### Rate Limiting

Use Upstash Redis in the Edge Function. Enforce per user per day:

```typescript
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit'
import { Redis } from 'https://esm.sh/@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 d'), // 20 AI requests per day
})

const { success } = await ratelimit.limit(userId)
if (!success) return new Response('Rate limit exceeded', { status: 429 })
```

### MyFitnessPal Integration

The MFP public API was deprecated in 2020 and now requires a partner agreement. Architecture decision: design the integration using an abstraction layer (`NutritionProvider` interface) that can slot in MFP when API access is resolved, with a manual macro entry fallback for launch. Do not block features on MFP API access.

---

## Premium Gate Architecture

### Three-Layer Defense

**Layer 1: JWT claim (source of truth)**

Stripe webhooks hit an Edge Function that writes subscription status to the `subscriptions` table. A Supabase Auth Hook reads this table and injects `app_metadata.subscription_tier = 'premium'` into every JWT at token issuance.

```sql
-- Auth Hook: custom_access_token
CREATE OR REPLACE FUNCTION custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  tier text;
BEGIN
  SELECT s.tier INTO tier
  FROM subscriptions s
  WHERE s.user_id = (event->>'user_id')::uuid
    AND s.status = 'active';

  IF tier IS NOT NULL THEN
    event := jsonb_set(event,
      '{claims,app_metadata,subscription_tier}',
      to_jsonb(tier));
  END IF;
  RETURN event;
END;
$$ LANGUAGE plpgsql;
```

**Layer 2: RLS policies (server enforcement)**

Premium-only tables (`meal_plans`, `coach_conversations`) have RLS policies that call `is_premium()`. Even if a client bypasses the UI gate, it cannot read or write premium data.

**Layer 3: Edge Function check (AI cost enforcement)**

Before any Claude API call, the Edge Function re-checks `app_metadata.subscription_tier` from the validated JWT. No JWT manipulation can fake this because the JWT is signed with Supabase's private key.

**Client-side gates are UI only** — they show upgrade prompts and are not a security boundary. Never rely on client-side premium checks to prevent API calls.

### JWT Expiry Consideration

JWTs are short-lived (1 hour default). If a subscription lapses mid-session, the next token refresh will not include `premium` in `app_metadata`. The client should handle 402/403 responses from the Edge Function gracefully by redirecting to the upgrade screen.

---

## Wearable Sync Architecture

### Access Patterns by Provider

| Provider | API Type | OAuth | Data Available | Rate Limits |
|----------|----------|-------|----------------|-------------|
| Apple HealthKit | Native iOS SDK | Permission modal | HRV, sleep, steps, HR, workouts | None (local read) |
| Garmin | REST + Developer Program | OAuth 2.0 | Activities, HR, recovery | Application approval required |
| Whoop | REST | OAuth 2.0 | Recovery, strain, sleep | Newer API, partnership may be required |
| Fitbit | REST | OAuth 2.0 | Activity, sleep, HR | 150 req/hr |
| Suunto | REST | OAuth 2.0 | Activities | Developer registration required |

### Architecture

Two separate sync paths exist:

**Path A: HealthKit (iOS native, no network)**

Use `react-native-health` with Expo custom dev client (NOT Expo Go — native modules not supported there).

```typescript
// Platform-specific: ios/HealthKitService.ts
import AppleHealthKit, { HealthValue } from 'react-native-health';

const PERMISSIONS = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRateVariabilitySDNN,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.HeartRate,
    ]
  }
};
```

Apple Watch data flows through HealthKit automatically — if the user has a Watch, all Watch health data is available via the iOS HealthKit store. You read it from one place.

**Path B: Cloud REST APIs (Garmin, Whoop, Fitbit, Suunto)**

OAuth tokens stored in `wearable_connections` table (access/refresh tokens encrypted at rest via Supabase Vault or pgcrypto). A Supabase Edge Function (`wearable-sync`) handles:

1. Token refresh when expired
2. Fetching new data from provider REST APIs
3. Normalizing to the `habit_logs` schema
4. Upserting to Supabase

```
wearable-sync Edge Function
  └── Called: on-demand (user taps "Sync Now") OR
              scheduled via pg_cron (daily 6am) for background pull
  └── For each active wearable_connection:
        1. Refresh token if expired
        2. Fetch data since last_synced_at
        3. Normalize to { steps, sleep_hours, recovery_score }
        4. Upsert to habit_logs
        5. Update last_synced_at
```

### Normalization Contract

All wearable data maps to the same fields in `habit_logs`. Provider-specific rich data (Whoop detailed cycles, Garmin activity files) can be stored in a `raw_wearable_data jsonb` column for future use without blocking the normalized path.

### Background Sync Strategy

iOS enforces minimum 15-minute intervals for background tasks and the system can defer them further. Do not rely on background task timing for UX-critical features.

- **HealthKit reads:** On-demand at app foreground, after workout completion (post-workout HR pull)
- **Cloud APIs:** On-demand via "Sync" button + pg_cron daily scheduled Edge Function
- **Background task:** `expo-background-task` as a best-effort enhancement for when the app is woken by the OS; not the primary sync path

---

## Push Notification Architecture

### Scheduling Logic Lives in Two Places

**Client-side (one-time schedule):**
- Rest timer notifications — scheduled via `Notifications.scheduleNotificationAsync` immediately after set completion; cancelled if user manually ends rest
- PR celebration — triggered client-side immediately post-workout when a PR is detected in local SQLite

**Server-side (pg_cron + Edge Function):**
- Workout reminders — scheduled daily by Edge Function `send-workout-reminders` via Expo Push API
- Weekly summary — pg_cron triggers Sunday evening
- Meal reminders — scheduled by Edge Function when a meal plan is generated

### Smart Timing

The "learns from history" timing works by tracking `session.started_at` values in the local SQLite. On the server side, the `notification_preferences` table stores the user's explicit preferred time as a seed. A weekly Edge Function job:

1. Queries the last 8 `sessions.started_at` values
2. Computes a median "workout start hour"
3. If median differs from stored preference by more than 30 minutes, updates `workout_reminder_time`
4. Schedules the next week's push tokens via Expo Push API

Expo Push Notifications require an Expo push token (`getExpoPushTokenAsync`), which must be stored per-device in a `push_tokens` table (one user can have multiple devices):

```sql
push_tokens (
  id uuid PK,
  user_id uuid references auth.users,
  token text NOT NULL,
  platform text CHECK(platform IN ('ios', 'android')),
  created_at timestamptz,
  UNIQUE(token)
)
```

---

## AI Coach Chat — Context Strategy

### Do NOT use full history in every prompt

A user with 6 months of workouts will have hundreds of messages. Sending the full history to Claude Sonnet costs money and adds latency.

### Recommended: Sliding Window + Structured Context Bundle

```
System prompt (fixed ~800 tokens):
  - Role: personal coach for [name]
  - Current split, phase, week in phase
  - Macro targets
  - Any active injuries/flags

Structured context bundle (computed, ~1000 tokens):
  - Last 5 completed sessions (date, exercises, weights, go-rate)
  - Current body measurements
  - Recovery score (latest from habit_logs)
  - Active program if any

Conversation window (last 20 messages, capped at ~4000 tokens):
  - Oldest messages pruned when window full

New user message
```

Total budget per request: ~6000 input tokens. At Claude Sonnet pricing, this is well under $0.02/request — appropriate for a 20 req/day premium limit.

### Context Pruning

When `coach_messages` in a conversation exceeds 30 messages, prune from the oldest. The Edge Function computes this before building the prompt — it does not store a summary (summaries lose detail that matters for coaching continuity). Token counting is done with a lightweight approximation (1 token ≈ 4 chars) before sending.

### Conversation Architecture

Each premium user has one active `coach_conversations` record. Conversations do not auto-reset — continuity matters for coaching. If the user wants a fresh start, they can "New Conversation" which creates a new record; old conversations are archived but preserved.

---

## File Storage — Progress Photos

### Upload Flow

```typescript
// 1. Pick image
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.8,
});

// 2. Compress before upload (expo-image-manipulator)
import * as ImageManipulator from 'expo-image-manipulator';
const compressed = await ImageManipulator.manipulateAsync(
  result.assets[0].uri,
  [{ resize: { width: 1080 } }],
  { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
);

// 3. Upload to Supabase Storage
const path = `${userId}/${Date.now()}.jpg`;
const { error } = await supabase.storage
  .from('progress-photos')
  .upload(path, {
    uri: compressed.uri,
    type: 'image/jpeg',
    name: `${Date.now()}.jpg`
  } as any);

// 4. Store reference in progress_photos table
await supabase.from('progress_photos').insert({
  user_id: userId,
  storage_path: path,
  taken_at: new Date().toISOString()
});
```

### Storage Bucket Structure

```
progress-photos/
  {user_id}/
    {timestamp}.jpg
    {timestamp}-thumb.jpg   (generated via Edge Function or client resize)
```

RLS on the bucket: users can only read/write their own folder using `user_id` path prefix matching.

Thumbnails are generated client-side at upload time (resize to 300px width) — no server-side image processing needed.

### CDN Delivery

Supabase Storage serves files via a Cloudflare CDN. For the comparison view, use `getPublicUrl()` which returns the CDN URL. For private photos (recommended), use `createSignedUrl()` with a 1-hour expiry — generate URLs on the fly when the photos screen opens, not stored in the database.

---

## Monorepo Structure

### Single Expo App, No Separate Web App

The project spec calls for one Expo codebase for iOS, Android, and Web. Do not split into a monorepo with a separate Next.js app — that multiplies complexity without benefit for a single-developer, single-user product.

### Directory Structure

```
raze-and-rise-v2/
  app/                    # Expo Router file-based routes
    (auth)/
      login.tsx
      signup.tsx
    (app)/
      _layout.tsx         # Tab navigator
      dashboard/
        index.tsx
      workouts/
        index.tsx
        [id].tsx
      split/
        index.tsx
      progress/
        index.tsx
      settings/
        index.tsx
    +not-found.tsx
  src/
    components/           # Shared UI components
      ExerciseCard/
      RestTimer/
      SetRow/
      PRBadge/
    lib/
      db.ts               # PowerSync instance
      supabase.ts         # Supabase client
      claude.ts           # AI Edge Function caller
    hooks/
      useWorkoutSession.ts
      useWearableSync.ts
      useSubscription.ts
    services/
      healthkit.ios.ts    # Platform-specific (Metro picks up .ios.ts)
      healthkit.android.ts
      wearable/
        garmin.ts
        whoop.ts
        fitbit.ts
    types/
      db.ts               # Generated from Supabase schema
      workout.ts
  supabase/
    functions/
      ai-chat/
        index.ts
      wearable-sync/
        index.ts
      send-workout-reminders/
        index.ts
      stripe-webhook/
        index.ts
    migrations/
      001_initial_schema.sql
      002_migrate_v1_data.sql
  tests/
    e2e/                  # Playwright (web target)
    unit/                 # Vitest
```

### Platform-Specific Code

Metro bundler resolves `.ios.ts`, `.android.ts`, `.native.ts`, `.web.ts` suffixes automatically. Use this for HealthKit vs Health Connect:

```typescript
// src/services/healthkit.ios.ts  — HealthKit
// src/services/healthkit.android.ts  — Health Connect
// src/services/healthkit.web.ts  — stub (no-op)
```

The main import `import HealthService from '@/services/healthkit'` resolves to the right file per platform.

### Web-Specific Concerns

Expo Router web builds as a React SPA or SSR app. Service Worker for PWA offline is handled via Expo's built-in PWA support (`web.serviceWorker: true` in `app.json`). Playwright E2E tests run against the web build in CI.

---

## Migration from v1

### State of v1

- Table: `user_state` (user_id uuid PK, state jsonb, updated_at timestamptz)
- Single JSON blob per user in the same Supabase project (`jmtogdlsgpfoefbgdubm`)
- Live in production at raze-and-rise.vercel.app

### Strategy: Expand-and-Contract, Zero-Downtime

The v1 app and v2 app run on separate Vercel URLs pointing at the same Supabase project. v1 continues writing the JSON blob. The migration creates v2 tables without touching v1's `user_state` table.

**Phase 1: Create v2 schema (non-destructive)**
Run migration SQL to create all v2 tables. The `user_state` table is untouched. v1 keeps working.

**Phase 2: Backfill script (one-time, before v2 launch)**
A Node.js script (service role key, bypasses RLS) reads each user's JSON blob and inserts rows into the v2 normalized tables:

```typescript
// migrate-v1.mjs
for (const row of allUsers) {
  const state = row.state;
  const userId = row.user_id;

  // Profile
  await supabase.from('profiles').upsert({
    user_id: userId,
    name: state.profile?.name,
    age: state.profile?.age ? parseInt(state.profile.age) : null,
    height_cm: parseHeight(state.profile?.height),
    sex: state.profile?.sex,
  }, { onConflict: 'user_id' });

  // Latest measurement snapshot
  if (state.measurements?.weight) {
    await supabase.from('measurements').insert({
      user_id: userId,
      measured_at: state.updated_at,
      weight_kg: kgFromLbs(parseFloat(state.measurements.weight)),
      body_fat_pct: parseFloat(state.measurements.bodyFat) || null,
      // ... other fields
    });
  }

  // Templates
  for (const [dayLabel, template] of Object.entries(state.templates ?? {})) {
    // insert template + template_exercises
  }

  // History → sessions + session_sets
  for (const entry of state.history ?? []) {
    // Each history entry becomes one sessions row + N session_sets rows
    // session.id = entry.id (preserve the UUID, enables idempotent re-runs)
  }

  // Split settings
  await supabase.from('split_settings').upsert({
    user_id: userId,
    split_type: state.settings?.split,
    rotation_pointer: state.rotation?.pointer ?? 0,
    phase: state.settings?.splitPhase ?? 0,
    // ...
  }, { onConflict: 'user_id' });
}
```

Key migration decisions:
- `history[].id` maps directly to `sessions.id` — same UUID, idempotent
- v1 `measurements` is a single snapshot; backfill as one row with `measured_at = updated_at`
- v1 `session.sets` keyed by exercise UUID: becomes `session_sets` rows with `exercise_name` snapshot
- v1 ORM exercises: insert as `one_rep_maxes` rows with `measured_at = updated_at`

**Phase 3: Verify**
Query both tables and compare counts. Cross-check workout history counts per user.

**Phase 4: Cutover**
Point the domain at v2. Keep v1 URL alive for 30 days as fallback. The `user_state` table is kept but no longer written by anything — it becomes a read-only backup. Drop it after 60 days.

**No dual-write period needed**: This is a single user (personal use). The cutover is a deliberate switch, not a gradual traffic split.

---

## Apple Watch Companion App

### Verdict: Native Module Required

You cannot write an Apple Watch app in React Native or JavaScript. The watch app must be written in SwiftUI. Communication with the React Native iOS app goes through Apple's `WatchConnectivity` framework.

### Implementation Path

1. **Watch app**: Minimal SwiftUI app displaying current exercise, set count, rest timer, and go/no-go buttons
2. **Bridge**: `react-native-watch-connectivity` or `expo-watch-connectivity` (Expo module wrapping WatchConnectivity) — the Expo module is community-maintained but active
3. **Data flow**:

```
React Native (iOS) ←→ WatchConnectivity ←→ watchOS SwiftUI
  │                                              │
  │ sendMessage({                                │ receives exercise
  │   exercise: "Bench Press",                  │ name, set count,
  │   currentSet: 3,                            │ timer state
  │   totalSets: 4,
  │   restSeconds: 90
  │ })
  │
  │ receives from watch:
  │   { type: 'SET_COMPLETE', result: 'go' }
  │   { type: 'REST_SKIP' }
```

4. **Build requirement**: Requires Expo Bare Workflow (not Managed) or EAS Build — custom native code cannot run in Expo Go. This is a Phase 3+ feature, after the Expo project is already in Bare workflow for HealthKit.

### Deferral Recommendation

Build the Watch app in a dedicated phase after the core iOS/Android app is stable. The Watch UI is a projection of state managed in the phone app — it requires the phone-side session model to be solid first.

---

## Build Order

The following sequence minimizes rework by building foundational layers before features that depend on them.

### Phase 1: Foundation
**Goal:** Authenticated shell, normalized schema, offline sync running, data migration complete.

- Expo project init (Bare Workflow for native module support)
- TypeScript, Expo Router, NativeWind or StyleSheet setup
- Supabase normalized schema deployed (all tables, RLS)
- PowerSync integrated with Supabase connector
- Auth flows: email/password, Google OAuth, Apple Sign-In
- v1 → v2 migration script written and tested
- Onboarding wizard (profile + split + first template)
- Core navigation (5-tab layout)

Rationale: Everything else depends on the data layer being normalized and offline-capable. Doing this first means all subsequent features build on a solid, tested foundation.

### Phase 2: Core Workout Experience
**Goal:** Full workout logging loop, frictionless, offline.

- ExerciseCard v2: set rows, go/no-go, weight input, RPE, notes, warm-up flag
- Rest timer (client-side, local notifications)
- Smart weight suggestion from local SQLite history
- Superset support (paired exercises, shared rest timer)
- Bodyweight exercise type (BW + offset)
- Session-level notes and injury/body map
- Workout complete overlay → session commits to PowerSync

Rationale: The core value statement is "frictionless, accurate, smart." Get this right before building any surrounding features.

### Phase 3: Templates, Programs, and Progress
**Goal:** Full template management, multi-week programs, progress analytics.

- Searchable exercise library with ExerciseDB videos
- Template builder with superset support
- Editable history (post-session corrections)
- Multi-week program builder (manual)
- Progress charts (Victory Native or Recharts web equivalent)
- Measurement history + progress photos
- Deload detection and suggestion

### Phase 4: Premium Gate and AI Features
**Goal:** Stripe billing live, AI features gated and working.

- Stripe monthly subscription (Stripe SDK + webhooks)
- Custom JWT Auth Hook for subscription tier
- RLS premium policies deployed
- Edge Function: `ai-chat` with streaming, rate limiting
- AI coach chat UI
- Edge Function: `ai-workout-generation`
- Edge Function: `ai-meal-plan`
- Meal plan display and local caching for offline

### Phase 5: Wearables and Notifications
**Goal:** HealthKit live, REST wearables scaffolded, push notifications working.

- HealthKit integration (HRV, sleep, steps, post-workout HR)
- Garmin OAuth + activity pull
- Whoop OAuth + recovery pull
- Fitbit OAuth + sleep/activity pull
- Recovery score on Dashboard
- Expo Push Notifications setup
- Workout reminder with smart timing
- PR alerts, weekly summary
- Gamification: badges and achievements

### Phase 6: Polish and Platform
**Goal:** App Store ready, PWA, Watch companion.

- Dark/light mode
- Home screen widgets (iOS/Android)
- PWA manifest + Service Worker
- Apple Watch companion (SwiftUI + WatchConnectivity)
- Calendar sync (Apple + Google)
- Workout share card (shareable image)
- Full data export (JSON/CSV)
- Playwright E2E test suite
- App Store submission (iOS + Android)

---

## Key Constraints and Tradeoffs

### Constraint: Expo Bare Workflow Required from Day One

HealthKit, WatchConnectivity, and home screen widgets all require native code. Starting in Managed workflow and migrating later is painful. Use `npx create-expo-app --template bare-minimum` from the start.

### Constraint: Supabase Free Tier Limits and PowerSync

PowerSync has a generous free tier (1GB data, 1M sync operations/month) suitable for single-user personal use. Supabase free tier limits on Edge Function invocations (500K/month) are well above expected usage. Monitor before upgrading.

### Tradeoff: PowerSync vs. Manual Sync

PowerSync abstracts significant complexity (WAL reading, sync stream management, SQLite conflict handling). The tradeoff is a third-party service dependency. For a personal-use app where downtime tolerance is high, this is acceptable. If PowerSync changes pricing or discontinues, migration to WatermelonDB with custom Supabase RPCs is the fallback — the local SQLite schema is compatible.

### Constraint: MyFitnessPal API

The MFP public API has been closed since 2020. Integration requires a partner agreement. Design the `NutritionProvider` abstraction now, but do not block any phase on MFP access. Manual macro entry is the launch fallback.

### Tradeoff: Single Supabase Project for v1 and v2

Both v1 and v2 use the same Supabase project. Risk: a bad migration could corrupt v1's `user_state` table during the transition. Mitigation: the v2 schema creates entirely new tables, never modifying `user_state`. The backfill script only inserts, never updates `user_state`. Take a point-in-time backup in Supabase before running the backfill.

### Constraint: App Store Review

Apple requires Sign in with Apple whenever any third-party OAuth is present. Both Google OAuth and Apple Sign-In must ship together — cannot release with Google-only. This is a Phase 1 requirement, not Phase 6.

### Tradeoff: Claude Sonnet for AI Features

Claude Sonnet is the right balance of reasoning quality and cost for coaching chat. Haiku would be cheaper but noticeably weaker at nuanced workout/nutrition advice. Opus is overkill and 5x more expensive. Use Sonnet with a 20 req/day premium cap. Re-evaluate if token costs become significant.

### Constraint: Wearable API Access

Garmin's developer program and Whoop's API require application/approval. Suunto's API is similarly gated. Plan for 2–4 weeks of approval time. Build the wearable integration UI and Edge Function scaffold in Phase 5, but initiate the developer program applications during Phase 3 to avoid blocking Phase 5.

---

## Sources

- [Supabase: React Native Offline-First with WatermelonDB](https://supabase.com/blog/react-native-offline-first-watermelon-db)
- [PowerSync: Bringing Offline-First to Supabase](https://www.powersync.com/blog/bringing-offline-first-to-supabase)
- [PowerSync React Native & Expo SDK Docs](https://docs.powersync.com/client-sdks/reference/react-native-and-expo)
- [Supabase Custom Claims and RBAC](https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac)
- [Supabase Edge Function Rate Limiting](https://supabase.com/docs/guides/functions/examples/rate-limiting)
- [Expo Notifications API Docs](https://docs.expo.dev/versions/latest/sdk/notifications)
- [react-native-health (HealthKit)](https://github.com/agencyenterprise/react-native-health)
- [expo-watch-connectivity](https://github.com/ixacik/expo-watch-connectivity)
- [react-native-watch-connectivity](https://github.com/watch-connectivity/react-native-watch-connectivity)
- [Migrating from JSON to Postgres Schema (expand-and-contract pattern)](https://dev.to/gabrielanhaia/migrating-from-a-json-column-to-a-proper-schema-in-postgres-4o9e)
- [Supabase Stripe Webhook Handling](https://supabase.com/docs/guides/functions/examples/stripe-webhooks)
- [WatermelonDB Sync Implementation](https://watermelondb.dev/docs/Implementation/SyncImpl)
- [PowerSync Custom Conflict Resolution](https://docs.powersync.com/handling-writes/custom-conflict-resolution)
- [Expo Background Task Docs](https://docs.expo.dev/versions/latest/sdk/background-task/)
- [Claude API Context Windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [Expo Monorepos Guide](https://docs.expo.dev/guides/monorepos/)
- [Which Wearables Are Developers Using](https://www.themomentum.ai/blog/which-wearables-are-developers-using-in-health-apps-and-why)
- [Garmin Connect Developer Program](https://developer.garmin.com/gc-developer-program/overview/)
