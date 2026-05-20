# Architecture Patterns

**Domain:** Mobile-first family household management PWA (single-household / single-tenant)
**Researched:** 2026-05-19
**Confidence:** HIGH on TanStack Query patterns, Web Push, RLS, React Router. MEDIUM on Edge Functions dispatch (verified pattern, exact code not validated against latest Deno runtime). MEDIUM on custody pattern storage (no canonical reference; pattern is bespoke).

---

## 1. Recommended High-Level Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │              Browser (iOS Safari /            │
                  │              Android Chrome / Desktop)        │
                  │                                                │
                  │   ┌────────────────────────────────────────┐  │
                  │   │   React App (Vite + React Router v6)    │  │
                  │   │  ┌──────────────────────────────────┐  │  │
                  │   │  │  TanStack Query (server cache)    │  │  │
                  │   │  │  + Supabase Realtime invalidator  │  │  │
                  │   │  └──────────────────────────────────┘  │  │
                  │   │  ┌──────────────────────────────────┐  │  │
                  │   │  │  Feature Modules (chores, meals, │  │  │
                  │   │  │  custody, groceries, etc.)        │  │  │
                  │   │  └──────────────────────────────────┘  │  │
                  │   └────────────────────────────────────────┘  │
                  │   ┌────────────────────────────────────────┐  │
                  │   │  Service Worker (Workbox + Web Push)   │  │
                  │   │  - precache + offline shell             │  │
                  │   │  - 'push' listener → showNotification   │  │
                  │   │  - 'notificationclick' → open URL       │  │
                  │   └────────────────────────────────────────┘  │
                  └────────────────────┬─────────────────────────┘
                                       │ HTTPS
                                       ▼
        ┌──────────────────────────────────────────────────────────┐
        │                    Supabase                                │
        │  ┌─────────────┐ ┌───────────────┐ ┌──────────────────┐  │
        │  │   Auth      │ │   Postgres     │ │   Realtime       │  │
        │  │ Google OAuth│ │ + RLS policies │ │ postgres_changes │  │
        │  │ JWT         │ │ + pg_cron      │ │                  │  │
        │  └─────────────┘ └───────────────┘ └──────────────────┘  │
        │  ┌──────────────────────────────────────────────────────┐│
        │  │             Edge Functions (Deno)                     ││
        │  │  - dispatch-notifications (cron-triggered)             ││
        │  │  - generate-custody (one-shot maintenance)             ││
        │  └──────────────────────────────────────────────────────┘│
        └──────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                       ┌───────────────────────────┐
                       │   Vercel (static + /api)   │
                       │   - SPA hosting             │
                       │   - /api/calendar.ics       │
                       └───────────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │   Push services (FCM, APNs via Apple WPS)│
                  │   (handled by web-push library)           │
                  └──────────────────────────────────────────┘
```

Key principle: **the browser is a thin client**. Postgres + RLS is the source of truth. Edge Functions handle the only server-side concern (sending push notifications on a schedule). Vercel serves static assets and the iCal route only.

---

## 2. Module / Component Boundaries

### `src/` layout (feature-sliced, not type-grouped)

```
src/
├── app/                      # App shell, routing, providers
│   ├── App.tsx               # Router + provider tree only
│   ├── router.tsx            # All route definitions
│   ├── providers/
│   │   ├── QueryProvider.tsx     # TanStack Query client
│   │   ├── AuthProvider.tsx      # Supabase session listener
│   │   └── ThemeProvider.tsx     # data-theme attribute
│   └── guards/
│       └── RequireAuth.tsx   # Protected route wrapper
│
├── features/                 # One folder per domain
│   ├── auth/
│   │   ├── api.ts            # signIn, signOut, getSession
│   │   ├── hooks.ts          # useUser, useIsParent
│   │   └── LoginPage.tsx
│   ├── members/
│   │   ├── api.ts            # CRUD + queries
│   │   ├── hooks.ts          # useMembers, useMember, useUpdateMember
│   │   ├── types.ts          # Member, MemberRole
│   │   └── components/
│   │       ├── MemberCard.tsx
│   │       ├── MemberForm.tsx
│   │       └── MemberAvatar.tsx
│   ├── chores/
│   │   ├── api.ts
│   │   ├── hooks.ts          # useChores, useToggleChore, useAddChore
│   │   ├── logic.ts          # recurring-chore advancement, streak calc
│   │   └── components/
│   ├── calendar/
│   ├── custody/
│   │   ├── api.ts
│   │   ├── hooks.ts
│   │   ├── pattern.ts        # 2-2-3 / 2-2-5-5 expansion logic
│   │   └── components/
│   ├── meals/
│   ├── groceries/
│   ├── notes/
│   └── notifications/
│       ├── api.ts            # subscribe/unsubscribe push
│       ├── hooks.ts          # usePushPermission, useSubscribe
│       └── service-worker.ts # SW push event handler
│
├── lib/
│   ├── supabase.ts           # Single client instance
│   ├── queryKeys.ts          # Centralized cache keys
│   ├── realtimeBridge.ts     # Subscribes once, invalidates queries
│   ├── time.ts               # Timezone-aware date helpers
│   └── types/
│       └── database.ts       # Generated from Supabase CLI
│
├── ui/                       # Reusable presentational primitives
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── BottomTabBar.tsx
│   └── ...
│
├── styles/
│   ├── index.css             # CSS variable definitions per theme
│   └── reset.css
│
├── main.tsx                  # Entry: registerSW, render <App />
└── sw/
    └── sw-custom.ts          # Custom SW (Workbox injectManifest mode)
