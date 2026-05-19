# Stack Research — Raze and Rise v2

**Researched:** 2026-05-18
**Mode:** Ecosystem / prescriptive
**Overall confidence:** HIGH for core stack, MEDIUM for wearables and monetization

---

## Recommended Stack

### 1. Expo SDK — Version + Workflow

- **Library:** `expo` SDK 55 (React Native 0.83, React 19.2)
- **Why:** SDK 55 is the current stable release as of February 2026. New Architecture is now mandatory (Legacy Architecture was dropped in SDK 55). Hermes bytecode diffing reduces OTA update download sizes by ~75%. SDK 56 beta is available but targets Q2 2026 stable — start on 55, upgrade to 56 once stable.
- **Workflow:** Managed Workflow with EAS Build. Do not eject to bare. The managed workflow supports everything this app needs including native modules (HealthKit, WatchConnectivity) via Expo Config Plugins and EAS Build.
- **OTA updates:** Use `expo-updates` + EAS Update. Channel strategy: `development` / `preview` / `production`. EAS Workflows YAML automates publishing to the production channel on every push to main. Hermes bytecode diffing is on by default in SDK 55 — no extra config needed.
- **Web support caveat:** Expo Router supports web via Metro, but any native module (HealthKit, WatchConnectivity) silently no-ops on web. Gate those calls behind `Platform.OS === 'ios'`. The web build is a PWA, not a hybrid — it runs in the browser.
- **Don't use:** Bare workflow (adds native complexity with no benefit for this app). Expo Go for development beyond initial tinkering (push notifications don't work in Expo Go on Android as of SDK 53; use development builds via EAS).

---

### 2. TypeScript

- **Library:** TypeScript 5.x (included via `expo/tsconfig.base`)
- **Why:** Required throughout. Expo CLI auto-detects TypeScript and sets up compilation. Path aliases work natively via Metro without `babel-plugin-module-resolver` as of SDK 50+, but you still need both `tsconfig.json` `paths` and the Babel module resolver for runtime correctness.
- **Recommended tsconfig:**
  ```json
  {
    "extends": "expo/tsconfig.base",
    "compilerOptions": {
      "strict": true,
      "paths": {
        "@/*": ["./src/*"],
        "@/assets/*": ["./assets/*"]
      }
    },
    "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
  }
  ```
- **Strict mode:** Enable it from day one. `strict: true` activates 8 checks (strictNullChecks, noImplicitAny, etc.). The cost is a slower first few hours of setup; the benefit is catching null-access bugs before runtime in a fitness app where history data can be undefined.
- **Path aliases runtime trap:** TypeScript `paths` is compile-time only. You must also install `babel-plugin-module-resolver` and configure `babel.config.js` with matching aliases. Without it, the app compiles but crashes at runtime.
- **Don't use:** `allowJs: true` mixed codebases — start TypeScript-only from file one.

---

### 3. Supabase + React Native

- **Library:** `@supabase/supabase-js` v2 (current, no v3 yet)
- **Session storage:** Do NOT use `AsyncStorage` alone — Supabase sessions exceed the `expo-secure-store` 2048-byte limit and AsyncStorage is unencrypted. Use the **MMKV + SecureStore hybrid**:
  - `react-native-mmkv` — encrypted, synchronous key-value store (~30x faster than AsyncStorage)
  - `expo-secure-store` — stores the MMKV encryption key (small, fits under 2048 bytes)
  - `expo-crypto` — generates the UUID encryption key
  - Pattern: generate UUID with Expo Crypto → store in SecureStore → use as MMKV encryption key → store Supabase session in encrypted MMKV
