# Phase 2: Core Session Loop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 2-core-session-loop
**Areas discussed:** Session screen structure, Rest timer UX, Set row interaction, Completion & Anubis flow

---

## Session Screen Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated full-screen route | Workouts tab navigates to /session screen. Tab bar hidden. Session owns full screen. | ✓ |
| Workouts tab inline | Active session replaces tab content. Tab bar stays visible. | |

**Q2 — Exercise layout:**

| Option | Description | Selected |
|--------|-------------|----------|
| Scrollable stacked cards (FlashList) | All exercises visible in vertical list. Dense, data-forward. | ✓ |
| One exercise at a time with prev/next nav | Full-width card, swipe or arrow to advance. | |
| Collapsible sections | Exercises collapse after all sets marked. | |

**Q3 — Session header:**

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — day label + elapsed timer + Complete button | e.g. "Push · 00:42:15 · [Complete]" | ✓ |
| Full summary bar — day label + elapsed + volume + sets done/total | More data-dense. | |
| Just the day label, no timer | Minimal. | |

---

## Rest Timer UX

**Q1 — Timer display location:**

| Option | Description | Selected |
|--------|-------------|----------|
| Floating bottom pill | Persistent overlay. Exercise list visible and scrollable behind it. | ✓ |
| Full-screen takeover | Timer replaces session screen. Swipe down to return. | |
| Inline on set row | Mini-countdown replaces buttons on the marked set row. | |

**Q2 — Timer controls:**

| Option | Description | Selected |
|--------|-------------|----------|
| Countdown + Skip + ±30s buttons | Most flexible. | ✓ |
| Countdown + Skip only | Simpler. | |
| Countdown only, tap anywhere to skip | Minimal. | |

**Q3 — At zero behavior:**

| Option | Description | Selected |
|--------|-------------|----------|
| Vibrate + sound, pill turns accent, auto-dismiss after 3s | Draws attention then gets out of the way. | ✓ |
| Vibrate + sound, pill stays until dismissed | User must tap Skip to clear. | |
| Vibrate + sound, pill disappears immediately | Clean. No visual linger. | |

---

## Set Row Interaction

**Q1 — Weight input:**

| Option | Description | Selected |
|--------|-------------|----------|
| Inline editable field, always visible | Pre-filled from last session. Fastest path to log. | ✓ |
| Tap row to open quick-input modal | Bottom sheet with number pad. Extra tap. | |
| Scroll-wheel picker | No keyboard. Good for gloves/sweaty hands. | |

**Q2 — Secondary actions (RPE, warm-up, notes):**

| Option | Description | Selected |
|--------|-------------|----------|
| Long-press opens action sheet | Clean rows. Long-press reveals options. | |
| Swipe left to reveal action buttons | Standard list-swipe pattern. | |
| Expand chevron per set row | Tap chevron to expand inline form. | ✓ |

**Q3 — Previous performance display:**

| Option | Description | Selected |
|--------|-------------|----------|
| Muted text below weight input: "185 lbs · ✓✓✓✗" | Compact. Tap to auto-fill. | ✓ |
| Separate column on the right | Side-by-side spreadsheet style. | |
| Hidden behind info icon | Extra tap required. | |

---

## Completion & Anubis Flow

**Q1 — What happens on "Complete Workout":**

| Option | Description | Selected |
|--------|-------------|----------|
| Anubis animation full-screens instantly, then fades to Dashboard | No summary. No confirmation. Session committed during animation. | ✓ |
| Anubis then post-workout summary screen | PRs, volume, duration, go-rate. User taps Done. | |
| Confirmation dialog first, then Anubis | Alert with confirm/cancel. | |

**Q2 — Anubis implementation:**

| Option | Description | Selected |
|--------|-------------|----------|
| Lottie animation (JSON) from assets | lottie-react-native. Plays once. | ✓ |
| Static image + Reanimated opacity/scale | No Lottie dependency. | |
| Video file (MP4) via expo-av | Full fidelity but adds bundle size. | |

---

## Claude's Discretion

- Exact exercise card visual design (spacing, typography hierarchy) — follow Phase 1 NativeWind tokens
- Superset scroll behavior implementation (auto-scroll to paired exercise)
- Body map injury UI (anatomical front/back muscle group tap targets)
- WORKOUT-13 Run GPS fallback (device GPS) — lower priority; Apple Health pull first

## Deferred Ideas

- Post-workout summary screen — user went straight to Dashboard; can add in Phase 3 or Phase 6
- Confirmation dialog before completing — user said no; can add as Settings toggle in Phase 6
- WORKOUT-13 device GPS fallback toggle — deferred within Phase 2 scope
