# Phase 2: Members, Onboarding & Billing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 02-members-onboarding-billing
**Areas discussed:** Member management screen, "Acting as" picker, Invitation & join flows, COPPA consent + tier gating

---

## Member management screen

### Q1: Where do parents go to manage members?

| Option | Description | Selected |
|--------|-------------|----------|
| New /members tab in bottom nav | 7th tab dedicated to member management. Always visible to parents, hidden from kids via visible_sections. | ✓ |
| /settings sub-page | Members live under a Settings tab (Phase 7). Requires a settings stub. | |
| Modal / sheet from nav or avatar area | Tap the family name or a 'manage' icon in TopNav. No new route. | |

**User's choice:** New /members tab in bottom nav

### Q2: How is the member list presented?

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable card list, one card per member | Avatar, name, role badge, edit/delete. 'Add member' button at top. | ✓ |
| Grid of avatar chips, expand on tap | Compact visual grid, tap to expand into edit form. | |

**User's choice:** Scrollable card list

### Q3: Where does the add/edit form appear?

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet / modal over the members list | Slide-up panel with name, emoji, color, role, visible_sections. Keeps context. | ✓ |
| Inline edit on the card | Card expands in place with form fields. | |

**User's choice:** Bottom sheet / modal

### Q4: How do avatar chips appear in the bottom nav?

| Option | Description | Selected |
|--------|-------------|----------|
| Member avatar chips row above the bottom nav tabs | Horizontal strip of emoji+color circles above the tab bar. Tapping switches "Acting as" context. | ✓ |
| Avatar chips inside the nav bar | Avatars alongside tab icons. Very crowded on mobile. | |
| Avatar chips on the Dashboard only | Not persistent — user must go to Dashboard to switch context. | |

**User's choice:** Avatar chips row above bottom nav tabs

---

## "Acting as" picker

### Q1: How persistent is the "Acting as" context?

| Option | Description | Selected |
|--------|-------------|----------|
| Session-scoped — persists until parent switches or logs out | All actions attributed to selected member for the whole session. | ✓ |
| Per-page or per-action — picked at point of use | 'Who completed this?' picker on each action. Safer but more taps. | |

**User's choice:** Session-scoped

### Q2: What UI indicator shows the active "Acting as" context?

| Option | Description | Selected |
|--------|-------------|----------|
| Colored top banner in the active member's color | Persistent banner below TopNav in Roman's member color. Hard to miss. | ✓ |
| Bold chip highlight + label in the avatar row | Subtle — easy to miss if parent scrolls. | |
| You decide | Leave to planner. | |

**User's choice:** Colored top banner in member's color

### Q3: Can real members (with Google accounts) be "acted as"?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — any member can be 'acted as', real or virtual | Covers offline real members too. | ✓ |
| Virtual members only | Real members must log in themselves. | |

**User's choice:** Any member, real or virtual

### Q4: What data is stored for the audit trail?

| Option | Description | Selected |
|--------|-------------|----------|
| updated_by = parent's member_id; target member_id on the action row | No separate audit table needed. | ✓ |
| Separate audit_log table | Explicit but requires a new table in Phase 2. | |
| You decide | Leave to researcher/planner. | |

**User's choice:** updated_by = parent's member_id; target member_id on action row

---

## Invitation & join flows

### Q1: Email invite mechanism (ONBD-02)?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-seeded member row + Supabase Auth invite email | handle_new_user() trigger links on Google sign-in by email match. | ✓ |
| Custom email with the 6-digit family code | One flow covers both. | |
| Two separate completely independent flows | Email uses Supabase invite; code uses family_join_codes table. | |

**User's choice:** Pre-seeded member row + Supabase Auth invite

### Q2: When does the invitee use the 6-digit code (ONBD-03)?

| Option | Description | Selected |
|--------|-------------|----------|
| Signs in with Google first, then prompted to enter the code | No match → /join screen. | ✓ |
| Enters code before signing in via /join?code=XXXXXX route | More upfront context, more complex. | |

**User's choice:** Signs in first, then enters code

### Q3: Where does the parent trigger invites and share the code?

| Option | Description | Selected |
|--------|-------------|----------|
| Member card 'Invite' action for un-linked members | One sheet: family code at top + email input at bottom. | ✓ |
| Separate 'Invite member' button at top of /members page | Independent of existing member cards. | |

**User's choice:** Member card 'Invite' action

### Q4: Does the 6-digit code expire?

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed per family, never expires | Simple — no rotation. | |
| One-time code that expires after use or after 7 days | More secure. Parent generates fresh code per invite. | ✓ |

**User's choice:** One-time code, expires after use or 7 days

---

## COPPA consent + tier gating

### Q1: What triggers the COPPA consent flow?

| Option | Description | Selected |
|--------|-------------|----------|
| 'Under 13' toggle in the Add Member form | Parent explicitly marks child as under 13 before saving. | ✓ |
| Date of birth field — app auto-detects under 13 | More accurate but requires storing birthdate. | |
| All child-role members presumed potentially under 13 | Broadest coverage but overkill for teenagers. | |

**User's choice:** 'Under 13' toggle/checkbox

### Q2: What does the COPPA consent screen require?

| Option | Description | Selected |
|--------|-------------|----------|
| Simple: data summary + 'I am parent/guardian' checkbox + Confirm | Minimal friction. coppa_consented_at timestamp on member row. | ✓ |
| Full legal flow: privacy policy + email confirmation | High friction. Better for public apps; overkill here. | |

**User's choice:** Simple consent screen with checkbox

### Q3: What does useTier() enforce in Phase 2?

| Option | Description | Selected |
|--------|-------------|----------|
| Invitations are premium — free tier can't invite by email or code | Clear premium value prop. Real gate to verify success criterion 5. | ✓ |
| Member count capped on free tier (e.g. max 3) | Simple rule but feels punishing for small families. | |
| useTier() wired but nothing gated in Phase 2 | Hook exists but success criterion 5 is unverifiable. | |

**User's choice:** Invitations are premium-only

### Q4: What do free-tier families see when trying to invite?

| Option | Description | Selected |
|--------|-------------|----------|
| Locked Invite button → tapping shows upgrade prompt sheet | Soft gate — educates and upsells. | ✓ |
| Feature hidden entirely on free tier | No upsell; user doesn't know invitations exist. | |

**User's choice:** Locked state + upgrade prompt sheet

---

## Claude's Discretion

- Emoji picker library/implementation
- Member color swatch set (8–12 colors)
- Stripe subscription creation timing for trial start
- `/join` route error handling UX (expired code, already-used code)

## Deferred Ideas

- Stripe billing portal UI → Phase 7 (Settings)
- Member profile page with streak stats → Phase 7
- Per-device + per-trigger push preferences per member → Phase 6
- Family code rotation / manual revoke → Phase 7
