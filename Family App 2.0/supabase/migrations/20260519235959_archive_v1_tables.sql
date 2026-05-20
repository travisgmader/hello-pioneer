-- supabase/migrations/20260519235959_archive_v1_tables.sql
-- Archive Family App v1 tables by renaming them to v1_* prefix.
-- Preserves all v1 data for reference while the v2 schema (20260520000000) is applied.
-- v1 tables: chores, custody, events, groceries, grocery_requests, meal_plan, meal_recommendations, notes

alter table if exists public.chores rename to v1_chores;
alter table if exists public.custody rename to v1_custody;
alter table if exists public.events rename to v1_events;
alter table if exists public.groceries rename to v1_groceries;
alter table if exists public.grocery_requests rename to v1_grocery_requests;
alter table if exists public.meal_plan rename to v1_meal_plan;
alter table if exists public.meal_recommendations rename to v1_meal_recommendations;
alter table if exists public.notes rename to v1_notes;