```

**Why feature-sliced:** v1's `pages/` + monolithic `AppContext` made it impossible to delete a feature without grep. Feature folders own their API, hooks, types, and components — deleting a feature = deleting a folder.

**Boundary rule:** features may import from `lib/` and `ui/`, but never from each other. Cross-feature composition happens in `app/` (route components) or via shared query keys.

### Component communication table

| Component | Responsibility | Talks To |
|-----------|----------------|----------|
| `QueryProvider` | Caches server state; exposes `useQuery`/`useMutation` | All feature hooks |
| `AuthProvider` | Tracks Supabase session; exposes `user`, `isParent` | `RequireAuth`, all feature hooks |
| `RequireAuth` | Redirects to `/login` on no session | All protected routes |
| `realtimeBridge` (lib) | Subscribes to `postgres_changes`; calls `queryClient.invalidateQueries` | TanStack Query cache |
| Feature `api.ts` | Pure Supabase calls; returns DB rows or throws | Feature `hooks.ts` |
| Feature `hooks.ts` | Wraps queries/mutations; owns query keys | Feature components |
| Feature components | Pure presentation; calls hooks | UI primitives |
| Service worker | Receives push, shows notification, handles click | OS notification center, browser focus |
| Edge function `dispatch-notifications` | Reads pending notifications; calls `web-push` | `push_subscriptions` table, FCM/APNs |

---

## 3. Data Flow Diagrams

### 3.1 Read flow (any feature page)

```
Component mounts
  └─> useChores() hook
        └─> useQuery({ queryKey: ['chores'], queryFn: fetchChores })
              ├─> Cache HIT (fresh)?  return cached data immediately
              ├─> Cache HIT (stale)?  return cached, refetch in background
              └─> Cache MISS?         fetch from Supabase, store, return

In parallel: realtimeBridge listens to postgres_changes
  on `chores` table → queryClient.invalidateQueries(['chores'])
  → TanStack refetches → UI updates
```

### 3.2 Write flow (optimistic mutation)

```
User taps "toggle chore"
  └─> useToggleChore().mutate(choreId)
        ├─> onMutate:
        │     1. queryClient.cancelQueries(['chores'])
        │     2. previous = queryClient.getQueryData(['chores'])
        │     3. queryClient.setQueryData(['chores'], optimisticData)
        │     4. return { previous }
        ├─> mutationFn: supabase.from('chores').update(...).eq('id', id)
        ├─> onError(err, vars, ctx):
        │     queryClient.setQueryData(['chores'], ctx.previous)   ← ROLLBACK
        │     toast.error(...)
        └─> onSettled:
              queryClient.invalidateQueries(['chores'])             ← consistency
```

This pattern fixes v1's biggest reliability bug (no rollback on failed Supabase write).

### 3.3 Push notification flow (end-to-end)

```
[Setup, once per device, on user action]
1. User taps "Enable notifications" in Settings
2. Notification.requestPermission()   ← must be user-initiated
3. swRegistration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: <VAPID_PUBLIC_KEY>
   })
4. supabase.from('push_subscriptions').upsert({
     member_id, user_id, endpoint, p256dh, auth, user_agent
   })

[Dispatch, on schedule]
1. pg_cron fires every minute → calls Edge Function dispatch-notifications
2. Edge Function:
   - SELECT * FROM notifications_queue WHERE send_at <= now() AND sent_at IS NULL
   - For each row: load subscriptions for target member_id(s)
   - web-push.sendNotification(subscription, payload) for each
   - On 410 Gone: DELETE from push_subscriptions (subscription dead)
   - UPDATE notifications_queue SET sent_at = now() WHERE id = ...
3. FCM/APNs forwards to device

[Reception, on device]
1. SW 'push' event fires
2. event.waitUntil(self.registration.showNotification(title, options))
3. User taps notification
4. SW 'notificationclick': focus existing client or open(payload.url)
```

### 3.4 Auth flow

```
App loads
  └─> AuthProvider mounts
        ├─> supabase.auth.getSession() → set initial user
        └─> supabase.auth.onAuthStateChange((event, session) => set user)

User visits /chores
  └─> <RequireAuth>
        ├─> session null + still loading → render spinner
        ├─> session null + done loading → <Navigate to="/login" replace />
        └─> session present → <Outlet />

Session expires mid-session
  └─> Supabase client auto-refreshes via refresh_token (built-in)
  └─> If refresh fails: onAuthStateChange fires SIGNED_OUT
        → AuthProvider sets user=null
        → RequireAuth redirects to /login
        → after login, navigate back via location.state.from
