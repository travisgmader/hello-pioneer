# Pitfalls Research — Raze and Rise v2

**Domain:** Full-stack fitness platform — React Native + Expo + Supabase + Claude API + Stripe + wearables
**Researched:** 2026-05-18
**Overall confidence:** HIGH for Expo/RLS/Stripe/Watch; MEDIUM for wearable API stability and Claude streaming specifics

---

## Critical Pitfalls (project-killers if ignored)

### 1. Apple IAP vs. Stripe on iOS — The Billing Architecture Must Be Decided in Phase 1

**What goes wrong:** Building Stripe-only billing into the iOS app and shipping it violates App Store guidelines, triggering rejection or removal. Apple historically required all digital subscription purchases to go through in-app purchase (IAP) at 30% (15% for small developers). Stripe on iOS native for digital goods = rejection.

**Current state (May 2026):** The April 2025 Epic v. Apple ruling lets US App Store apps link to external web checkout. You can now include a Stripe web checkout link inside the iOS app. However:
- The ruling applies **only to the US App Store**. EU/international users are under different rules.
- Apple may still charge a commission on web purchases (amount TBD by court).
- Most apps must still **offer native IAP alongside** the external link, not instead of it.
- "Reader apps" (Spotify pattern) have different rules; a fitness tracker does not qualify.

**Consequence of getting this wrong:** App rejected on first submission. Rebuilding billing mid-project is expensive.

**Prevention strategy:**
- Implement billing as a hybrid from the start: RevenueCat or native StoreKit IAP as the primary path, plus a Stripe web checkout link for users who prefer it.
- Use RevenueCat (even though the project currently says "Stripe chosen for simplicity") to abstract IAP across iOS/Android/web. RevenueCat handles entitlement syncing automatically. A pure Stripe approach requires building your own entitlement sync server.
- If you reject RevenueCat, the minimum viable approach is: native StoreKit on iOS, Stripe Checkout on Android and web, and a server-side webhook to sync subscription status to Supabase.
- Do NOT use Stripe's mobile SDK to charge for premium inside a native iOS app binary.

**Warning signs:**
- Any code that calls `Stripe.initPaymentSheet()` inside an iOS native screen for a digital subscription
- No IAP dependency (`expo-in-app-purchases` or `react-native-purchases`) in the project by the end of Phase 2

**Phase:** Must be decided and architected in Phase 1, implemented by Phase 2.

---

### 2. Apple Watch Companion App — Not Supported by Expo Managed Workflow

**What goes wrong:** Developers assume Expo can build a watchOS extension. It cannot. watchOS does not run JavaScript. The watch UI and logic must be written in Swift/SwiftUI. `expo prebuild` destroys the Xcode watchOS target every time it regenerates native files.

