# Phase 2: Members, Onboarding & Billing - Context

**Gathered:** 2026-05-27
**Status:** Ready for planning

<domain>
## Phase Boundary

A parent can manage real and virtual family members via a dedicated `/members` tab; a member avatar row above the bottom nav makes context-switching ("Acting as") available at all times; parents can invite family members via email link or generate a one-time 6-digit join code; a COPPA-compliant consent screen gates child member creation for children under 13; and Stripe billing is enforced — invitations are premium-only, gated by `useTier()`, with the trial period sourced from `family_settings.trial_ends_at`.

Visible output: `/members` route with member card list + add/edit bottom sheet; member avatar chip row above nav; `handle_new_user()` Postgres trigger auto-linking invited members; COPPA consent step for under-13 members; `/join` route for code entry post-login; invite action on un-linked member cards; `useTier()` hook enforcing premium gate on invitations.

</domain>

<decisions>
## Implementation Decisions

### Member Management Screen

- **D-01:** Member management lives on a new `/members` tab added to the bottom nav. It is the 7th tab. Parents see it; children can have it hidden via `visible_sections`.
- **D-02:** The `/members` page displays a scrollable card list — one card per member — showing avatar (emoji + color chip), name, role badge (Parent / Child), and edit / delete actions.
- **D-03:** Adding or editing a member opens a bottom sheet / modal over the list. The form includes: name input, emoji picker, color swatch picker, role toggle (Parent / Child), and `visible_sections` checkboxes (which app sections the member sees).
- **D-04:** Member avatar chips appear in a horizontal row **above** the bottom nav tabs. Each chip shows the member's emoji on their color background. Tapping a chip switches the active "Acting as" context. Tapping the currently active chip goes to that member's profile (Phase 7).

### "Acting as" Picker

- **D-05:** "Acting as" is **session-scoped** — tapping a member chip in the avatar row sets that member as the active context for the entire session until the parent taps their own chip or a different member, or logs out.
- **D-06:** When a parent is "Acting as [Name]", a **colored top banner** in that member's `members.color` is shown persistently below the TopNav (above page content). It reads "Acting as [Name]" with a dismiss / switch-back affordance. This is the primary safety indicator.
- **D-07:** **Any** member can be "acted as" — real members (with `auth_user_id`) and virtual members (`auth_user_id = NULL`) both appear in the avatar row for parents. This covers the case where a real member is offline or unavailable.
- **D-08:** Audit trail for "Acting as" actions: `updated_by` on the mutated row records the **parent's `member_id`** (the real actor). The action's `member_id` (or equivalent foreign key) records the **target member** (who the action is attributed to). No separate audit_log table is needed in Phase 2.

### Invitation & Join Flows

- **D-09:** Email invite (ONBD-02): Parent enters an email address on the `/members` page → a member row is pre-seeded with that email → Supabase Auth invite email is sent. When the invitee clicks the link and completes Google OAuth, the `handle_new_user()` Postgres trigger matches `new.email` (lowercase) to the pre-seeded `members.email` column and sets `auth_user_id`.
- **D-10:** 6-digit join code (ONBD-03): The invitee signs in with Google first. If no member row matches their email, they land on a `/join` screen that prompts "Enter your family code." Entering a valid, unexpired code creates or links their member row.
- **D-11:** Both invite mechanisms are triggered from the `/members` page. Un-linked member cards (those with no `auth_user_id`) show an "Invite" action. Tapping opens a bottom sheet with: (top) the 6-digit family code + copy/share button, and (bottom) an "Invite by email" input field.
- **D-12:** The 6-digit join code is **one-time use and expires after 7 days**. A `family_invites` table stores: `code`, `family_id`, `created_at`, `expires_at`, `used_at` (nullable). Once claimed, `used_at` is set and the code is invalid.

### COPPA Parental Consent