```

---

## 4. Patterns to Follow

### Pattern 1: Centralized query keys

**What:** All TanStack Query keys live in `lib/queryKeys.ts` as a typed factory.

**When:** Always. Prevents the "I invalidated `['chores']` but the cache key was `['chores', userId]`" bug.

**Example:**
```ts
export const qk = {
  chores: {
    all: ['chores'] as const,
    list: (filters?: ChoreFilters) => ['chores', 'list', filters] as const,
    detail: (id: string) => ['chores', 'detail', id] as const,
    byMember: (memberId: string) => ['chores', 'byMember', memberId] as const,
  },
  members: {
    all: ['members'] as const,
    detail: (id: string) => ['members', id] as const,
  },
  // ...
}
```
Invalidating `qk.chores.all` invalidates all chore-related queries via prefix matching.

### Pattern 2: One Realtime bridge per table (not per query)

**What:** A single `useRealtimeBridge()` mounted in `app/` subscribes to every table once and translates `postgres_changes` into `queryClient.invalidateQueries`.

**When:** App init. Do NOT subscribe inside individual `useQuery` hooks — multiple components on the same page would create duplicate channels.

**Example:**
```ts
export function useRealtimeBridge() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel('family-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' },
          () => qc.invalidateQueries({ queryKey: qk.chores.all }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' },
          () => qc.invalidateQueries({ queryKey: qk.events.all }))
      // ... one per table
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // refetch everything on reconnect — subs miss events during downtime
          qc.invalidateQueries();
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [qc]);
}
```
The reconnect-invalidate-all is critical: Supabase docs warn that brief disconnects silently drop events.

### Pattern 3: Mutation hooks always include `onMutate` + `onError` + `onSettled`

**What:** Every mutation does optimistic update, rollback on failure, invalidate on settle.

**When:** Any user-initiated write. Required for the responsive feel a mobile family app needs.

**Example:**
```ts
export function useToggleChore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      supabase.from('chores').update({ completed }).eq('id', id).throwOnError(),
    onMutate: async ({ id, completed }) => {
      await qc.cancelQueries({ queryKey: qk.chores.all });
      const previous = qc.getQueryData(qk.chores.list());
      qc.setQueryData(qk.chores.list(), (old: Chore[]) =>
        old?.map(c => c.id === id ? { ...c, completed } : c));
      return { previous };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.chores.list(), ctx.previous);
      toast.error('Could not update chore');
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.chores.all }),
  });
}
```

### Pattern 4: `members` table is the join axis, not auth.users

**What:** Every domain row references `member_id` (UUID FK to `members`), not a user/email. Members may or may not have a linked `auth_user_id`.

**When:** Always. Lets virtual members (kids without accounts) own chores, events, and meals.

**Example:** A chore assigned to a virtual child Roman:
```
chores.assigned_member_id → members.id (Roman, auth_user_id NULL)
```
When Roman's mom marks it complete on her phone, the toggle works because RLS checks the family membership, not row-ownership.

### Pattern 5: Custody as pattern + override, not per-day rows

**What:** Store the recurring rule (start anchor + cycle) once, generate dates on read. Allow per-date overrides for swaps.

**When:** From day one — v1 used per-day `custody` rows which makes "change the pattern starting next month" impossible.

**Example schema:**
```sql
custody_patterns (
  id UUID PK,
  pattern_type TEXT,           -- '2-2-3' | '2-2-5-5' | 'week-on-week-off' | 'custom'
  cycle_days SMALLINT[],       -- e.g. {2,2,3} or {7,7}; sums to cycle length
  anchor_date DATE,            -- the first day of cycle slot 0
  anchor_parent_id UUID,       -- which parent starts the cycle
  starts_on DATE,              -- pattern valid from this date
  ends_on DATE NULL,           -- and until this date (null = forever)
  created_at, updated_at, created_by, updated_by
)

custody_overrides (
  date DATE PRIMARY KEY,
  parent_member_id UUID NOT NULL REFERENCES members(id),
  reason TEXT,
  created_at, updated_at, created_by, updated_by
)
```
Read: `custodyForDate(d)` = override(d) ?? expand(activePattern, d).
This is the only sensible storage; per-day rows for a 10-year horizon = ~3650 rows that all need rewriting on every pattern change.

### Pattern 6: Service worker uses Workbox `injectManifest`, not `generateSW`

**What:** `vite-plugin-pwa` has two strategies. Use `injectManifest` so you own the SW source file (needed for the custom `push` and `notificationclick` listeners).

**When:** Required for push. `generateSW` doesn't let you add custom event handlers.

**Example `vite.config.ts`:**
```ts
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src/sw',
  filename: 'sw-custom.ts',
  registerType: 'autoUpdate',
  manifest: { /* ... */ },
})
```

---

## 5. Anti-Patterns to Avoid

### Anti-Pattern 1: One God Context for all server state
**What:** v1's `AppContext` held all 7 tables + auth + mutations in a single provider.
**Why bad:** Any change re-renders everything. No caching. No optimistic rollback. No background refetch.
**Instead:** TanStack Query per feature. Context only for *client* state that's truly global (current theme, current user). Server data is *never* in React state.

### Anti-Pattern 2: Per-component Realtime subscriptions
**What:** Subscribing inside `useEffect` of a list page.
**Why bad:** Two list pages on the same screen = two channels. Unmount races leave dangling subs. Easy to subscribe but forget to invalidate.
**Instead:** Pattern 2 above — one bridge in app root.

### Anti-Pattern 3: Client-generated string IDs (`'c' + Date.now()`)
**What:** v1's pattern.
**Why bad:** Collisions on fast input; not sortable by lex order globally; not type-checked against FKs.
**Instead:** `gen_random_uuid()` as Postgres default. Let the DB assign. Client passes nothing; `select(...).single()` returns the new row.

### Anti-Pattern 4: Fully permissive RLS
**What:** `POLICY ... USING (true)` on every table.
**Why bad:** Anyone with the anon key can read/write everything. Browser DevTools = full DB access.
**Instead:** RLS that checks `auth.uid()` is in the `family_members` (whitelist) view — see schema below.

### Anti-Pattern 5: Storing push subscription on `auth.users.id` only
**What:** `push_subscriptions(user_id, ...)`.
**Why bad:** Doesn't account for virtual members and doesn't model "Stella has notifications enabled on iPad AND iPhone."
**Instead:** `push_subscriptions(id, member_id, user_id, endpoint UNIQUE, ...)`. `endpoint` is the natural unique key — same device subscribing twice should upsert.

### Anti-Pattern 6: Notifications fired from the browser
**What:** "When a chore completes, the marker's browser sends notifications to everyone."
**Why bad:** Browser is offline / on a different network / phone locked. Push only fires reliably when a server initiates it.
**Instead:** Enqueue a `notifications_queue` row from the client (or via Postgres trigger) and let an Edge Function dispatch on a tight cron.

### Anti-Pattern 7: Schema migrations in Supabase Dashboard SQL Editor
**What:** v1's `transport_parent` → `dropoff_parent` change made directly in dashboard, schema file stale.
**Why bad:** No history, no rollback, no reproducibility, environments drift.
**Instead:** Supabase CLI (`supabase migration new`, `supabase db push`). Migrations in `/supabase/migrations/` committed to git.

---

## 6. Supabase Schema (proposed)

```sql
-- ============================================================
-- families: trivially single-row, but enables future multi-family
-- ============================================================
create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Chicago',  -- fixes v1 hard-code
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- members: the join axis for everything
-- ============================================================
create type member_role as enum ('parent', 'child');