**The actual architecture:**
- The iOS companion app is React Native (as normal).
- The watchOS app is a separate Swift/SwiftUI Xcode target that communicates with the iOS app via WatchConnectivity framework.
- `react-native-watch-connectivity` provides a JS bridge so your RN code can send/receive messages to/from the watch app. The watch app UI itself is Swift.
- EAS Build can include the watchOS target **only** if you move the watch code outside the Expo-managed native directories (the root of the Xcode workspace, not inside `ios/`) so `expo prebuild` does not delete it.
- There is a confirmed EAS CLI issue where building an app with a watch companion target produces errors (GitHub expo/eas-cli#795).

**Consequence of getting this wrong:** You discover this after committing to the managed workflow. Switching to bare workflow or restructuring the Xcode project is a multi-day effort.

**Prevention strategy:**
- Acknowledge from Phase 1 that the Apple Watch feature requires bare workflow or a carefully pinned managed workflow with a custom Xcode workspace structure.
- Eject to bare workflow before the watch feature begins. Do not attempt it in managed.
- Write the watch target in Swift/SwiftUI. Use `react-native-watch-connectivity` for the message bridge only.
- Keep the watch Xcode target at the repo root or a sibling directory so `expo prebuild` does not overwrite it.
- Budget 1–2 additional sprints for the watch feature compared to a pure RN feature.

**Warning signs:**
- "Apple Watch companion app" is on the roadmap but no Swift file has been created
- No bare workflow eject has occurred by the phase that includes watch features

**Phase:** Architecture decision in Phase 1. Implementation in a dedicated late phase (after core app is stable).

---

### 3. Expo Go Is Not the Testing Target — Almost Nothing in This Project Works There

**What goes wrong:** Developers test in Expo Go and assume it represents the real app. It does not. The following features in this project **cannot run in Expo Go**:
- HealthKit / Apple Health (native module, requires entitlements)
- Stripe (native SDK, requires custom build)
- Push notifications (SDK 53+: Expo Go dropped push notification support)
- Apple Sign-In (native entitlement)
- Home screen widgets (`expo-widgets` alpha: not available in Expo Go)
- Apple Watch connectivity (`react-native-watch-connectivity`: native module)
- Wearable SDKs (all require native modules)
- Background tasks / foreground services

**What this means practically:** You need an EAS development build (`expo-dev-client`) from Day 1 of native feature work. This build is essentially your real app binary, sideloaded to a device, that supports hot reload.

**Prevention strategy:**
- Set up EAS Build and `expo-dev-client` in Phase 1 before writing any native-dependent code.
- Run `eas build --profile development` to generate the dev client binary once per native dependency addition.
- Never rely on Expo Go for integration testing of any feature in this project.

**Warning signs:**
- Development is happening exclusively in Expo Go after Phase 1
- Push notification or HealthKit testing is being deferred "until we have a real device build"

**Phase:** Phase 1 setup — EAS Build configuration and dev client should be the first deliverable before feature work.

---

### 4. OTA Updates Cannot Fix Native Code — Every Native Dependency Addition Requires a New Build

**What goes wrong:** A developer ships an EAS Update (OTA) after adding a new native library (e.g., adding Garmin or Whoop SDK). The update arrives on user devices. The app crashes on launch because the JS bundle references a native module that isn't in the binary.

**The rule:** OTA (EAS Update) only updates the JavaScript bundle and assets. It cannot change:
- Native module binaries
- App entitlements
- Permission strings in Info.plist / AndroidManifest.xml
- SDK versions
- Config plugin outputs

**Prevention strategy:**
- Any time you `npm install` a library with a native module, you must run a new `eas build` and submit to the store (or distribute via TestFlight/internal track) before shipping JS changes that use it.
- Use `expo-updates` runtime version policy `"runtimeVersion": { "policy": "sdkVersion" }` so OTA updates are only delivered to compatible binaries.
- Maintain a checklist: "Does this library have native code?" If yes, new build required.

**Warning signs:**
- Adding a native library and shipping an EAS Update on the same day
- No runtime version configured in `eas.json`

**Phase:** Phase 1 — runtime version policy must be configured before first production build.

---

### 5. Offline Sync Data Loss — In-Memory Optimistic Updates Are Unsafe

**What goes wrong:** The app applies workout set completions as in-memory state changes, then tries to sync to Supabase when connectivity returns. If the app is backgrounded, killed, or crashes before sync, the workout data is gone. This is the #1 user trust destruction event in fitness apps.

**Common failure modes:**
- Optimistic update stored in React state → app killed mid-workout → all set logs lost
- Sync fires while another sync is in progress → race condition → double-write or missed write
- Conflict on multi-device: same session open on phone and tablet → last-write-wins clobbers the fuller record
- Network reconnects during sync → partial push → server has some sets, device has others → inconsistent state with no detection

**Prevention strategy:**
- Every set completion, note, or state mutation must write to **local SQLite first**, as a durable outbox entry, before updating UI state.
- Never rely on React state or AsyncStorage as the source of truth for workout data. Both are volatile.
- Use WatermelonDB (SQLite-backed, built-in sync engine) as the local database. It provides a pull/push sync protocol designed for exactly this use case with Supabase as the backend.
- Each workout session has a `session_id` (UUID generated client-side at session start). This is the atomic unit — conflict resolution compares by `session_id`. On conflict, merge by taking the session with the higher set count or the later `updated_at` timestamp, not silently overwriting.
- Use an explicit sync status field per record: `synced | pending | conflict | error`. Never infer sync state from presence/absence of server ID.
- The outbox must persist to disk before the sync attempt, not after.

**Warning signs:**
- Workout completion events written to `useState` or Zustand before SQLite
- No `session_id` UUID present in the data model
- Sync triggered directly from API response rather than from a background outbox processor
- No "pending sync" indicator visible to the user

**Phase:** Phase 1 data architecture. If offline sync is added later as a retrofit, it typically causes a complete data layer rewrite.

---

## High-Risk Areas

### 6. Supabase RLS — Silent Failures That Look Like Bugs

**What goes wrong:**

**Failure mode A — Table accessible to everyone:** RLS not enabled on a new table. Since the Supabase client uses the anon key by default, any row in that table is publicly readable. This is a data exposure bug, not immediately obvious in testing because the developer is logged in.

**Failure mode B — Table inaccessible to everyone:** RLS enabled but no policies created. All queries return empty arrays. No errors are thrown. The app appears to silently fail. This is particularly dangerous for UPDATE policies — an UPDATE RLS policy without a corresponding SELECT policy will silently reject all updates.

**Failure mode C — Wrong JWT claims used in policies:** Using `raw_user_meta_data` claims (which users can modify client-side) to enforce premium access. An authenticated user can elevate their subscription tier by manipulating their metadata.

**Failure mode D — Realtime subscriptions silently drop:** Supabase Realtime respects RLS. If a table has RLS enabled but the SELECT policy doesn't exist or doesn't match, Realtime events are silently dropped — no error, the subscription just stops delivering events. This is a confirmed and open GitHub issue (supabase/supabase#35282).

**Failure mode E — Catastrophic auth.uid() performance:** `auth.uid()` evaluated per row on unindexed tables causes sequential scans. A query that should take 2ms takes 50ms+ at 10,000 rows. This compounds badly on Realtime-heavy screens.

**Prevention strategy:**
- Enable RLS on every table immediately on creation. Zero exceptions.
- For every table: create SELECT, INSERT, UPDATE, DELETE policies before writing app code that touches it.
- Wrap `auth.uid()` in a `(select auth.uid())` subquery in all policies. This caches the result for the query rather than re-evaluating per row.
- Add a btree index on `user_id` (or whatever column is used in `WHERE user_id = auth.uid()`) on every user-scoped table.
- Premium feature gating: store subscription tier in a separate `subscriptions` table that only `service_role` can write. RLS policies on premium-gated tables check `EXISTS (SELECT 1 FROM subscriptions WHERE user_id = auth.uid() AND tier = 'premium' AND status = 'active')`. Never check `raw_user_meta_data` for authorization.
- For Realtime: explicitly verify that SELECT policies exist on any table with a realtime subscription. Test realtime with a non-admin client.
- Test all RLS policies using the Supabase client SDK, not the SQL Editor. The SQL Editor bypasses RLS as the postgres superuser.

**Warning signs:**
- New tables created in migrations without `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`
- Empty query results with no error — likely RLS block
- Realtime subscription exists but events never arrive
- Subscription tier checked from `user.user_metadata` rather than a server-side `subscriptions` table

**Phase:** Phase 1 schema design. Every phase that adds tables must add RLS policies in the same migration.

---

### 7. Claude API — Cost Blowouts and Context Window Overflow

**What goes wrong:**

**Cost blowout:** Every AI chat message sends the entire conversation history as context. A user with 6 months of chat history sends 50,000+ input tokens per message. At scale, this becomes expensive quickly. Unbounded context window = unbounded cost.

**Context overflow:** Claude's context window is large but not infinite. Appending full workout history (hundreds of sessions, thousands of sets) as context to a coaching question will eventually overflow or degrade response quality as the model attends to too much irrelevant data.

**Streaming on React Native:** Claude API supports streaming via Server-Sent Events (SSE). React Native's `fetch` API handles SSE poorly — you need either `EventSource` polyfill, the Anthropic SDK's streaming support, or a backend proxy that buffers and streams. Implementing raw SSE in RN has well-documented pitfalls with chunk handling.

**Latency:** Cold-start latency on streaming responses is 1–3 seconds before the first token. On mobile, users interpret this as a frozen UI if there's no loading state.

**Prevention strategy:**
- Never send raw conversation history from the client to Claude. Always proxy through a Supabase Edge Function or similar backend.
- Implement context summarization: when conversation history exceeds a token budget (e.g., 20,000 tokens), summarize older messages into a condensed context block before sending.
- For workout context: send a structured summary (last 5 sessions, current phase, PRs in the last 30 days) rather than raw database dumps.
- Rate limit AI endpoints per user per day. Enforce in the Edge Function, not in the client. A user hammering the chat with rapid messages should hit a per-minute limit.
- Enable Anthropic prompt caching for static system prompts. The system prompt (coaching persona, app context) is identical across all users — caching it reduces input costs by 50–90% for that portion.
- Use streaming from the Edge Function to the client. The RN client connects to your Edge Function's streaming endpoint, which proxies the Anthropic stream. This isolates SSE complexity to the backend.
- Show an immediate "thinking" indicator before the first streaming token arrives to prevent perceived freezes.

**Warning signs:**
- AI chat call made directly from the RN client to the Anthropic API (key exposure + no rate limiting)
- No token counting before sending context
- No per-user daily/hourly request limit
- Conversation history array grows without bound in local state

**Phase:** Phase that introduces AI chat. Architecture (proxy, rate limiting, caching) must be designed before first token is sent.

---

### 8. MyFitnessPal API — It Does Not Exist for New Developers

**What goes wrong:** The project assumes MFP integration is possible. The MFP public API was deprecated in 2020. As of 2024, the MFP Developer Portal requires a partnership agreement with MFP to obtain API credentials. There is no public sign-up path. Cold-emailing `API@myfitnesspal.com` yields no response for most developers.

**The landscape:**
- **MFP OAuth scraping / unofficial API:** Brittle, violates MFP ToS, breaks on any MFP app update.
- **MFP CSV export:** MFP allows users to export their food log as CSV. This is manual, not a live integration.
- **No live bidirectional integration is realistically available** for a new developer without a formal MFP business partnership.

**Realistic alternatives:**
- **Build your own food logging with an open food database.** Open Food Facts is a free, open-source database with 3M+ products and a REST API — no approval required. Edamam has a free tier (100 calls/day) and paid tiers.
- **HealthKit nutrition data:** Apple Health aggregates nutrition data from other apps (including MFP). You can read macro totals from HealthKit without directly integrating with MFP. The user connects MFP to Apple Health separately; your app reads from Health.
- **Defer food logging entirely.** The project scope already defers barcode scanning and own food logging. The MFP integration is the last remaining nutrition data source question. If HealthKit nutrition read covers the use case (today's macros), implement that. If not, implement an Open Food Facts search.

**Prevention strategy:**
- Remove "MyFitnessPal integration (both directions)" from Active requirements and replace with "HealthKit nutrition read" as the primary integration path. Use Open Food Facts for in-app food search if needed.
- Do not build any code that depends on MFP API credentials that haven't been obtained.

**Warning signs:**
- Any code that calls `myfitnesspal.com` API endpoints without confirmed credentials
- MFP integration on the roadmap with no status update on API access

**Phase:** Phase 1 — resolve this before it blocks a nutrition phase.

---

### 9. Wearable API Instability — Platform Risk for Garmin, Whoop, Fitbit

**What goes wrong:**

**Garmin:** Garmin has restricted third-party access to Garmin Connect API. In a confirmed case (Hevy fitness app), Garmin approved API access but restricted what data could flow — specifically blocking completed workout push-back into Garmin Connect. Garmin is building a native strength ecosystem (Garmin Connect+) and appears to be strategically limiting competitors' integration depth. Garmin Connect IQ is for building native watch apps in Monkey C (a proprietary language), not a REST API for workout sync.

**Whoop:** Whoop's developer API is newer and requires partnership approval. The API has historically changed without notice. Recovery scores and strain data are available but delayed (not real-time). Terms changes have revoked access for some third-party apps without warning.

**Google Fit → Health Connect:** Google Fit REST API is deprecated as of 2024 (no new signups since May 1, 2024, full deprecation in 2026). Android health data must go through Health Connect. Health Connect requires Android 14+ (available as an app download on older devices). The `react-native-health-connect` library supports this migration.

**Fitbit:** Fitbit/Google integration through Health Connect is the path forward. Fitbit syncs to Health Connect on Android; direct Fitbit API requires OAuth and developer app approval.

**Suunto:** Suunto has a developer API (SuuntoPlus) but it's not widely supported by React Native libraries. Lowest-priority integration.

**Prevention strategy:**
- Treat all wearable integrations as "HealthKit / Health Connect first, direct SDK second." HealthKit on iOS aggregates data from Garmin, Whoop, Fitbit, and most wearables via their companion apps. Reading HRV, sleep, and recovery from HealthKit is more reliable than each device's proprietary API.
- Garmin workout push: implement `.fit` file export (already exists in v1) rather than depending on the Garmin Connect API. The user manually imports the file. This is lower-friction than it sounds for serious athletes.
- Whoop: build the integration to poll recovery data, but architect it so it can be disabled without affecting core app functionality. If Whoop changes terms, the integration degrades gracefully to "no recovery score."
- For Android, target Health Connect not Google Fit. Use `react-native-health-connect`.
- Gate wearable integrations as progressive enhancements. Core workout tracking must never depend on wearable connectivity.

**Warning signs:**
- Core app features (e.g., dashboard recovery score) that throw errors or break if wearable API call fails
- Direct Garmin Connect API calls for workout data without a fallback
- Any code using `react-native-google-fit` (deprecated, use `react-native-health-connect`)

**Phase:** Wearable integrations should be a dedicated later phase, after core app is stable. Health Connect / HealthKit first.

---

### 10. Android Background Task Killing — Smart Notification Timing Will Fail on Many Devices

**What goes wrong:** Android OEMs (Samsung, Xiaomi, Huawei, Oppo, OnePlus) apply aggressive battery optimization that kills background processes. A React Native app that schedules a workout reminder notification via a background task will work correctly on Pixel devices and fail silently on Samsung devices — same code, different behavior. No error is thrown; the notification simply never fires.

**"Smart timing" specifically:** Learning notification timing from user behavior requires either: (a) periodic background task execution (unreliable on Android), or (b) a server-side scheduler that sends push via FCM/APNS (reliable). Implementing smart timing client-side on Android is a trap.

**Prevention strategy:**
- All push notifications must be sent server-side via Expo Notifications / FCM / APNS, not scheduled locally on device.
- Smart timing is implemented on the server: when the user opens the app at a given time consistently, the server updates their preferred send time. The next day's notification is scheduled from the server at that time.
- For Android, use `notifee` with a foreground service if any real-time in-workout notification (e.g., rest timer completion) must survive backgrounding. A foreground service shows a persistent notification to keep the process alive.
- On first Android launch, detect whether battery optimization is enabled for the app (`isBatteryOptimizationEnabled()`) and prompt the user to disable it via `openBatteryOptimizationSettings()`. Do this once during onboarding, not repeatedly.
- Never rely on `BackgroundFetch` or similar client-side scheduler as the primary notification mechanism.

**Warning signs:**
- `expo-task-manager` or `expo-background-fetch` used as the mechanism for workout reminder push notifications
- No server-side push notification dispatch logic
- Notification testing only done on Pixel devices (not Samsung)

**Phase:** Notification architecture must be server-side from Phase 1. Smart timing feature implemented in a later phase, server-side.

---

### 11. Progress Photos — Image Size and Storage Cost Creep

**What goes wrong:** Users upload phone camera photos (12–25MB raw JPEG). Without client-side compression, Supabase Storage costs become significant quickly. Loading a before/after comparison view with two uncompressed photos causes a 10–15 second load on cellular. Offline access to progress photos is impossible without download.

**Prevention strategy:**
- Compress images client-side before upload. Use `expo-image-manipulator` to resize to max 1920px on the longest edge and compress to ~80% JPEG quality. This typically reduces 15MB raw to under 1MB without perceptible quality loss for progress tracking purposes.
- Store both the compressed original and a thumbnail (400px wide) in Supabase Storage. Use Supabase's image transformation endpoint (`?width=400`) for dynamic resizing if the Storage plan includes it, or generate the thumbnail at upload time.
- Set a Supabase Storage bucket policy with a max file size of 5MB to prevent accidentally storing raw phone photos.
- For before/after comparison: load thumbnails first, load full images only on tap.
- Do not attempt to cache progress photos locally for offline access in early phases — it's a storage management problem. Mark it as a future enhancement.

**Warning signs:**
- Upload code that calls `supabase.storage.upload()` with the raw camera output without any intermediate processing step
- Storage bucket with no file size limit configured
- Comparison view that `Image` renders full-res photos directly

**Phase:** Progress photos phase. Compression pipeline must be implemented before any photos are stored.

---

### 12. Home Screen Widgets — iOS Only, Alpha Library, Requires EAS Build

**What goes wrong:** `expo-widgets` is currently in alpha and not available in Expo Go. It is iOS-only — Android widgets are not supported by this library and require native Kotlin code. Assuming the widget feature works cross-platform (or works in Expo Go) leads to false planning.

**Current state:**
- `expo-widgets` supports iOS WidgetKit and Live Activities via `@expo/ui/swift-ui` components.
- Android home screen widgets require a native Kotlin implementation — separate, not handled by `expo-widgets`.
- Both require EAS Build. Neither works in Expo Go.
- The library's alpha status means breaking changes between SDK versions are expected.

**Prevention strategy:**
- Scope the widget feature as iOS-first. Treat Android widgets as a separate, later deliverable requiring native Android code.
- Do not block the widget feature on `expo-widgets` reaching stable. Use it in alpha but pin the version and test on each SDK upgrade.
- Widget-to-app data sharing uses App Groups (iOS) / SharedPreferences (Android). The widget cannot read directly from SQLite or Supabase. Design a data bridge (shared UserDefaults / shared storage) that the main app writes to after each state change.
- Budget extra time: widget setup requires App Group entitlements configuration in EAS and specific `expo-target.config.js` setup.

**Warning signs:**
- Widget feature planned for Android using `expo-widgets`
- Widget implementation attempted in Expo Go
- No App Group identifier configured in EAS credentials

**Phase:** Dedicated late phase, after core app and iOS-specific features are stable.

---

### 13. FlashList vs FlatList — FlatList Will Cause Jank in Workout History

**What goes wrong:** `FlatList` is React Native's default list component. It uses virtualization (unmount/remount of items on scroll). For simple lists this is fine. For a workout history screen that renders dense exercise-and-set rows — which may have different heights, embedded charts, or dynamic content — FlatList causes consistent JS thread spikes above 60% and frame drops on older devices.

**Shopify's FlashList** uses cell recycling (a fixed pool of components reused with new data) instead of mount/unmount cycles. Benchmarks show JS thread stays below 10% vs. 90%+ with FlatList on complex lists, and up to 10x faster rendering on initial load.

**Prevention strategy:**
- Use `@shopify/flash-list` for any list longer than ~20 items with non-trivial item components: workout history, exercise library, session log, set history.
- The FlashList API is nearly identical to FlatList — migration is a near drop-in replacement.
- Provide `estimatedItemSize` to FlashList. Without it, FlashList falls back to measurement passes that degrade performance.
- Keep item components pure (memoize with `React.memo`). Prevent list re-renders from unrelated state changes.

**Warning signs:**
- `FlatList` used for workout history or exercise library
- No `estimatedItemSize` on FlashList components
- Performance testing only done on simulator (simulators don't accurately represent older device CPU constraints)

**Phase:** Any phase that builds list-heavy screens. Start with FlashList, don't migrate later.

---

### 14. TypeScript Path Aliases — EAS Local Builds Break Differently Than Development

**What goes wrong:** Path aliases (`@/components`, `~/utils`) configured in `tsconfig.json` work in Metro development. EAS local builds can fail to resolve them even when development works correctly. This is a confirmed open issue (expo/expo#36807, May 2025). The symptom is a bundling error on `eas build --local` that doesn't reproduce in `npx expo start`.

**Prevention strategy:**
- Use Expo's built-in path alias support (SDK 49+). Set `baseUrl: "."` in `tsconfig.json` and define paths. Do not use `babel-plugin-module-resolver` on Expo SDK 49+ — it conflicts with the built-in support.
- After configuring aliases, test with `eas build --profile development --local` before committing to the pattern. Catch the issue before it blocks production builds.
- If EAS local builds fail with path aliases: add `plugins: ["babel-plugin-module-resolver"]` as a fallback and mirror `tsconfig.json` paths in `babel.config.js`.
- Never use path aliases in native module config files or `metro.config.js` — only in application source files.

**Warning signs:**
- Path aliases work in Expo Go but EAS builds fail with "module not found"
- Both `tsconfig.json` paths AND `babel-plugin-module-resolver` configured simultaneously (conflict)
- First EAS build happens late in the project (discovery of this issue is late)

**Phase:** Phase 1 — configure path aliases in the initial project setup and immediately test with an EAS build.

---

### 15. Supabase Realtime + RLS — Silent Subscription Drops

**What goes wrong (additional detail beyond #6):** When a developer adds RLS to a table that has a Realtime subscription, the subscription silently stops delivering events. The channel connection status shows "subscribed" but no change events arrive. There is no error message.

**Root cause:** Supabase Realtime checks RLS when deciding whether to deliver an event to a subscriber. If the subscriber doesn't have a SELECT policy that permits seeing the row, the event is dropped. The subscription does not fail — it simply delivers nothing.

**The trigger scenario for this project:** Any feature that uses `supabase.channel().on('postgres_changes', ...)` on tables like `workout_sessions`, `sets`, or `user_measurements` will silently stop working when RLS is added to those tables if SELECT policies aren't in place.

**Prevention strategy:**
- For every table with a Realtime subscription, explicitly verify: (a) the table is in the `supabase_realtime` publication, and (b) a SELECT policy exists for the authenticated role.
- If using schema-based migrations: add `ALTER PUBLICATION supabase_realtime ADD TABLE table_name;` explicitly in migrations for Realtime tables.
- Test Realtime with a non-admin authenticated user. The Supabase dashboard uses service role which bypasses RLS — it will show events even when client users don't receive them.
- Consider whether Realtime is necessary. For workout data, polling on app foreground (using `AppState`) may be simpler and more reliable than Realtime subscriptions.

**Warning signs:**
- Realtime subscription exists but events stop arriving after adding RLS
- Realtime tested only via Supabase dashboard
- Tables not explicitly added to `supabase_realtime` publication in migrations

**Phase:** Any phase that introduces Realtime + RLS. Always a pair — never add one without the other.

---

## Phase-Mapped Prevention Strategies

| Phase Topic | Pitfall | Prevention |
|-------------|---------|------------|
| Phase 1: Project setup | Expo Go dependency | Set up EAS Build + `expo-dev-client` before any feature work |
| Phase 1: Project setup | OTA breaks native | Configure runtime version policy in `eas.json` immediately |
| Phase 1: Project setup | Path alias EAS failure | Configure aliases and test EAS build in Phase 1 |
| Phase 1: Data architecture | In-memory workout loss | Design SQLite outbox (WatermelonDB) as the write layer from day 1 |
| Phase 1: Schema design | RLS silent failures | Enable RLS on every table at creation; add all CRUD policies in same migration |
| Phase 1: Schema design | Realtime RLS drops | Add SELECT policies before adding Realtime subscriptions |
| Phase 1: Billing architecture | App Store IAP rejection | Decide: RevenueCat (recommended) or native StoreKit + Stripe web hybrid |
| Phase 2: Auth | Apple IAP + Sign-In required | Apple Sign-In required whenever any third-party OAuth is present |
| Phase 2: AI features | Claude cost blowout | Proxy all Claude calls through Edge Function; rate limit per user; summarize context |
| Phase 2: AI features | Streaming on RN | SSE proxy pattern via Edge Function; show loading state before first token |
| Phase 3: Wearables | Google Fit deprecated | Target Health Connect (Android); HealthKit aggregation (iOS) |
| Phase 3: Wearables | Garmin API restrictions | Use .fit file export as primary; Connect API as optional enhancement |
| Phase 3: Wearables | Whoop API instability | Graceful degradation if Whoop data unavailable |
| Phase 3: Wearables | HealthKit App Store review | Clear NSHealthShareUsageDescription in Info.plist; feature must be clearly labeled in UI |
| Phase 4: Progress/photos | Upload size creep | Client-side compression before upload; Storage bucket max size policy |
| Phase 4: Lists | FlatList jank | Use FlashList for all workout history and exercise library screens |
| Phase 5: Notifications | Android background killing | Server-side push only; prompt for battery optimization exemption in onboarding |
| Phase 5: Notifications | Smart timing complexity | Implement timing on server; start with user-set time, evolve from there |
| Phase 5: MFP integration | MFP API inaccessible | Replace with HealthKit nutrition read + Open Food Facts search |
| Phase 6: Watch app | Expo managed = broken | Eject to bare workflow before watch feature; Swift/SwiftUI for watch UI |
| Phase 6: Widgets | Android not supported | iOS-only via `expo-widgets` alpha; Android widgets need native Kotlin separately |
| Phase 6: Widgets | Expo Go incompatible | Widgets require EAS Build; dev client required for all widget testing |

---

## Decisions That Must Be Made in Phase 1

These cannot be deferred. Making the wrong choice — or deferring — causes rewrites.

### Decision 1: Billing Architecture
**Options:**
- RevenueCat (abstracts IAP for iOS/Android/web, syncs entitlements) + Stripe for web billing
- Native StoreKit (iOS) + Google Play Billing (Android) + Stripe (web) with a custom entitlement sync server

**Recommendation:** RevenueCat. The custom entitlement sync server is 2–4 weeks of work that RevenueCat provides for free. The "Stripe chosen for simplicity" rationale in PROJECT.md does not hold on iOS native — Stripe alone cannot be used for digital subscriptions in an iOS app without violating App Store guidelines (US exception allows linking to Stripe web checkout, but still requires offering IAP).

**Deadline:** Must be chosen before any subscription UI is built.

### Decision 2: Workflow — Managed vs. Bare
**Recommendation:** Start in managed workflow with EAS Build. Eject to bare workflow when the Apple Watch companion app phase begins. Do not pre-eject; managed workflow is easier to maintain for the duration before watch is needed.

**Deadline:** Eject decision before the watch companion app phase starts.

### Decision 3: Local Database Strategy
**Options:**
- WatermelonDB (SQLite, built-in Supabase sync protocol, conflict resolution)
- Custom SQLite via `expo-sqlite` with a hand-rolled outbox
- MMKV (key-value, not relational — inappropriate for workout set data)
- AsyncStorage (too slow, not suitable for complex data)

**Recommendation:** WatermelonDB. The sync engine alone justifies it. The tradeoff is schema friction: any schema change requires updating WatermelonDB schema, the Supabase schema, and the sync functions — but this is acceptable for a single-developer project with deliberate schema design upfront.

**Deadline:** Data model must be designed before Phase 1 is complete. WatermelonDB schema and Supabase migration must be in sync from the first table.

### Decision 4: MyFitnessPal Integration Scope
**Recommendation:** Downgrade "MFP bidirectional integration" to "HealthKit nutrition read." MFP API access is not available to new developers. Build the nutrition feature around: (a) HealthKit nutrition data aggregation (reads macros that MFP and other apps write to Health), and (b) Open Food Facts if in-app food search is needed.

**Deadline:** Before the nutrition phase begins.

### Decision 5: Wearable Integration Priority and Fallback Strategy
**Recommendation:** HealthKit first (reads from all connected wearables on iOS). Health Connect second (Android). Direct Garmin/Whoop/Fitbit APIs as optional enhancements, not primary integrations. Each wearable integration must degrade gracefully (disable, not crash) if the API becomes unavailable or terms change.

**Deadline:** Before the wearables phase begins.

---

## Sources

- [Adapty: Can You Use Stripe for In-App Purchases in 2026?](https://adapty.io/blog/can-you-use-stripe-for-in-app-purchases/)
- [TechCrunch: Stripe shows iOS developers how to avoid Apple's App Store commission (May 2025)](https://techcrunch.com/2025/05/01/stripe-shows-ios-developers-how-to-avoid-apples-app-store-commission/)
- [Stripe: Accept in-app purchases on iOS and Android](https://docs.stripe.com/mobile/digital-goods)
- [Expo: Widgets documentation (alpha)](https://docs.expo.dev/versions/latest/sdk/widgets/)
- [Expo: Home screen widgets and Live Activities blog](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo)
- [EAS CLI Issue #795: Apple Watch companion app build errors](https://github.com/expo/eas-cli/issues/795)
- [react-native-watch-connectivity](https://github.com/watch-connectivity/react-native-watch-connectivity)
- [Supabase: Offline-first React Native with WatermelonDB](https://supabase.com/blog/react-native-offline-first-watermelon-db)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase RLS + Realtime incompatibility issue #35282](https://github.com/supabase/supabase/issues/35282)
- [MakerKit: Supabase RLS Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Optimizing RLS Performance: AntStack](https://medium.com/@antstack/optimizing-rls-performance-with-supabase-postgres-fa4e2b6e196d)
- [Notifee: Android Background Restrictions](https://notifee.app/react-native/docs/android/background-restrictions)
- [Expo GitHub Issue #36807: Path alias EAS build failures](https://github.com/expo/expo/issues/36807)
- [Shopify FlashList](https://shopify.github.io/flash-list/)
- [Google Fit Migration to Health Connect](https://developer.android.com/health-and-fitness/health-connect/migration/fit)
- [Google Fit API Deprecation: Thryve Health](https://www.thryve.health/blog/google-fit-api-deprecation-and-the-new-health-connect-by-android-what-thryve-customers-need-to-know)
- [MyFitnessPal Developer Portal (partnership required)](https://www.myfitnesspal.com/apps/api/version)
- [Garmin Connect+ Strength App restrictions (2026)](https://the5krunner.com/2026/03/24/garmin-connect-plus-strength-apps/)
- [Expo FAQ](https://docs.expo.dev/faq/)
- [React Native Expo path aliases setup](https://medium.com/@manthankaslemk/react-native-path-aliases-with-expo-babel-module-resolver-and-typescript-b7f19d3efb62)
- [react-native-health: Expo config plugin](https://github.com/agencyenterprise/react-native-health/blob/master/docs/Expo.md)
- [iOS App Store Requirements for Health Apps](https://blog.dashsdk.com/app-store-requirements-for-health-apps/)
- [DEV: React Native offline-first conflict-safe SQLite sync](https://dev.to/sathish_daggula/react-native-offline-first-conflict-safe-sqlite-sync-549a)
