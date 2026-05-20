# Domain Pitfalls

**Domain:** Family household management PWA (chores, calendar, custody, meals, groceries, notes) with Web Push, Supabase Realtime, TanStack Query, React Router v6
**Researched:** 2026-05-19
**Overall confidence:** HIGH for iOS/PWA constraints and Supabase Realtime; MEDIUM for streak design (opinionated recommendation based on best-practice timezone handling)

This file catalogs concrete mistakes that have caused rewrites, support burden, or data loss in apps shaped like Family Hub 2.0. Each pitfall lists warning signs, prevention, and the phase where it bites hardest.

---

## Critical Pitfalls

These cause rewrites, data loss, or "the whole feature is broken on iPhone" — the platform our family runs on.

### Pitfall 1: Treating iOS Web Push like Chrome Web Push
**Phase relevance:** Foundation / Notifications phase
**What goes wrong:** Notifications work in dev (Chrome desktop), then ship to iPhone and nothing arrives.
**Why it happens:** iOS 16.4+ added Web Push, but with hard preconditions Chrome doesn't have:
- Push only works for PWAs installed via **Share → Add to Home Screen**. An open Safari tab cannot receive push, ever.
- `manifest.json` must declare `"display": "standalone"` (or `"fullscreen"`); without this, install succeeds but push silently fails.
- `Notification.requestPermission()` MUST be called inside a real user-gesture handler (click/tap). Calling it on page load, inside a `setTimeout`, or after an `await` boundary will be silently ignored.
- No silent/data-only pushes. Every push payload MUST render a user-visible notification or iOS will revoke the push subscription after a few violations.
- No automatic install banner (`beforeinstallprompt` doesn't fire). Users must be taught the Share-sheet flow.
- `Notification.permission` returns `"denied"` in some iOS builds even when permission is granted (a known WebKit bug). Use the `PushSubscription` object as the source of truth, not `Notification.permission`.

**Consequences:** "Push notifications don't work" becomes the dominant support complaint. Family stops trusting the app. Subscriptions get revoked silently.
**Prevention:**
- Build an in-app onboarding screen that detects `navigator.standalone === false` on iOS and shows the Share-sheet install instructions with screenshots BEFORE requesting permission.
- Gate `requestPermission()` behind a "Turn on notifications" button users tap explicitly.
- Always render a visible notification — never send silent pushes.
- Source-of-truth check: try `registration.pushManager.getSubscription()` instead of reading `Notification.permission`.
- Test on a real iPhone added to Home Screen, every release. Simulator and desktop Safari are not representative.

**Detection (warning signs):** Subscriptions disappearing from your DB without user action; iOS users reporting "I turned it on but nothing comes"; `subscribe()` resolving with a subscription that fails server-side delivery.

---

### Pitfall 2: Asking for notification permission on first page load
**Phase relevance:** Notifications phase
**What goes wrong:** First-time visitor gets a permission prompt before they understand what the app does, taps "Block" out of reflex, and now they can never re-enable without manually clearing site data.
**Why it happens:** Browser permission state is sticky. Once "denied," there's no `requestPermission()` UI you can show to recover; the browser will return `"denied"` immediately without prompting.
**Consequences:** Permanent loss of the notification channel for that user. On iOS the only recovery is "delete the PWA, clear Safari data, reinstall" — a non-starter for kids.
**Prevention:**
- Use the **double-permission pattern**: show your OWN in-app dialog ("Get reminders for your chores?") with a clear value proposition first. Only call `Notification.requestPermission()` after the user taps "Yes."
- Trigger the prompt CONTEXTUALLY: after the user adds their first chore, completes onboarding, or visits a "Notifications" tab — never on first paint.
- If `permission === 'denied'`, show a recovery card explaining how to re-enable in OS settings instead of a dead button.
- Track a `dismissed_at` timestamp in localStorage so the in-app prompt doesn't nag.

**Detection:** Opt-in rate below 50% (contextual prompts achieve 70-85%); `denied` count climbing in your analytics; family members saying "I clicked no by accident."

---

### Pitfall 3: Supabase Realtime + TanStack Query double-update
**Phase relevance:** Foundation / any phase with mutations + realtime
**What goes wrong:** User toggles a chore. Three things happen:
1. Optimistic update writes to TanStack cache.
2. `supabase.update()` succeeds, mutation `onSuccess` invalidates the query, triggering a refetch.
3. Postgres trigger fires `postgres_changes` event back to the same client, which ALSO invalidates the query, triggering ANOTHER refetch.
The chore UI flickers, sometimes briefly shows stale data, and on slow networks the realtime invalidation can clobber a still-in-flight optimistic update.

**Why it happens:** Realtime doesn't know which client originated the change. Every client gets every event, including the one that caused it.
**Consequences:** Janky UI, wasted bandwidth, race conditions where mutation B's optimistic update gets overwritten by mutation A's realtime echo. With many mutations rapidly (kid spam-tapping a chore checkbox), state can briefly desync.

**Prevention (pick ONE pattern and apply consistently):**
- **Pattern A (recommended for Family Hub 2.0): Realtime → `setQueryData` patch, mutations → optimistic + no invalidate.**
  - Mutations do optimistic `setQueryData` + Supabase write. No `invalidateQueries` on success.
  - Realtime subscription receives `postgres_changes` payload (which contains `new` and `old`) and calls `setQueryData` to patch the row in the cache.
  - The optimistic update and the realtime echo converge to the same value — no double-fetch, no flicker.
- **Pattern B: Mutations invalidate; realtime triggers invalidate with debounce.** Simpler but causes refetch storms when multiple events arrive close together. Debounce realtime → invalidate by 100-200ms.
- Always call `queryClient.cancelQueries()` before optimistic updates so in-flight refetches don't clobber.
- Tag mutations with a client-generated ID and ignore realtime events whose payload matches a recent mutation (echo suppression). Optional — Pattern A obviates this.

**Detection:** Doubled network requests on every mutation; visible UI flicker on toggle; "the checkbox jumps back" reports.

---

### Pitfall 4: Migrating TEXT IDs to UUIDs without intermediate columns
**Phase relevance:** Migration phase
**What goes wrong:** You run `ALTER COLUMN id TYPE uuid USING id::uuid` on `chores` and get `ERROR: foreign key constraint "chore_assigned_to_fkey" cannot be implemented` — or worse, the migration succeeds but every FK in `events`, `groceries`, etc. now points to invalid IDs because the source TEXT (like `'c1700000000'`) cannot cast to UUID.
**Why it happens:** Cannot drop the PK while FKs depend on it; cannot cast arbitrary text to UUID; FK columns themselves are TEXT and must be converted in lockstep.
**Consequences:** Half-migrated DB, orphaned rows, app boots but every cross-table query returns empty. With real family data on the line, "just re-run it" is not safe.

**Prevention — staged migration with parallel columns:**
1. **Add new columns alongside old.** On every table: `ADD COLUMN new_id UUID DEFAULT gen_random_uuid()`. On FK columns: `ADD COLUMN new_assigned_to UUID`.
2. **Populate the new FK columns** by joining old → new ID maps (write a one-time SQL script or use a `id_map` temp table per source table).
3. **Verify counts and integrity** with read-only queries before any destructive step. Compare row counts, sample-check joined data.
4. **Cut over inside a single transaction**: drop old FK constraints, drop old PK, rename `new_id` → `id`, rename `new_assigned_to` → `assigned_to`, re-add FK constraints, re-add PK. If anything fails, the transaction rolls back.
5. **Keep old columns for one release** as `old_id TEXT` — gives you a rollback path and reference for debugging.
6. **Snapshot the prod DB before migrating.** Supabase paid plans have point-in-time recovery; free tier needs a manual `pg_dump` upload to storage.

**Rollback strategy (mandatory before running):**
- Pre-migration: full `pg_dump` of every table to Supabase Storage with timestamp.
- Migration script must be idempotent (safe to re-run from a clean state).
- If migration fails mid-flight: restore from `pg_dump`, fix script, re-run. Don't try to "fix forward" with patch SQL.
- Run migration against a Supabase branch DB or cloned project FIRST. Never run unverified migration against the family's live data.

**Detection:** Constraint errors on `ALTER`; row counts changing unexpectedly; queries returning empty after migration despite data being present (FKs not updated).

---

### Pitfall 5: Streaks computed against the wrong timezone
**Phase relevance:** Chores phase
**What goes wrong:** Kid completes chore at 11:45 PM in Chicago. Server stores `completed_at = 2026-05-19T04:45:00Z` (UTC). Streak logic groups by UTC date and assigns this to May 19 instead of May 18. Tomorrow night they complete a chore at 11pm — also "May 19" in UTC. Streak counter never increments. Or: family travels to Hawaii, completes a chore "today" their time, but server logs it as "tomorrow" UTC and the streak break happens at the wrong moment.

**Why it happens:** Three different timezone candidates compete (browser, server, "family home" timezone), and naïve date math uses whichever is most convenient.

**Recommendation (specific):**
- Add `timezone TEXT NOT NULL DEFAULT 'America/Chicago'` to a `family_settings` row (PROJECT.md already lists family timezone as a requirement).
- Store completion as `completed_at TIMESTAMPTZ` in UTC (Postgres default). NEVER use `TIMESTAMP` without timezone.
- Streak math runs in the **family timezone**, not the user's device timezone, not UTC:
  ```js
  // Pseudocode using Luxon (recommended over date-fns-tz for streak math)
  const familyTz = family.timezone; // e.g., 'America/Chicago'
  const completionLocalDate = DateTime
    .fromISO(completedAt, { zone: 'utc' })
    .setZone(familyTz)
    .toISODate(); // 'YYYY-MM-DD' in family local time
  ```
- A "day" runs from midnight-to-midnight in the family timezone. A streak breaks when there's no completion for an entire family-local calendar day.
- For daily-recurring chores: "completing today's instance" means a completion with `completionLocalDate === todayLocalDate(familyTz)`.
- For weekly/monthly: the `due_date` advance logic must also use family timezone — converting `due_date + 1 week` via UTC midnight will silently drift across DST.

**Why Luxon over date-fns-tz here:** Luxon's `setZone` handles DST transitions correctly when adding intervals (spring-forward / fall-back). date-fns-tz is workable but has documented edge cases when arithmetic crosses DST boundaries. Bundle size is 23KB — acceptable for a PWA.

**Prevention checklist:**
- Single source of truth: `family_settings.timezone` (configurable per Settings requirement).
- All timestamp columns `TIMESTAMPTZ`, never `TIMESTAMP`.
- All streak/recurrence math passes the family timezone explicitly — no implicit "use system zone."
- Tests with fixed timestamps that cross DST boundaries (March 14 2026 spring-forward, November 7 2026 fall-back).
- Tests where the device timezone differs from family timezone (parent traveling).

**Detection:** Streaks resetting when nobody missed a chore; streaks NOT resetting when someone clearly skipped; "completed yesterday" badges appearing on items completed today; recurring chores advancing to weird dates after DST.

---

### Pitfall 6: Mapping Google OAuth identity by email instead of by stable identity ID
**Phase relevance:** Foundation / Member Management
**What goes wrong:** v1 hardcodes member IDs to emails. When `laylamerryman11@gmail.com` becomes `layla.mader@gmail.com` (kid changes their Google address), her chore history, streak, and member profile become orphaned because the email lookup fails.

**Why it happens:** Email is treated as a foreign key. In Supabase Auth, the stable identifier is `auth.users.id` (a UUID), not email. Supabase auto-links new identities with the same email to the existing user — meaning emails CAN change while `auth.users.id` stays the same — but if the app keys on email, that linkage is invisible.

**Consequences:** History fragmentation, lost streaks, duplicate member rows. Or worse: a former email gets reused/reassigned and now grants access to old data.

**Prevention:**
- `members` table has two relevant columns:
  - `auth_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL` — the stable link.
  - `email TEXT NULL` — convenience field, NOT a key. Updated from `auth.users.email` on login.
- App access control checks `auth_user_id`, never `email`.
- "Virtual members" (parent-managed, no Google account) have `auth_user_id = NULL` — schema supports this from day one.
- Provide a parent-only "Link Google account" action on a member's profile, which writes the current `auth.user.id` to `members.auth_user_id`. This is also the email-change recovery flow: parent re-links the new account to the existing member row.
- On every login, sync `auth.users.email` → `members.email` for the linked member so the convenience field stays fresh.
- NEVER seed `members` from a hardcoded email list. Allowed-email gating belongs in a separate `allowed_emails` table or RLS policy.

**Detection:** "I changed my email and now my chores are gone"; duplicate member rows; new login creates a new member instead of finding the existing one.

---

## Moderate Pitfalls

### Pitfall 7: Service worker update never reaches the user
**Phase relevance:** Foundation / PWA setup
**What goes wrong:** You ship a fix. Family on iPhones still see the old version for days because the service worker only checks for updates on navigation, and a PWA on Home Screen doesn't navigate often.
**Prevention:**
- Use `registerType: 'prompt'` with vite-plugin-pwa and show a "New version available — tap to refresh" banner in the app when `needRefresh` fires.
- Call `registration.update()` on app focus (`visibilitychange`) and on a periodic interval (every 60 min while open).
- The update flow: show banner → user taps refresh → call `updateServiceWorker(true)` → SW posts `SKIP_WAITING` → `clientsClaim` → page reloads.
- For data-shape-breaking changes, ALSO bump a version number in cached query keys so stale data doesn't survive the update.

**Detection:** Bug reports for issues you've already fixed; service worker version in DevTools lagging the latest commit.

---

### Pitfall 8: Service worker cache evicted after 7 days of inactivity on iOS
**Phase relevance:** Foundation / Offline support
**What goes wrong:** iOS Safari enforces a 7-day cap on script-writable storage if the PWA isn't actively used. Family member who hasn't opened the app in a week loses cached data, login token, and possibly the push subscription itself.
**Prevention:**
- PWAs **added to Home Screen** are exempt from the 7-day eviction (this is the main reason the install-to-home-screen UX matters beyond push).
- Don't rely on Cache Storage for anything load-bearing. Cache API has a ~50 MB limit on iOS; IndexedDB can go to ~500 MB but is also subject to eviction without Home Screen install.
- Keep critical data server-side and refetch on launch. Cache is a performance optimization, not a source of truth.
- Push subscriptions should be persisted server-side; if `getSubscription()` returns null after a long absence, re-prompt automatically via the in-app flow.

**Detection:** Users have to re-login after a vacation; "I had push and now I don't"; missing data after a week of non-use.

---

### Pitfall 9: Realtime channel leaks from missing useEffect cleanup
**Phase relevance:** Any phase using realtime
**What goes wrong:** Component subscribes to `family-realtime` on every render or never unsubscribes. WebSocket connections accumulate; eventually hits the per-project channel limit, or the same payload is processed by 5 stale handlers.
**Why it happens:** Common mistakes: subscribing outside `useEffect`; missing dependency array; not returning a cleanup function; using `removeAllChannels()` in places that nuke channels other parts of the app need.
**Prevention:**
- Single global subscription pattern: ONE module owns the realtime client, sets up channels once on auth, tears down on signOut. Components subscribe to the TanStack cache, not directly to Supabase.
- If components must subscribe directly, ALWAYS:
  ```js
  useEffect(() => {
    const channel = supabase.channel('chores-changes').on(...).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [/* stable deps only */]);
  ```
- Never call `removeAllChannels()` from a component — it kills channels other components own.
- Channel names should be unique per logical subscription (`chores-changes`, `events-changes`), not generic (`family-realtime` for everything makes filtering harder and one error rebuilds them all).

**Note on channel naming:** Channels in Supabase share a single WebSocket — having many is cheap. The same client CANNOT subscribe twice to the same channel name; the second subscribe silently replaces the first. This causes "my listener stopped firing" bugs when two components subscribe to the same channel name.

**Detection:** WebSocket count growing in DevTools Network tab; "TooManyChannels" errors; handlers firing 2x, 3x, 4x per event.

---

### Pitfall 10: Realtime reconnect leaves cache stale
**Phase relevance:** Any phase using realtime
**What goes wrong:** User puts phone in pocket for an hour. iOS suspends the WebSocket. Phone wakes, connection reconnects, but events that fired during the gap are GONE — Supabase Realtime does not buffer or replay missed events.
**Consequences:** Family member completes a chore on their phone; other family members never see the update until they manually refresh.
**Prevention:**
- On `SUBSCRIBED` event (which fires on initial connect AND every reconnect), call `queryClient.invalidateQueries()` to refetch everything tied to that channel.
- Monitor the channel `status` callback; on `CHANNEL_ERROR` or `TIMED_OUT`, treat the cache as stale and refetch.
- Use a heartbeat (`heartbeatIntervalMs`) to detect silent disconnects faster (45s → 12s detection).
- Show a subtle "Reconnecting…" indicator when realtime status isn't `SUBSCRIBED` so the user knows the data could be stale.

**Detection:** "I marked it done on my phone and Mom's iPad never updated"; long-running tabs showing old data despite the app appearing connected.

---

### Pitfall 11: React Router redirect loop on auth-protected routes
**Phase relevance:** Foundation / routing
**What goes wrong:** User opens `/chores`. Auth context is still loading (`session = undefined`). Route guard sees no session, redirects to `/login`. Auth context resolves, sees session exists, the `/login` page redirects back to `/chores`. Loop until React breaks rendering.
**Why it happens:** Three states get conflated: "loading," "no session," and "has session." Guard treats `loading` as `no session.`
**Prevention:**
- Three-state auth: `'loading' | 'authenticated' | 'unauthenticated'`. Never collapse to a boolean.
- Route guard component:
  - `loading` → render a splash/skeleton (NOT a `<Navigate>`).
  - `unauthenticated` → `<Navigate to="/login" replace state={{ from: location }} />` (use `replace` so back button doesn't loop).
  - `authenticated` but on `/login` → `<Navigate to={state?.from?.pathname ?? '/'} replace />`.
- Use `useNavigate({ replace: true })` after OAuth callback completes — without `replace`, the login URL stays in history and back button replays the auth flow.
- The `<Login>` page itself should `<Navigate>` to home if already authenticated, but only AFTER session check completes — same three-state pattern.

**Detection:** Browser tab spinning; URL flickering between two routes; React warning "Maximum update depth exceeded."

---

### Pitfall 12: Deep links broken before session loads
**Phase relevance:** Foundation / routing
**What goes wrong:** Family member taps a push notification linking to `/chores/abc123`. App loads, route guard sees no session yet (still booting), redirects to `/login`, OAuth completes, but redirects to `/` — the deep link is lost.
**Prevention:**
- Persist the intended destination across the auth round-trip:
  - Route guard captures `location.pathname + location.search` into navigation state.
  - Login page reads `state.from` and uses it as the post-auth redirect target.
- For OAuth specifically, Supabase's `redirectTo` should point to a single `/auth/callback` route that finishes the session, reads the original target from `sessionStorage` or URL hash, then navigates there.
- Push notification action URLs should include the path AND a fallback (e.g., `/auth/callback?next=/chores/abc123`) so the callback handler knows where to send the user.

**Detection:** Notification taps always land users on `/` instead of the specific item; shared URLs lose state across login.

---

### Pitfall 13: Optimistic mutation has no rollback path
**Phase relevance:** Any phase with mutations
**What goes wrong:** v1's existing failure mode (called out in HANDOFF.md): mutation optimistically updates UI, Supabase write fails, toast shows error, but the UI is now showing data the DB doesn't have.
**Prevention (TanStack Query idiom):**
- Every `useMutation` with optimistic update implements `onMutate` (snapshot), `onError` (restore snapshot), `onSettled` (final sync).
  ```js
  onMutate: async (vars) => {
    await queryClient.cancelQueries({ queryKey });
    const prev = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, optimisticPatch);
    return { prev };
  },
  onError: (err, vars, ctx) => {
    queryClient.setQueryData(queryKey, ctx.prev);
  },
  onSettled: () => {
    // optional: realtime will deliver the truth; only invalidate if not using realtime
  },
  ```
- Always call `cancelQueries` first so a concurrent refetch doesn't overwrite the optimistic state mid-flight.
- Pair with Pitfall 3's realtime pattern: if you're using `setQueryData` from realtime, the `onSettled` invalidate is unnecessary.

**Detection:** Stale UI after error toasts; manually refreshing "fixes" the state; reports of "I deleted it but it came back."

---

### Pitfall 14: VAPID key rotation breaks every existing subscription
**Phase relevance:** Notifications phase
**What goes wrong:** You discover the VAPID private key was committed to git, rotate it, and now every push subscription stored in your DB fails to deliver — but the failure mode is silent (PushService returns 410 Gone).
**Why it happens:** Each `PushSubscription` is cryptographically bound to the VAPID public key the client subscribed with. Rotating the server-side key without re-subscribing clients invalidates every subscription.
**Prevention:**
- **Don't commit the private key.** Use Vercel env vars (`VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`). The public key is fine to ship to the client (it's literally how it works).
- Generate keys once with `web-push generate-vapid-keys`. Store the pair securely; keep a written backup somewhere off-machine. Losing the private key means every family member must re-subscribe.
- If rotation is needed: send a final push to all subscribers with a `data.type === 'reauth'` payload that triggers the client to call `pushManager.unsubscribe()` then re-subscribe with the new public key. Plan a 1-2 week transition period using both keys server-side, then drop the old.
- Server-side: on `410 Gone` or `404` responses from the push endpoint, delete the subscription from the DB — these are unrecoverable.

**Detection:** All push notifications silently failing after a deploy; `push_subscriptions` table populated but delivery logs all 410s.

---

### Pitfall 15: Counting a "completed" recurring chore wrong
**Phase relevance:** Chores phase / streaks
**What goes wrong:** v1 implements recurring chores by toggling `completed` and advancing `due_date`. This means:
- The chore row never accumulates completion history — only the current state.
- Streak math has no per-day record to count against.
- Un-checking a chore (mistake correction) "rewinds" `due_date` ambiguously.

**Prevention:**
- Separate the **template** from the **instances**:
  - `chores` table = templates: `id, title, assigned_to, frequency, next_due_date, active`.
  - `chore_completions` table = events: `id, chore_id, member_id, completed_at TIMESTAMPTZ, completed_for_date DATE`.
- "Completing" inserts a row into `chore_completions` and advances `next_due_date` on the template.
- "Un-completing" deletes the most recent completion row (parent permission required).
- Streak math runs against `chore_completions`, not `chores.completed`.
- `completed_for_date` (a DATE in family timezone) is what streak math groups by — independent of the precise `completed_at` UTC timestamp.

**Why this matters specifically:** Streaks (PROJECT.md Active requirement) and "richer member page" with activity history (Active requirement) and push-on-completion (parent alert) all need the completion event log to exist as first-class data. Modeling it correctly in the foundation phase is much cheaper than retrofitting later.

**Detection:** Can't answer "how many chores did Layla complete in May?" without scanning the audit log; un-check produces weird `due_date` values; streak counter and "chores done today" disagree.

---

## Minor Pitfalls

### Pitfall 16: RLS policies copied from v1 (`USING (true)`)
**Phase relevance:** Foundation
**What goes wrong:** Same issue v1 has — fully permissive RLS. With a closed app it's "low risk now," but RLS is far easier to set right from day one than to add later.
**Prevention:** Policy template: every table has `USING (auth.uid() IN (SELECT auth_user_id FROM members WHERE family_id = current_family()))`. Parent-only writes gated by `EXISTS (SELECT 1 FROM members WHERE auth_user_id = auth.uid() AND role = 'parent')`.
**Detection:** `auth_role: anon` working in SQL editor when it shouldn't.

### Pitfall 17: iCal export hardcoded to one timezone (existing v1 issue)
**Phase relevance:** Settings / iCal export
**What goes wrong:** v1 hardcodes `America/Chicago` in `api/calendar.ics.js`.
**Prevention:** Read `family_settings.timezone` server-side in the serverless function. Emit `BEGIN:VTIMEZONE`/`TZID=` matching the family setting.

### Pitfall 18: localStorage fallback diverges from server schema
**Phase relevance:** Foundation
**What goes wrong:** v1 has 7 localStorage useEffects. New rewrite uses TanStack Query with persistence — if we use `@tanstack/query-sync-storage-persister`, schema changes invalidate the persisted cache but it sometimes silently keeps stale entries.
**Prevention:** Set a `buster` key based on app version in the persister config. Bump on schema changes to force a clean refetch.

### Pitfall 19: Push payload exposes private data on the lock screen
**Phase relevance:** Notifications phase
**What goes wrong:** "Layla completed chore: take medication" on a locked phone leaks family info to bystanders.
**Prevention:** Keep notification bodies generic ("New chore activity from Layla"). Tapping opens the app to the detail. Provide a setting "show details in notifications" defaulted off for sensitive families.

### Pitfall 20: Browser back button broken by modal-style routes
**Phase relevance:** Routing
**What goes wrong:** v1's "click day to open modal" doesn't update the URL. With React Router v6 we'll want modal routes — but if implemented naively, back button closes the whole page instead of just the modal.
**Prevention:** Use React Router's `location.state.background` pattern for modal routes. Modal opens push a new history entry whose route renders the modal over the parent; back button pops back to the parent without unmounting it.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation (auth, router, query client) | #11 redirect loop, #12 deep link loss, #6 OAuth → member mapping, #16 permissive RLS | Three-state auth from day one; `auth_user_id` not email; lock down RLS now, not later |
| Migration | #4 TEXT → UUID FK chaos | Parallel columns + single-transaction cutover + `pg_dump` snapshot + branch DB dry-run |
| PWA + Notifications | #1 iOS install requirement, #2 permission UX, #14 VAPID key handling, #7 SW update flow, #8 cache eviction, #19 lock-screen privacy | Build the iOS install onboarding screen; double-permission pattern; env-var VAPID keys; prompt-style SW updates |
| Realtime + Mutations | #3 double-update, #9 channel leaks, #10 reconnect staleness, #13 missing rollback | Pick Pattern A (realtime → setQueryData, mutations → optimistic without invalidate); single ownership of channels |
| Chores | #5 timezone-naive streaks, #15 completion modeling | `chore_completions` event log + family timezone + Luxon for date math |
| Calendar / Custody | #5 timezone (recurrence + DST), #20 modal routing | Family timezone for all recurrence; `location.state.background` for modal routes |
| Settings | #17 hardcoded iCal timezone | Read `family_settings.timezone` server-side |

---

## Sources

- [PWA Push Notifications on iOS in 2026: What Really Works](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en) — HIGH (corroborated)
- [PWA iOS Limitations and Safari Support [2026]](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — HIGH
- [Apple Developer Forums: PWA push notifications on iOS](https://developer.apple.com/forums/thread/732594) — HIGH (official)
- [Apple Developer Forums: Notification.permission denied on iOS 16.5](https://developer.apple.com/forums/thread/731412) — HIGH (official, documents the WebKit bug)
- [Apple Developer Forums: iOS PWA Data Persistence Beyond 7 Days](https://developer.apple.com/forums/thread/710157) — HIGH (official)
- [Service Worker Cache Storage Limit](https://love2dev.com/blog/what-is-the-service-worker-cache-storage-limit/) — MEDIUM
- [Supabase: Fixing TooManyChannels Error](https://supabase.com/docs/guides/troubleshooting/realtime-too-many-channels-error) — HIGH (official)
- [Supabase: Handling Silent Disconnections](https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794) — HIGH (official)
- [Supabase: Realtime Heartbeats](https://supabase.com/docs/guides/troubleshooting/realtime-heartbeat-messages) — HIGH (official)
- [Supabase: Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) — HIGH (official)
- [Supabase: Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking) — HIGH (official)
- [Supabase: Realtime Channels](https://supabase.com/docs/guides/realtime/concepts) — HIGH (official)
- [Supabase JS issue #1729: docs don't explain channels need cleanup](https://github.com/supabase/supabase-js/issues/1729) — MEDIUM
- [Realtime JS issue #281: same](https://github.com/supabase/realtime-js/issues/281) — MEDIUM
- [TanStack Query v5: Query Invalidation](https://tanstack.com/query/v5/docs/framework/react/guides/query-invalidation) — HIGH (official)
- [TanStack Query: Optimistic Updates](https://tanstack.com/query/v4/docs/framework/react/guides/optimistic-updates) — HIGH (official)
- [TanStack Query discussion #7932: race conditions with cancelQueries](https://github.com/TanStack/query/discussions/7932) — HIGH
- [How to Use Supabase with TanStack Query (Makerkit)](https://makerkit.dev/blog/saas/supabase-react-query) — MEDIUM
- [Handling Realtime Data With Supabase (Nextbase docs)](https://www.usenextbase.com/docs/v2/guides/handling-realtime-data-with-supabase) — MEDIUM
- [Vite PWA: Auto Update guide](https://vite-pwa-org.netlify.app/guide/auto-update.html) — HIGH (official)
- [Vite PWA: Prompt for new content](https://vite-pwa-org.netlify.app/guide/prompt-for-update) — HIGH (official)
- [web.dev: Permission UX](https://web.dev/articles/push-notifications-permissions-ux) — HIGH (Google)
- [Smashing Magazine: Better Notifications and Permission Requests](https://www.smashingmagazine.com/2019/04/privacy-better-notifications-ux-permission-requests/) — HIGH
- [RFC 8292: VAPID for Web Push](https://datatracker.ietf.org/doc/html/rfc8292) — HIGH (official spec)
- [RFC 9749: VAPID rotation guidance](https://datatracker.ietf.org/doc/rfc9749/) — HIGH (official spec)
- [PostgreSQL: migrate primary key from serial to UUID](https://gist.github.com/julp/e52889f40d7c678afdf66d3b28082fc6) — MEDIUM
- [Convert PostgreSQL database from int IDs to UUID](https://medium.com/@turboazot/convert-postgresql-database-from-int-ids-to-uuid-v4-a1d843c8393a) — MEDIUM
- [React Router v6 redirect issue #7879](https://github.com/ReactTraining/react-router/issues/7879) — MEDIUM
- [Authentication with React Router v6 (LogRocket)](https://blog.logrocket.com/authentication-react-router-v7/) — MEDIUM
- [Comparing date-fns-tz and Luxon (Medium)](https://medium.com/@sungbinkim98/comparing-date-fns-tz-and-luxon-55aee1bab550) — MEDIUM
- [date-fns vs Day.js vs Luxon 2026 (PkgPulse)](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026) — MEDIUM