create table members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,  -- null = virtual
  email text,                              -- lowercase, used for whitelist match on first OAuth
  display_name text not null,
  emoji text not null default '🙂',
  color text not null default 'lavender',  -- references theme palette token
  role member_role not null default 'child',
  -- visibility config (JSONB lets us add sections without migrations)
  visible_sections jsonb not null default '["dashboard","chores","calendar","meals","groceries","notes"]'::jsonb,
  visible_in_member_tabs boolean not null default true,  -- show this member's tab to others
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references members(id),
  updated_by uuid references members(id)
);

create index members_family_idx on members(family_id);
create index members_auth_user_idx on members(auth_user_id) where auth_user_id is not null;
create unique index members_email_lower_idx on members(family_id, lower(email)) where email is not null;

-- ============================================================
-- Helper: is the caller a member of this family?
-- ============================================================
create or replace function auth_member_id() returns uuid
language sql stable security definer as $$
  select id from members where auth_user_id = auth.uid() limit 1;
$$;

create or replace function auth_family_id() returns uuid
language sql stable security definer as $$
  select family_id from members where auth_user_id = auth.uid() limit 1;
$$;

create or replace function auth_is_parent() returns boolean
language sql stable security definer as $$
  select role = 'parent' from members where auth_user_id = auth.uid() limit 1;
$$;

-- ============================================================
-- chores
-- ============================================================
create type chore_frequency as enum ('once','daily','weekly','monthly');

create table chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  assigned_member_id uuid references members(id) on delete set null,
  frequency chore_frequency not null default 'weekly',
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references members(id),
  due_date date,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references members(id),
  updated_by uuid references members(id)
);
create index chores_family_idx on chores(family_id);
create index chores_assigned_idx on chores(assigned_member_id);

-- ============================================================
-- events (calendar)
-- ============================================================
create table events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  member_id uuid references members(id) on delete set null,
  date date not null,
  start_time time,
  end_time time,
  color text not null default 'lavender',
  dropoff_parent_id uuid references members(id),
  pickup_parent_id uuid references members(id),
  repeat_rule text,    -- iCal RRULE; null = single occurrence
  repeat_until date,
  parent_event_id uuid references events(id),  -- for materialized occurrences if needed
  notify_minutes_before int,                    -- triggers notifications_queue insertion
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references members(id),
  updated_by uuid references members(id)
);
create index events_family_date_idx on events(family_id, date);

-- ============================================================
-- custody (pattern + overrides)
-- ============================================================
create table custody_patterns (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  label text,
  cycle_days smallint[] not null,            -- {2,2,3} = ten-day cycle? No, 7-day; for 2-2-5-5 = {2,2,5,5}=14
  anchor_date date not null,
  anchor_parent_member_id uuid not null references members(id),
  alternates boolean not null default true,  -- second cycle flips
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references members(id),
  updated_by uuid references members(id)
);

create table custody_overrides (
  date date primary key,
  family_id uuid not null references families(id) on delete cascade,
  parent_member_id uuid not null references members(id),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references members(id),
  updated_by uuid references members(id)
);
create index custody_overrides_family_idx on custody_overrides(family_id);

-- ============================================================
-- meals
-- ============================================================
create type meal_slot as enum ('breakfast','lunch','dinner');

create table meal_plan (
  family_id uuid not null references families(id) on delete cascade,
  date date not null,
  slot meal_slot not null,
  meal text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references members(id),
  primary key (family_id, date, slot)
);

create table meal_recommendations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  category meal_slot not null default 'dinner',
  suggested_by_member_id uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table meal_votes (
  recommendation_id uuid references meal_recommendations(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recommendation_id, member_id)
);
-- normalized votes (NOT a JSONB array) so RLS + counting are sane

-- ============================================================
-- groceries
-- ============================================================
create table groceries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  qty text,
  category text not null default 'Other',
  added_by_member_id uuid references members(id),
  checked boolean not null default false,
  source_request_id uuid,  -- if promoted from a request
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references members(id)
);

