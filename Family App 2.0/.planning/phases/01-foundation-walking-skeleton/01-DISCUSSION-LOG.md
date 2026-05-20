# Phase 1: Foundation & Walking Skeleton - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 1-Foundation & Walking Skeleton
**Areas discussed:** Offline queue mechanism, Stripe depth in Phase 1, Email allowlist gate, family_id resolution after auth, Walking skeleton shell fidelity

---

## Offline Queue Mechanism

**Q1: Which offline queue approach for Phase 1?**

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Query built-in | networkMode: 'offlineFirst' on mutations, zero extra infra | ✓ |
| IndexedDB + Background Sync | Service worker intercepts writes, true offline-first, iOS Safari inconsistency | |
| Simplified retry-on-reconnect | Writes fail offline, auto-retry on reconnect, no true queue | |

**User's choice:** TanStack Query built-in (Recommended)

**Q2: networkMode setting?**

| Option | Description | Selected |
|--------|-------------|----------|
| networkMode: 'offlineFirst' | Fires immediately, queues when offline, flushes on reconnect | ✓ |
| networkMode: 'online' (default) | Waits until online before firing, feels unresponsive | |

**User's choice:** offlineFirst (Recommended)

**Q3: Visible offline indicator?**

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — offline banner at top | Shows 'Offline — changes will sync when reconnected' | ✓ |
| Silent queue | Writes queue silently, no indicator | |

**User's choice:** Visible banner (Recommended)

**Q4: Queue persistence across page close?**

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory only is fine | Lost on page close while offline, acceptable for Phase 1 | |
| Persist to localStorage | Serializes paused mutations, harder with complex contexts | |
| You decide | Leave to researcher/planner | ✓ |

**User's choice:** You decide — deferred to Claude discretion
**Notes:** User asked for recommendation; Claude recommended in-memory only for Phase 1, deferred IndexedDB persistence to Phase 6 service worker work.

---

## Stripe Depth in Phase 1

**Q1: What does 'done' look like for Stripe in Phase 1?**

| Option | Description | Selected |
|--------|-------------|----------|
| Infrastructure only | Schema + customer creation + trial tracking. No useTier() hook yet | ✓ |
| Infrastructure + tier hook | Same plus useTier() for Phase 2+ gating | |
| Full foundation with enforcement | Infrastructure + gating + upgrade CTA placeholder | |

**User's choice:** Infrastructure only (Recommended)

**Q2: When/how is the Stripe customer created?**

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Edge Function on family insert | DB trigger → Edge Function, async, isolated | ✓ |
| Client-side on form submit | After Supabase write, client calls /api/stripe endpoint | |

**User's choice:** Edge Function on family insert (Recommended)

**Q3: Where is trial period tracked?**

| Option | Description | Selected |
|--------|-------------|----------|
| family_settings.trial_ends_at column | Timestamp, set at creation, no Stripe call to check | ✓ |
| Stripe subscription object only | Real trial sub immediately, accurate but requires Stripe call | |
| Separate subscriptions table | Mirror Stripe state locally via webhook, most flexible | |

**User's choice:** family_settings.trial_ends_at (Recommended)
**Notes:** User asked for recommendation on whether to continue; Claude recommended moving on — Stripe scope is well-defined.

---

## Email Allowlist Gate

**Q1: How should the closed-app access gate work?**

| Option | Description | Selected |
|--------|-------------|----------|
| DB table: allowed_emails | Supabase table, parents manage it without redeploy | ✓ |
| Env var ALLOWED_EMAILS | Comma-separated on Vercel, requires redeploy to change | |
| Supabase Auth email allowlist | Native Supabase dashboard setting, no code | |

**User's choice:** DB table (Recommended)

**Q2: What happens when non-allowed email signs in?**

| Option | Description | Selected |
|--------|-------------|----------|
| Sign out + show 'access denied' screen | Session invalidated, shows email used and sign-out button | ✓ |
| Block before OAuth redirect | Not possible without email pre-entry | |
| Redirect to request-access form | For apps planning to open beyond one family | |

**User's choice:** Sign out + access denied (Recommended)

**Q3: Who can add/remove from allowed_emails?**

| Option | Description | Selected |
|--------|-------------|----------|
| Only parents (auth_is_parent() = true) | RLS policy, managed from Settings in Phase 7 | ✓ |
| Service role only | Dashboard/migration only, no in-app management | |
| You decide | Leave to researcher/planner | |

**User's choice:** Only parents (Recommended)
**Notes:** User asked for recommendation; Claude recommended moving on — key decisions locked.

---

## family_id Resolution After Auth

**Q1: How should the app resolve family_id post-auth?**

| Option | Description | Selected |
|--------|-------------|----------|
| TanStack Query: useCurrentFamily() hook | Query fetches families row linked to auth.uid(), cached | ✓ |
| Supabase JWT custom claims | family_id baked into JWT, requires custom claims function | |
| Context + session storage | React context seeded from one-time lookup, inconsistent | |

**User's choice:** useCurrentFamily() hook (Recommended)

**Q2: What happens when user has no family?**

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to family creation wizard | RequireFamily boundary → /onboarding/create-family | ✓ |
| Block on waiting screen | Admin must manually create family in dashboard | |
| Auto-create family on first sign-in | Postgres trigger, conflicts with Phase 2 invite/join flow | |

**User's choice:** Redirect to wizard (Recommended)
**Notes:** User asked for recommendation; Claude recommended moving on.

---

## Walking Skeleton Shell Fidelity

**Q1: What does the Phase 1 shell look like?**

| Option | Description | Selected |
|--------|-------------|----------|
| Functional nav + placeholder pages | All route links in nav, empty state placeholders, theme toggle | ✓ |
| Login + dashboard only | Just OAuth + empty dashboard | |
| Full v1 nav with member chips | Member avatars in nav, theme switcher, all routes | |

**User's choice:** Functional nav + placeholder pages (Recommended)

**Q2: Default theme for new users?**

| Option | Description | Selected |
|--------|-------------|----------|
| Lavender | Original v1 theme, safe default | |
| Match OS preference | prefers-color-scheme → Lavender (light) or Midnight (dark) | ✓ |

**User's choice:** Match OS preference

**Q3: Where is theme preference stored?**

| Option | Description | Selected |
|--------|-------------|----------|
| family_settings table | Family-wide, consistent across all devices | ✓ |
| localStorage (per-device) | Same as v1, fast, differs between devices | |
| members table (per-member) | Each member can pick their own, adds schema complexity | |

**User's choice:** family_settings table (Recommended)
**Notes:** User asked for recommendation on continuing; Claude recommended writing CONTEXT.md — all areas covered.

---

## Claude's Discretion

- **Offline queue persistence depth** — user deferred to Claude. Claude's position: in-memory only for Phase 1, IndexedDB deferred to Phase 6.
- **Stripe webhook event list** — left to researcher to determine specific events beyond trial-related ones.
- **TypeScript strictness** — `strict: true` in tsconfig is Claude's default; researcher may relax specific checks if needed.

## Deferred Ideas

- `useTier()` hook and feature gating → Phase 2
- Stripe billing portal UI → Phase 7
- Offline queue persistence across page close → Phase 6
- Member avatar chips in nav → Phase 2
- Per-member theme preference → Considered and rejected in favor of family-level setting
