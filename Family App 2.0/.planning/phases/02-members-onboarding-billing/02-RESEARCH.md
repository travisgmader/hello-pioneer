# Phase 2: Members, Onboarding & Billing - Research

**Researched:** 2026-05-28
**Domain:** Multi-tenant member management, invite/join flows, COPPA consent, tier gating (RevenueCat — NOT Stripe)
**Confidence:** HIGH (stack + integration) / MEDIUM (RevenueCat trial event mapping)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Member Management Screen**
- **D-01:** Member management lives on a new `/members` tab added to the bottom nav. It is the 7th tab. Parents see it; children can have it hidden via `visible_sections`.
- **D-02:** The `/members` page displays a scrollable card list — one card per member — showing avatar (emoji + color chip), name, role badge (Parent / Child), and edit / delete actions.
- **D-03:** Adding or editing a member opens a bottom sheet / modal over the list. The form includes: name input, emoji picker, color swatch picker, role toggle (Parent / Child), and `visible_sections` checkboxes (which app sections the member sees).
- **D-04:** Member avatar chips appear in a horizontal row **above** the bottom nav tabs. Each chip shows the member's emoji on their color background. Tapping a chip switches the active "Acting as" context. Tapping the currently active chip goes to that member's profile (Phase 7).

**"Acting as" Picker**
- **D-05:** "Acting as" is **session-scoped** — tapping a member chip in the avatar row sets that member as the active context for the entire session until the parent taps their own chip or a different member, or logs out.
- **D-06:** When a parent is "Acting as [Name]", a **colored top banner** in that member's `members.color` is shown persistently below the TopNav (above page content). It reads "Acting as [Name]" with a dismiss / switch-back affordance. This is the primary safety indicator.
- **D-07:** **Any** member can be "acted as" — real members (with `auth_user_id`) and virtual members (`auth_user_id = NULL`) both appear in the avatar row for parents. This covers the case where a real member is offline or unavailable.
- **D-08:** Audit trail for "Acting as" actions: `updated_by` on the mutated row records the **parent's `member_id`** (the real actor). The action's `member_id` (or equivalent foreign key) records the **target member** (who the action is attributed to). No separate audit_log table is needed in Phase 2.

**Invitation & Join Flows**
- **D-09:** Email invite (ONBD-02): Parent enters an email address on the `/members` page → a member row is pre-seeded with that email → Supabase Auth invite email is sent. When the invitee clicks the link and completes Google OAuth, the `handle_new_user()` Postgres trigger matches `new.email` (lowercase) to the pre-seeded `members.email` column and sets `auth_user_id`.
- **D-10:** 6-digit join code (ONBD-03): The invitee signs in with Google first. If no member row matches their email, they land on a `/join` screen that prompts "Enter your family code." Entering a valid, unexpired code creates or links their member row.
- **D-11:** Both invite mechanisms are triggered from the `/members` page. Un-linked member cards (those with no `auth_user_id`) show an "Invite" action. Tapping opens a bottom sheet with: (top) the 6-digit family code + copy/share button, and (bottom) an "Invite by email" input field.
- **D-12:** The 6-digit join code is **one-time use and expires after 7 days**. A `family_invites` table stores: `code`, `family_id`, `created_at`, `expires_at`, `used_at` (nullable). Once claimed, `used_at` is set and the code is invalid.

**COPPA Parental Consent**
- **D-13:** The COPPA consent flow is triggered by an **"Under 13" toggle/checkbox** in the Add Member form. When the parent checks "Under 13" and taps Save, a COPPA consent screen appears before the member row is written.
- **D-14:** The consent screen shows: a plain-language summary of what data is stored for the child (name, emoji, color, chore completions, calendar events); a single checkbox "I am this child's parent or legal guardian and consent to this data being stored"; and a Confirm button. Consent is recorded as a `coppa_consented_at` timestamp on the `members` row.
- **D-15:** No separate email confirmation or full privacy-policy flow is required. This is a closed family app — the lightweight single-checkbox pattern is appropriate.

**useTier() Hook & Premium Gating**
- **D-16:** **Invitations are the first premium gate.** Free-tier families (trial expired, no active subscription) cannot invite members by email or generate/use a join code. `useTier()` reads `family_settings.subscription_status` (set by RevenueCat webhook — see Reframe below) and `trial_ends_at` to derive `{ tier: 'free' | 'premium', trialActive: boolean }`.
- **D-17:** When a free-tier family taps the "Invite" action on a member card, the button is visually **locked** (lock icon + "Premium" badge). Tapping it opens a bottom sheet: "Invitations require Premium — upgrade to add family members." The sheet has an Upgrade CTA (wires to billing portal in Phase 7; for now a placeholder).
- **D-18:** During the 7-day trial (`trialActive: true`), invitations are available. `useTier()` returns `tier: 'premium'` for any family with an active trial.

### Claude's Discretion
- Exact emoji picker library/implementation (native HTML input vs. a picker component) — researcher/planner to choose.
- Color swatch set for member color picker — researcher/planner to define a set of 8–12 distinguishable colors.
- Exact RevenueCat subscription creation timing for the trial (whether Phase 2 creates the subscription at trial start or defers it) — left to researcher.
- `/join` route UX polish (loading states, error messages for expired codes) — left to planner.

### Deferred Ideas (OUT OF SCOPE)
- **Billing portal UI** — Phase 7 (Settings). The upgrade CTA in Phase 2's premium gate sheet is a placeholder only.
- **Member profile page with streak stats** — Phase 7 (Cross-Cutting). Tapping a member chip goes to profile; the profile content is Phase 7's responsibility.
- **Per-device + per-trigger push preferences per member** — Phase 6 (Push Notifications).
- **Member page activity history** — Phase 7.
- **Family code rotation / revoke** — Not in Phase 2. The `family_invites` one-time code pattern handles security; manual revoke is a Settings concern for Phase 7.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONBD-02 | Invite family members by email link | Supabase `inviteUserByEmail` (admin API) called from Edge Function + `handle_new_user()` trigger (Pattern 1 below) |
| ONBD-03 | Join a family via 6-digit code | New `family_invites` table + `/join` route + `claim_family_invite()` RPC (Pattern 2 below) |
| ONBD-04 | COPPA parental consent flow | `coppa_consented_at` column on `members` + consent screen UI (Pattern 5 below) |
| ONBD-05 | 7-day free trial of premium tier | Already set on `family_settings.trial_ends_at` in Phase 1 wizard via `computeTrialEnd()`; `useTier()` reads it (Pattern 4) |
| MEMB-01 | Parents can add, edit, and delete members | `useMembers()` query hook + `useUpsertMember()` / `useDeleteMember()` mutation hooks; CRUD UI on `/members` route (Pattern 6) |
| MEMB-02 | Real members — linked via `members.auth_user_id` | `handle_new_user()` trigger links Google sign-in to pre-seeded row by email (Pattern 1) |
| MEMB-03 | Virtual members — no Google account (`auth_user_id = NULL`) | INSERT `members` row with `auth_user_id: null` from parent's session (RLS allows this via `private.current_family_id()`) |
| MEMB-04 | Per-member name, emoji, color | Form fields in Add/Edit bottom sheet; columns already exist in `members` (Pattern 6) |
| MEMB-05 | Per-member `visible_sections JSONB` | Checkboxes in Add/Edit form; column already exists; downstream UI honors via `useMembers()` filter (Pattern 7) |
| MEMB-06 | "Acting as" picker with audit | `useActingAs()` Context provider + `useActingAsMember()` hook; every mutation reads `actingAsId` and writes `member_id: actingAsId, updated_by: parentMemberId` (Pattern 8) |
| MEMB-07 | `handle_new_user()` Postgres trigger | New migration `handle_new_user.sql` — trigger on `auth.users INSERT` (Pattern 1) |
</phase_requirements>

---

## Summary

This phase wires up everything around the `members` table that Phase 1 stubbed: the `handle_new_user()` trigger, member CRUD, the avatar chip + "Acting as" UX, invite flows (both email and 6-digit code), COPPA consent for under-13s, and the first real premium gate via `useTier()`.

**The single most important finding:** Phase 1 shipped with **RevenueCat, not Stripe**. The CONTEXT.md was written assuming Stripe. Every reference to "Stripe webhook" / "Stripe customer" / "Stripe subscription" in the success criteria, ROADMAP, and CONTEXT.md is incorrect for the current codebase state. The existing `supabase/functions/revenuecat-webhook/index.ts` is the authoritative billing webhook; `families.rc_app_user_id` and `family_settings.subscription_status` are the canonical columns. `useTier()` MUST read those. Plan-check should flag any plan that introduces a Stripe SDK, Stripe customer, or Stripe webhook in Phase 2.