create table grocery_requests (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  requested_by_member_id uuid references members(id),
  notes text,
  status text not null default 'pending',  -- 'pending' | 'approved' | 'rejected'
  resolved_by_member_id uuid references members(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- notes
-- ============================================================
create table notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  body text not null,
  author_member_id uuid references members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references members(id)
);

-- ============================================================
-- push subscriptions (one per device per member)
-- ============================================================
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index push_subs_member_idx on push_subscriptions(member_id);

-- ============================================================
-- notifications queue (enqueue → cron dispatches → mark sent)
-- ============================================================
create type notification_kind as enum (
  'chore_due','chore_completed_kid','event_reminder','custody_change','grocery_request'
);

create table notifications_queue (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  kind notification_kind not null,
  target_member_id uuid references members(id) on delete cascade,  -- null = whole family
  title text not null,
  body text not null,
  click_url text,
  payload jsonb,
  send_at timestamptz not null default now(),
  sent_at timestamptz,
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);
create index notif_pending_idx on notifications_queue(send_at) where sent_at is null;
```

### RLS policies (the model: "any active member of the same family")

```sql
alter table families             enable row level security;
alter table members              enable row level security;
alter table chores               enable row level security;
alter table events               enable row level security;
alter table custody_patterns     enable row level security;
alter table custody_overrides    enable row level security;
alter table meal_plan            enable row level security;
alter table meal_recommendations enable row level security;
alter table meal_votes           enable row level security;
alter table groceries            enable row level security;
alter table grocery_requests     enable row level security;
alter table notes                enable row level security;
alter table push_subscriptions   enable row level security;
alter table notifications_queue  enable row level security;

-- Generic "same family" policy template
create policy family_read on chores for select
  using (family_id = auth_family_id());

create policy family_write on chores for insert
  with check (family_id = auth_family_id());

create policy family_update on chores for update
  using (family_id = auth_family_id())
  with check (family_id = auth_family_id());

-- Parent-only mutations on member admin:
create policy members_parent_write on members for insert
  with check (family_id = auth_family_id() and auth_is_parent());
create policy members_parent_update on members for update
  using (family_id = auth_family_id() and auth_is_parent());
create policy members_parent_delete on members for delete
  using (family_id = auth_family_id() and auth_is_parent());

-- Push subscriptions: only the owning user can manage their own rows
create policy ps_own_select on push_subscriptions for select using (user_id = auth.uid());
create policy ps_own_write on push_subscriptions for insert with check (user_id = auth.uid());
create policy ps_own_delete on push_subscriptions for delete using (user_id = auth.uid());
```

**Why these are safer than v1's `using(true)`:** anon-key requests from a logged-out browser see nothing. A child cannot delete a parent or another child. Push subscriptions can never leak to other family members.

**Trigger for `updated_at` + `updated_by`** (every mutating table):
```sql
create or replace function set_audit_cols() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth_member_id();
  if tg_op = 'INSERT' and new.created_by is null then
    new.created_by := auth_member_id();
  end if;
  return new;
end $$;

create trigger audit_chores before insert or update on chores
  for each row execute function set_audit_cols();
-- repeat per table
```

---

## 7. Push Notification Architecture (end-to-end)

### VAPID key management

1. **Generate once** (locally, not in CI):
   ```bash
   npx web-push generate-vapid-keys
   ```
2. **Store**:
   - **Public key** → `VITE_VAPID_PUBLIC_KEY` env var (Vercel + .env.local) — safe to ship to clients.
   - **Private key** → Supabase Edge Function secret (`supabase secrets set VAPID_PRIVATE_KEY=...`) — NEVER in client bundle.
   - **Contact** (`mailto:travis.g.mader@gmail.com`) → Edge Function secret `VAPID_SUBJECT`.
3. **Rotate**: if the private key leaks, generate new keys, store, then bulk-DELETE `push_subscriptions` (all clients will re-subscribe on next visit).

### Service worker structure (`src/sw/sw-custom.ts`)

```ts
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Family', body: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.click_url ?? '/' },
      tag: data.tag,          // de-dupe: replaces older notification w/ same tag
      renotify: !!data.tag,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil((async () => {
    const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of clientsArr) {
      if (c.url.includes(url) && 'focus' in c) return c.focus();
    }
    return self.clients.openWindow(url);
  })());
});
```

### Client subscription flow (`features/notifications/api.ts`)

```ts
export async function subscribePush(memberId: string) {
  // 1. permission — must be in a user-initiated handler
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Permission denied');

  // 2. wait for SW ready
  const reg = await navigator.serviceWorker.ready;

  // 3. subscribe
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });
  const json = sub.toJSON();

  // 4. persist
  const { error } = await supabase.from('push_subscriptions').upsert({
    member_id: memberId,
    user_id: (await supabase.auth.getUser()).data.user!.id,
    endpoint: json.endpoint!,
    p256dh: json.keys!.p256dh,
    auth: json.keys!.auth,
    user_agent: navigator.userAgent,
  }, { onConflict: 'endpoint' });
  if (error) throw error;
}
```

### Dispatch Edge Function (`supabase/functions/dispatch-notifications/index.ts`)

```ts
import webpush from 'npm:web-push@3';
import { createClient } from 'jsr:@supabase/supabase-js@2';

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

Deno.serve(async () => {
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: pending } = await sb
    .from('notifications_queue')
    .select('*')
    .is('sent_at', null)
    .lte('send_at', new Date().toISOString())
    .limit(100);

  for (const n of pending ?? []) {
    const subsQuery = sb.from('push_subscriptions').select('*');
    const { data: subs } = n.target_member_id
      ? await subsQuery.eq('member_id', n.target_member_id)
      : await subsQuery.in('member_id',
          (await sb.from('members').select('id').eq('family_id', n.family_id)).data?.map(m => m.id) ?? []);

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: n.title, body: n.body, click_url: n.click_url, tag: `${n.kind}-${n.id}` })
        );
      } catch (e: any) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('id', s.id);
        } else {
          await sb.from('notifications_queue').update({
            attempts: n.attempts + 1, last_error: String(e)
          }).eq('id', n.id);
          continue;
        }
      }
    }
    await sb.from('notifications_queue').update({ sent_at: new Date().toISOString() }).eq('id', n.id);
  }
  return new Response('ok');
});
```

### Cron schedule (in Postgres)

```sql
select cron.schedule(
  'dispatch-notifications',
  '* * * * *',  -- every minute
  $$ select net.http_post(
       url := 'https://<project>.supabase.co/functions/v1/dispatch-notifications',
       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_secret'))
     ); $$
);
```

### Postgres triggers that enqueue notifications

```sql
-- When a kid completes a chore, notify parents
create or replace function chore_completed_notify() returns trigger language plpgsql as $$
declare member_role member_role;
begin
  if new.completed and not old.completed then
    select role into member_role from members where id = new.completed_by;
    if member_role = 'child' then
      insert into notifications_queue(family_id, kind, target_member_id, title, body, click_url)
      select new.family_id, 'chore_completed_kid', m.id,
             '🎉 Chore complete',
             (select display_name from members where id = new.completed_by) || ' finished: ' || new.title,
             '/chores'
      from members m where m.family_id = new.family_id and m.role = 'parent';
    end if;
  end if;
  return new;
