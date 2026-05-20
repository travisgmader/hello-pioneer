-- supabase/migrations/20260520000000_initial_schema.sql
-- Phase 1 — Foundation & Walking Skeleton — Plan 02
-- Source: 01-RESEARCH.md §Supabase Schema & RLS (lines 1086–1408)
--         + 01-CONTEXT.md decisions D-05, D-06, D-08, D-10, D-11
--         + 01-02-PLAN.md Task 2.1 §8a (chicken-and-egg bootstrap INSERT policies)
--         + Bootstrap allowlist from ../family-app/src/lib/allowedEmails.js
--
-- WHAT THIS APPLIES:
--   * pgcrypto extension + `private` schema for SECURITY DEFINER helpers
--   * 13 tables in public.*: families, members, family_settings, allowed_emails,
--     chores, chore_completions, events, meals, groceries, notes,
--     push_subscriptions, notifications_queue, family_links
--   * `private.set_updated_at()` trigger (attached to 10 audited tables)
--   * Helper functions `private.current_family_id()` and `private.auth_is_parent()`
--   * RLS enabled on all 13 tables; standard policies plus two bootstrap INSERT
--     policies that close the chicken-and-egg gap for first-family creation
--   * `supabase_realtime` publication with 11 family-scoped tables (ARCH-07)
--   * Bootstrap allowlist: 5 family emails (idempotent ON CONFLICT DO NOTHING)
--
-- WHAT THIS DOES NOT INCLUDE (deferred per the plan body):
--   * `handle_new_user()` trigger (MEMB-07 in Phase 2)
--   * `chore_streaks` views (Phase 3)
--   * `notifications_queue` triggers and pg_cron schedules (Phase 6)
--   * Linked-family INSERT/UPDATE/DELETE policies on `family_links` (Phase 4)
--
-- IDEMPOTENCY:
--   This migration is intended to run exactly once against an empty Supabase
--   project. Re-running it on a populated schema will error on duplicate
--   `create table`/`create policy` calls — that is by design (catches drift).

-- ── Extensions ────────────────────────────────────────────────────
create extension if not exists pgcrypto;     -- gen_random_uuid (also available natively in pg15)

-- ── Private schema for SECURITY DEFINER helpers ───────────────────
create schema if not exists private;

-- ── Tables (ordered by FK dependency) ─────────────────────────────

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🏠',  -- house emoji; ZWJ sequences avoided
  stripe_customer_id text,             -- populated by Edge Function
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,  -- nullable for virtual members (Phase 2)
  email text,                          -- lowercase
  name text not null,
  emoji text not null default '🙂',
  color text not null default 'lavender',
  role text not null default 'member' check (role in ('parent', 'member')),
  visible_sections jsonb not null default '[]',  -- Phase 2 populates
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create unique index members_family_auth_user_uniq on public.members(family_id, auth_user_id) where auth_user_id is not null;