The **second most important finding:** `inviteUserByEmail` requires the `service_role` key and **must be called from an Edge Function**, not the browser. Phase 1 already established the Edge Function pattern (revenuecat-webhook); we add a new `invite-member` Edge Function with parent-role authorization.

The **third most important finding:** RevenueCat does NOT emit a `TRIAL_STARTED` webhook event. The existing webhook handler (`supabase/functions/revenuecat-webhook/index.ts` line 65-67) maps a `TRIAL_STARTED` case that will never fire. Trial state in RevenueCat is signalled by `INITIAL_PURCHASE` with `period_type === 'TRIAL'`. This is independent of the app-internal 7-day trial that runs from `family_settings.trial_ends_at` (set on family creation, no RevenueCat purchase needed). Phase 2's `useTier()` should treat `trial_ends_at > now()` as `trialActive` REGARDLESS of RevenueCat state — the trial is app-driven, not RevenueCat-driven, until a paid product exists.

**Primary recommendation:** Implement Phase 2 in 5 waves: (1) Schema + trigger + `family_invites` table + `coppa_consented_at` column, (2) `useMembers()` + `useTier()` + `useActingAs()` hooks, (3) `/members` route + AddEditMemberSheet + ActingAsBanner + Avatar chip row in BottomNav, (4) Invite flow (Edge Function + Sheet + `/join` route), (5) COPPA consent screen + premium gate sheet. Defer the Upgrade CTA wiring to a placeholder "coming in Phase 7" link.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Member CRUD UI | Browser/Client | — | TanStack Query optimistic updates own this |
| Email invitation send | Edge Function (Deno) | Browser (form) | `inviteUserByEmail` requires service_role; cannot run in browser |
| `handle_new_user()` linking | Database (Postgres trigger) | — | Must execute atomically with `auth.users INSERT` on every signup |
| 6-digit code generation | Database (RPC) | Browser (display) | RPC runs as `SECURITY DEFINER`, ensures uniqueness, never exposes service_role |
| 6-digit code claim | Database (RPC) | Browser (form) | Atomic check-and-set on `used_at`; RLS-safe |
| COPPA consent timestamp | Database (column) | Browser (UI gate) | Single column on `members`; UI enforces before INSERT |
| `useTier()` derivation | Browser/Client | — | Pure derivation from already-loaded `family_settings`; no extra fetch |
| "Acting as" state | Browser (React Context) | — | Session-scoped, never persisted to DB |
| Audit trail (`updated_by`) | Browser (mutation) | Database (column) | Parent's `member_id` written by client on every mutation |
| Subscription state | Database (webhook-written) | Browser (read via `useCurrentFamily`) | RevenueCat webhook → `family_settings.subscription_status`; client reads embedded value |

---

## Standard Stack

### Core (already in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | `^2.106.0` (latest 2.106.2) [VERIFIED: npm registry] | DB + Auth | Phase 1 standard; carry forward |
| `@tanstack/react-query` | `^5.100.0` [VERIFIED: package.json] | Server state + mutations | Phase 1 standard; optimistic CRUD pattern |
| `react-router` | `^7.15.0` [VERIFIED: package.json] | `/members` and `/join` routes | Phase 1 standard; Data mode |
| `luxon` | `^3.7.0` [VERIFIED: package.json] | Trial expiry / code expiry math | Phase 1 standard; ARCH-13 |