end $$;

create trigger chore_completed_notify_t after update on chores
  for each row execute function chore_completed_notify();
```

Same pattern for `event_reminder` (cron-style: scan events `notify_minutes_before` before start_time), `custody_change`, `chore_due` (daily 8am pre-check).

---

## 8. PWA Installability + iOS Caveats

### Manifest (`public/manifest.webmanifest`)

```json
{
  "name": "Family Hub",
  "short_name": "Family",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#7c6df0",
  "background_color": "#fff8f5",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### iOS Safari requirements (hard rules)

| Requirement | Why |
|---|---|
| iOS 16.4+ | Web Push is not supported below this |
| `display: "standalone"` | iOS only enables Push when launched from home screen as standalone |
| Must be installed via "Add to Home Screen" | iOS will NOT show an install prompt; you must coach the user |
| Apple touch icon (`apple-touch-icon.png` 180×180) | Otherwise the home screen icon is a screenshot |
| `Notification.requestPermission()` must be in a user gesture | No prompts on load |
| iOS strips query strings from `start_url` in some cases | Don't rely on launch URL params |
| EU users: no PWA mode under DMA (iOS 17.4+) | No push for EU. Acceptable risk: this family is US-based |

### iOS coach screen

Build a `<InstallCoach />` component that detects:
- `navigator.standalone === true` → already installed, hide
- iOS Safari (UA check) and not standalone → show "Tap Share, then Add to Home Screen" with diagram
- Other browsers → use `beforeinstallprompt` event for native banner

### Service worker registration (`src/main.tsx`)

```ts
import { registerSW } from 'virtual:pwa-register';
const updateSW = registerSW({
  onNeedRefresh() { /* show toast: "New version, tap to refresh" */ },
  onOfflineReady() { /* optional toast */ },
});
```

---

## 9. React Router v6 + Supabase Auth

### Route tree

```tsx
<BrowserRouter>
  <Routes>
    <Route element={<AppShell />}>              {/* providers + nav + outlet */}
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chores" element={<Chores />} />
        <Route path="/calendar" element={<FamilyCalendar />} />
        <Route path="/meals" element={<Meals />} />
        <Route path="/groceries" element={<Groceries />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/members/:id" element={<MemberPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

### `RequireAuth` (handles session expiry)

```tsx
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
```

### `AuthProvider`

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);  // SIGNED_OUT → user=null → RequireAuth redirects
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthCtx.Provider value={{ user, loading }}>{children}</AuthCtx.Provider>;
}
```

Supabase JS auto-refreshes the access token via the refresh token. Only when the refresh fails (e.g., token revoked or 7-day inactivity expiry) does `onAuthStateChange` fire `SIGNED_OUT`. The router redirect is automatic.

### Login redirect-back

```tsx
function LoginPage() {
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/';
  const signIn = () => supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${from}` }
  });
  // ...
}
```

---

## 10. Data Migration Strategy (v1 → v2)

### Risks to address up front

| Risk | Mitigation |
|---|---|
| Live family data is in use during migration | Run migration during a low-traffic window; freeze v1 writes by switching its Supabase keys (effectively read-only) for the cutover |
| String IDs in v1 (`'c'+Date.now()`) → UUIDs in v2 | Build an ID map: `{ old_id: new_uuid }` and rewrite all FK references during transform |
| `chores.assigned_to = 'dad'` (text) → `assigned_member_id` (uuid FK) | Resolve via the email→member_id map (see below) |
| `events.dropoff_parent = 'mom'` → `dropoff_parent_id` (uuid FK) | Same resolution table |
| Per-day `custody` rows → patterns + overrides | Inspect actual cadence; if periodic, derive pattern; otherwise import all as overrides initially and let the user create a forward-looking pattern in v2 |
| Schema file is stale | Derive schema from live DB, not from `supabase/schema.sql` |
| Push subs and notifications_queue don't exist in v1 | Skip — start fresh in v2 |
| `meal_recommendations.votes` is JSONB array → `meal_votes` table | Loop array, insert one row per vote |
| Notes use `gen_random_uuid()` already | Pass through, just remap title/body |
| `meal_plan` PK is `(date, slot)` → `(family_id, date, slot)` | Add the constant `family_id` during transform |

### Migration approach: dump + transform script (recommended)

**Why a script, not pg_dump piped to psql:** the schemas are too different. We need a Node script that reads from v1 and writes to v2 with row-level transforms.

```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Set up v2 Supabase project                               │
│   - New project (or new schema, with `_v2` prefix on old tables) │
│   - Run all migrations from /supabase/migrations/                │
│   - Create the single `families` row → family_id (constant)      │
│   - Seed `members` from PARENT_EMAILS + child emails:            │
│       dad → travis, mom → angelia, layla, stella, roman          │
│     Build id map: { v1_id: v2_uuid }                             │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: Read v1 tables → write v2 tables                         │
│   For each table:                                                │
│     - SELECT * FROM v1                                           │
│     - Transform each row (resolve member IDs, add family_id,    │
│       coerce types, generate UUIDs for v1 string IDs)           │
│     - Build v1_id → v2_uuid map for FK lookups in dependent     │
│       tables                                                     │
│     - INSERT into v2                                             │
│                                                                  │
│   Order (FK-safe):                                               │
│     1. families  (manual, one row)                               │
│     2. members   (manual seed from v1 hardcoded list)            │
│     3. chores                                                    │
│     4. events                                                    │
│     5. custody → custody_overrides (all v1 days as overrides)    │
│     6. meal_plan                                                 │
│     7. meal_recommendations → meal_votes (split votes array)     │
│     8. groceries                                                 │
│     9. grocery_requests                                          │
│    10. notes                                                     │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Integrity checks                                         │
│   - Row counts: v1.count == v2.count for each table              │
│   - No null `family_id` in any v2 row                            │
│   - No orphan FKs (every member_id resolves to a row)            │
│   - Sample 10 random rows per table; spot-check field-by-field   │
│   - Specifically verify: chores.assigned_member_id, events       │
│     .dropoff/pickup_parent_id, meal_votes count == votes[].length│
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Dry-run + cutover                                        │
│   - Dry run against a v1 staging snapshot                        │
│   - Backup v1 (Supabase auto + manual pg_dump of public schema)  │
│   - Run for real against prod v1 → prod v2                       │
│   - Update Vercel env vars to point to v2 Supabase project      │
│   - Verify app loads, all data present                           │
│   - Keep v1 project live (read-only) for 30 days as fallback     │
└─────────────────────────────────────────────────────────────────┘
```

### Migration script skeleton (`scripts/migrate-v1-to-v2.ts`)

```ts
import { createClient } from '@supabase/supabase-js';

