# Phase 3: Templates, Programs & Progress - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-27
**Phase:** 3-templates-programs-progress
**Areas discussed:** Workouts tab restructure, Progress tab layout, AI program gen scope, Gamification depth

---

## Workouts Tab Restructure

### Q1: Where does template management live?

| Option | Description | Selected |
|--------|-------------|----------|
| Workouts tab owns it | Restructure Workouts into a template list screen. Today's active template gets a Start CTA at the top; all others listed below. | ✓ |
| Split tab owns it | Split tab already handles split settings and rotation. Template management stays near those controls. | |

**User's choice:** Workouts tab owns template management

---

### Q2: What shows at the top of the Workouts tab?

| Option | Description | Selected |
|--------|-------------|----------|
| Today's workout card + Start button | Prominent card showing today's day label, exercise names, and a big Start button. Template list scrolls below. | ✓ |
| Just the template list, 'Today' badge on active | No separate hero card — the list shows all templates, the current day's gets a highlighted 'Today' badge inline. | |
| Stats summary row first, then Today's card, then list | Dashboard-lite: streak + recent workout count across top. | |

**User's choice:** Today's workout card + Start button at the top

---

### Q3: How does the template builder open?

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen route | Tapping 'New template' or an existing template navigates to a dedicated full-screen builder. Exercise search lives within it. | ✓ |
| Bottom sheet / modal | Template builder slides up as a tall modal sheet. | |

**User's choice:** Full-screen route

---

### Q4: Exercise search inside the template builder?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline search + muscle group filter chips | Search bar at the top with muscle group Chip filters. Results list below. Tapping adds to template. | ✓ |
| Tap 'Add exercise' → separate search modal sheet | Template builder shows configured exercises; Add exercise opens a modal. | |
| You decide | Researcher and planner figure out the UX based on ExerciseSwapModal pattern. | |

**User's choice:** Inline search + muscle group filter chips

---

## Progress Tab Layout

### Q1: How is the Progress tab organized?

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal segment tabs within the screen | Segment row at top: Overview / Charts / Photos / Achievements. Content swaps below. | ✓ |
| One long scrolling screen, sections stacked | All content on one scroll — no sub-navigation. | |
| Separate screens via list items | Progress tab shows a menu list navigating to separate screens. | |

**User's choice:** Horizontal segment tabs (Overview / Charts / Photos / Achievements)

---

### Q2: What lives in the Overview segment?

| Option | Description | Selected |
|--------|-------------|----------|
| Stats row + streak + recent sessions list | Top row: total workouts, weekly streak, go-rate %, lifetime PRs. Below: recent sessions list. | ✓ |
| Stats row + mini chart preview + recent sessions | Adds a small sparkline-style weight chart as a teaser before the Charts tab. | |
| You decide | Researcher and planner determine the right Overview content. | |

**User's choice:** Stats row + streak + recent sessions list

---

### Q3: Charts segment — how does the user pick which exercise to chart?

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown / picker at the top of the Charts segment | Exercise name picker at top. Below: weight progression chart + volume bar chart. Date range filter as segmented control. | ✓ |
| Search-to-chart: type exercise name, chart appears | Search input at the top. As user types, matching exercises appear. | |
| Auto-show top 5 most-logged exercises as chart cards | Scrollable list of chart cards — one per frequently-logged exercise. | |

**User's choice:** Dropdown / picker at top + date range segmented control

---

### Q4: Where does history editing (HISTORY-02) live?

| Option | Description | Selected |
|--------|-------------|----------|
| In the recent sessions list — tap session → edit sheet | Tapping a session in the Overview list opens a detail/edit view. | ✓ |
| In the active session route, retroactively | 'View history' from Workouts tab opens a past session in session screen with edit mode. | |
| You decide | Researcher and planner determine the right edit entry point. | |

**User's choice:** Tap session in Overview list → edit sheet/view

---

## AI Program Gen Scope

### Q1: Real Claude call or stub in Phase 3?

| Option | Description | Selected |
|--------|-------------|----------|
| Real Claude call, ungated in Phase 3 | Full Edge Function + Claude API wired up. No premium check. Phase 4 adds the gate. | ✓ |
| Stub the button, defer to Phase 4 | 'Generate with AI' button is a placeholder. Phase 4 wires the real call. | |
| Real call behind a dev flag | Edge Function built and tested, but UI button hidden behind __DEV__ flag. | |

**User's choice:** Real Claude call, ungated in Phase 3

---

### Q2: Program builder entry point?

| Option | Description | Selected |
|--------|-------------|----------|
| Split tab owns programs | Programs section within Split tab (alongside split type and rotation). 'Create manual' + 'Generate with AI' CTAs. | ✓ |
| Separate Programs tab or route from Workouts | Programs get their own screen accessible from Workouts tab. | |

**User's choice:** Split tab owns programs

---

### Q3: AI program review step?

| Option | Description | Selected |
|--------|-------------|----------|
| Week-by-week grid: Accept / Regenerate / Edit | Claude returns program → review screen shows week grid → user taps Accept, Regenerate, or Edit. | ✓ |
| Streaming display, then Accept / Reject | Program streams in as text first, then structured view for accept/reject. | |
| You decide | Researcher and planner determine the program review UX. | |

**User's choice:** Week-by-week grid with Accept / Regenerate / Edit

---

## Gamification Depth

### Q1: Ship all three gamification features or defer challenges?

| Option | Description | Selected |
|--------|-------------|----------|
| Badges + streak only in Phase 3; challenges deferred | GAMIFY-01 + GAMIFY-03. Challenges (GAMIFY-02) deferred to Phase 6 — complex timed opt-in goals. | ✓ |
| All three in Phase 3 | Ship badges, streak, and challenges. Simple presets + opt-in + automated progress check. | |

**User's choice:** Badges + streak only; challenges deferred to Phase 6

---

### Q2: Where do badges and streak surface in the UI?

| Option | Description | Selected |
|--------|-------------|----------|
| Achievements segment in Progress tab + streak in Overview | Badge grid in Achievements; streak in Overview stats row. | |
| Badges in Progress + streak badge in Dashboard header | Streak more prominent — flame icon + count in Dashboard header. | |
| You decide | Researcher and planner determine placement. | ✓ |

**User's choice:** You decide (Claude's discretion)

---

### Q3: How does the user find out they earned a badge?

| Option | Description | Selected |
|--------|-------------|----------|
| Toast/banner on session complete | Animated toast after Anubis animation: '100 workouts! Badge unlocked.' One-time display. | ✓ |
| Silent unlock — badge just appears in Achievements | Badge awarded in background. User discovers it when they visit Achievements. | |

**User's choice:** Toast/banner after session complete (after Anubis animation)

---

## Claude's Discretion

- Badge and streak placement in the UI (Achievements segment vs. Dashboard header — based on screen real estate)
- ExerciseDB video embed approach (YouTube embed vs. direct video player vs. GIF — follow cache-first strategy)
- Exact template card visual design within the Workouts tab list
- Deload suggestion UI surface (Dashboard banner vs. prompt on session start)
- Progress photo upload UX (camera capture vs. gallery picker vs. both)

## Deferred Ideas

- **Challenges (GAMIFY-02)** — timed opt-in goals deferred to Phase 6 (Polish)
- **Template sharing links (TEMPLATE-08)** — deferred to Phase 6 per roadmap
- **Admin bulk upload (TEMPLATE-09)** — deferred to Phase 6 per roadmap