### New libraries to add
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `vaul` | `^1.1.2` [VERIFIED: npm registry — version published Dec 2024] | Bottom sheet primitive for Add/Edit Member, Invite, COPPA, Premium Gate sheets | Built on Radix Dialog primitive — handles focus management, ARIA, drag-to-dismiss; 9KB gzip; mobile-first; CSS Modules friendly (unstyled). Widely adopted (shadcn/ui ships Drawer based on it). [CITED: https://github.com/emilkowalski/vaul] |

### Supporting (zero-dep alternatives considered + recommended)
| Choice area | Decision | Why |
|-------------|----------|-----|
| **Emoji picker** | **Native `<input type="text">` + a small static grid of curated emojis (same pattern as Phase 1 wizard line 28: `EMOJI_CHIPS = ['🏠', '🌳', '🌟', '🌈', '🏡', '🦊', '🐝', '🌻']`)** | Phase 1's `create-family.tsx` already establishes a 8-chip palette pattern. Extending to ~24 chips covering people/animals/objects covers MEMB-04 without adding 60KB+ of `emoji-picker-react` (or worse, `emoji-mart`). [VERIFIED: src/routes/onboarding/create-family.tsx:28] |
| **Color swatch picker** | **Static palette of 10 named colors (matching CSS-variable theme)** | CSS variables already define `--lavender`, etc.; pick 10 distinguishable hex values that work in both Lavender and Midnight themes. No library needed. |
| **6-digit code generation** | **Database SECURITY DEFINER function `private.generate_invite_code()`** using `floor(random() * 900000 + 100000)` with retry-on-conflict (unique constraint on `code`) | Avoids a code-collision race on the client. Single source of truth. |
| **Web Share API** | **Native `navigator.share()` with fallback to clipboard copy** | Per CONTEXT.md "specifics": "share via native Web Share API". Zero deps; widely supported in mobile browsers. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `vaul` for bottom sheets | `react-modal-sheet` v5.6.0 | Both are valid. `vaul` chosen because it's built on Radix Dialog (better a11y baseline) and is the de facto pattern in the React + Tailwind ecosystem in 2026. `react-modal-sheet` is great but uses Motion (Framer-style) which adds animation runtime weight. |
| `vaul` for bottom sheets | Hand-rolled CSS-only slide-up div | A CSS-only sheet works visually but loses: focus trap, ESC handling, scroll-lock on body, drag-to-dismiss, snap points, ARIA `role="dialog"`. Re-implementing these correctly is ~300 lines of subtle code. `vaul` is 9KB gzip — worth it. |
| `emoji-picker-react` (v4.19.1) | Native `<input>` + small static grid | Picker adds ~60KB. A family app uses ~24 well-chosen emojis; full picker is overkill. [VERIFIED: npm view emoji-picker-react version → 4.19.1] |
| Server-generated UUID for `family_invites.id` | `crypto.randomUUID()` on client | Codes are short-lived and don't need optimistic UI (the parent waits for the code to display). Server gen is simpler. The 6-digit code itself is generated server-side. |
| Stripe subscription at family creation | App-internal trial via `trial_ends_at` only | **Phase 1 already implements this.** The wizard sets `trial_ends_at` 7 days out. RevenueCat is only involved if/when the user actually attempts to purchase. Phase 2 should NOT create a RevenueCat customer at family creation. |

**Installation:**
```bash
npm install vaul
```

**Version verification (run 2026-05-28):**
- `npm view @supabase/supabase-js version` → `2.106.2` (latest)
- `npm view vaul version` → `1.1.2` (latest; published 2024-12-14)
- `npm view react-modal-sheet version` → `5.6.0` (alternative not chosen)
- `npm view emoji-picker-react version` → `4.19.1` (rejected — too heavy)

---

## Package Legitimacy Audit

slopcheck was not available in this research environment. All packages are tagged `[ASSUMED]` per protocol; planner must gate each new install behind a `checkpoint:human-verify` task.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `vaul` | npm | ~2.4 yrs (created Jul 2023) | ~500k/wk (per npm) | github.com/emilkowalski/vaul | not run | Approved — Emil Kowalski (ex-Vercel design), used by shadcn/ui ecosystem |
| `@supabase/supabase-js` | npm | 5+ yrs | ~3M/wk | github.com/supabase/supabase-js | already installed | Approved |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

**Planner action:** Insert a `checkpoint:human-verify` task BEFORE `npm install vaul` in the relevant wave. The user should confirm via the package's GitHub link before the install runs.

---

## Architecture Patterns

### System Architecture Diagram

```
                  ┌────────────────────────────────────────┐
                  │  Browser / React 19 (Vite SPA)         │
                  │                                        │
   /members ──────┤  MembersRoute                          │
                  │    ├─ useMembers(familyId) ─┐          │
                  │    ├─ MemberCardList        │          │
                  │    ├─ AddEditMemberSheet ───┼──────┐   │
                  │    ├─ InviteSheet (per card)│      │   │
                  │    └─ CoppaConsentSheet ────┘      │   │
                  │                                    │   │
                  │  RootLayout                        │   │
                  │    ├─ ActingAsBanner (D-06)        │   │
                  │    ├─ TopNav                       │   │
                  │    ├─ <Outlet/>                    │   │
                  │    ├─ AvatarChipRow ◀── useMembers │   │
                  │    └─ BottomNav (7 tabs incl /members)  │
                  │                                    │   │
   /join   ───────┤  JoinRoute                         │   │
                  │    └─ ClaimCodeForm                │   │
                  │                                    │   │
                  │  ActingAsProvider (React Context)  │   │
                  │    └─ useActingAs()/setActingAs()  │   │
                  │                                    │   │
                  │  useTier() ◀──── useCurrentFamily  │   │
                  └────────────────┬───────────────────┘   │
                                   │                       │
                  ┌────────────────▼───────────────────┐   │
                  │  Supabase (Postgres + Auth + RT)   │   │
                  │                                    │   │
                  │  auth.users  ──INSERT trigger──▶   │   │
                  │     handle_new_user() ───────────┐ │   │
                  │       ├─ UPDATE members          │ │   │
                  │       │   SET auth_user_id =     │ │   │
                  │       │   new.id                 │ │   │
                  │       │   WHERE                  │ │   │
                  │       │   email = lower(         │ │   │
                  │       │     new.email)           │ │   │
                  │       └─ (no match → no-op)      │ │   │
                  │                                  │ │   │
                  │  public.members ◀── CRUD ────────┘ │   │
                  │  public.family_invites             │   │
                  │  public.family_settings            │   │
                  │                                    │   │
                  │  RPC: claim_family_invite(code)    │   │
                  │  RPC: generate_invite_code()       │   │
                  └────────────┬───────────────────────┘   │
                               │                           │
                  ┌────────────▼───────────────────────┐   │
                  │  Edge Functions (Deno)             │   │
                  │                                    │   │
                  │  invite-member  ◀── invoke ────────┘   │
                  │    ├─ verify caller is parent          │
                  │    ├─ INSERT pre-seeded member row     │
                  │    └─ supabase.auth.admin              │
                  │         .inviteUserByEmail(email)      │
                  │                                        │
                  │  revenuecat-webhook (already shipped)  │
                  │    └─ UPDATE family_settings           │
                  │       SET subscription_status = ...    │
                  └────────────────────────────────────────┘
```

### Component Responsibilities

| File | Responsibility | New / Existing |
|------|----------------|----------------|
| `src/routes/members.tsx` | Render member list, add-member CTA | NEW |
| `src/routes/join.tsx` | Render code-claim form | NEW |
| `src/components/members/MemberCard.tsx` | One member's avatar + name + actions | NEW |
| `src/components/members/AddEditMemberSheet.tsx` | Bottom-sheet form for member CRUD | NEW |
| `src/components/members/InviteSheet.tsx` | Bottom-sheet with code + email input | NEW |
| `src/components/members/CoppaConsentSheet.tsx` | Bottom-sheet for COPPA confirmation | NEW |
| `src/components/members/PremiumGateSheet.tsx` | Bottom-sheet for free-tier invite block | NEW |
| `src/components/members/AvatarChipRow.tsx` | Horizontal scroll of member chips, above BottomNav | NEW |
| `src/components/members/ActingAsBanner.tsx` | Colored persistent banner, below TopNav | NEW |
| `src/components/BottomNav.tsx` | Add 7th tab `/members`; render AvatarChipRow above tabs | EDIT (significant) |
| `src/routes/RootLayout.tsx` | Add `ActingAsBanner` between TopNav and Outlet; wrap children in `ActingAsProvider` | EDIT (small) |
| `src/routes/router.tsx` | Add `/members` (inside RootLayout) and `/join` (sibling of `create-family`) | EDIT (small) |
| `src/data/useMembers.ts` | `useQuery(['members', familyId])` | NEW |
| `src/data/useUpsertMember.ts` | `useMutation` (insert or update) + optimistic | NEW |
| `src/data/useDeleteMember.ts` | `useMutation` (delete) + optimistic | NEW |
| `src/data/useTier.ts` | `useTier()` derives `{ tier, trialActive, trialDaysLeft }` | NEW |
| `src/data/useFamilyInvites.ts` | `useQuery` + `useMutation` for generating/claiming codes | NEW |
| `src/auth/ActingAsProvider.tsx` | React Context for session-scoped `actingAsId` | NEW |
| `src/auth/useActingAs.ts` | Hook exposing `{ actingAsId, setActingAs }` | NEW |
| `supabase/migrations/<ts>_phase2_member_management.sql` | Adds `family_invites`, `coppa_consented_at`, `handle_new_user()` trigger, two RPCs | NEW |
| `supabase/functions/invite-member/index.ts` | Edge Function calling `inviteUserByEmail` | NEW |

### Recommended Project Structure (additions)

```
src/
├── routes/
│   ├── members.tsx                # NEW
│   ├── join.tsx                   # NEW
│   └── ... (existing routes)
├── components/
│   ├── members/                   # NEW directory
│   │   ├── MemberCard.tsx
│   │   ├── MemberCard.module.css
│   │   ├── AddEditMemberSheet.tsx
│   │   ├── AddEditMemberSheet.module.css
│   │   ├── InviteSheet.tsx
│   │   ├── CoppaConsentSheet.tsx
│   │   ├── PremiumGateSheet.tsx
│   │   ├── AvatarChipRow.tsx
│   │   ├── AvatarChipRow.module.css
│   │   ├── ActingAsBanner.tsx
│   │   └── ActingAsBanner.module.css
│   ├── BottomNav.tsx              # EDIT
│   └── ... (existing components)
├── data/
│   ├── useMembers.ts              # NEW
│   ├── useUpsertMember.ts         # NEW
│   ├── useDeleteMember.ts         # NEW
│   ├── useTier.ts                 # NEW
│   ├── useFamilyInvites.ts        # NEW
│   └── ... (existing hooks)
├── auth/
│   ├── ActingAsProvider.tsx       # NEW
│   ├── useActingAs.ts             # NEW
│   └── ... (existing)
└── lib/
    ├── memberColors.ts            # NEW — 10-color palette
    └── memberEmojis.ts            # NEW — ~24 curated emojis
```

### Pattern 1: Email Invite + `handle_new_user()` Trigger

**What:** Parent invites by email → Edge Function pre-seeds a `members` row (with `email`, no `auth_user_id`) and calls `supabase.auth.admin.inviteUserByEmail(email)`. The invite email contains a magic link. When the invitee clicks the link, they land at the OAuth provider selection (or a Supabase-hosted page that signs them in via email magic link). They sign in with Google. A new `auth.users` row is inserted. The `handle_new_user()` trigger fires, finds the pre-seeded `members` row by lowercase email, and stamps `auth_user_id` with the new auth user's UUID.

**Why this design:** `inviteUserByEmail` requires the `service_role` key, so it cannot run in the browser. We isolate the privileged call in an Edge Function and authorize via the caller's parent role. [CITED: https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail]

**When to use:** Email-driven invitation (ONBD-02).

**Example — Postgres trigger (new migration):**
```sql
-- Source: Adapted from https://supabase.com/docs/guides/auth/managing-user-data
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Link the new auth user to a pre-seeded members row, if any
  update public.members
     set auth_user_id = new.id,
         updated_at = now()
   where email = lower(new.email)
     and auth_user_id is null
   -- LIMIT 1 implicit because of unique partial index members_family_auth_user_uniq
   ;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
```

**Example — Edge Function (`supabase/functions/invite-member/index.ts`):**
```typescript
// Pattern mirrors supabase/functions/revenuecat-webhook/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  // 1. Verify caller is an authenticated parent (use the user's anon JWT)
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return new Response('unauthorized', { status: 401 });

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { authorization: authHeader } } },
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return new Response('unauthorized', { status: 401 });

  // Confirm parent role via a SELECT under the caller's JWT (RLS enforces family scope)
  const { data: callerMember } = await userClient
    .from('members')
    .select('id, family_id, role')
    .eq('auth_user_id', user.id)
    .single();
  if (!callerMember || callerMember.role !== 'parent') {
    return new Response('forbidden', { status: 403 });
  }

  // 2. Parse + validate payload
  const { email, name, role, emoji, color, visibleSections } = await req.json();
  const normalizedEmail = String(email).toLowerCase().trim();

  // 3. Pre-seed the members row (admin client bypasses bootstrap policies safely
  //    because we've verified caller is a parent of `callerMember.family_id`)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error: insertErr } = await admin
    .from('members')
    .insert({
      family_id: callerMember.family_id,
      email: normalizedEmail,
      name,
      role: role ?? 'member',
      emoji: emoji ?? '🙂',
      color: color ?? 'lavender',
      visible_sections: visibleSections ?? [],
    });
  if (insertErr) {
    // Duplicate email in the same family → return 409 with message
    return new Response(insertErr.message, { status: 409 });
  }

  // 4. Send the Supabase invite email
  const redirectTo = new URL(req.url).origin + '/'; // Land at app root (handle_new_user wires the link)
  const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo },
  );
  if (inviteErr) {
    // Roll back the pre-seeded row to keep state consistent
    await admin.from('members').delete()
      .eq('family_id', callerMember.family_id)
      .eq('email', normalizedEmail)
      .is('auth_user_id', null);
    return new Response(inviteErr.message, { status: 500 });
  }

  return new Response('invited', { status: 200 });
});
```

**Critical detail (CITED: Supabase community guidance):** `inviteUserByEmail` does not return a useful error when the email already exists in `auth.users` (security non-leak). The Edge Function must handle this case explicitly — typically by returning 200 with a "user already exists; family link will resolve on next sign-in" message.

### Pattern 2: 6-Digit Code Generation + Claim

**What:** Parent triggers code generation → DB inserts a row in `family_invites` with a randomly generated 6-digit code, `expires_at = now() + 7 days`. Parent shares the code. Invitee signs in with Google. If `handle_new_user()` finds no matching member by email, the user has no family — they hit `RequireFamily` which redirects to `/onboarding/create-family`. **CONTEXT.md D-10 requires a third option: route to `/join`** when the user has no family AND a code is available. This requires adding a "Join existing family with a code" link on `/onboarding/create-family`.

**When to use:** Generating an invite code (parent side), claiming an invite code (invitee side).

**Example — SQL schema:**
```sql
create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  code text not null unique,                    -- 6 digits, zero-padded
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_auth_user_id uuid references auth.users(id),
  created_by uuid references auth.users(id) on delete set null
);
create index family_invites_code_active_idx on public.family_invites(code)
  where used_at is null;

alter table public.family_invites enable row level security;

-- SELECT: parents see their family's invites
create policy family_invites_select on public.family_invites
  for select to authenticated
  using (family_id = private.current_family_id() and private.auth_is_parent());

-- INSERT: parents create invites for their own family
create policy family_invites_insert on public.family_invites
  for insert to authenticated
  with check (family_id = private.current_family_id() and private.auth_is_parent());

-- Realtime publication so the parent sees the code appear (cross-device)
alter publication supabase_realtime add table public.family_invites;
```

**Example — Code generation RPC:**
```sql
create or replace function public.generate_invite_code(p_family_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_attempt int := 0;
begin
  -- Authorize: caller must be parent of p_family_id
  if not exists (
    select 1 from public.members m
    where m.auth_user_id = auth.uid()
      and m.family_id = p_family_id
      and m.role = 'parent'
  ) then
    raise exception 'forbidden';
  end if;

  loop
    v_code := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    begin
      insert into public.family_invites (family_id, code, expires_at, created_by)
      values (p_family_id, v_code, now() + interval '7 days', auth.uid());
      return v_code;
    exception when unique_violation then
      v_attempt := v_attempt + 1;
      if v_attempt > 5 then raise exception 'code generation failed'; end if;
    end;
  end loop;
end;
$$;

grant execute on function public.generate_invite_code(uuid) to authenticated;
```

**Example — Code claim RPC:**
```sql
create or replace function public.claim_family_invite(p_code text)
returns table (family_id uuid, family_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite record;
  v_email text;
  v_name text;
begin
  -- Get the caller's email from JWT
  v_email := lower(coalesce((select auth.jwt() ->> 'email'), ''));
  if v_email = '' then raise exception 'no email on session'; end if;

  -- Atomic check-and-claim
  select * into v_invite from public.family_invites
    where code = p_code
      and used_at is null
      and expires_at > now()
    for update;
  if not found then raise exception 'invalid or expired code'; end if;

  update public.family_invites
    set used_at = now(), used_by_auth_user_id = auth.uid()
    where id = v_invite.id;

  -- Link or create the caller's members row
  v_name := coalesce((select raw_user_meta_data ->> 'full_name' from auth.users where id = auth.uid()),
                     split_part(v_email, '@', 1));

  -- Upsert: if a pre-seeded row by email exists, link it; else insert
  if exists (
    select 1 from public.members
    where family_id = v_invite.family_id and email = v_email and auth_user_id is null
  ) then
    update public.members
      set auth_user_id = auth.uid()
      where family_id = v_invite.family_id and email = v_email and auth_user_id is null;
  else
    insert into public.members (family_id, auth_user_id, email, name, role)
    values (v_invite.family_id, auth.uid(), v_email, v_name, 'member');
  end if;

  return query
    select f.id, f.name from public.families f where f.id = v_invite.family_id;
end;
$$;

grant execute on function public.claim_family_invite(text) to authenticated;
```

### Pattern 3: RevenueCat Tier Gating (NOT Stripe)

**What:** `useTier()` reads `family.family_settings.subscription_status` and `family.family_settings.trial_ends_at` from `useCurrentFamily()` (no extra fetch). Returns derived state.

**When to use:** Anywhere the UI gates a feature on premium (Phase 2 = invitations; Phase 7+ = more features).

**Example — `src/data/useTier.ts`:**
```typescript
import { DateTime } from 'luxon';
import { useCurrentFamily } from './useCurrentFamily';

export type Tier = 'free' | 'premium';
export interface TierState {
  tier: Tier;
  trialActive: boolean;
  trialDaysLeft: number | null;
  subscriptionStatus: string | null;
}

/**
 * Derive the family's billing tier from `family_settings`.
 *
 * Trial precedence (D-18): An app-internal 7-day trial begins at family
 * creation via `family_settings.trial_ends_at`. While that timestamp is in
 * the future, `tier` is 'premium' regardless of RevenueCat state.
 *
 * RevenueCat precedence: subscription_status values (set by
 * `supabase/functions/revenuecat-webhook/index.ts`) of 'initial_purchase' |
 * 'renewal' | 'product_change' | 'trialing' all map to premium.
 * 'canceled' or NULL map to free (modulo the app-internal trial).
 */
export function useTier(): TierState {
  const { data: family } = useCurrentFamily();
  const settings = family?.family_settings ?? null;
  const status = settings?.subscription_status ?? null;
  const trialEndsAt = settings?.trial_ends_at;

  const now = DateTime.now();
  const trialEnd = trialEndsAt ? DateTime.fromISO(trialEndsAt) : null;
  const trialActive = !!(trialEnd && trialEnd > now);
  const trialDaysLeft = trialEnd && trialActive
    ? Math.max(0, Math.ceil(trialEnd.diff(now, 'days').days))
    : null;

  const premiumStatuses = new Set([
    'initial_purchase', 'renewal', 'product_change', 'trialing', 'active',
  ]);
  const subscriptionPremium = !!status && premiumStatuses.has(status);

  const tier: Tier = (trialActive || subscriptionPremium) ? 'premium' : 'free';
  return { tier, trialActive, trialDaysLeft, subscriptionStatus: status };
}
```

### Pattern 4: "Acting as" Provider (Session-Scoped Context)

**What:** A React Context at RootLayout level holds `actingAsId: string | null`. Defaults to the authenticated parent's own `member_id`. Persisted in `sessionStorage` so a hard-refresh during the session preserves it; cleared on sign-out. NOT persisted in localStorage or the DB (D-05: session-scoped only).

**Example — `src/auth/ActingAsProvider.tsx`:**
```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useMembers } from '../data/useMembers';
import { useAuthUserId } from './useAuthUserId';

const ActingAsContext = createContext<{
  actingAsId: string | null;
  setActingAs: (memberId: string | null) => void;
} | null>(null);

const STORAGE_KEY = 'fh2:actingAs';

export function ActingAsProvider({ children }: { children: ReactNode }) {
  const authUserId = useAuthUserId();
  const { data: members } = useMembers();
  const ownMember = members?.find(m => m.auth_user_id === authUserId);

  // Initialize from sessionStorage, fallback to own member
  const [actingAsId, _setActingAs] = useState<string | null>(() => {
    return sessionStorage.getItem(STORAGE_KEY);
  });

  // Default to own member once members load
  useEffect(() => {
    if (!actingAsId && ownMember?.id) _setActingAs(ownMember.id);
  }, [actingAsId, ownMember?.id]);

  const setActingAs = (memberId: string | null) => {
    if (memberId === null) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, memberId);
    _setActingAs(memberId);
  };

  return (
    <ActingAsContext.Provider value={{ actingAsId, setActingAs }}>
      {children}
    </ActingAsContext.Provider>
  );
}

export function useActingAs() {
  const ctx = useContext(ActingAsContext);
  if (!ctx) throw new Error('useActingAs must be inside ActingAsProvider');
  return ctx;
}
```

**Audit-trail invariant (D-08):** Any mutation hook that writes a member-attributable row MUST do:
```typescript
const { actingAsId } = useActingAs();
const { data: ownMember } = useOwnMember(); // parent's own member row
// ...
.insert({
  family_id,
  member_id: actingAsId ?? ownMember.id,        // target member
  updated_by: ownMember.id,                     // real actor (parent's member_id)
})
```

This is a project-wide invariant — Phase 3 (chore_completions), Phase 4 (events), Phase 5 (groceries/notes) all consume it. Worth a project-wide convention doc check after Phase 2 ships.

### Pattern 5: COPPA Consent

**What:** Single `coppa_consented_at TIMESTAMPTZ NULL` column on `members`. UI flow: parent toggles "Under 13" → tapping "Save" routes through `CoppaConsentSheet` → on Confirm, member row is INSERTed with `coppa_consented_at: new Date().toISOString()`.

**Why this is sufficient (D-15 + CITED: FTC COPPA FAQ §H.10):** COPPA Section 312.5(b)(2)(v) allows the "email plus" consent method for operators that use children's personal information for "internal use" only and do not disclose it to third parties. A closed family app where children's data never leaves the family's space falls under this exception. The single-checkbox + timestamp pattern satisfies the "email plus" standard because the parent is already authenticated via Google OAuth (which itself is a federated identity assertion stronger than email-only).

**Critical 2026 update [CITED: FTC COPPA Rule Update April 2025, compliance deadline April 22, 2026]:** New rules require operators to "implement a written children's personal information security program" and prohibit indefinite data retention. These are policy concerns that surface in Phase 7 (Compliance) — Phase 2's responsibility is only the consent gate + timestamp. Plan-check should flag if Phase 2 attempts to handle data-retention policy.

**Example — UI gate:**
```tsx
// In AddEditMemberSheet
const [isUnder13, setIsUnder13] = useState(false);
const [coppaConfirmed, setCoppaConfirmed] = useState(false);

const handleSave = async () => {
  if (isUnder13 && !coppaConfirmed) {
    setShowCoppaSheet(true); // Opens CoppaConsentSheet over current sheet
    return;
  }
  await upsertMember.mutateAsync({
    name, emoji, color, role, visible_sections,
    coppa_consented_at: isUnder13 ? new Date().toISOString() : null,
  });
};
```

### Pattern 6: Member CRUD with Optimistic Updates

**What:** Standard TanStack Query v5 optimistic mutation pattern (already established in CLAUDE.md §TanStack Query v5 Patterns). Key invariants: cancel queries before snapshot, return snapshot from `onMutate`, invalidate in `onSettled` (not `onSuccess`).

**Example — `useUpsertMember.ts`:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { newId } from '../lib/newId';
import { useCurrentFamily } from './useCurrentFamily';
import type { Database } from './types';

type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberRow = Database['public']['Tables']['members']['Row'];

export function useUpsertMember() {
  const qc = useQueryClient();
  const { data: family } = useCurrentFamily();
  const familyId = family?.id;

  return useMutation({
    mutationFn: async (input: Partial<MemberRow> & { name: string }) => {
      if (!familyId) throw new Error('No current family');
      const row: MemberInsert = {
        id: input.id ?? newId(),
        family_id: familyId,
        name: input.name,
        emoji: input.emoji ?? '🙂',
        color: input.color ?? 'lavender',
        role: input.role ?? 'member',
        visible_sections: input.visible_sections ?? [],
        email: input.email ?? null,
        auth_user_id: input.auth_user_id ?? null,
      };
      const { error } = await supabase
        .from('members')
        .upsert(row, { onConflict: 'id' });
      if (error) throw error;
      return row;
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['members', familyId] });
      const prev = qc.getQueryData<MemberRow[]>(['members', familyId]);
      qc.setQueryData<MemberRow[]>(['members', familyId], (old) => {
        if (!old) return old;
        const existing = old.find(m => m.id === input.id);
        if (existing) {
          return old.map(m => m.id === input.id ? { ...m, ...input } : m);
        }
        return [...old, { ...input, id: input.id ?? newId() } as MemberRow];
      });
      return { prev };
    },
    onError: (_e, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(['members', familyId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['members', familyId] });
    },
  });
}
```

### Pattern 7: `visible_sections` Schema (locked at Phase 2)

**Decision needed:** What's the shape of `visible_sections`? The schema declares it as `jsonb` with default `'[]'`. The simplest workable shape is an array of route paths the member may see, e.g. `["/dashboard", "/chores", "/calendar"]`. An empty array means "see all" (sensible default for parents). A populated array is a strict allowlist (for children).

**Why this shape:** Iteration cost is O(n) but n ≤ 7 routes, negligible. Cross-cutting consumption is one-liner: `members.visible_sections.length === 0 || members.visible_sections.includes(route)`. Future expansion (sub-sections, settings flags) can move to an object schema later without breaking the array path.

**Critical pitfall:** Make sure the AddEditMember form treats "all checkboxes checked" as `[]` (the "see all" default), not as the full enumerated array. Otherwise adding a future route silently hides it from all existing members.

### Pattern 8: Avatar Chip Row Above Bottom Nav (D-04)

**What:** A horizontal-scroll strip mounted INSIDE BottomNav.tsx, BEFORE the tab bar. Each chip is a button showing the member's emoji on their `color` background. The active chip (matching `actingAsId`) gets a ring/border. Tapping switches `actingAsId` via context.

**Critical pitfall — multi-device duplication:** Because the chip row uses `useMembers()` and a new member added on Device A is realtime-invalidated on Device B, Device B's chip row updates automatically. No manual sync needed. But: the avatar chip row mounts inside `BottomNav`, which renders inside `RootLayout`, which is gated by `RequireFamily`. So `useMembers()` is safe to call (family is guaranteed present). Plan-check should confirm AvatarChipRow does NOT mount outside this boundary.

**Example layout:**
```tsx
// BottomNav.tsx
<div className={styles.container}>
  <AvatarChipRow />     {/* NEW: above tab bar */}
  <div className={styles.bottomBar}>
    {/* existing 7 tabs */}
  </div>