const v1 = createClient(V1_URL, V1_SERVICE_KEY);
const v2 = createClient(V2_URL, V2_SERVICE_KEY);

// Step 1: family + members (manual)
const familyId = await ensureFamily('Mader');
const memberMap = await seedMembers(familyId, [
  { v1id: 'dad',    email: 'travis.g.mader@gmail.com',    role: 'parent', name: 'Dad', emoji: '🦊' },
  { v1id: 'mom',    email: 'angelia.m.merryman14@gmail.com', role: 'parent', name: 'Mom', emoji: '🌸' },
  { v1id: 'layla',  email: 'laylamerryman11@gmail.com',   role: 'child', name: 'Layla', emoji: '⭐' },
  { v1id: 'stella', email: 'stellamader6@gmail.com',      role: 'child', name: 'Stella', emoji: '🌟' },
  { v1id: 'roman',  email: 'maderroman5@gmail.com',       role: 'child', name: 'Roman', emoji: '🚀' },
]);
// memberMap: { 'dad': '<uuid>', 'mom': '<uuid>', ... }

// Step 2: chores
const { data: chores } = await v1.from('chores').select('*');
const choreRows = chores!.map(c => ({
  id: crypto.randomUUID(),
  family_id: familyId,
  title: c.title,
  assigned_member_id: memberMap[c.assigned_to] ?? null,
  frequency: c.frequency,
  completed: c.completed,
  due_date: c.due_date,
  created_at: c.created_at,
}));
await v2.from('chores').insert(choreRows);

// ... events, custody, meal_*, groceries, notes
```

### Pre-flight checklist before running

- [ ] v2 schema deployed via Supabase CLI migrations
- [ ] RLS policies enabled and tested with a non-service-role client
- [ ] Audit trigger on every mutating table
- [ ] `families` row created, `family_id` known
- [ ] All 5 members seeded with correct emails (lowercased)
- [ ] `auth_user_id` left NULL on members initially — populated on first OAuth login by a `handle_new_user()` trigger that matches `auth.users.email` → `members.email`
- [ ] V1 Supabase project backed up (manual pg_dump + auto daily)
- [ ] Migration script dry-run against a copy of v1 prod data

### `handle_new_user()` trigger (auto-link OAuth login to member row)

```sql
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  update public.members
    set auth_user_id = new.id, updated_at = now()
    where lower(email) = lower(new.email) and auth_user_id is null;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

This is the bridge: when Layla signs in with Google for the first time, her `auth.users.id` is automatically linked to the pre-seeded `members` row that has her email. No manual setup per member.

---

## 11. Scalability Considerations

| Concern | At a single family (5–10) | At 100 families | At 1M families |
|---|---|---|---|
| Realtime channels | One channel per session, fine | One per family OK | Sharding required; Supabase has per-project channel limits |
| RLS query cost | Negligible | Indexes on `family_id` essential (already in schema) | Partitioning by `family_id` may help |
| Push dispatch volume | < 100/day, single-function dispatch fine | Per-minute cron + queue table fine | Move to a dedicated worker pool with batching |
| Storage | KB-MB | MB-GB | Per-family backup strategy |
| Notes/events/chores volume | Small | Need pagination on lists | Materialized views for dashboards |

For this app (single family, scope explicit in PROJECT.md), the schema is comfortably overbuilt. The `family_id` column on everything is the only multi-tenancy hook; if multi-family is ever wanted, it's already wired.

---

## 12. Suggested Build Order (Phase Dependencies)

This drives the roadmap. Each level depends only on prior levels.

