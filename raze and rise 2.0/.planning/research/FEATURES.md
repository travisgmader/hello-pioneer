# Features Research — Raze and Rise v2

**Domain:** Full fitness platform (workout tracking + AI coaching + nutrition + wearables)
**Researched:** 2026-05-18
**Confidence:** HIGH — verified against Strong, Hevy, Whoop, Fitbod official docs and multiple independent reviews

---

## Table Stakes (users leave if missing)

Features users of a serious lifting app treat as baseline. Missing any of these signals an amateur product.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auto rest timer after set log | Strong, Hevy, Fitbod all do this. Manually starting a timer is a solved problem — any app without it feels broken | Low | Auto-fire on set complete; sound + vibration + local notification |
| Previous performance on exercise card | Hevy shows a PREVIOUS column with last weight × reps per set row. Strong shows same inline. Users cannot track overload without it | Low | Display only during active session (not template builder). Tap to auto-fill |
| PR celebration mid-workout | Hevy fires a live banner overlay when a new 1RM, heaviest set, most reps, or volume PR is hit. Strong does a brief animation. 65% higher 90-day retention for apps with this | Low | Banner-style, not full-screen interruption. Catch all PR types: 1RM, 5RM, volume, total reps |
| Per-exercise rest timer override | Users expect shorter rests on isolation work, longer on compounds. Global default + per-exercise config is the pattern | Low | Set at template level; overridable during live session |
| Background timer with notification | If the user locks screen or switches apps mid-rest, a local push notification must fire when timer expires. No notification = constant app-switching anxiety | Medium | Requires native push notification (Expo Notifications). Test against iOS background refresh limits |
| Set types: warmup, working, AMRAP | Warmup sets excluded from volume and PR calculations. AMRAP tracking (logging actual reps hit vs prescribed). Drop sets. Strong supports all of these; it's expected | Low | Flag warmup sets in UI; exclude from go-rate and PR logic |
| Superset support | Both Strong and Hevy support supersets. Any serious PPL or hypertrophy program uses them | Medium | Color-coded pairing, smart scroll to next exercise, rest timer fires after last exercise in pair |
| Exercise library with muscle tags | Searchable, filterable by muscle group, equipment. Curated built-in + user-defined custom | Medium | ExerciseDB API covers this; cache responses locally |
| Progress charts (1RM, volume, bodyweight) | Recharts or Victory Native. Lifters want per-exercise weight progression, estimated 1RM trend, total weekly volume | Medium | Date-range filter minimum. Week/month/all-time |
| Workout history with full detail | Every session browsable: exercises, sets, weights, results, duration | Low | Already in v1; normalize in v2 schema |
| Edit completed workouts | Fix a typo after session ends. Hevy and Strong both allow this | Low | Critical for accuracy — users notice when they can't correct mistakes |
| Offline mode | Gym Wi-Fi is unreliable. Must log sets offline and sync on reconnect | High | Service Worker + local-first persistence. Merge by session ID |
| Bodyweight exercise handling | Pull-ups, dips, push-ups need body weight as base, with +/- offset for weighted/assisted | Low | Pull current body weight from measurements automatically |
| Dark mode, gym-readable UI | Bright white apps are painful under gym lighting. Users switching from Whoop or Strong expect dark-first | Low | Dark as default; light mode as toggle |

---

## Differentiators (competitive advantage)