- **Auto-refresh on mobile:** Listen to `AppState` changes. Call `supabase.auth.startAutoRefresh()` when app becomes active, `supabase.auth.stopAutoRefresh()` on background. Without this, sessions silently expire when the app returns from background.
- **Offline + session:** The main known bug (GitHub Discussion #36906): if the app launches offline and `startAutoRefresh()` fires, it can clear a valid session. Fix: wrap the Supabase client init with a `isConnected` check before calling `startAutoRefresh()`, or catch the network error and suppress it without clearing session state.
- **Realtime subscriptions:** Work on mobile but drain battery. Use sparingly — only subscribe to channels the user is actively viewing. Unsubscribe in `useEffect` cleanup.
- **Don't use:** `@supabase/ssr` — it's designed for server-side rendering and is not applicable to React Native.

---

### 4. Offline-First Sync

- **Recommended:** **PowerSync** (primary recommendation for this app)
- **Why PowerSync over WatermelonDB:**
  - PowerSync reads Postgres WAL directly — no manual sync logic to write
  - Official Supabase integration guide; native Supabase auth handshake built in
  - React Native SDK (`@powersync/react-native` + `@journeyapps/react-native-quick-sqlite`)
  - Write locally → upload queue processes when online → conflict resolution built in
  - The correct mental model for this app: workouts are written locally (fast, offline), queued, and synced. No data loss even in airplane mode mid-workout.
- **PowerSync pricing:** Free tier includes 2 GB synced/month and 500 MB hosted. Free projects deactivate after 1 week of inactivity (use the paid $49/month plan for production — negligible cost vs. the engineering time to build manual sync).
- **Sync Rules:** YAML file in the PowerSync Dashboard that defines which tables and rows sync to which users. For this single-user app, all rows belonging to `auth.uid()` sync to the device — straightforward.
- **Alternative — TanStack Query + MMKV:** Simpler to implement, no new service. TanStack Query handles server state with `staleTime` and background refetching; persist the cache to MMKV for offline reads. Appropriate if you accept "stale data when offline" semantics (reads work, writes queue). Use this if PowerSync feels like over-engineering for a single-user app.
- **Don't use:** WatermelonDB — requires building your own sync backend (non-trivial), has a history of maintenance gaps, and adds significant complexity. Replicache is expensive and web-first. ElectricSQL is still maturing for React Native.
- **Decision guidance:** If the requirement is true offline write + background sync (e.g., log a workout mid-flight and have it sync later), use PowerSync. If "offline read + retry on reconnect" is sufficient, TanStack Query + MMKV is faster to ship.

---

### 5. State Management

- **Server state:** `@tanstack/react-query` v5 — non-negotiable. Handles all Supabase data fetching, caching, background refetch, and error states. The `useQuery` / `useMutation` model fits workout CRUD perfectly.
- **Client/UI state:** `zustand` v5 — lightweight, no boilerplate, excellent React Native support. Use for: active workout session state, UI state (modals, active tab), user preferences not yet persisted.
- **Persistence:** `zustand` persist middleware with `react-native-mmkv` as the storage adapter (synchronous, fast, encrypted). The `zustand-mmkv-storage` adapter package is a clean wrapper.
- **Don't use:** Redux Toolkit — too much boilerplate for a solo-developer project. Jotai — atomic model is harder to reason about for complex nested state (active session with many exercises). Context API alone — performance issues when session state changes frequently during a workout (re-renders every consumer).
- **Architecture:** Keep a clean separation. TanStack Query owns all remote data (history, templates, profile). Zustand owns local transient state (active session, rest timer, UI). This maps cleanly to PowerSync's write-local model too — writes go to PowerSync's local SQLite, queries come from TanStack Query (or PowerSync's reactive queries).

---

### 6. Navigation

- **Library:** **Expo Router** (included with SDK 55, currently v4-range)
- **Why:** Default for all new Expo projects since SDK 50. File-based routing eliminates navigation boilerplate. Deep linking and universal links work automatically. The app structure maps directly to `src/app/(tabs)/`:
  ```
  src/app/
    (tabs)/
      _layout.tsx        ← bottom tab bar
      index.tsx          ← Dashboard
      workouts.tsx       ← Workouts
      split.tsx          ← Split (fixed v1 bug: gets its own tab)
      progress.tsx       ← Progress
      settings.tsx       ← Settings
    workout/[id].tsx     ← active session (modal/stack)
    auth.tsx             ← auth page
    _layout.tsx          ← root layout (auth guard)
  ```
- **Native Tabs (SDK 55+):** `expo-router/unstable-native-tabs` renders platform-native system tabs on iOS and Android. Use for the bottom tab bar — it gives the "premium native feel" that custom JS tabs cannot.
- **Don't use:** React Navigation standalone — it's what Expo Router builds on top of. Adding it directly loses file-based routing, auto-deep-linking, and web support. Fine for apps migrating from it, but start with Expo Router for new projects.

---

### 7. Styling — Dark UI / Premium Feel

- **Recommended:** **NativeWind v4** (stable) with **react-native-reusables** component primitives
- **Why NativeWind v4 over v5:** NativeWind v5 (Tailwind v4 based) is pre-release as of May 2026. The API and Metro plugin are still changing. Use v4 for a production app. v5 upgrade path is documented and straightforward when it stabilizes.
- **Why NativeWind over Tamagui:** Tamagui's compiler produces smaller output but adds significant setup complexity and occasional SDK version incompatibilities. For a dark-themed data-dense UI, NativeWind's utility-first approach with `dark:` variant is faster to iterate and easier to maintain.
- **Why NativeWind over Gluestack:** Gluestack v2 now uses NativeWind under the hood. Going directly to NativeWind gives you the same utility classes without the component library constraints — you own the components.
- **Dark theme:** NativeWind v4 supports `dark:` variant. Wire it to the device's `useColorScheme()` hook. Define your design tokens (brand colors, spacing scale) as CSS custom properties.
- **Component approach:** Write custom components, not a UI library. This app needs a "Whoop/Strong aesthetic" — dense, opinionated, dark. Pre-built component libraries will fight your design. Use `react-native-reusables` for accessible primitives (Checkbox, Slider, Dialog) and style them with NativeWind.
- **Charts:** `victory-native-xl` (current version ~41.x, actively maintained by Nearform). Uses Skia for GPU-accelerated rendering — critical for the progress charts with real data. Depends on `@shopify/react-native-skia` and `react-native-reanimated`.
- **Animations:** `react-native-reanimated` v3 (already a peer dep of Skia and NativeWind). Use for rest timer countdown, workout complete overlay, exercise card transitions.
- **Don't use:** StyleSheet-only — loses the design velocity of utility classes. Tamagui — compiler adds build complexity and occasional SDK-version conflicts. React Native Paper / NativeBase — Material Design aesthetic, fights the dark athletic brand.

---

### 8. Claude API — AI Coaching

- **Critical finding:** The official `@anthropic-ai/sdk` does NOT support React Native directly. The SDK requires Node.js globals that do not exist in the Hermes runtime.
- **Correct architecture:** All Claude API calls MUST go through a **Supabase Edge Function** (Deno runtime). The Edge Function receives the request, applies auth validation (verify Supabase JWT), checks premium status, enforces rate limits, then calls the Anthropic API using the server-side API key.
- **Client side:** Call your Edge Function URL with `fetch()` and the user's Supabase auth token in the `Authorization` header. Stream responses using SSE (Supabase Edge Functions support streaming).
- **Rate limiting:** Implement in the Edge Function. Store request counts in a Supabase table (`ai_usage` with `user_id`, `date`, `request_count`). Reject if over the daily limit before calling Claude.
- **Premium gate:** The Edge Function checks `profiles.is_premium` before proceeding. No client-side trust.
- **Model:** Use `claude-sonnet-4-5` or latest Claude 3.5 Sonnet equivalent for AI coaching (good balance of cost and quality). Use `claude-haiku` for lightweight tasks like workout name suggestions.
- **Don't use:** `anthropic-react-native` (community package by backmesh) — unverified, unmaintained, exposes API key in the bundle. Never put the Anthropic API key in the client bundle.

---

### 9. Stripe / Subscription Billing

- **Critical architectural decision — read carefully:**
- **For App Store distribution:** Apple requires IAP for digital subscriptions sold in-app on iOS. Post the April 2025 Epic v. Apple ruling, you can link to external checkout in the US, but only via a browser redirect (not in-app payment sheet). Conversion drops 20-30% with external flows.
- **Recommendation: RevenueCat + Stripe (hybrid)** — not Stripe alone.
  - `react-native-purchases` (RevenueCat SDK) — handles StoreKit (iOS) and Google Play Billing (Android). Receipt validation, entitlement management, and subscription state across platforms are handled for you. This is 3-4 weeks of work if built from scratch and a constant source of edge-case bugs.
  - Stripe — use for web billing (RevenueCat's Web Billing connects Stripe to entitlements). RevenueCat syncs web purchases to iOS/Android entitlements automatically.
  - Stripe Edge Functions — still needed for webhook handling when/if you process any web payments.
- **If targeting web/PWA subscriptions only** (deferring App Store): Stripe + Supabase Edge Function webhook is the right pattern. Official Supabase example exists at `supabase/examples/edge-functions/supabase/functions/stripe-webhooks`.
- **Don't use:** Stripe alone for iOS in-app subscriptions — Apple will reject the app or disable the purchase flow. `@stripe/stripe-react-native` is correct for physical goods or web-redirect flows, not for consumable in-app digital subscriptions on iOS.

---

### 10. Push Notifications

- **Library:** `expo-notifications` (SDK 55, built-in)
- **Setup:** EAS handles APNs credentials (iOS) and FCM V1 credentials (Android) via `eas credentials` command. Requires a paid Apple Developer account for APNs.
- **Expo Push Service vs. direct:** Use Expo's Push Service for simplicity (wraps both APNs and FCM). Direct FCM/APNs only if you need delivery receipts or vendor-specific features this app doesn't require.
- **Smart timing implementation:**
  1. During onboarding, collect preferred workout time as a seed (store as UTC hour in `profiles`)
  2. After each completed workout, update a `workout_times` table with the completion timestamp
  3. A Supabase scheduled function (pg_cron) or a nightly Edge Function computes the rolling average workout hour per user and updates `profiles.preferred_workout_hour`
  4. A server-side job (Supabase Edge Function via cron) calls Expo's push API at the user's computed optimal time each day
  5. Never schedule from the client — always server-side
- **Local scheduling (rest timer, meal reminders):** `Notifications.scheduleNotificationAsync()` with a trigger. These fire locally without a server.
- **Permissions:** Request on first relevant action, not on app launch. iOS will reject permission prompts shown before context.
- **Don't use:** Firebase Cloud Messaging directly — adds the entire Firebase SDK for something Expo already abstracts.

---

### 11. Apple Watch Companion

- **Verdict:** Possible, but requires native code. Cannot be built in pure React Native / TypeScript.
- **Architecture:**
  1. The iOS app is your React Native / Expo app (main iPhone app)
  2. The Watch app is a separate **SwiftUI / WatchKit** app written in Swift
  3. Communication bridge: **WatchConnectivity** framework
  4. Bridge to React Native: `expo-watch-connectivity` (community Expo module wrapping WatchConnectivity) or `react-native-watch-connectivity` (bare workflow compatible, requires EAS Build)
- **Implementation:**
  - In EAS Build, the Expo project includes the Watch app as a separate target in the Xcode project
  - The SwiftUI Watch app is its own native target — minimal UI: exercise name, sets remaining, go/no-go buttons, rest timer
  - `WCSession` sends messages between the iPhone RN app and the Watch app bidirectionally
  - The React Native side sends the current exercise and set state; the Watch sends back the completed set result
- **Complexity rating:** High. This is 1-2 weeks of native Swift development plus Expo Config Plugin authoring. Plan this as its own milestone. Do not attempt to launch without a native iOS developer familiar with WatchKit.
- **TurboModules:** New Architecture (mandatory in SDK 55) makes the WatchConnectivity TurboModule approach cleaner and more type-safe than the old bridge.
- **Don't use:** Any claim that you can run React Native on watchOS natively — you cannot. The Watch app must be SwiftUI/WatchKit. React Native only runs on the iPhone.

---

### 12. Wearables — HealthKit, Garmin, Whoop, Fitbit

**HealthKit (highest priority):**
- **Library:** `react-native-health` (agencyenterprise) — iOS only, HealthKit wrapper. Well-maintained, actively developed with a Swift rewrite underway.
- Use for: HRV, steps, sleep, resting HR, post-workout heart rate, writing workout sessions to Health
- Requires `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` in `app.json` entitlements
- Gate all calls behind `Platform.OS === 'ios'`

**Garmin:**
- Garmin does not have a React Native SDK. Options:
  1. **Garmin Health API** — webhook-based. Garmin pushes data to your server when users authorize. Your Supabase Edge Function receives the webhook and stores in the DB. The user authenticates via Garmin Connect OAuth in a WebView. Established pattern; no native SDK needed.
  2. **Garmin Connect IQ SDK** — for building watch face / data field apps on Garmin devices. This is a separate product (Monkey C language). Not relevant for the iOS/Android app.

**Whoop:**
- Whoop API is in beta with frequent changes. Access requires applying for developer credentials.
- Integration pattern: OAuth 2.0 → access token → poll `/v1/recovery` and `/v1/cycle` endpoints for recovery score and strain.
- Treat as a bonus integration; Whoop's beta API is not production-stable. Check developer.whoop.com for current access status.

**Fitbit:**
- Fitbit Web API is a REST API with OAuth 2.0. Accessible without native SDK. Pull sleep and activity data via your Edge Function (proxy for token security).
- Google acquired Fitbit; the API is stable but investment in it is uncertain long-term.

**Unified wearables alternative — Terra API:**
- `tryterra.co` — single integration for 500+ wearables including Garmin, Whoop, Fitbit, Apple Health, Oura, Strava
- Has a React Native SDK and authentication widget
- **Recommended if** you want Garmin + Whoop + Fitbit without building separate OAuth flows. Cost: per-user pricing (check current rates at tryterra.co).
- **Alternative:** Open Wearables (open-source, self-hosted, MIT licensed) — supports Apple Health, Garmin, Polar, Suunto, Whoop. Free but requires self-hosting infrastructure.
- **Recommended approach for v2:** Build HealthKit natively (it's free, iOS-native, critical). Use Terra API for Garmin/Whoop/Fitbit in one integration. Defer Suunto.

---

### 13. ExerciseDB API

- **Current status:** ExerciseDB on RapidAPI is operational but the free tier is capped at **10 requests/day** — completely unusable for production. Paid tiers exist but the API is hosted on RapidAPI with potential instability.
- **Recommendation:** Do NOT rely on ExerciseDB as the primary data source. Adopt a **cache-first strategy:**
  1. At build time or first launch, fetch and cache the full exercise library to Supabase Storage or a local SQLite table (PowerSync can sync it)
  2. Use ExerciseDB only for initial seeding — never for real-time requests during a workout session
  3. Store exercise GIFs/videos in Supabase Storage (or a CDN) after fetching once
- **Alternatives if ExerciseDB access becomes unavailable:**
  - **WorkoutX API** — 1,300+ exercises, free tier at 500 req/month, REST endpoints, GIF animations. Purpose-built as an ExerciseDB alternative.
  - **YMove API** — 698+ HD video exercises. Better video quality than ExerciseDB.
  - **Self-hosted open-source** — the ExerciseDB GitHub repo (`bootstrapping-lab/exercisedb-api`) is self-hostable with 1,500+ exercises. Run on a Supabase Edge Function or a separate Vercel serverless function. Zero ongoing API cost.
- **Don't use:** ExerciseDB as a real-time data source. Any design that fetches exercise data during an active workout session.

---

### 14. Instacart Integration

- **Confirmed approach:** Instacart has an official MCP server (`https://mcp.dev.instacart.tools/mcp`) and a Developer Platform API.
- **How it works with this app:** The AI meal plan generation (Claude via Edge Function) generates a structured ingredient list. That list is passed as tool arguments to the Instacart MCP server, which creates a shoppable Instacart shopping list. The user is redirected to Instacart to complete the purchase.
- **No direct in-app checkout:** Instacart MCP creates a shopping list URL — the user is taken to Instacart's app/web to complete the order. There is no in-app purchase flow.
- **Authentication:** API key in the `Authorization: Bearer` header. Key is server-side only (Edge Function). Never expose in the client bundle.
- **MCP invocation from mobile:** The React Native app calls a Supabase Edge Function that has the Instacart API key. The Edge Function calls the Instacart API to create the shopping list and returns the list URL to the client. The client opens the URL with `Linking.openURL()`.
- **Don't use:** Direct client-side MCP calls — the API key would be exposed in the bundle.

---

### 15. Testing

**Unit / Component:**
- **Library:** `vitest` (v2) + `@testing-library/react-native` v13+
- **Why Vitest over Jest:** Faster, ESM-native, compatible with the Vite-adjacent tooling landscape. `@testing-library/react-native` works with Vitest via the `@vitest/browser` or standard jsdom mode.
- **Coverage:** Pure logic files (macro calculator, weight suggestion, split rotation, progress calculations) — these must have 100% unit test coverage. Component tests for ExerciseCard, rest timer, set logging interactions.

**E2E Mobile:**
- **Library:** **Maestro** — YAML-based, no native build changes required, works with Expo development builds
- **Why Maestro over Detox:** Maestro has automatic retries, smart waiting, and YAML-based tests that QA-minded contributors can write without knowing the codebase. Detox requires build configuration changes and has a steeper setup curve. Maestro won practical comparisons in fintech apps in 2025.
- **Critical paths to cover:** Auth flow, complete a workout session (all sets go), rest timer fires, session saved to history, navigation between all 5 tabs.

**E2E Web:**
- **Library:** `playwright` — for the web/PWA target. Run against the Vercel preview URL in CI.

**Component documentation:**
- **Storybook** — already in the PROJECT.md plan. Use `@storybook/react-native` for native, `@storybook/react` for web stories.

**Don't use:** Detox for this project — the Maestro DX is significantly better for a small team. Appium — too much setup for the test coverage goals.

---

## Installation Reference

```bash
# Core Expo
npx create-expo-app@latest raze-and-rise-v2 --template blank-typescript
cd raze-and-rise-v2
npx expo install expo-router expo-updates

# Supabase
npx expo install @supabase/supabase-js react-native-mmkv expo-secure-store expo-crypto

# Offline / State
npx expo install @powersync/react-native @journeyapps/react-native-quick-sqlite
npm install @tanstack/react-query zustand

# Navigation / Styling
npx expo install nativewind
npm install --save-dev tailwindcss@3  # NativeWind v4 uses Tailwind v3

# Charts / Animations
npx expo install @shopify/react-native-skia react-native-reanimated react-native-gesture-handler
npm install victory-native  # XL version

# Wearables
npx expo install react-native-health  # iOS HealthKit

# Notifications
npx expo install expo-notifications expo-background-task

# Payments
npm install react-native-purchases  # RevenueCat

# Testing
npm install --save-dev vitest @testing-library/react-native
# Maestro: install CLI separately (brew install maestro)
npm install --save-dev @playwright/test

# TypeScript / Dev
npm install --save-dev babel-plugin-module-resolver
```

---

## Key Findings

1. **SDK 55 drops Legacy Architecture — New Architecture is mandatory.** Every library you choose must support the New Architecture. As of 2026, the major ecosystem libraries (Supabase, React Query, Zustand, Reanimated, Skia) all do. However, older community libraries for HealthKit and Watch connectivity need explicit verification before use. React Native Health is undergoing a Swift rewrite — check its New Architecture compatibility before integrating.

2. **Stripe alone will get your iOS app rejected.** Digital subscriptions consumed inside the app require StoreKit on iOS. Post-April 2025 ruling allows external payment links in the US, but with 20-30% conversion penalty. Use RevenueCat (`react-native-purchases`) to wrap StoreKit/Google Play Billing, and use Stripe for web billing only. RevenueCat syncs all entitlements across platforms.

3. **The Claude API cannot run client-side in React Native.** The `@anthropic-ai/sdk` requires Node.js globals absent from Hermes. All AI calls must route through Supabase Edge Functions. This is also the correct security architecture — the API key must never be in the client bundle. Design every AI feature as an async Edge Function call with streaming SSE support.

4. **SecureStore alone cannot hold a Supabase session.** The 2048-byte limit means sessions are silently truncated. The production pattern is: MMKV (encrypted with a key from SecureStore) stores the session; SecureStore stores only the small encryption key. Additionally, the app must handle the offline-launch bug where `startAutoRefresh()` clears a valid session — suppress network errors, don't sign the user out.

5. **Apple Watch requires native Swift — plan it as a dedicated milestone.** You cannot run React Native on watchOS. The Watch app is SwiftUI/WatchKit, communicating over WatchConnectivity. Budget 1-2 weeks of native iOS development time and treat it as a separate milestone after the core iOS/Android app is stable.

---

## Confidence Levels

| Area | Confidence | Reason |
|------|------------|--------|
| Expo SDK 55 current stable | HIGH | Official changelog confirmed, SDK 56 beta announced |
| New Architecture mandatory SDK 55+ | HIGH | Official release notes — no opt-out available |
| Expo Router as default navigation | HIGH | Official Expo recommendation since SDK 50, Context7 confirmed |
| TypeScript strict + path aliases | HIGH | Expo docs + Context7 confirmed setup |
| Supabase session via MMKV + SecureStore | HIGH | Documented in Supabase blog, GitHub issues confirmed the 2048-byte limit |
| PowerSync for offline sync | HIGH | Official Supabase integration guide, free tier exists |
| TanStack Query v5 for server state | HIGH | Established pattern, documented for React Native |
| Zustand v5 for local state | HIGH | Community consensus, MMKV adapter documented |
| NativeWind v4 (not v5) | HIGH | v5 explicitly pre-release; v4 stable |
| Victory Native XL for charts | HIGH | Active Nearform maintenance, latest version confirmed |
| Claude API via Edge Function only | HIGH | Official SDK states no React Native support |
| RevenueCat for subscriptions | HIGH | App Store policy confirmed via multiple legal sources |
| Maestro for E2E mobile | MEDIUM | Strong community adoption, 2025 comparisons favor it over Detox; still younger than Detox |
| ExerciseDB 10 req/day limit | HIGH | Confirmed at RapidAPI listing |
| Terra API for wearables | MEDIUM | Service exists, pricing not locked in, review rate limits before committing |
| Apple Watch companion feasibility | MEDIUM | Architecture confirmed, community demos exist; complexity is high |
| Whoop API stability | LOW | Documented as beta with frequent changes; access requires approval |
| MyFitnessPal integration | LOW | Public API deprecated 2020; Terra MFP integration is via Terra's own scraping/partnership — verify current status before building |
| Instacart MCP | MEDIUM | Official MCP server exists and documented; shopping list creation confirmed; checkout flow is external redirect, not in-app |

---

## Architecture Decisions Driven by This Research

1. **Edge Functions as the AI and payment boundary** — Claude API calls, Stripe webhooks, Instacart API calls, and wearable OAuth token exchange all happen in Supabase Edge Functions. The React Native app is a thin client that never holds API keys.

2. **PowerSync as the sync layer between Supabase and device SQLite** — workouts write to SQLite locally, sync to Postgres when online. This eliminates the entire class of "lost workout on reconnect" bugs that v1 suffers from.

3. **Normalized Supabase schema is non-negotiable** — the v1 JSON blob cannot support offline sync, conflict resolution, per-exercise analytics, or editable history. All tables must have proper foreign keys and row-level security policies before PowerSync sync rules are written.

4. **RevenueCat is the right subscription abstraction** — not because Stripe is wrong, but because handling StoreKit edge cases (restore purchases, subscription status on reinstall, family sharing, refunds) manually is a significant ongoing maintenance burden. RevenueCat commoditizes this.

5. **Apple Watch is a post-v2 milestone** — the native Swift requirement means it cannot be in the initial launch. Design the data model (workout sessions, set logging) to be Watch-compatible from day one, but defer the Watch UI to a separate milestone.

---

## Open Questions / Gaps

- **MyFitnessPal:** The public API is deprecated (2020). Terra claims an MFP integration, but its mechanism (web scraping vs. official partnership) is unclear. Resolve this before building the nutrition sync feature. Fallback: manual macro entry only, with MFP integration as a stretch goal.
- **Whoop API access:** Developer credentials require approval. Apply immediately — approval can take weeks.
- **Terra API pricing:** Review per-user costs against expected user count before committing to it as the wearables abstraction layer.
- **react-native-health New Architecture compatibility:** Verify the current version supports New Architecture (required for SDK 55+) before integrating HealthKit.
- **ExerciseDB data license:** Confirm the licensing terms before bundling exercise data into Supabase Storage. The self-hosted open-source version (bootstrapping-lab fork) is the safest legal path.
- **RevenueCat free tier limits:** RevenueCat's free plan has a tracked revenue threshold — confirm it before launch.
