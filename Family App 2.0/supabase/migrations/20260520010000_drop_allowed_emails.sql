-- Drop allowlist gate — app is moving to App Store with open registration.
-- Family isolation is enforced by RLS (family_id on all tables).
-- Access control moves to invite-based family joining (Phase 5+).
drop table if exists public.allowed_emails cascade;