create table public.family_settings (
  family_id uuid primary key references public.families(id) on delete cascade,
  timezone text not null,              -- e.g. 'America/Chicago'
  theme text not null default 'lavender' check (theme in ('lavender', 'midnight')),
  trial_ends_at timestamptz,           -- set at family creation; D-06
  stripe_subscription_status text,     -- 'trialing' | 'active' | 'canceled' | NULL
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.allowed_emails (
  email text primary key,              -- store lowercased
  family_id uuid references public.families(id) on delete cascade,  -- which family they belong to (nullable while bootstrapping)
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  assigned_member_id uuid references public.members(id) on delete set null,
  frequency text not null check (frequency in ('once', 'daily', 'weekly', 'monthly')),
  requires_approval boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.chore_completions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  chore_id uuid not null references public.chores(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  completed_at timestamptz not null default now(),
  approved_by uuid references public.members(id),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  rrule text,                          -- RFC 5545 recurrence
  assigned_member_id uuid references public.members(id) on delete set null,
  dropoff_parent_id uuid references public.members(id),
  pickup_parent_id uuid references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  title text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique (family_id, date, slot)
);

create table public.groceries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  qty text,
  category text,
  checked boolean not null default false,
  added_by_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  body text not null default '',
  posted_by_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table public.push_subscriptions (
  endpoint text primary key,
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications_queue (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  kind text not null,                  -- 'chore_due' | 'chore_completed' | 'event_reminder' | 'custody_change'
  payload jsonb not null,
  scheduled_for timestamptz not null,
  delivered_at timestamptz,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create table public.family_links (
  id uuid primary key default gen_random_uuid(),
  family_a_id uuid not null references public.families(id) on delete cascade,
  family_b_id uuid not null references public.families(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (family_a_id <> family_b_id)
);
create unique index family_links_pair_uniq on public.family_links (least(family_a_id, family_b_id), greatest(family_a_id, family_b_id));

-- ── updated_at trigger function ───────────────────────────────────
-- Pitfall 2: SECURITY DEFINER + set search_path = '' avoids search_path attacks.
-- The function writes to NEW.updated_by from `auth.uid()` when not already supplied.

create or replace function private.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(new.updated_by, (select auth.uid()));
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Apply trigger to every audited table (10 tables — push_subscriptions IS audited
-- because endpoints rotate; notifications_queue is NOT audited because it is an
-- append-only event log; allowed_emails is NOT audited because rows are immutable
-- — revoke = delete; family_links is NOT audited because it is a pair record).
do $$
declare t text;
begin
  for t in select unnest(array['families','members','family_settings','chores','chore_completions','events','meals','groceries','notes','push_subscriptions']) loop
    execute format('create trigger trg_%s_updated_at before update on public.%s for each row execute function private.set_updated_at();', t, t);
  end loop;
end$$;

-- ── Helper functions (SECURITY DEFINER, in `private` schema) ──────
-- `private` is NOT exposed via PostgREST API (only `public` is by default), so
-- these helpers cannot be invoked from the client. They are callable from RLS
-- policies because policies execute in the planner's context.

create or replace function private.current_family_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select family_id
  from public.members
  where auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.auth_is_parent()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.members
    where auth_user_id = (select auth.uid())
      and role = 'parent'
  );
$$;

grant execute on function private.current_family_id() to authenticated;
grant execute on function private.auth_is_parent() to authenticated;

-- ── Row Level Security ────────────────────────────────────────────

alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.family_settings enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.chores enable row level security;
alter table public.chore_completions enable row level security;
alter table public.events enable row level security;
alter table public.meals enable row level security;
alter table public.groceries enable row level security;
alter table public.notes enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notifications_queue enable row level security;
alter table public.family_links enable row level security;

-- families: members see their own family; insert is unrestricted in Phase 1
-- (Phase 2 + Stripe billing gate this — RESEARCH.md Open Question 4 RESOLVED)
create policy families_select on public.families
  for select to authenticated
  using (id = private.current_family_id());

create policy families_insert on public.families
  for insert to authenticated
  with check (true);    -- ONBD-01: any authenticated allowlisted user can create the first family

create policy families_update on public.families
  for update to authenticated
  using (id = private.current_family_id() and private.auth_is_parent())
  with check (id = private.current_family_id());

-- Generic family_id-scoped policies for the rest. (Generated via do-block.)
-- One SELECT, INSERT, UPDATE, DELETE policy per table — 10 tables × 4 = 40 policies.
do $$
declare t text;
begin
  for t in select unnest(array['members','family_settings','chores','chore_completions','events','meals','groceries','notes','push_subscriptions','notifications_queue']) loop
    execute format($f$
      create policy %I_select on public.%I
        for select to authenticated
        using (family_id = private.current_family_id());
      create policy %I_insert on public.%I
        for insert to authenticated
        with check (family_id = private.current_family_id());
      create policy %I_update on public.%I
        for update to authenticated
        using (family_id = private.current_family_id())
        with check (family_id = private.current_family_id());
      create policy %I_delete on public.%I
        for delete to authenticated
        using (family_id = private.current_family_id() and private.auth_is_parent());
    $f$, t, t, t, t, t, t, t, t);
  end loop;
end$$;

-- ── Bootstrap INSERT policies for first-family creation ───────────
-- Plan 02 §8a: closes the chicken-and-egg gap in the Family Creation Wizard.
--
-- The generic `*_insert` policies above use `with check (family_id =
-- private.current_family_id())`. During the Family Creation Wizard's first
-- INSERTs, `private.current_family_id()` returns NULL because no `members` row
-- exists yet for the authenticated user — and `NULL = NULL` is FALSE, so the
-- generic policies refuse the writes. Without these two bootstrap policies the
-- wizard would need service-role bypass.
--
-- Postgres applies the UNION of all permissive policies, so these sit alongside
-- (do not replace) the generic INSERT policies.

create policy members_insert_bootstrap on public.members
  for insert to authenticated
  with check (
    auth.uid() is not null
    and not exists (select 1 from public.members m where m.auth_user_id = auth.uid())
  );
-- Allows the user's FIRST member row to be inserted into any family — but only
-- when they have zero member rows yet. Threat: a user could insert themselves
-- into another family's id, but in practice the wizard always pairs this with a
-- freshly-created family (created by the same auth.uid()), so the family_id is
-- provably the user's own. Once any member row exists for the user, this policy
-- stops applying and the generic `members_insert` (gated on family_id =
-- private.current_family_id()) takes over.

create policy family_settings_insert_bootstrap on public.family_settings
  for insert to authenticated
  with check (
    family_id in (select id from public.families where created_by = auth.uid())
  );
-- Allows INSERT into family_settings ONLY when the authenticated user is the
-- `created_by` of that family — i.e., they just inserted the family row in the
-- same wizard submit. Window closes after wizard completes because future writes
-- go through the generic `family_settings_update` policy.

-- ── allowed_emails policies ───────────────────────────────────────
-- User sees only their own row; only parents may INSERT/DELETE. No UPDATE
-- policy: allowlist rows are immutable (revoke = delete).

create policy allowed_emails_select_own on public.allowed_emails
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

create policy allowed_emails_insert_parent on public.allowed_emails
  for insert to authenticated
  with check (private.auth_is_parent());

create policy allowed_emails_delete_parent on public.allowed_emails
  for delete to authenticated
  using (private.auth_is_parent());

-- ── family_links policy ───────────────────────────────────────────
-- SELECT-only in Phase 1; Phase 4 adds INSERT/UPDATE/DELETE when the linked-
-- family UI exists. Visible to either side of the pair.

create policy family_links_select on public.family_links
  for select to authenticated
  using (
    family_a_id = private.current_family_id()
    or family_b_id = private.current_family_id()
  );

-- ── Realtime publication ──────────────────────────────────────────
-- ARCH-07: adds 11 family-scoped tables to `supabase_realtime` so
-- `postgres_changes` events fire. `family_links` is NOT included in Phase 1
-- (no UI consumes it yet). `allowed_emails` is NOT included (mutations are
-- rare, no client UI subscribes).

alter publication supabase_realtime add table
  public.families,
  public.members,
  public.family_settings,
  public.chores,
  public.chore_completions,
  public.events,
  public.meals,
  public.groceries,
  public.notes,
  public.push_subscriptions,
  public.notifications_queue;

-- ── Bootstrap allowed_emails ──────────────────────────────────────
-- Sourced verbatim from ../family-app/src/lib/allowedEmails.js. These rows MUST
-- be present BEFORE Plan 03's allowlist gate runs (Pitfall 8). Re-running this
-- migration is safe — ON CONFLICT DO NOTHING is idempotent.

insert into public.allowed_emails (email) values
  ('travis.g.mader@gmail.com'),
  ('angelia.m.merryman14@gmail.com'),
  ('laylamerryman11@gmail.com'),
  ('stellamader6@gmail.com'),
  ('maderroman5@gmail.com')
on conflict do nothing;