```
Level 0: Project setup
  └── Vite + React 19 + React Router v6 + TypeScript
  └── ESLint + Prettier + Playwright
  └── Vercel project (separate from v1)
  └── Empty Supabase project (separate from v1)

Level 1: Foundation (the "Walking Skeleton")
  └── Supabase client + env vars
  └── AuthProvider + Google OAuth login + RequireAuth
  └── TanStack Query setup (QueryProvider, devtools, retry config)
  └── Centralized queryKeys
  └── Bottom tab bar + empty page shells for each route
  └── Theme system (lavender + midnight) via CSS vars
  └── Error boundaries on each route

Level 2: Data layer
  └── Migrations: families + members + audit triggers
  └── RLS policies (test with a real authenticated request)
  └── `handle_new_user()` trigger
  └── Realtime bridge (subscribes once at app root)

Level 3: Members feature (everything else depends on this)
  └── Members list + create/edit/delete (parents only)
  └── Per-member nav visibility config UI
  └── Member avatar component (emoji + color)

Level 4: Core domain features (parallel-safe)
  ├── Chores (CRUD + recurring logic + streak calc)
  ├── Events / Calendar (month grid, modal, RRULE)
  ├── Custody (pattern + overrides, calendar layer)
  ├── Meals (week planner + recommendations + votes table)
  ├── Groceries (list + requests flow redesign)
  └── Notes (CRUD with edit/delete this time)

Level 5: PWA + Push (depends on Level 1 SW registration)
  ├── vite-plugin-pwa injectManifest mode
  ├── Manifest + icons + iOS coach screen
  ├── Custom SW with push + notificationclick handlers
  ├── push_subscriptions table + RLS
  ├── Subscribe UI in Settings (per-device opt-in)
  ├── notifications_queue table
  ├── dispatch-notifications Edge Function
  ├── pg_cron schedule
  └── Per-domain notify triggers (chore done, event soon, custody change)

Level 6: Cross-cutting
  ├── Search across all domains
  ├── Family timezone setting → iCal export uses it
  └── Member page enrichment (history, stats)

Level 7: Data migration (depends on Levels 2 + 3 + 4 schemas being final)
  └── Migration script + dry runs + cutover

Level 8: Production hardening
  └── Error tracking (Sentry or similar)
  └── Playwright E2E vs preview deployments
  └── Performance budget on bundle size
```

**Critical ordering rules:**
- Level 2 RLS *must* be enabled before any data is inserted in Level 3+. Permissive-then-tighten causes data leaks during transition.
- Level 5 push depends on Level 1's SW registration but is otherwise independent — you could even ship without push and add it later. But triggers (Level 5 end) depend on Level 4 tables existing.
- Level 7 migration runs *last* because the v2 schema is only stable once all features are designed. Migrating then changing the schema = double migration pain.
- Member features (Level 3) before domain features (Level 4): every domain row references `members.id`.

---

## 13. Sources

- [Supabase Realtime + TanStack Query patterns (Makerkit)](https://makerkit.dev/blog/saas/supabase-react-query) — HIGH confidence on cache-invalidation pattern
- [React Query vs Supabase subscription discussion](https://github.com/orgs/supabase/discussions/5048) — HIGH on the reconnection-loss caveat
- [Supabase Cache Helpers](https://zenn.dev/ryoku4/articles/abde1e6ad926b0?locale=en) — MEDIUM on bundled query-key generation
- [TanStack Query optimistic updates docs](https://tanstack.com/query/v5/docs/framework/react/guides/optimistic-updates) — HIGH on onMutate / onError / onSettled trio
- [vite-plugin-pwa guide](https://vite-pwa-org.netlify.app/guide/) — HIGH on injectManifest vs generateSW
- [vite-plugin-pwa GitHub](https://github.com/vite-pwa/vite-plugin-pwa) — HIGH
- [web-push library README](https://github.com/web-push-libs/web-push/blob/master/README.md) — HIGH on VAPID generation and dispatch
- [Web Push with VAPID overview (Rossta)](https://rossta.net/blog/using-the-web-push-api-with-vapid.html) — MEDIUM
- [Lovable + Supabase Push Notifications walkthrough](https://www.originalobjective.com/blog/from-lovable-app-to-mobile-pwa-push-notifications-with-supabase) — MEDIUM, validated push_subscriptions schema shape
- [iOS Safari PWA limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — HIGH on standalone requirement
- [iOS web push special requirements (Pushpad)](https://pushpad.xyz/blog/ios-special-requirements-for-web-push-notifications) — HIGH on 16.4 + standalone + user-gesture rule
- [Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — HIGH on index-on-policy-columns
- [Supabase RLS official docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — HIGH
- [Protected routes with React Router 6 + Supabase (Vallejo)](https://medium.com/@seojeek/protected-routes-in-react-router-6-with-supabase-authentication-and-oauth-599047e08163) — MEDIUM on RequireAuth + Outlet pattern
- [Supabase backup/restore CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore) — HIGH on schema-only/data-only dump flags
- [Supa-Migrate community tool](https://github.com/mansueli/Supa-Migrate) — LOW, useful as reference only
- [Scheduling Edge Functions with pg_cron](https://supabase.com/docs/guides/functions/schedule-functions) — HIGH on pg_net + pg_cron flow
- [2-2-3 custody schedule definition](https://hodgsonlawoffices.com/blog/2-2-3-custody-schedule) — HIGH on the pattern itself; storage scheme is bespoke and unsourced

Pattern-storage approach for custody (Section 4, Pattern 5) is opinionated and not drawn from a canonical reference — it's an application of standard "rule + exceptions" calendar modeling.