</div>
```

### Anti-Patterns to Avoid

- **Calling `inviteUserByEmail` from the browser.** Requires service_role. Must go through an Edge Function.
- **Generating 6-digit codes client-side.** Race condition on uniqueness; client could brute-force codes. Use the SECURITY DEFINER RPC.
- **Persisting `actingAsId` in localStorage.** Session-scoped means session-scoped (D-05). Use sessionStorage.
- **Reading `subscription_status` from Stripe.** Phase 1 shipped with RevenueCat — there is no Stripe in this codebase. Plan-check must reject any Stripe SDK install.
- **Treating `TRIAL_STARTED` as a real RevenueCat event.** RevenueCat does not emit it. The existing webhook handler has dead code at line 65-67 — flag for cleanup but don't change in Phase 2 unless it's blocking.
- **Putting the chip row inside TopNav.** TopNav is desktop-first; the chip row is mobile-affordance and belongs above BottomNav (D-04 + CONTEXT.md code_context).
- **Using a separate audit_log table.** D-08 explicitly says `updated_by` + the action's `member_id` columns are sufficient. No new table.
- **Letting RequireFamily redirect a code-claiming user to `/onboarding/create-family`.** Add a "Or join an existing family" link on `create-family.tsx` that routes to `/join`. Otherwise an invited user with a code has no path in.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom-sheet modal (drag-to-dismiss, focus trap, ARIA dialog, scroll-lock) | A CSS slide-up div with manual focus management | `vaul` (built on Radix Dialog) | ~9KB gzip vs ~300 lines of subtle modal/a11y code. Mobile Safari focus quirks alone burn 2 days. |
| 6-digit code uniqueness & expiry | Client-side `Math.random()` + manual UPDATE check | `generate_invite_code()` RPC with unique constraint + retry | Race-free; auth + family scope enforced in SQL. |
| Invite-by-email auth flow | Custom JWT, custom magic-link generator | `supabase.auth.admin.inviteUserByEmail` | Reuses Supabase's existing email template, SMTP infra, and rate limits. |
| OAuth-to-pre-seeded-row linking | Manual POST from frontend after sign-in | Postgres trigger `handle_new_user()` | Atomic with `auth.users INSERT`; works even if the user signs in from a fresh device with no client state. |
| Web Share / Copy fallback | Manual clipboard library + share dialog | Native `navigator.share()` + `navigator.clipboard.writeText()` | Both are 1st-party Web APIs in 2026. |
| COPPA consent infrastructure | Email verification, age gates, ToS flow | Single column + checkbox | "Email-plus" consent (FTC 312.5(b)(2)(v)) suffices for closed-family internal-use apps. [CITED: FTC] |

**Key insight:** Phase 2's "scope" is broad (member CRUD + invites + COPPA + tier gating) but each surface has a well-trodden library or pattern. The biggest risk is **scope drift into Phase 7 territory** — specifically: don't build the Stripe/RevenueCat billing portal here; don't build a member-profile page here; don't build a settings page here.

---

## Runtime State Inventory

This is not a rename/refactor phase — it's additive. The following are still worth checking:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `family_settings.subscription_status` already exists (renamed from `stripe_subscription_status` by migration 20260520020000). `members.email`, `members.auth_user_id` already exist (Phase 1 schema). | None — Phase 2 reads existing columns and adds `coppa_consented_at` + the new `family_invites` table. |
| Live service config | RevenueCat dashboard webhook is configured (Phase 1 shipped this). No additional service config required for Phase 2. | Verify RevenueCat dashboard still points to the same Edge Function URL after any redeploy. |
| OS-registered state | None | None |
| Secrets/env vars | `REVENUECAT_WEBHOOK_AUTH_HEADER`, `SUPABASE_SERVICE_ROLE_KEY` already set. Phase 2 adds NOTHING new (the invite-member Edge Function reuses `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL`). | None |
| Build artifacts | None — no rename | None |

**Critical note:** The Phase 2 CONTEXT.md says "Stripe webhook" / "Stripe subscription". The actual Phase 1 codebase uses RevenueCat. Phase 2 implementation must NOT introduce Stripe.

---

## Common Pitfalls

### Pitfall 1: Service Role Key Leaks Into the Browser
**What goes wrong:** A developer adds the service_role key to `vite-env.d.ts` to call `auth.admin.inviteUserByEmail` from `useUpsertMember`. The key ships in the bundle, granting any visitor full database access.
**Why it happens:** Vite exposes any `VITE_*` env var to the client. Supabase admin client lives in the same npm package as the regular client.
**How to avoid:** All `auth.admin.*` calls go through `supabase/functions/invite-member/`. The service_role key is set ONLY via `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=…` and is NEVER prefixed with `VITE_`.
**Warning signs:** grep the bundle output `dist/assets/*.js` for `service_role` after first build of Phase 2.

### Pitfall 2: `handle_new_user()` Trigger Blocks Signups
**What goes wrong:** The trigger raises an unhandled exception (e.g., type mismatch on email column, or attempting to read from a table that doesn't exist yet). Every Google sign-in fails with a generic 500.
**Why it happens:** The trigger runs synchronously inside the `auth.users INSERT` transaction. Any error blocks the signup.
**How to avoid:** Wrap the body in BEGIN/EXCEPTION/END that logs and SWALLOWS errors (`RAISE WARNING`) so signups always succeed. The linking is a best-effort optimization, not a precondition.
```sql
exception when others then
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;  -- never block the signup
```
**Warning signs:** A successful Phase 2 RED-stage test should include signing up a fresh Google user with NO pre-seeded row and confirming the signup completes. Then sign up a Google user WITH a pre-seeded row and confirm linkage.

### Pitfall 3: Acting-As Banner Renders Behind RootLayout's Children
**What goes wrong:** The banner is added inside `<main>` instead of as a sibling of `<TopNav>`. Pages with their own top-of-page elements (Dashboard greeting, e.g.) overlap the banner.
**Why it happens:** Easy to assume "above page content" means "first child of main".
**How to avoid:** Mount `ActingAsBanner` as a sibling of TopNav, BEFORE `<main>`. The CSS Modules `styles.banner` should be `position: sticky; top: <topnav-height>;` so it always sits flush under TopNav.

### Pitfall 4: Realtime Bridge Misses `family_invites` and `members.coppa_consented_at`
**What goes wrong:** Parent's device A generates a new invite code; device B doesn't see the code appear because `family_invites` is not in the `supabase_realtime` publication.
**Why it happens:** Phase 1's `useRealtimeBridge.ts` hardcodes the list of tables; Phase 2 must update both the SQL `alter publication` AND the TypeScript `FAMILY_SCOPED_TABLES` constant.
**How to avoid:** When adding `family_invites` in the migration, ALSO `alter publication supabase_realtime add table public.family_invites` AND add `'family_invites'` to the `FAMILY_SCOPED_TABLES` constant in `src/data/useRealtimeBridge.ts`. Verify by creating an invite on device A and seeing it appear on device B without reload.

### Pitfall 5: Pre-Seeded Member Row Blocks the Wizard Bootstrap Policy
**What goes wrong:** A parent invites a new family. The invitee — a different Google user — signs in for the FIRST time and is immediately routed into the Family Creation Wizard (because their `members` row exists in the inviter's family, but with stale `auth_user_id = NULL`). `handle_new_user()` may not have fired yet OR the join fails because `lower(new.email)` doesn't match (e.g., user's Google account is `Bob.Smith@gmail.com` and the parent typed `bob.smith@gmail.com` — both should match, lowercase comparison handles this, but case is a common bug).
**How to avoid:** Always lowercase in the INSERT (Edge Function already does this) AND in the trigger (`where email = lower(new.email)`). Test with mixed-case emails end-to-end.

### Pitfall 6: Trial Math Off-By-One on Refresh
**What goes wrong:** `useTier()` returns `trialDaysLeft: 0` on the actual expiry day, leaving the user with a confusing "0 days left but trial still active" state.
**Why it happens:** `Math.ceil(0.5)` is 1 but `Math.ceil(0)` is 0, and `now()` racing with the stored `trial_ends_at` produces fencepost errors.
**How to avoid:** The Phase 1 `computeTrialEnd()` uses Luxon's `plus({ days: 7 })` which is calendar-day-safe. `useTier()` should compute `trialActive = trialEnd > now` (strict inequality) and clamp `trialDaysLeft = Math.max(0, ...)`. Display "Trial ends today" when `trialDaysLeft === 0` and `trialActive === true`.

### Pitfall 7: `inviteUserByEmail` Silently Succeeds When User Already Exists
**What goes wrong:** Parent invites `bob@gmail.com` (already a user in another family). The invite email is sent BUT Bob already has an `auth.users` row, so `handle_new_user()` does not fire on the invite link click. Bob is just logged in, lands on his own family's dashboard, and the pre-seeded row in the inviter's family sits with `auth_user_id = NULL` forever.
**Why it happens:** Per Supabase community: "inviteUserByEmail does not error if the email already exists as that would be a security leak" [CITED: search results]. The behavior is intentional.
**How to avoid:** Either (a) tell the inviter "we sent an invite — if Bob already has an account, ask him to enter the family code instead", OR (b) check `auth.users` for an existing user via service_role before sending the invite, and route Bob to the join-code flow. Option (a) is simpler for MVP; document this expected behavior.

### Pitfall 8: `vaul` Snap Points Trap Keyboard Users
**What goes wrong:** Bottom sheets opened with snap points (`snapPoints={[0.5, 0.9]}`) confuse keyboard users — pressing Tab can move focus into elements obscured by the partial-snap state.
**Why it happens:** vaul's snap points are visual; keyboard focus order is independent.
**How to avoid:** Phase 2 sheets should NOT use snap points (just open/close). Save snap points for future iterations. [CITED: vaul GitHub issue 2024]

### Pitfall 9: Plan-Check Reading "Stripe" From CONTEXT.md and Approving Plans That Use Stripe
**What goes wrong:** CONTEXT.md and ROADMAP.md success criteria reference "Stripe" extensively. A planner generating tasks reads "Stripe webhook" and writes a task to install `stripe` npm package + create a Stripe customer in the wizard. This rewrites Phase 1's working RevenueCat integration.
**Why it happens:** CONTEXT.md was written before the Phase 1 RevenueCat switch.
**How to avoid:** **This research document is the override.** Plan-check should reject any Phase 2 task that:
- Installs `stripe` or `@stripe/stripe-js`
- Creates a `Stripe Customer` Edge Function
- References `STRIPE_SECRET_KEY` env var
- Writes to a `stripe_*` column (those columns no longer exist; they were renamed in migration 20260520020000).

Treat the literal word "Stripe" in CONTEXT.md / ROADMAP / REQUIREMENTS as a synonym for "RevenueCat" in all Phase 2 planning. The success criterion #5 stands as written EXCEPT for the billing system identifier.

---

## Code Examples

### Generate-and-display invite code (parent side)
```typescript
// src/data/useFamilyInvites.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useCurrentFamily } from './useCurrentFamily';

export function useGenerateInviteCode() {
  const { data: family } = useCurrentFamily();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!family?.id) throw new Error('No current family');
      const { data, error } = await supabase.rpc('generate_invite_code', {
        p_family_id: family.id,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['family_invites', family?.id] });
    },
  });
}
```

### Claim a code (invitee side, on `/join`)
```typescript
export function useClaimInviteCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('claim_family_invite', {
        p_code: code,
      });
      if (error) throw error;
      return data as { family_id: string; family_name: string }[];
    },
    onSuccess: () => {
      // The user's members row was just linked. Force a fresh current-family fetch.
      qc.removeQueries({ queryKey: ['current-family'] });
    },
  });
}
```

### Acting-as-aware mutation example (will be the pattern from Phase 3 onward)
```typescript
// In a future Phase 3 useCompleteChore hook:
const { actingAsId } = useActingAs();
const { data: own } = useOwnMember();
await supabase.from('chore_completions').insert({
  family_id, chore_id,
  member_id: actingAsId ?? own.id,    // target member (per D-08)
  updated_by: own.id,                  // real actor (parent)
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hand-rolled mobile sheet with CSS transitions | `vaul` (Radix-based drawer) | Vaul GA 2024-12, 1.x stable | Free a11y baseline + drag-to-dismiss for ~9KB |
| Stripe Checkout for cross-platform subscriptions | RevenueCat unified SDK | Phase 1 (2026-05) | Required by Apple App Store policy 4.8; also handles Google Play Billing and web fallback |
| Email invitation via custom magic-link generator | `supabase.auth.admin.inviteUserByEmail` | Supabase Auth v2 (2022+) | Reuses SMTP, email templates, rate limits |
| Per-row audit_log table | Audit columns on the row itself (`updated_by`, `updated_at`) | Phase 1 schema (D-08) | Half the writes, simpler RLS |

**Deprecated/outdated:**
- **Stripe in Family Hub 2.0:** All Stripe references in CONTEXT.md / ROADMAP / REQUIREMENTS are stale (pre-Phase-1 pivot). Treat as RevenueCat.
- **`react-spring-bottom-sheet`:** Maintained but heavier than vaul; vaul has eaten its market share since 2024.
- **`emoji-picker-react`:** Fine for general-purpose apps, but Phase 1 already established the "small curated set" UX for family apps.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `vaul` snap points cause keyboard focus issues | Pitfall 8 | Low — recommendation is just "don't use snap points in Phase 2", which is safe regardless |
| A2 | `inviteUserByEmail` "doesn't error on duplicate email" is current Supabase behavior | Pitfall 7 | Medium — if Supabase fixed this, our UX message is just wrong, not broken |
| A3 | Email-plus consent (FTC §312.5(b)(2)(v)) covers a closed family app's internal-use COPPA needs | Pattern 5 | Medium — this is the canonical "internal use" exception but the 2026 amendment tightens; verify with legal at Phase 7 compliance |
| A4 | RevenueCat `TRIAL_STARTED` does not exist as a real event type | Summary + Pitfall | Low — even if Supabase webhook handler keeps dead branch, it just never fires; harmless |
| A5 | `vaul` is appropriate vs `react-modal-sheet`; both valid | Standard Stack | Low — easy swap if planner finds bundle-size issue |
| A6 | The 10-color member palette can be defined statically and works in both Lavender + Midnight themes | Supporting | Low — palette is a code constant, easy to refine |
| A7 | `visible_sections` should be an array of route paths (empty = "see all") | Pattern 7 | Medium — if shape needs to be object-based for sub-section control, schema is `jsonb` so migration is trivial |

**Planner action:** Convert A2, A3, A7 into `checkpoint:human-verify` tasks during planning (especially A3 — COPPA legal interpretation is the highest-risk assumption in this phase).

---

## Open Questions

1. **Does the user want a `/join` link on `/onboarding/create-family`?**
   - What we know: D-10 says "the invitee lands on a /join screen" after Google sign-in with no matching member. But `RequireFamily` redirects to `/onboarding/create-family`.
   - What's unclear: Should `/onboarding/create-family` offer a "or join existing family" link? Or should `RequireFamily` route to `/join` first and only fall through to `create-family` if no code is entered?
   - Recommendation: Add a "Already invited? Join with a code" link on `create-family.tsx`. Two routes, one decision point.

2. **What happens to a pre-seeded row when the invitee signs in with a different email than what was typed?**
   - What we know: `handle_new_user()` matches by lowercase email. Mismatch = pre-seeded row stays orphaned forever.
   - What's unclear: Should we surface a "claim by code" affordance for the invitee, OR allow parent to "re-link by email"?
   - Recommendation: MVP — the invite code flow IS the fallback. Show the parent the code prominently on the InviteSheet so they can share both. Phase 7 Settings can add re-linking.

3. **Should `family_invites` codes be SCOPED to one specific pre-seeded member, or generic to the whole family?**
   - What we know: D-12 implies generic ("one-time use per code") — the code creates or links the invitee's member row in `claim_family_invite`.
   - What's unclear: If the parent generates a code intending Bob to use it but Carol uses it instead, Carol gets in. Is this acceptable?
   - Recommendation: For MVP in a closed family app, yes — the parent shares the code via private channel. Phase 7 can add "scope to pre-seeded member" if needed.

4. **What does the Upgrade CTA in PremiumGateSheet do in Phase 2?**
   - What we know: D-17 says "wires to billing portal in Phase 7; for now a placeholder."
   - What's unclear: Show a disabled button? Navigate to `/settings` (doesn't exist yet)? Show a "coming soon" toast?
   - Recommendation: A button that shows a toast "Upgrade flow coming in v1 launch — for now, your 7-day trial is active." Avoids navigating to a non-existent route.

5. **Should the AvatarChipRow hide for children?**
   - What we know: D-07 says any member can be acted as; "Acting as" is a parent-only capability.
   - What's unclear: Children logged in directly — do they see avatar chips at all?
   - Recommendation: Hide the AvatarChipRow entirely for non-parent roles. They have no need to switch context; their own member is implicit.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build / dev | likely ✓ | (Phase 1 shipped) | — |
| Supabase CLI | `supabase functions deploy invite-member` | likely ✓ | (Phase 1 used it) | Manual deploy via Studio |
| Vercel CLI | Production deploys | likely ✓ | (Phase 1 shipped) | Auto-deploy on push to main |
| Playwright | E2E for /members + /join | ✓ (package.json) | ^1.60.0 | — |
| Vitest | Unit tests for useTier, useActingAs | ✓ (package.json) | ^4.0.0 | — |
| Supabase project access | DB migration + Edge Function deploy | assumed ✓ | project `cfvqjqkqfbrgfpwukady` | — |
| RevenueCat dashboard access | (Read-only) verify webhook still receives events | assumed ✓ | (Phase 1 configured) | — |

**Missing dependencies with no fallback:** none identified.
**Missing dependencies with fallback:** none required.

**Planner action:** No environment-setup tasks needed. Confirm package install + supabase login are still working at start of Phase 2 wave 1 via a quick `npm run typecheck && supabase status` smoke task.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.0 + @testing-library/react ^16.0.0 (unit/component) + Playwright ^1.60.0 (E2E) |
| Config file | `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts` (all exist from Phase 1) |
| Quick run command | `npx vitest run <pattern>` (single file under 5s) |
| Full suite command | `npm test` (Vitest) + `npm run test:e2e` (Playwright) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| MEMB-01 | Add/edit/delete member updates the list | unit | `npx vitest run src/data/useUpsertMember.test.ts` | ❌ Wave 0 |
| MEMB-01 | Add member CRUD round trip in UI | E2E | `npx playwright test tests/members-crud.spec.ts` | ❌ Wave 0 |
| MEMB-02 | `handle_new_user()` links pre-seeded row | integration (Supabase test DB) | `npx vitest run tests/integration/handle-new-user.test.ts` | ❌ Wave 0 |
| MEMB-03 | Virtual member row inserts with `auth_user_id NULL` | unit | `npx vitest run src/data/useUpsertMember.test.ts` | ❌ Wave 0 |
| MEMB-04 | Form persists name/emoji/color | component | `npx vitest run src/components/members/AddEditMemberSheet.test.tsx` | ❌ Wave 0 |
| MEMB-05 | `visible_sections` filter hides routes | unit | `npx vitest run src/components/BottomNav.test.tsx` | ❌ Wave 0 |
| MEMB-06 | Mutation with `actingAsId` writes `member_id` and `updated_by` correctly | unit | `npx vitest run src/auth/useActingAs.test.tsx` | ❌ Wave 0 |
| MEMB-07 | `handle_new_user()` no-ops gracefully when no pre-seeded row | integration | (same file as MEMB-02) | ❌ Wave 0 |
| ONBD-02 | Edge Function pre-seeds row + sends invite | integration (mocked admin client) | `npx vitest run tests/integration/invite-member.test.ts` | ❌ Wave 0 |
| ONBD-03 | `claim_family_invite` RPC links pre-seeded row | integration | `npx vitest run tests/integration/claim-invite.test.ts` | ❌ Wave 0 |
| ONBD-03 | `/join` route claim happy path | E2E | `npx playwright test tests/join-flow.spec.ts` | ❌ Wave 0 |
| ONBD-04 | COPPA flow gates child creation | component | `npx vitest run src/components/members/CoppaConsentSheet.test.tsx` | ❌ Wave 0 |
| ONBD-05 | `useTier()` returns premium during trial | unit | `npx vitest run src/data/useTier.test.ts` | ❌ Wave 0 |
| ONBD-05 | Premium gate sheet blocks invite when trial expired + no subscription | E2E | `npx playwright test tests/premium-gate.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** quick `vitest run` on the just-changed files + `npm run typecheck`.
- **Per wave merge:** full `npm test` (Vitest) + targeted `playwright test` on phase-relevant specs.
- **Phase gate:** full `npm test && npm run test:e2e` green before `/gsd:verify-work`.

### Wave 0 Gaps
- [ ] `tests/integration/handle-new-user.test.ts` — exercises trigger against test DB
- [ ] `tests/integration/invite-member.test.ts` — exercises Edge Function with mocked admin client
- [ ] `tests/integration/claim-invite.test.ts` — exercises RPCs
- [ ] `tests/members-crud.spec.ts` (Playwright) — happy path through /members
- [ ] `tests/join-flow.spec.ts` (Playwright) — happy path through /join
- [ ] `tests/premium-gate.spec.ts` (Playwright) — trial expired → gate sheet shown
- [ ] `src/data/useTier.test.ts` — unit tests for derivation logic
- [ ] `src/data/useUpsertMember.test.ts` — optimistic update + rollback
- [ ] `src/auth/useActingAs.test.tsx` — Context provider + sessionStorage round-trip
- [ ] `src/components/members/AddEditMemberSheet.test.tsx` — form behavior
- [ ] `src/components/members/CoppaConsentSheet.test.tsx` — consent gate logic
- [ ] `src/components/BottomNav.test.tsx` — extend for 7th tab + AvatarChipRow

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Google OAuth via Supabase Auth (Phase 1); Phase 2 adds invite-email magic link, not a new auth surface |
| V3 Session Management | yes | Session-scoped acting-as via sessionStorage; Supabase Auth handles JWT refresh |
| V4 Access Control | yes | `private.auth_is_parent()` SECURITY DEFINER + RLS policies on `family_invites`; Edge Function double-checks role via caller JWT |
| V5 Input Validation | yes | Email normalization (lowercase + trim); 6-digit code regex; member name length cap |
| V6 Cryptography | no (mostly) | RNG for codes via `random()` — acceptable for 6-digit one-use codes that expire in 7 days; tighten to `gen_random_bytes` if brute-force becomes a concern |
| V8 Data Protection | yes | COPPA — `coppa_consented_at` is a control flag; pre-seeded `members.email` is PII (already covered by RLS) |

### Known Threat Patterns for {Supabase + React + RevenueCat}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Service role key leaks to client bundle | Information Disclosure | All admin calls in Edge Functions; service_role NEVER prefixed `VITE_`; grep audit at build |
| Invite code brute force | Spoofing | 6-digit codes expire in 7 days; codes are one-time use; rate-limit `claim_family_invite` RPC via Supabase (10/min/IP via Edge gateway or `pg_throttle`) |
| Cross-family row reads | Information Disclosure | RLS policies on `family_invites` + `members` enforce `family_id = private.current_family_id()` |
| Acting-as identity confusion / parent denying action | Repudiation | D-08: `updated_by` = parent's `member_id` on every mutation; `member_id` = target. Audit query: `SELECT * FROM chore_completions WHERE updated_by != member_id` shows acted-as actions. |
| Invitee signs in with a different email than what was typed | Spoofing (mild) | Lowercase comparison in trigger; fallback to code-claim flow surfaced in UI |
| Replay of an already-claimed code | Spoofing | `claim_family_invite` is atomic via `FOR UPDATE`; `used_at IS NULL` check inside the transaction |
| Premium gate bypass (free user spoofs subscription_status) | Tampering | `subscription_status` only writable by service_role via revenuecat-webhook Edge Function (RLS UPDATE policy on `family_settings` checks `family_id = current_family_id() and auth_is_parent()` — but does NOT allow setting subscription_status; that column should be explicitly protected) |

**Critical action for planner:** Add an RLS column-level restriction on `family_settings.subscription_status` so that only the service_role can update it. Currently the generic UPDATE policy allows any parent to write any column. Add a trigger or a column privilege:
```sql
revoke update on public.family_settings from authenticated;
grant update (timezone, theme, trial_ends_at, updated_by) on public.family_settings to authenticated;
-- subscription_status is now only writable by service_role
```

---

## Project Constraints (from CLAUDE.md)

- **Auth:** Google OAuth only — no email/password. (Phase 1 added Apple Sign-In for App Store compliance.) Email INVITES are sent via Supabase's invite flow; the actual sign-in still goes through OAuth.
- **Hosting:** Vercel (no change).
- **Database:** Supabase (no change). Project ID: `cfvqjqkqfbrgfpwukady`.
- **Access:** Open registration; family isolation via RLS — NO email allowlist (dropped in migration 20260520010000).
- **Existing data:** v1 family-app data migration is Phase 10 concern; Phase 2 does not touch `v1_*` tables.

**CLAUDE.md hard constraints carried into Phase 2:**
- Use `crypto.randomUUID()` via `newId()` for all client-side UUIDs.
- All Supabase Realtime cleanup uses `supabase.removeChannel(ch)`, not `ch.unsubscribe()`.
- TanStack Query optimistic mutations: cancel → snapshot → mutate → rollback on error → invalidate on settled.
- Import everything from `react-router`, never `react-router-dom`.
- CSS Modules for all new component styles; CSS variables for theme.
- No hardcoded member IDs anywhere in code (already enforced by Phase 1 schema).

---

## Sources

### Primary (HIGH confidence)
- Phase 1 codebase as shipped (this repo's `src/` and `supabase/`): authoritative state on RevenueCat vs Stripe
- [Supabase Auth Admin `inviteUserByEmail` reference](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) — confirms admin API, service_role requirement
- [Supabase — Managing User Data (`handle_new_user` trigger pattern)](https://supabase.com/docs/guides/auth/managing-user-data) — canonical trigger example
- [RevenueCat — Event Types and Fields](https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields) — confirms NO `TRIAL_STARTED` event exists
- [vaul GitHub repository](https://github.com/emilkowalski/vaul) — built on Radix Dialog; mobile drawer primitive

### Secondary (MEDIUM confidence)
- [FTC COPPA Compliance FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) — "email plus" consent for internal use
- [FTC COPPA 2026 Rule Update](https://www.privo.com/blog/coppa-rule-update-2026) — April 22, 2026 compliance deadline; verifies Phase 2 timestamp pattern is still acceptable
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) — pattern reference for `invite-member` function (mirrors existing `revenuecat-webhook`)
- [Vaul snap points docs](https://vaul.emilkowal.ski/snap-points) — confirms snap points are opt-in; safe to skip
- Phase 1 `01-RESEARCH.md` (referenced via canonical_refs in CONTEXT.md) — established TanStack Query / Realtime / RLS patterns

### Tertiary (LOW confidence)
- WebSearch results on "vaul vs react-modal-sheet" — no first-party benchmark; decision rests on ecosystem signal (shadcn/ui adoption) not raw benchmarks

---

## Metadata

**Confidence breakdown:**
- Standard stack (vaul addition): HIGH — Phase 1 stack carries forward; only one new library
- Architecture (trigger + RPCs + Edge Function): HIGH — patterns are documented Supabase canon
- Billing pivot Stripe → RevenueCat: HIGH — directly verified in committed code (`supabase/migrations/20260520020000_revenuecat_billing.sql`)
- RevenueCat trial event mapping: MEDIUM — webhook docs confirm no `TRIAL_STARTED` event; existing handler has dead code branch
- COPPA "email plus" sufficiency: MEDIUM — well-established interpretation; 2026 amendment focuses on retention/biometric, doesn't tighten "internal use" exception
- vaul as sheet choice: MEDIUM — ecosystem-popular but `react-modal-sheet` is also valid; swap if planner finds friction

**Research date:** 2026-05-28
**Valid until:** 2026-06-28 (30 days for stable stack; if Phase 2 implementation starts after that, re-verify package versions and RevenueCat webhook event names)
