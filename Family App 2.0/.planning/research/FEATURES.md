# Feature Landscape — Family Household Management PWA

**Domain:** Family household management (chores, calendar, meals, groceries, notes, custody)
**Researched:** 2026-05-19
**Overall confidence:** MEDIUM-HIGH (well-covered competitive space; some implementation choices flagged LOW where only single sources support them)

## Executive Summary

The family-organizer space has matured into three distinct tiers: general organizers (Cozi, FamilyWall, Maple), gamified chore-first apps (OurHome, Habitica, Homsy), and court-grade co-parenting apps (OurFamilyWizard, TalkingParents, Custody X Change). Family Hub 2.0 sits at an unusual intersection — it needs the co-parenting custody rigor of the third tier, the chore engagement of the second, and the daily-driver UX of the first. Most existing apps fail at one of these three; users who need all three currently glue together three apps.

The clearest table-stakes win-or-lose features: color-coded shared calendar with per-member colors, real-time-syncing grocery list, auto-categorization in groceries, chore assignment with recurrence, push notifications for events and chore due times, and a custody view that color-codes which parent has the kids each day.

The clearest differentiators for this project: streak mechanics that recover gracefully (Duolingo-style freezes, not Habitica-style hard resets), mixed real/virtual member model (no other app handles a kid using a parent's account elegantly), and a unified calendar that genuinely layers events + meals + custody without becoming unreadable (Cozi and FamilyWall both fail here per reviews).

The biggest anti-features to avoid: points/leaderboards (already correctly out-of-scope per PROJECT.md — these create perverse incentives and shame dynamics), SMS notifications (cost + carrier friction), and a request-approval workflow that gates groceries (turns a 2-second action into a 3-step bottleneck).

---

## Table Stakes

Features users expect. Missing = product feels incomplete and gets uninstalled.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Per-member color coding across all surfaces | Every competitor does this; absence makes the calendar unreadable | Low | Each member gets one color; same color used on calendar, chore assignee chip, custody block, member avatar ring |
| Shared real-time grocery list | AnyList, Bring, Cozi, OurGroceries all do this; texting "what do we need" is the failure state users came to escape | Medium | Supabase realtime subscription on grocery_items table |
| Auto-categorization of grocery items | Standard in AnyList, Any.do, Bring, iOS Reminders; users won't manually sort 30 items | Medium | Static map of common items → category; categories: Produce, Dairy, Meat, Bakery, Pantry, Frozen, Household, Other |
| Recurring chores (daily / weekly / monthly) | OurHome, Cozi, Habitica all support; one-off-only is a deal-breaker | Low | Already in v1 — carry forward |
| Assign chore to specific member | Universal expectation | Low | Already in v1 — carry forward |
| Month-view calendar with event indicators | Universal expectation | Medium | See "Calendar Density" section below for dot/chip strategy |
| Push notification for upcoming event | Cozi, Skylight, every co-parenting app does this | Medium | Web Push API via service worker; configurable lead time (default 30 min) |
| Push notification when chore is due | Standard in chore apps; verbal reminders from parents are exactly the pain point users buy a chore app to solve | Medium | Configurable due time per chore; notification fires at that time if uncomplete |
| Mark chore complete with one tap | Universal | Low | Already in v1 — carry forward |
| Meal plan visible to all family members | Cozi, Plan to Eat, Paprika do this; the "what's for dinner" question is constant | Low | Already in v1 — carry forward |
| Shared notes / family wall | FamilyWall, Cozi, Maple all have this | Low | Already in v1 — carry forward; add edit/delete per PROJECT.md |
| Family timezone setting | Cozi defaults wrong for non-Pacific users; complaint pattern in reviews | Low | Already in PROJECT.md Active |
| Visual identification of who has kids today | Required for custody — color-coded day per parent (per OurFamilyWizard, Our Days, Custody X Change) | Medium | Background tint on calendar day cell representing the custodial parent |
| Handoff details on transition days | OurFamilyWizard, TalkingParents, Our Days all show dropoff/pickup parent + time | Medium | Already in v1 schema (dropoff_parent, pickup_parent) |
| Offline read of today's data | PWAs are expected to work in the car / store / kid's school pickup with spotty signal | Medium | Service worker cache via vite-plugin-pwa |

## Differentiators

Features that set Family Hub 2.0 apart from the field.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Streak recovery (freezes, not hard resets) | Habitica/OurHome punish a single missed day with full streak reset — Duolingo's research-backed approach (600+ experiments) shows freezes increased DAU by 0.38% and dramatically reduce abandonment | Medium | See "Chore Streaks" section below — implement 1-freeze grace per week, earned-not-purchased |
| Mixed real/virtual members in one family | No competitor handles "Layla is 8 and uses Mom's account" elegantly. Cozi requires logins; Google Family Link requires a child Google account; Meta Horizon does parent-managed accounts well but only for VR. A first-class virtual-member model where the parent acts-as the child is rare | High | See "Member Management" section below |
| Unified calendar with explicit layer toggles | FamilyWall and Cozi reviewers complain everything looks the same. A toggle row (Events / Meals / Custody / Chores) that lets users dial density up/down is uncommon | Medium | See "Calendar Density" section below |
| Per-member nav section visibility | A 6-year-old shouldn't see the grocery list; a teen shouldn't see custody settings. Cozi shows everyone everything; this is configurable per member | Medium | Already in PROJECT.md Active |
| Custody pattern as first-class entity | OurFamilyWizard has a Parenting Schedule Builder with 2-2-3, 2-2-5-5, 4-3, every-weekend presets that auto-generate the calendar. Most general family apps don't have this concept at all — they make you create custody events manually | High | See "Custody Scheduling" section below |
| Member-aware push targeting | Cozi sends everything to everyone; co-parenting apps send to both parents; Family Hub can route ("chore complete" → parents only; "event reminder" → assignees only) | Medium | Notification routing rules in DB; default sensible behavior with override |
| Mobile-first PWA installable from web | No app store friction; iOS 16.4+ supports installable PWAs with push (with Add to Home Screen requirement) | Medium | vite-plugin-pwa already chosen |

## Anti-Features

Features to explicitly NOT build. Each has a competitor doing it badly that we can learn from.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|--------------------|
| Points / rewards economy | OurHome, Homsy, KiddiKash all have this. Creates a treadmill where every chore demands a price negotiation. Once you start, you can't stop — pulling rewards feels punitive. Already correctly out-of-scope in PROJECT.md | Streaks only. Self-reinforcing, no economy to maintain |
| Leaderboards / sibling comparison | Encourages sabotage between siblings; turns a cooperative tool into competitive. Reviews of OurHome mention sibling drama | Per-member streak displayed on own profile; no cross-family leaderboard |
| Notification for every wall post / every list edit | FamilyWall reviewers report "45 notifications when someone opens the app" — fastest path to uninstall. Appbot data: 10% of users disable apps over notification volume; 6% uninstall | Route notifications by event class (see "Push Notifications" section); never notify on view-only or low-stakes edits |
| Grocery request approval workflow (kid → parent → list) | Adds three steps to what should be one. Kid wants Cheerios — they should add Cheerios. If parent doesn't want Cheerios, parent removes them when shopping. Approval flows die from friction | Anyone can add. Parents can delete. Reduce friction, don't add gatekeeping |
| Two-column "items / suggested" grocery layout | v1's existing UX problem per PROJECT.md. AnyList, Bring, Any.do all use single-list-with-recents. Two columns waste mobile width | Single list with add-bar at top, recents/suggestions as dismissible chips below the input |
| Editable / deletable custody events (when court-grade trail matters) | TalkingParents specifically prevents edit/delete of events for court admissibility. Family Hub 2.0 is not court-bound (intact household + custody schedule, per PROJECT.md), so this rigor isn't needed. But: avoid blindly copying co-parenting app patterns that exist for legal reasons | Full edit/delete capability; rely on audit log (updated_at / updated_by) for traceability |
| Premium gating of core features | FamilyWall and Cozi reviewers slam the "everything is paywalled" model. This is a private family app — no business model to maintain | All features free; no auth tier |
| SMS notifications | Per-message cost, carrier deliverability friction, no rich content. Already correctly out-of-scope in PROJECT.md | Web Push only |
| In-app pet tracking, family location, vehicle maintenance, school assignments | Feature creep that bloats FamilyWall and Maple. Scope discipline matters more than feature count | Six surfaces only: Chores / Calendar / Meals / Groceries / Notes / Custody |
| "Cry wolf" engagement push notifications ("You haven't checked in today!") | Appbot research: these break trust fastest. Family Hub serves a need; the family is captive; no need for retention tactics | Only event-triggered notifications, never schedule-triggered nags |
| Streak Achievement badges every 21 days (Habitica model) | Adds an achievement system that requires maintenance and surface area. Out of scope per PROJECT.md (streaks only, no badges) | Show streak count plainly on member profile and member chip; let the number itself be the achievement |
| Sentiment-scanning AI for messages | TalkingParents Ultimate has this; specific to high-conflict co-parenting. Wrong tool for an intact family | Plain text notes, no analysis |

---

## Deep Dives

### Chore Streaks — Mechanics

The PROJECT.md commits to "streaks only, no points." This is the right call, but the implementation choices below distinguish a streak that motivates from one that punishes.

**Recommended model (Duolingo-inspired, not Habitica):**

| Mechanic | Recommendation | Rationale |
|----------|----------------|-----------|
| Streak unit | Per-chore (not per-member-overall) | A streak on "make bed" is meaningful and addressable. A streak on "did anything" is fuzzy and gameable |
| Streak increment | +1 when chore marked complete on or before its due time on a scheduled day | Habitica model: standard |
| Streak reset | Reset to 0 ONLY if user has used all available freezes for the period | Recovery-first design — see Trophy and yukaichou.com research |
| Freezes | 1 freeze auto-replenished per week per member, max 2 stockpiled. Auto-consumes silently when a scheduled day is missed | Duolingo's research: freezes increased DAU 0.38%; psychological safety net effect even unused |
| Freeze visibility | Show "Snowflake x 1" next to streak count; consumed freezes show "Freeze used" toast next morning | Awareness reinforces value; silent consumption feels like cheating |
| Day boundary | Local midnight in family timezone | PROJECT.md already adds family timezone setting |
| Skipped days (not scheduled) | Don't count, don't reset — neutral | Habitica handles this correctly; copy it |
| Streak display location | Member profile page (large), member chip (small badge if >= 3), chore detail (per-chore streak) | Three-tier visibility per Duolingo's "always-visible widget" research |
| Reset notification | Push to assignee only: "Your [chore] streak ended at N. Start a new one today." Non-shaming language | Toptal UX research: passive-aggressive copy breaks trust; neutral framing preserves motivation |

**Why not points:** Already covered in Anti-Features. To restate the strongest argument: a reward economy turns intrinsic chore-completion motivation into extrinsic transactional motivation. When the rewards stop, the chores stop. Streaks are self-reinforcing — the only reward is the streak itself, which costs nothing to maintain.

**Pitfall to avoid:** Habitica's hard reset rule causes most users to abandon after one missed day. Recovery-first design (yukaichou.com) treats every user as someone who *will* break their streak and engineers re-entry as part of the loop, not failure.

### Custody Scheduling — UX

This is where Family Hub 2.0 has the most to learn from court-grade co-parenting apps.

**Pattern presets (steal from OurFamilyWizard):**

OurFamilyWizard's Parenting Schedule Builder offers these as one-click presets:
- 2-2-3 (alternating; 2 days A, 2 days B, 3 days A; flips next week)
- 2-2-5-5 (similar but longer blocks)
- 4-3 (4 days with one parent, 3 with the other, repeating)
- Every weekend
- Alternating weeks
- Every other weekend
- Custom (user defines)

For Family Hub 2.0's intact-family-with-custody scenario, the *minimum viable* presets are: 2-2-3, alternating weeks, every other weekend, and custom. The 2-2-3 is by far the most common.

**Visual representation (steal from OurFamilyWizard + Our Days):**

| Element | Pattern | Source |
|---------|---------|--------|
| Day cell background tint | Light fill in the custodial parent's color across the entire day cell | OurFamilyWizard ("color-coded so you can see the big picture at a glance") |
| Transition / handoff day | Split fill — diagonal gradient or two-color top/bottom | Our Days, Custody X Change |
| Dropoff parent / pickup parent | Small icons or initials on handoff day cell, sized to be glanceable on mobile | OurFamilyWizard |
| Handoff time | Shown on tap/expand of the day cell; not crowding the month view | All co-parenting apps |
| Holiday override | Star icon on the day; tap reveals which parent has the holiday | OurFamilyWizard ("each holiday gets a star") |

**Push notification triggers (custody-specific):**

| Trigger | Recipients | Lead Time | Confidence |
|---------|------------|-----------|------------|
| Custody pattern changed (e.g., parent edited the recurring schedule) | All adults | Immediate | HIGH (PROJECT.md already lists this) |
| Tomorrow is a handoff day | Both parents + age-appropriate kids | 6pm day before | MEDIUM (extrapolated from co-parenting app best practice; verify with users) |
| Handoff today, in 1 hour | Dropoff parent only | T-1 hour | MEDIUM (specific lead time is a guess; configurable preferred) |
| Holiday assignment changed | All adults | Immediate | MEDIUM |

**Pitfalls to avoid:**

- **Don't make every event imply a custody handoff.** OurFamilyWizard's color-coded events show *who is responsible* for dropoff/pickup of that event — this is different from the overnight custody pattern. Keep these two concerns separate: custody pattern = who has the kids overnight; event dropoff/pickup = who handles transport for that specific event.
- **Don't auto-generate years of custody data ahead of time.** Generate on-demand from the pattern. v1 may have done this; if so, fix in the migration.
- **Allow the pattern to have an end date or be paused** (e.g., summer custody is different). All major co-parenting apps support this.

### Push Notifications — UX Patterns

Research synthesis from Appbot, OneSignal, Pushwoosh, Userpilot, and family-specific apps (Cozi, Rooster Money, OurFamilyWizard).

**Prioritized trigger list (HIGH = ship in foundation phase, MEDIUM = phase 2, LOW = nice-to-have):**

| Priority | Trigger | Recipient(s) | When | Body Pattern |
|----------|---------|--------------|------|--------------|
| HIGH | Chore due in 1 hour | Assignee only | Configurable per chore; default 1hr before due | "[Chore name] is due at [time]" |
| HIGH | Chore marked complete | Parents only (not other kids) | On completion | "[Kid name] finished [chore]" |
| HIGH | Event reminder | Event creator + invited members | Configurable; default 30 min | "[Event title] starts at [time]" |
| HIGH | Custody schedule changed | All adults | Immediate | "[Parent name] changed the custody schedule" |
| MEDIUM | Tomorrow is a handoff day | Both adults | 6pm day before, family TZ | "Tomorrow: kids switch to [parent] at [time]" |
| MEDIUM | Streak about to reset (last freeze about to be consumed) | Assignee | 8pm day before reset, family TZ | "Your [chore] streak resets tomorrow. Mark it done to keep it." |
| MEDIUM | New note posted | All members with note-section visibility | On post | "[Author]: [first 40 chars of note]" |
| LOW | Grocery added by another member while shopping | The person currently shopping | Only if "I'm shopping now" state set | "[Member] added [item]" |
| LOW | Meal plan finalized for the week | All adults | On finalize | "Meals are planned for the week" |

**Frequency caps (HIGH-confidence — pulled from Appbot, OneSignal, Pushwoosh research):**

- Hard cap: 3 push messages per user per day, including bundled notifications
- Quiet hours: 8pm – 8am family timezone for kids; 10pm – 7am for adults (configurable per member)
- Bundle: multiple chore-complete notifications within a 30-min window collapse to "[N] chores completed"
- Never push for view-only actions, never push the same actor for an action they just took

**Anti-patterns (HIGH-confidence — explicitly called out by Appbot):**

- Guilt copy ("You haven't checked in today")
- Curiosity bait that doesn't pay off ("Something changed!")
- Schedule-based nags ("It's Monday — check the calendar!")
- Same notification fan-out to all members for a low-stakes event

### Grocery List UX — Better Than Two-Column

v1's two-column layout is the documented problem. Best-in-class reference apps: AnyList, Bring, Any.do, OurGroceries, iOS Reminders Grocery.

**Recommended pattern (single-list with input bar):**

```
┌─────────────────────────────┐
│ + Add item        [voice]   │  ← Sticky input at top
├─────────────────────────────┤
│ Recents: [Milk] [Eggs] [×]  │  ← Dismissible chips below input
├─────────────────────────────┤
│ PRODUCE                     │  ← Section header (auto-categorized)
│ ☐ Apples (x6)               │
│ ☐ Spinach                   │
│ DAIRY                       │
│ ☐ Milk (2x)                 │
│ ...                         │
└─────────────────────────────┘
```

| Feature | Source | Implementation Notes |
|---------|--------|----------------------|
| Sticky input at top of screen | AnyList, Bring | Single source of entry; one-handed thumb-reachable |
| Auto-categorization on add | AnyList, Bring, Any.do, iOS Reminders | Static map of ~200 common grocery items → category. New/unknown items go to "Other" and can be re-categorized |
| Recents as quick-add chips | AnyList | Tracks last 30 distinct items added by this family; tap to re-add |
| Per-item quantity (x6) | All major apps | Inline in the item row; tap to increment |
| Check off = strike through, move to bottom or hide | Bring (hides), AnyList (strike + bottom) | Hide after 5 seconds with undo toast (Material Design pattern) |
| Walmart link per item | v1 — keep | Optional per item |
| "Who's at the store right now" indicator | Original; not seen in competitors | Tap a "Shopping now" button to broadcast presence; others' adds appear with notification (LOW priority push) |
| Voice add | AnyList, iOS Reminders | Browser SpeechRecognition API; nice-to-have |
| Real-time multi-user editing | AnyList, Bring, OurGroceries, Cozi | Supabase realtime — already in plan |

**Anti-patterns to avoid:**

- Don't show categories the list doesn't currently have items in. Empty section headers are visual noise.
- Don't require category selection on add — auto-assign and let the user re-categorize if wrong.
- Don't push every add to every member. See notification frequency caps.

### Member Management UX — Real + Virtual Members

The hardest UX problem in this app. No competitor solves it cleanly.

**Member entity model:**

| Field | Required | Notes |
|-------|----------|-------|
| id | Yes | UUID |
| display_name | Yes | "Layla" |
| emoji | Yes | Single emoji, e.g. 🦋 |
| color | Yes | Hex; one of palette set |
| role | Yes | enum: parent / child / other |
| auth_type | Yes | enum: google / virtual |
| google_email | If auth_type=google | Linked Google account |
| managed_by | If auth_type=virtual | FK to a parent member's id; the parent who acts-as this member |
| visible_sections | Yes | array: chores, calendar, meals, groceries, notes, custody, member-pages |
| created_at, updated_at, updated_by | Yes | Audit per PROJECT.md |

**Virtual member behavior:**

- When a parent is logged in, an "Acting as: [Member]" picker is available in the header (only if they manage any virtual members).
- Choosing a virtual member changes the UI to that member's nav/section visibility, and any action taken (chore complete, note post) is attributed to the virtual member, with updated_by = the actual parent's account.
- Audit log records both: actor (parent) and member (virtual). This solves the "who actually marked the chore done" question for accountability without exposing it in normal UI.

**Why this matters:**

- A 6-year-old can have their own profile, their own streak, their own visible sections, without needing a Google account. (No competitor solves this elegantly: Google Family Link requires a kid Google account; Cozi requires logins; Meta Horizon is good but VR-only.)
- A teen can be promoted from virtual to real (link Google account) without losing history.
- Parents stay in control: only parents create virtual members; virtual members can be edited/deleted by their manager.

**Profile customization UI:**

| Element | Pattern | Source |
|---------|---------|--------|
| Emoji picker | Grid of emoji choices, searchable, with recents | emoji-picker-react library; standard pattern |
| Color picker | Curated palette of 12-16 colors that meet WCAG AA contrast against both themes | Custom; avoid free color picker — accessibility risk |
| Name | Plain text input, 1-30 chars, no emoji in name field (emoji is separate) | Standard |
| Section visibility | Toggle list of the 7 sections | Cozi has similar via family/single mode toggle |

### Calendar Density — Layering Without Clutter

The single biggest complaint in reviews of every family organizer (FamilyWall, Cozi, Skylight) is calendar clutter.

**Recommended approach (Mobbin / setproduct.com / UX patterns research):**

**Month view, mobile (default):**

| Layer | Visual | When Visible |
|-------|--------|--------------|
| Custody | Day cell background tint (subtle, ~10% opacity) | Always when custody section is enabled for the viewing member |
| Events | Up to 2 colored dots per day (member colors); "+N" indicator if more | Always |
| Meals | Single utensil icon in day cell corner when meal planned | Toggleable in calendar header |
| Chores | No representation on month view (too noisy) | Never in month view; shown in week/day view only |

**Layer toggle row at top of calendar:**

```
[Events ✓] [Meals ✓] [Custody ✓]
```

Each is a chip toggle; user-preferred state persists per device.

**Day detail (tap a day):**

Bottom sheet expands showing for that day, in this order:
1. Custody (who has the kids, handoff time if any)
2. Events (time + title + member colors)
3. Meals (breakfast / lunch / dinner)
4. Chores due today (assignee + status)

**Week view (alternate):**

Standard column-per-day layout with time slots; events placed as colored blocks; custody as a subtle column-wide background tint; meals as compact rows at top of each column; chores hidden by default (toggleable).

**Confidence flags:**

- The 2-dots-plus-overflow pattern is HIGH confidence — used by Cozi, Apple Calendar, Google Calendar.
- The layer-toggle chips pattern is MEDIUM confidence — researched in setproduct.com calendar UX article, but not specifically observed in family apps. Likely net-new for this space.
- Background tint for custody is HIGH confidence — OurFamilyWizard, Our Days, Custody X Change all do this.

**Anti-patterns:**

- Don't show full event titles on month view at mobile widths — there isn't room.
- Don't use color alone to encode custody — also use a corner icon or letter for accessibility (color-blind users; reference: setproduct.com note "color coding must be backed by pattern or icon for color-blind users").
- Don't show empty days as visually identical to in-the-past days — current month / today / past must be visually distinct.

---

## Feature Dependencies

```
Member entity model
    └── Member-aware push targeting
    └── Per-member color coding (calendar, chores, custody)
    └── Per-member section visibility
    └── Streak ownership

Push notification infrastructure (Web Push + service worker)
    └── Chore due reminders
    └── Event reminders
    └── Streak warnings
    └── Custody handoff notifications

Custody pattern entity
    └── Custody day-cell tints on calendar
    └── Handoff details on transition days
    └── Custody-change notifications

Chore + completion log
    └── Streak calculation
    └── Streak freezes
    └── Streak notifications

Grocery list + categorization map
    └── Auto-sort on add
    └── Recents chips
```

---

## MVP Recommendation

Given the PROJECT.md scope, suggested phase priority within the rewrite:

**Foundation phase (already in progress per git log):**
1. Member entity model (real + virtual) — unblocks everything else
2. Auth (Google OAuth) and acting-as for virtual members
3. Theme system + per-member colors

**Phase: Daily-driver features (highest-frequency use):**
1. Chores with assignment + recurrence + due times (table stakes)
2. Calendar month view with events (table stakes)
3. Grocery list with auto-categorization (table stakes + fixes v1 issue)

**Phase: Engagement + notifications:**
1. Web Push setup (service worker, subscriptions, permission flow)
2. Chore due / chore complete notifications
3. Event reminder notifications
4. Streaks with freezes

**Phase: Custody:**
1. Custody pattern entity + presets
2. Calendar day-cell custody tinting
3. Handoff details
4. Custody change notifications

**Phase: Polish + lower-frequency:**
1. Meal history navigation
2. Search across surfaces
3. Notes edit/delete
4. Richer member pages with stats

**Defer / nice-to-have:**
- Voice add for groceries
- "I'm shopping now" presence indicator
- Streak warning notifications (initial version: silent freeze use)

---

## Open Questions for Requirements Phase

- What is the family timezone default — derive from Google account, prompt on first run, or hardcode then settings-configurable? (PROJECT.md says configurable, doesn't specify initial source.)
- For the 6-year-old case: does the parent set up the kid's profile and the kid uses the parent's phone, or does the kid have their own device? This affects whether the "acting as" UX needs to be a long-lived mode toggle or a quick action.
- What is the desired streak freeze behavior on multi-day vacations? Should there be a "pause streaks" mode for family vacations, similar to OurFamilyWizard's custody pause?
- Should chore "due time" be soft (notification fires but you can still complete late on the same day) or hard (after due time, the day counts as missed)? Recommend soft — softer mechanics drive better long-term engagement per habit research.
- Are there features specific to "the dad uses Family Hub primarily; the kids only check it at chore time" usage patterns? This affects default landing pages and per-member home views.

---

## Sources

- [Habitica Streaks Wiki](https://habitica.fandom.com/wiki/Streaks) — Habitica streak mechanics (HIGH confidence; official wiki)
- [Habitica Dailies Wiki](https://habitica.fandom.com/wiki/Dailies) — Daily reset behavior
- [Duolingo Streak Habit Research](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) — Official Duolingo on streak design (HIGH)
- [Duolingo Streak System Breakdown](https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f) — Detailed third-party analysis (MEDIUM)
- [Trophy: What Happens When Users Lose Streaks](https://trophy.so/blog/what-happens-when-users-lose-streaks) — Recovery-first design research (MEDIUM)
- [Yu-kai Chou: Recovery-First Streak Design](https://yukaichou.com/gamification-analysis/recovery-first-streak-design/) — Gamification expert on streak design (MEDIUM)
- [OurFamilyWizard 2-2-3 Custody Schedules](https://www.ourfamilywizard.com/blog/2-2-3-custody-schedules) — Pattern explanation (HIGH)
- [OurFamilyWizard Calendar Features](https://www.ourfamilywizard.com/product-features/calendar) — Visual design patterns (HIGH)
- [OurFamilyWizard Parenting Schedules](https://www.ourfamilywizard.com/knowledge-center/tips-tricks/parents-website/parenting-schedules) — Schedule builder UX (HIGH)
- [TalkingParents Features](https://talkingparents.com/features) — Court-grade co-parenting comparison (HIGH)
- [Kidtime: 11 Best Free Co-Parenting Calendar Apps 2026](https://kidtime.app/blog/co-parenting-calendar-app-free) — Competitive landscape (MEDIUM)
- [Appbot: Push Notification Best Practices 2026](https://appbot.co/blog/app-push-notifications-2026-best-practices/) — Notification fatigue research (HIGH)
- [OneSignal: Push Notification Best Practices 2026](https://onesignal.com/blog/onesignal-guide-push-notification-best-practices-2026/) — Frequency caps, quiet hours (HIGH)
- [Userpilot: Push Notification Best Practices](https://userpilot.com/blog/push-notification-best-practices/) — Churn data (MEDIUM)
- [Toptal: Push Notification UX](https://www.toptal.com/designers/ux/push-notification-best-practices) — Copy patterns (MEDIUM)
- [AnyList](https://www.anylist.com/) — Grocery UX reference (HIGH; official site)
- [Bring! Grocery Shopping List](https://play.google.com/store/apps/details?id=ch.publisheria.bring) — Visual grocery list (MEDIUM)
- [iOS 17 Reminders Grocery Sorting](https://www.macrumors.com/2023/06/07/ios-17-reminders-grocery-sorting/) — Auto-categorization standard (MEDIUM)
- [Cozi Feature Overview](https://www.cozi.com/feature-overview/) — Direct competitor (HIGH)
- [Cozi App Review 2025](https://ourcal.com/blog/cozi-app-review-2025) — Third-party review (MEDIUM)
- [Cozi Mobile Month View Makeover](https://www.cozi.com/blog/mobile-month-makeover/) — Calendar density patterns (MEDIUM)
- [FamilyWall Reviews](https://apps.apple.com/us/app/familywall-family-organizer/id496889629?see-all=reviews&platform=iphone) — User complaint patterns (MEDIUM)
- [Cozi Reviews — JustUseApp](https://justuseapp.com/en/app/407108860/cozi-family-organizer/reviews) — User complaint patterns (LOW; aggregator)
- [Setproduct: Calendar UI Design Best Practices](https://www.setproduct.com/blog/calendar-ui-design) — Density and patterns (MEDIUM)
- [Eleken: Calendar UI Examples](https://www.eleken.co/blog-posts/calendar-ui) — Patterns reference (MEDIUM)
- [Magicbell: PWA iOS Limitations and Safari Support 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — Push notification PWA constraints (HIGH)
- [Mobiloud: PWA Push Notifications iOS/Android](https://www.mobiloud.com/blog/pwa-push-notifications) — Web Push setup (MEDIUM)
- [Trendhunter: OurHome](https://www.trendhunter.com/trends/ourhome) — Competitor gamification (LOW)
- [Homsy: Best Chore Chart Apps 2026](https://gethomsy.com/blog/comparisons/best-chore-chart-apps-2026) — Competitive landscape (MEDIUM)
- [Rooster Money: Child Chore Reminders](https://support.roostermoney.com/en/articles/5296565-child-chore-reminders) — Kid notification timing patterns (MEDIUM)
