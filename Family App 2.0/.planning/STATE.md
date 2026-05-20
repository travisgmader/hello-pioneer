# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-19)

**Core value:** Every family member always knows what needs doing, what's coming up, and who has the kids today — and gets a push notification when it actually matters.
**Current focus:** Phase 1 — Foundation & Walking Skeleton

## Current Position

Phase: 1 of 10 (Foundation & Walking Skeleton)
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: 2026-05-19 — Roadmap created from requirements; 10 phases derived from research build order

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: n/a
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: n/a
- Trend: n/a

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Phase 1: Full rewrite over incremental refactor — v1 architectural debt would constrain every phase
- Phase 1: React Router v7 (Data mode) over v6 — v6 is feature-frozen; v7 is the non-breaking successor
- Phase 1: TanStack Query over custom context — solves v1's biggest data reliability issues
- Phase 1: `members` as join axis (not `auth.users`) — unlocks virtual members and email-change resilience
- Phase 1: `chore_completions` event log in initial schema — required for streaks/history/parent alerts, not retrofittable
- Phase 1: Custody pattern + overrides model (never per-day rows) — v1's per-day approach requires rewriting hundreds of rows
- Phase 1: Single `useRealtimeBridge()` at app root — Pattern A optimistic mutations with Realtime patch (no double-invalidate)
- Phase 6: Custom service worker via `injectManifest` — `generateSW` cannot include push event handlers
- Phase 10: Migration last — v2 schema must be stable before migration is designed

### Pending Todos

None yet.

### Blockers/Concerns

Open questions from research/SUMMARY.md to resolve before/during each phase:
- Phase 1: Family timezone default (browser-derived vs prompted) — recommend prompt on first run, default to browser
- Phase 2: Roman's device model (shared vs own) — affects "Acting as" picker design
- Phase 3: Streak freeze on vacations (pause mode?) — defer if it adds MVP friction
- Phase 3: Chore due time soft vs hard — recommend soft (same-day completion still counts)
- Phase 6: Push payload privacy — default to generic copy with per-family "show details" toggle
- Phase 10: v1 custody data shape (periodic vs irregular) — inspect during dry-run

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| *(none)* | | | |

## Session Continuity

Last session: 2026-05-19
Stopped at: Roadmap created; 10 phases, 100% requirement coverage
Resume file: None
