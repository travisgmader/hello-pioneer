-- The Crown Season — cloud sync schema
-- Members authenticate (Google) and sync progress + journal per user.
-- Leader content (real names, pastoral notes) lives here behind RLS so it
-- never ships in the client bundle.

-- ---------------------------------------------------------------------------
-- Leader identity: a single email is the group leader. Kept in one place so
-- both policies and the profile trigger agree. Update the email if it changes.
-- ---------------------------------------------------------------------------
-- This migration is idempotent — safe to run repeatedly.
create or replace function public.is_leader()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'travis.g.mader@gmail.com'
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per authenticated user, auto-created on signup.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  is_leader    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- back-fill columns in case an earlier/partial profiles table is missing them
alter table public.profiles add column if not exists email        text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists is_leader    boolean not null default false;
alter table public.profiles add column if not exists created_at   timestamptz not null default now();
alter table public.profiles add column if not exists updated_at   timestamptz not null default now();

alter table public.profiles enable row level security;

drop policy if exists "read own or leader reads all" on public.profiles;
create policy "read own or leader reads all"
  on public.profiles for select
  using (id = auth.uid() or public.is_leader());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- Auto-provision a profile whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, is_leader)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.email, '') = 'travis.g.mader@gmail.com'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- progress: completed study days. day_key is "<week>-<day>" e.g. "1-1".
-- ---------------------------------------------------------------------------
create table if not exists public.progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  day_key      text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

alter table public.progress enable row level security;

drop policy if exists "own progress" on public.progress;
create policy "own progress"
  on public.progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- journal: gratitude + reflection, one row per user per STUDY DAY.
-- day_key is "<week>-<day>" e.g. "1-2" (same format as progress).
-- ---------------------------------------------------------------------------
create table if not exists public.journal (
  user_id     uuid not null references auth.users (id) on delete cascade,
  day_key     text not null,
  gratitude   text not null default '',
  reflection  text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (user_id, day_key)
);

alter table public.journal enable row level security;

drop policy if exists "own journal" on public.journal;
create policy "own journal"
  on public.journal for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- leader_content: single-row jsonb payload holding the sensitive leader data
-- (roster, member intake profiles, analysis, per-week notes). Readable and
-- writable only by the leader — nothing here ever ships to member clients.
-- ---------------------------------------------------------------------------
create table if not exists public.leader_content (
  id         integer primary key default 1,
  payload    jsonb not null,
  updated_at timestamptz not null default now(),
  constraint leader_content_singleton check (id = 1)
);

alter table public.leader_content enable row level security;

drop policy if exists "leader only" on public.leader_content;
create policy "leader only"
  on public.leader_content for all
  using (public.is_leader())
  with check (public.is_leader());