Features that meaningfully separate Raze and Rise v2 from Strong and Hevy. Most competitors offer 1-2 of these; combining them is the gap.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Claude AI coach chat (premium) | Future, Freeletics, and Whoop all offer AI coaching, but none combine it with full workout history access. Claude knowing your PRs, deload week, and injury flags = genuinely useful context-aware advice. Freeletics' Coach+ launched 2024 to strong reception | High | Gate behind premium. Rate limit per user. Full context window with their history |
| AI workout generation from performance data | Not just "generate a push day" but "generate a push day based on my last 4 sessions, that I hit my bench PR last week, and I'm in week 6 of hypertrophy phase" | High | Combine Claude API with full session history in prompt context |
| AI meal plan + Instacart one-tap ordering | No competitor does this end-to-end. Instacart MCP generates a shareable shopping list page from ingredient arrays. ChatGPT launched this with Instacart in Dec 2025 — it's proven viable | High | Instacart MCP creates recipe/list pages, not full cart checkout. UX: meal plan → ingredient list → "Order on Instacart" button opens generated link |
| Recovery-aware training suggestions | Whoop's Daily Outlook (2025) links biometric data to training decisions. Combining Whoop/HRV data with workout suggestions is Whoop's core value prop — doing it in the workout app itself eliminates the context switch | High | Requires Whoop or Apple HealthKit integration first |
| Deload auto-detection | No mainstream app surfaces a deload suggestion based on phase length. Fitbod adjusts dynamically but doesn't name it. Naming the deload and explaining why builds trust | Medium | Trigger after N weeks in a phase (configurable). Show suggestion card, not a forced change |
| AF PT Prep split with GPS run tracking | Niche but highly specific to actual user need. GPS route + pace + HR pulled from Apple Health/Garmin. No general-purpose app handles military PT prep as a first-class program type | High | Pull from Apple Health or Garmin; device GPS as fallback |
| Apple Watch companion for set logging | Strong has this and it's genuinely useful. Logging sets from wrist = no fumbling with phone between sets. Apple's own Workout Buddy (watchOS 26) shows Apple is investing here | High | Show exercise card, log set with go/no-go, rest timer on wrist. WatchOS 26 has new layout APIs |
| Share workout as Instagram card | Shareable image of completed session. Already popularized by Hevy's social features. Combined with shareable template links, builds organic growth | Low | Generate image server-side (Satori/OG image) or client-side canvas |
| Phase system (Hypertrophy / Strength / Power) | Periodization is well understood but few apps make it explicit at the session level. Displaying current phase, week number, and what's coming next makes the program feel intentional | Low | Already exists in v1. Make it a first-class dashboard element |
| WHOOP-style progressive disclosure UI | Start with 3 numbers (Recovery, today's session, next workout), tap for depth. Most fitness apps dump all data on screen simultaneously | Medium | Pattern from WHOOP's three-tier model: overview → trends → raw data |
| Home screen widget with today's workout | Garmin and Strava widgets show weekly mileage. Workout apps that show "Push Day — 8 exercises — Start" on the home screen remove the activation cost of opening the app | Medium | iOS 16+ WidgetKit. Small: day label + start button. Medium: day label + exercise count + next 2 exercises |

---

## Anti-Features (deliberate exclusions)

Things that feel like clutter, signal feature bloat, or create friction. Explicitly not building these is a product decision, not a gap.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Social leaderboards / friend feeds | Alienates serious athletes who do not want public comparison. Hevy has social and it's the least-used section per user reviews | Share button produces a self-contained image card. No feed, no follows |
| Water / hydration tracking | Every app has it. Nobody uses it. It adds a dashboard widget that competes with recovery data | Omit entirely. Users who care about hydration use a dedicated app |
| Barcode scanner / own food logging | MFP's barcode database is 14M+ items built over 15 years. Can't compete on food database quality | Integrate with MFP (read macros in) or Terra API as fallback. Do not build a competing database |
| Plate calculator | Strong has one and it's rarely used by people who aren't beginners. Takes screen real estate | Skip. Users who need it use their phone's calculator or memorize common plate configs |
| Excessive onboarding questionnaire | Noom-style 70-screen flows feel manipulative. Fitness apps lose 89% of users when onboarding feels complicated. First value moment must come within 90 seconds | 4-step onboarding (profile → split → template → practice set). Skip anything that doesn't unlock immediate value |
| Gamification overload | Badges + points + quests + streaks + social comparison simultaneously causes cognitive overload per 2025 study. Moderate gamification outperforms both sparse and overloaded systems | Single badge system for real milestones (100 workouts, 10k lbs, 30-day streak). No XP points, no avatar RPG systems |
| AI form video analysis via camera | Computer vision inference is expensive, slow, and has high false-positive rate for injury detection in real gym conditions. Out of scope and sets false expectations | Link to ExerciseDB demo videos per exercise instead |
| Paywall at core logging features | Gating the workout log behind premium kills retention. The app must build habit before monetizing it | Gate AI features (coach, meal plan, AI program gen). Free tier: full logging + charts + history + templates |
| Annual subscription at launch | Adds pricing decision complexity before product has proven retention | Monthly only to start. Annual pricing after 6 months of retention data |
| Coaching / trainer accounts | Out of scope per PROJECT.md. Adds an entirely different product surface | Shareable template links give a "share your program" release valve without building a coaching tier |

---

## UX Patterns by Feature Area

### 1. Active Workout Session Flow

**The gold standard (Strong + Hevy combined):**

- Session starts with a timer in the top bar (elapsed time, not countdown).
- Each exercise is its own card: exercise name at top, set rows below.
- Set row columns: set number | PREVIOUS (last session weight × reps) | WEIGHT input | REPS input | ✓ complete.
- Tapping PREVIOUS value auto-fills the current set — one tap to match last session.
- Completing a set via ✓ auto-starts the rest timer immediately (no separate tap).
- PR banner slides in from top when a new record is set. Dismisses automatically after 3s. Does not block set logging.
- At the bottom of each exercise card: "+ Add Set" button.
- At the bottom of the session: "Finish Workout" button (prominent, but requires confirmation scroll past all exercises to reach).

**Session navigation:** Single scrollable view of all exercises in order. No tab switching mid-session. Superset pairs are visually grouped with a colored left border and a color-matched header.

**Superset flow (Hevy pattern):** Complete a set of Exercise A → app auto-scrolls to Exercise B → complete a set of Exercise B → rest timer fires → app scrolls back to Exercise A. Color-coded pairing (each pair gets a distinct hue). This is the correct pattern. Parallel tracking (logging both at once) is confusing on mobile.

### 2. Rest Timer UX

**Placement:** Not full-screen. A persistent strip at the bottom of the active session view (above the tab bar). Shows countdown in large numerals, plus exercise name for next set. Tapping expands to a bottom sheet with +/- controls to adjust time on the fly.

**Background behavior:** When user locks screen or switches apps, a local push notification fires at timer completion. Notification text: "Rest complete — time for set [N+1] of [Exercise Name]." Vibration + sound. This is what Strong does and it's the critical path for gym usability.

**Visual:** Green countdown while in normal range. Turns amber at 30 seconds remaining (optional). Does not use a ring/circle timer (takes too much space). Simple monospace countdown is more readable across the gym.

### 3. Progressive Overload Display

**Pattern (Hevy-verified):** PREVIOUS column appears only during live sessions, not in template builder. Shows exact weight × reps from last session, set by set. If a new set type is added (e.g. adding a 5th set when history only has 4), the PREVIOUS cell is blank for new rows.

**Overload suggestion:** After the session completes (post-workout summary), surface a single insight: "You hit all 4 sets of bench press at 185 lbs. Consider 190 lbs next session." This is less distracting than mid-workout suggestions and avoids cognitive load during the set.

**Focus metric:** Show one aggregate above the exercise card (e.g. total volume or volume vs last session). Let user choose which metric in Settings. Strong calls this "Focus Metric."

### 4. Superset UX

**Pattern (Hevy-verified):**

- To pair: tap ⋮ menu on an exercise → "Add to Superset" → select the second exercise.
- Each pair gets a unique color (not user-chosen — auto-assigned for simplicity).
- During active session: completing any set in the pair triggers auto-scroll to the next exercise in the pair. After the last exercise in the pair completes, rest timer fires, then scroll returns to the first exercise.
- Visual: left border color stripe on each card in the pair. Small colored tag next to the exercise name (e.g. "Superset A").
- Rest timer fires once per round, not per exercise. Timer duration uses the longer of the two exercise rest settings.

**Three-exercise circuits:** Hevy supports grouping more than 2 exercises. Support this from the start — it's how PPL programs often handle tricep finishers.

### 5. AI Coach Patterns

**The Whoop model (verified, 2025):** Not a standalone chat tab. AI coaching is woven into every screen:

- Recovery screen: "Why did my score drop?" → AI explains based on HRV, sleep, and prior strain.
- Post-workout: AI interprets the session in context of the week's strain.
- Morning: "Daily Outlook" — a proactive 2-3 line recommendation for today's intensity.
- Evening: "Day in Review" — evening recap with sleep recommendations.

**For Raze and Rise v2:** Offer both modalities.

1. **Proactive insights (lower cost):** After workout completion, Claude generates a 2-3 sentence post-workout insight. Inline on the completion screen. Contextual to the session just logged. This is not a premium feature — it's an introduction to the AI capability.

2. **Chat interface (premium):** Full open-ended chat with full context (session history, current phase, macro targets, injury flags, deload status injected into system prompt). Freeletics' Coach+ uses this exact model and saw strong adoption.

**Copy for upgrade prompt:** "Unlock Coach" not "Subscribe to Premium." Frame the AI as a person, not a feature tier.

### 6. Meal Planning UX

**Structure that works (based on AI meal planning best practices):**

- **Weekly view (default):** 7-column calendar grid. Each day shows meal names in the meal slots (Breakfast, Lunch, Dinner, Snack). Tap a day to expand.
- **Day view:** Full recipe cards for each meal. Shows prep time, macro breakdown per meal, and total daily macros.
- **Recipe detail:** Ingredient list (with amounts), step-by-step instructions, optional photo. Ingredients are tappable and flow into the grocery list.
- **Grocery list:** Consolidated list of all ingredients for the week, organized by aisle/category. Each ingredient shows which day(s) it's needed.
- **Instacart button:** At the bottom of the grocery list — "Order on Instacart." Opens the Instacart-generated page URL (via MCP). The MCP creates a shareable shopping list page, not a direct cart — set this expectation in UI ("opens Instacart to your list").

**What makes it feel useful vs overwhelming:**

- Pre-fill macro targets from the calculator (already in v1). Show plan macros vs target at the top of each day.
- Allow per-meal swaps without rebuilding the whole plan.
- Cache the current week's plan for offline reading (the user needs it in the kitchen, not just with internet).
- Do not show more than 4 meals/day by default.

### 7. Onboarding

**Target: time to first completed set < 90 seconds.**

- Step 1 (profile): Name, weight, height, sex, age. Required to unlock macro calc and bodyweight exercise defaults. No skipping without a clear cost explanation.
- Step 2 (split): Visual weekly schedule picker — show what each split type looks like as a 7-day calendar. One tap to select.
- Step 3 (first template): Show a pre-built template for the selected split. Allow immediate customization but make it optional. "Start with this" is the CTA, not "Build your own."
- Step 4 (practice set): Walk through logging one set with guidance overlays. This is the aha moment. The user should log a set before the onboarding ends.
- After step 4: Done. No notification permission, no review request, no paywall. Those come after day 2 or after first real session completion.

**Onboarding anti-pattern to avoid:** Do not ask for notification permission during onboarding. Prompt after the first real session is complete — conversion rate for notification permissions is significantly higher post-aha-moment.

### 8. Premium Gating

**The correct gate architecture for this product:**

- **Free:** Full workout logging, templates, splits, progress charts, workout history, basic analytics, wearable sync, habits tracking.
- **Premium ($9.99/month):** AI coach chat, AI workout generation, AI meal planning + Instacart, advanced analytics (per-muscle volume breakdown, training load trends).

**Placement of upgrade prompts:**

- At the entry point to a premium feature, not randomly mid-session.
- A locked icon on the Coach tab. Tapping shows a single-screen upgrade pitch with the outcome language: "Get a coach who knows your lifts."
- Mid-workout: never. Showing a paywall mid-set loses the user permanently.
- Post-workout summary: acceptable for one contextual nudge (e.g., "Want AI analysis of this session?").

**Trial strategy (best practice from 2025 data):** Offer "Start 7-day free trial" as primary CTA + "See what's included" as secondary. Do not force the trial — let users opt in. Apps with longer trial periods show 45.7% higher conversion rates.

**Copy that converts:** "Unlock your coach" > "Subscribe to Premium." "Start my transformation" > "Start trial." Outcome language beats transactional language consistently.

### 9. Wearable Sync UX

**Connected devices screen (Settings → Connections):**

Show each integration as a row with:
- Device/service logo + name
- Connection status: a green dot (Connected), grey dot (Disconnected), or amber ⚠ (Sync error)
- Last synced timestamp
- Connect / Disconnect button

**Common error states to design for:**

- Whoop → Strava duplicate activity problem: warn users if both Whoop and Garmin are connected to avoid duplicate session uploads. Explain the conflict and let them choose which source wins.
- Apple HealthKit "not authorized" state: direct user to iOS Settings > Privacy > Health. Do not show an error without a clear fix path.
- Garmin/Whoop data not synced within 24 hours: surface an amber warning on the relevant stat tile on the Dashboard. Do not silently fail.

**Architecture note:** Apple HealthKit requires a native iOS app — no web fallback. This is a hard constraint for the Expo build. HealthKit reads/writes must go through the native module (expo-health). Web version gets no HealthKit data.

### 10. Progress Visualization

**What serious lifters actually look at (evidence-based):**

1. **Per-exercise estimated 1RM trend** — the single most motivating chart. Shows strength progress in a number they understand.
2. **Total weekly volume per muscle group** — bar chart, week by week. Answers "am I overtraining chest relative to back?"
3. **Bodyweight over time** — line chart with a 7-day rolling average line on top of daily weigh-in dots.
4. **Body fat % over time** — paired with bodyweight for composition progress.
5. **Workout frequency heatmap** — GitHub-style calendar heatmap showing training days. Streak visibility.

**What they do not look at:** Heart rate zones, pace per mile (unless AF PT Prep split is active), caloric expenditure estimates from wrist HR (too inaccurate to be trusted).

**Chart design (WHOOP-informed):** Single metric per chart. Large number as the headline, small trend arrow (↑3% this month). Tap to expand to full chart. Date range filter: 30 days / 90 days / 1 year / All Time. Color consistency: green = improving, red = declining, grey = no change.

### 11. Gamification

**The correct scope for a serious athlete product:**

- **Do:** Milestone badges for real achievements: first workout, 10 workouts, 50 workouts, 100 workouts, PR badge per exercise, 7-day streak, 30-day streak, 1000 lbs total volume, 10,000 lbs total volume, first deload completed.
- **Do:** Time-limited challenges (30 workouts in 30 days). One active challenge at a time. Binary: completed or not.
- **Do:** Streak indicator on the Dashboard. Current streak count + longest streak. Subtle — not a flame emoji, a clean counter.
- **Do not:** XP points. No level system. No avatars. No social comparison badges. No confetti on every set.

**The moderation principle (verified by 2025 Frontiers in Psychology study):** Moderate gamification (a few meaningful elements) outperforms both sparse (nothing) and overloaded (everything) systems for physical activity adherence. The ceiling is low. Two or three elements done well beats ten elements done superficially.

**Tone:** Acknowledge achievements with a single line of copy + a clean badge icon. "You've logged 100 workouts. That's serious." Not "AMAZING JOB CHAMPION 🎉🎉🎉."

### 12. Home Screen Widgets

**What to show (based on Strava/Garmin/Fitbod patterns):**

- **Small widget (2×2):** Today's split label (e.g. "Push") + exercise count + "Start" deep link button. If workout is already completed today: show a green checkmark + session duration.
- **Medium widget (2×4):** Today's split label + next 2–3 exercises + "Start" button. If rest day: show recovery score (if wearable connected) or "Rest Day."
- **Lock screen widget (iOS 16+):** Workout streak count, or today's session status (completed/pending).

**What not to show:** Calorie counts, heart rate numbers, or anything requiring real-time data that could be stale. Widgets are read-only snapshots — stale HR data on a home screen widget is worse than no HR data.

---

## Key Insights

**1. Logging speed is the primary retention driver.** Every tap added to the set-logging flow is friction that costs habit formation. Strong's dominance comes almost entirely from its ability to get from "gym bag hits the floor" to "set logged" in 3 taps. Every feature decision during session must ask: does this add a tap?

**2. The rest timer is the heartbeat of the active session.** It is not optional. The specific implementation details (auto-fire, background notification, in-session strip not full-screen, per-exercise override) are all load-bearing. Getting this wrong makes the app feel broken regardless of how good everything else is.

**3. Previous performance display is the progressive overload feature.** Users do not need a wizard or a recommendation. They need to see what they did last time on each set row. The overload suggestion after the session is a nice-to-have layer on top, not a replacement.

**4. WHOOP's design philosophy is the target aesthetic, not just the color palette.** Progressive disclosure (summary → trend → raw), color-semantic data encoding (green/amber/red), and separating "what does this number mean" from "what should I do about it" are the structural principles. Apply these to recovery, workout intensity, and nutrition data.

**5. The Instacart MCP integration creates a shareable list page — not a cart.** Set this expectation in the UI: "Opens your grocery list on Instacart." Full checkout completion happens in the Instacart app. This is not a blocker — it's still genuinely useful — but the copy and UX must match what the API actually delivers.

**6. MyFitnessPal direct API access is effectively closed.** The official API is not accepting new developer applications. Terra API provides a viable middleware path (user authenticates through Terra widget, nutrition data flows via webhook). Plan for Terra API integration rather than direct MFP access. This is a known constraint per PROJECT.md.

**7. AI gating strategy is the most important product decision for monetization.** Gate AI features (coach, generation, meal plans) but leave wearables, analytics, charts, and full logging on the free tier. The free tier must build the habit. The paid tier monetizes the habit once formed. Showing a paywall during an active workout session is a permanent user loss event.

**8. The meal plan must be editable and cacheable to be useful.** A generated plan that users cannot swap individual meals from, or that disappears offline, will be generated once and never opened again. Per-meal swaps and local caching are not nice-to-haves — they are the difference between a feature used daily and a feature used once.

**9. Gamification ceiling is low for this audience.** Serious lifters are internally motivated by PRs, progressive overload numbers, and streak data. A badge for 100 workouts is meaningful. A daily XP reward for logging water is not. Over-gamifying alienates the primary user type.

**10. Superset UX must be sequential (alternate), not parallel (log both simultaneously).** Parallel tracking on mobile requires context-switching between cards while physically moving between stations — cognitively expensive. Sequential auto-scroll (Hevy pattern) matches how supersets are actually performed.

---

## Feature Priority Map for Roadmap Sequencing

**Must ship in Phase 1 (core session loop):**
Rest timer (auto + background notification), previous performance column, set types (warmup/working/AMRAP), PR banner, superset support, offline mode

**Must ship in Phase 2 (retention layer):**
Progress charts (1RM, volume, bodyweight), workout history edit, onboarding flow, home screen widgets, gamification (badges + streak)

**Must ship in Phase 3 (platform expansion):**
Apple Watch companion, wearable sync (Apple Health first, then Garmin/Whoop), recovery score on dashboard, post-workout AI insights (proactive, not gated)

**Must ship in Phase 4 (premium features):**
AI coach chat, AI workout generation, AI meal planning, Instacart integration, premium paywall + trial flow

**Defer or cut:**
MFP direct integration (use Terra API), annual pricing, Suunto/Fitbit (low usage among serious lifters), water tracking, plate calculator

---

## Sources

- [Hevy vs Strong App (2026) — Setgraph](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026)
- [Hevy Superset UX](https://www.hevyapp.com/features/what-are-supersets/)
- [Hevy Previous Workout Values](https://www.hevyapp.com/features/track-exercises/)
- [Hevy Live PR Notification](https://www.hevyapp.com/features/live-pr/)
- [Strong App Review 2025 — RepReturn](https://repreturn.com/strong-app-review/)
- [Strong vs Hevy — RepReturn](https://repreturn.com/strong-app-vs-hevy/)
- [Fitbod Progressive Overload](https://fitbod.me/blog/what-is-progressive-overload-and-how-fitbod-builds-it-into-every-workout-automatically/)
- [Freeletics Coach+ AI Coaching](https://www.freeletics.com/en/blog/posts/freeletics-coach-plus/)
- [WHOOP AI Guidance (2025)](https://www.whoop.com/us/en/thelocker/new-ai-guidance-from-whoop/)
- [WHOOP Design Breakdown](https://www.925studios.co/blog/whoop-design-breakdown)
- [Effective Paywall Examples — DEV.to](https://dev.to/paywallpro/effective-paywall-examples-in-health-fitness-apps-2025-3op9)
- [Fitness App Onboarding Best Practices](https://dev.to/paywallpro/fitness-app-onboarding-guide-data-motivation-completion-an0)
- [Instacart MCP Documentation](https://docs.instacart.com/developer_platform_api/guide/tutorials/mcp/)
- [MyFitnessPal API Status / Terra API](https://tryterra.co/integrations/myfitnesspal)
- [Gamification in Fitness Apps — Trophy](https://www.trophy.so/blog/fitness-gamification-examples)
- [Strava iOS Widget](https://support.strava.com/hc/en-us/articles/216917517-iOS-Widget)
- [AI Meal Planning UX](https://medium.com/@beautifullyfunctionalapps/building-a-beautifully-functional-ai-meal-planning-app-9a8adab510fc)
- [Fitness App UX Mistakes](https://dataconomy.com/2025/11/11/best-ux-ui-practices-for-fitness-apps-retaining-and-retaining-users/)
