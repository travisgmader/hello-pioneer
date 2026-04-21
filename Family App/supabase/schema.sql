-- ============================================================
-- Family Hub — Supabase Schema
-- Run this in the Supabase SQL editor (project > SQL Editor)
-- ============================================================

-- ── Chores ──────────────────────────────────────────────────
create table if not exists chores (
  id          text primary key,
  title       text not null,
  assigned_to text,
  frequency   text not null default 'weekly',
  completed   boolean not null default false,
  due_date    date,
  created_at  timestamptz not null default now()
);

-- ── Events ──────────────────────────────────────────────────
create table if not exists events (
  id               text primary key,
  title            text not null,
  member_id        text,
  date             date not null,
  time             text,
  color            text not null default 'lavender',
  transport_parent text,
  created_at       timestamptz not null default now()
);

-- ── Custody (one row per day) ────────────────────────────────
create table if not exists custody (
  date   date primary key,
  parent text not null  -- 'mom' | 'dad'
);

-- ── Meal plan ────────────────────────────────────────────────
create table if not exists meal_plan (
  date date not null,
  slot text not null,  -- 'Breakfast' | 'Lunch' | 'Dinner'
  meal text not null,
  primary key (date, slot)
);

-- ── Meal recommendations ─────────────────────────────────────
create table if not exists meal_recommendations (
  id           text primary key,
  title        text not null,
  category     text not null default 'Dinner',
  suggested_by text,
  votes        jsonb not null default '[]',
  created_at   timestamptz not null default now()
);

-- ── Groceries ────────────────────────────────────────────────
create table if not exists groceries (
  id         text primary key,
  name       text not null,
  qty        text,
  category   text not null default 'Other',
  added_by   text,
  checked    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Grocery requests ─────────────────────────────────────────
create table if not exists grocery_requests (
  id           text primary key,
  name         text not null,
  requested_by text,
  notes        text,
  status       text not null default 'pending',  -- 'pending' | 'approved'
  created_at   timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- Enabled but permissive for now (single-family, no auth).
-- Tighten these policies when you add Supabase Auth.
-- ============================================================

alter table chores               enable row level security;
alter table events               enable row level security;
alter table custody              enable row level security;
alter table meal_plan            enable row level security;
alter table meal_recommendations enable row level security;
alter table groceries            enable row level security;
alter table grocery_requests     enable row level security;

-- Allow all operations for anonymous users until auth is added
create policy "public access" on chores               for all using (true) with check (true);
create policy "public access" on events               for all using (true) with check (true);
create policy "public access" on custody              for all using (true) with check (true);
create policy "public access" on meal_plan            for all using (true) with check (true);
create policy "public access" on meal_recommendations for all using (true) with check (true);
create policy "public access" on groceries            for all using (true) with check (true);
create policy "public access" on grocery_requests     for all using (true) with check (true);