- **D-13:** The COPPA consent flow is triggered by an **"Under 13" toggle/checkbox** in the Add Member form. When the parent checks "Under 13" and taps Save, a COPPA consent screen appears before the member row is written.
- **D-14:** The consent screen shows: a plain-language summary of what data is stored for the child (name, emoji, color, chore completions, calendar events); a single checkbox "I am this child's parent or legal guardian and consent to this data being stored"; and a Confirm button. Consent is recorded as a `coppa_consented_at` timestamp on the `members` row.
- **D-15:** No separate email confirmation or full privacy-policy flow is required. This is a closed family app — the lightweight single-checkbox pattern is appropriate.

### useTier() Hook & Premium Gating

- **D-16:** **Invitations are the first premium gate.** Free-tier families (trial expired, no active subscription) cannot invite members by email or generate/use a join code. `useTier()` reads `family_settings.subscription_status` (set by Stripe webhook) and `trial_ends_at` to derive `{ tier: 'free' | 'premium', trialActive: boolean }`.
- **D-17:** When a free-tier family taps the "Invite" action on a member card, the button is visually **locked** (lock icon + "Premium" badge). Tapping it opens a bottom sheet: "Invitations require Premium — upgrade to add family members." The sheet has an Upgrade CTA (wires to Stripe billing portal in Phase 7; for now a placeholder).
- **D-18:** During the 7-day trial (`trialActive: true`), invitations are available. `useTier()` returns `tier: 'premium'` for any family with an active trial.

### Claude's Discretion

- Exact emoji picker library/implementation (native HTML input vs. a picker component) — researcher/planner to choose.
- Color swatch set for member color picker — researcher/planner to define a set of 8–12 distinguishable colors.
- Exact Stripe subscription creation timing for the trial (whether Phase 2 creates the Stripe subscription at trial start or defers it) — left to researcher.
- `/join` route UX polish (loading states, error messages for expired codes) — left to planner.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `.planning/PROJECT.md` — Key Decisions table, constraints (Google OAuth only, Vercel, Supabase, closed access), v1 patterns to carry forward
- `.planning/REQUIREMENTS.md` — Phase 2 requirement IDs: ONBD-02, ONBD-03, ONBD-04, ONBD-05, MEMB-01, MEMB-02, MEMB-03, MEMB-04, MEMB-05, MEMB-06, MEMB-07
- `.planning/ROADMAP.md` §Phase 2 — Goal, success criteria (5 items), mode: mvp

### Phase 1 Context (prior decisions that carry forward)
- `.planning/phases/01-foundation-walking-skeleton/01-CONTEXT.md` — D-04 (useTier deferred to Phase 2), D-05/D-06/D-07 (Stripe infrastructure), D-11/D-12 (useCurrentFamily + RequireFamily), D-14 (member avatar chips deferred to Phase 2)

### Technology Stack
- `CLAUDE.md` §Recommended Stack — pinned versions (React 19, Vite 8, TypeScript 5.7, React Router 7.15, TanStack Query 5.100, Supabase JS 2.106)
- `CLAUDE.md` §TanStack Query v5 Patterns — optimistic mutation pattern with rollback; used for member CRUD
- `CLAUDE.md` §Supabase Realtime Patterns — single channel per concern; members list should invalidate via `useRealtimeBridge()`
- `CLAUDE.md` §UUID Generation — `crypto.randomUUID()` via `newId()` for new member IDs (optimistic create)

### Existing Source Code (integration points)
- `src/data/types.ts` — Full DB schema as TypeScript types; `members` table Row/Insert/Update, `family_settings` Row including `subscription_status` and `trial_ends_at`, `family_invites` table (to be added in this phase)
- `src/data/useCurrentFamily.ts` — `useCurrentFamily()` is the single source of `family_id`; member hooks derive `family_id` from it
- `src/routes/router.tsx` — Current router topology; Phase 2 adds `/members` route and `/join` route
- `src/components/BottomNav.tsx` — Bottom nav component; Phase 2 adds the `/members` tab + avatar chip row above nav
- `src/components/TopNav.tsx` — Top nav component; Phase 2 adds the "Acting as" colored banner below it
- `src/lib/trialEnd.ts` — Trial end date helpers; `useTier()` hook builds on this

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`useCurrentFamily()`** (`src/data/useCurrentFamily.ts`): Returns `FamilyWithSettings | null`. All member hooks should derive `family_id` from `family.id` here. Already handles the `family_settings` embed with `subscription_status` and `trial_ends_at`.
- **`BottomNav`** (`src/components/BottomNav.tsx`): Phase 2 adds a 7th `/members` tab and inserts the avatar chip row above the nav container. This component needs the most structural change.
- **`TopNav`** (`src/components/TopNav.tsx`): Phase 2 adds the "Acting as" banner below TopNav when an "acting as" context is active. Should be a sibling element, not nested inside TopNav.
- **`newId()`** (`src/lib/newId.ts`): Client-side `crypto.randomUUID()` wrapper. Use for new member IDs to enable optimistic creates.
- **`trialEnd.ts`** (`src/lib/trialEnd.ts`): Trial date helpers. `useTier()` hook in Phase 2 extends this with subscription_status reading.
- **`RequireFamily`** (`src/auth/RequireFamily.tsx`): Redirects to `/onboarding/create-family` when no family. Phase 2's `/join` route is parallel — users who have a Google account but no family should land on a screen offering create vs. join.

### Established Patterns
- **TanStack Query for all server state**: Member list → `useMembers(familyId)`, member CRUD → `useMutation` with optimistic update + rollback.  `queryKey: ['members', familyId]` follows the existing `['current-family']` key pattern.
- **Supabase Realtime invalidation**: `useRealtimeBridge()` should subscribe to `members` table changes and invalidate `['members', familyId]`. Pattern mirrors the Phase 1 `['current-family']` invalidation.
- **CSS Modules + CSS variables**: All new components follow CSS Modules pattern. Member colors use `members.color` as a CSS custom property (`style={{ '--member-color': member.color }}`).
- **Bottom sheet pattern**: Phase 2 introduces the first bottom sheet modal. Researcher/planner should pick a consistent approach (CSS-only slide-up div, a headless UI library, or Radix) that can be reused for future phases.

### Integration Points
- **Router**: Add `/members` and `/join` routes to `src/routes/router.tsx`. `/members` is inside RootLayout (protected). `/join` should be inside the auth-required `/` loader but OUTSIDE RootLayout (like `/onboarding/create-family`) since a joining user may not have a family yet.
- **Nav**: `BottomNav` needs the avatar chip row, which requires `useMembers()` to be called (members must be loaded). This is the first hook that needs `family_id` in a layout-level component.
- **`useActingAs` context**: A new context/hook to store the session-scoped active member. Should live at the RootLayout level (inside `RequireFamily`). Components read `useActingAs()` to get the active member; mutations pass the acting-as `member_id` as `member_id` and the real auth'd user's `member_id` as `updated_by`.

</code_context>

<specifics>
## Specific Ideas

- The "Acting as" banner should use the member's `members.color` as the background (or accent), matching the member's avatar chip color, so it's visually unambiguous which member is active.
- The bottom sheet for Add/Edit member should open with a smooth slide-up animation consistent with native mobile sheet behavior. The edit form pre-populates all fields.
- The "Invite" bottom sheet on a member card shows the 6-digit code prominently at the top (copy icon + share via native Web Share API) and an email input below. Both flows in one sheet reduces cognitive load.
- The `/join` route post-login: if the user has no member match and types a valid code, the app should show a confirmation step ("You're joining the [Family Name] family — confirm?") before committing.
- Trial counter: the Dashboard or member page should surface how many trial days remain (Phase 2 responsibility since `useTier()` is being built here).

</specifics>

<deferred>
## Deferred Ideas

- **Stripe billing portal UI** — Phase 7 (Settings). The upgrade CTA in Phase 2's premium gate sheet is a placeholder only.
- **Member profile page with streak stats** — Phase 7 (Cross-Cutting). Tapping a member chip goes to profile; the profile content is Phase 7's responsibility.
- **Per-device + per-trigger push preferences per member** — Phase 6 (Push Notifications).
- **Member page activity history** — Phase 7.
- **Family code rotation / revoke** — Not in Phase 2. The `family_invites` one-time code pattern handles security; manual revoke is a Settings concern for Phase 7.

</deferred>

---

*Phase: 2-Members, Onboarding & Billing*
*Context gathered: 2026-05-27*
