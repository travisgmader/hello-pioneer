---
phase: 01-foundation-walking-skeleton
plan: 04a
type: execute
wave: 3
depends_on:
  - 01-03
files_modified:
  - src/data/queryClient.ts
  - src/data/useCurrentFamily.ts
  - src/data/useFamilySettings.ts
  - src/data/useRealtimeBridge.ts
  - src/auth/RequireAuth.tsx
  - src/auth/RequireFamily.tsx
  - src/routes/router.tsx
  - src/routes/RouteErrorFallback.tsx
  - src/routes/RouteErrorFallback.module.css
autonomous: false
requirements:
  - ARCH-02
  - ARCH-03
  - ARCH-07
  - ARCH-08
  - ARCH-09
user_setup: []

must_haves:
  truths:
    - "An unauthenticated browser hitting / is redirected to /login by the requireAuthLoader, no flash of protected content"
    - "requireAuthLoader signs out and redirects to /access-denied any authenticated user whose email is NOT in allowed_emails (browser-side multi-tenant gate per ARCH-01 working in concert with RLS)"
    - "An authenticated allowlisted user with no linked family row is redirected to /onboarding/create-family by RequireFamily (the route is mounted by 01-04b; Plan 05 fills in the wizard content)"
    - "Throwing in any route component renders RouteErrorFallback with heading 'Something went wrong on this page' and two CTAs (Reload this page, Back to Dashboard) — verified by tests/unit/error-boundary.test.tsx"
    - "useCurrentFamily query key is ['current-family'] with staleTime Infinity so multiple component reads do not refetch"
    - "useFamilySettings exposes a mutation that PATCHes family_settings filtered on family_id (used by ThemeToggle in 01-04b to persist user choice family-wide)"
    - "useRealtimeBridge subscribes to a single channel family:<id> and bails out cleanly when familyId is undefined (Pitfall 3 mitigated)"
    - "useRealtimeBridge cleanup calls supabase.removeChannel(channel) NOT channel.unsubscribe (Pitfall: CLAUDE.md anti-pattern)"
  artifacts:
    - path: "src/data/queryClient.ts"
      provides: "Single QueryClient with offlineFirst mutations and 30s staleTime queries"
      contains: "networkMode: 'offlineFirst'"
    - path: "src/data/useCurrentFamily.ts"
      provides: "TanStack Query hook returning the user's family row plus its joined family_settings (single source of family_id + theme per D-11 + D-15)"
      contains: "queryKey: ['current-family']"
    - path: "src/data/useFamilySettings.ts"
      provides: "Mutation hook for PATCHing family_settings (theme + other family-level prefs) — consumed by ThemeToggle in 01-04b to satisfy D-15 cross-device persistence"
      contains: "from('family_settings').update"
    - path: "src/data/useRealtimeBridge.ts"
      provides: "Single channel postgres_changes subscriber translating events into invalidateQueries per ARCH-07"
      contains: "supabase.removeChannel"
    - path: "src/auth/RequireAuth.tsx"
      provides: "Loader-based guard signing out non-allowlisted users and redirecting unauthenticated traffic to /login"
      contains: "isAllowedEmail"
    - path: "src/auth/RequireFamily.tsx"
      provides: "Component-level boundary redirecting users with no family to /onboarding/create-family"
      contains: "useCurrentFamily"
    - path: "src/routes/router.tsx"
      provides: "createBrowserRouter config with errorElement on every route per D-16"
      contains: "createBrowserRouter"
    - path: "src/routes/RouteErrorFallback.tsx"
      provides: "Error boundary fallback rendered by React Router v7 errorElement"
      contains: "Something went wrong on this page"
  key_links:
    - from: "src/auth/RequireAuth.tsx"
      to: "supabase.auth.getSession + isAllowedEmail"
      via: "Loader function that throws redirect on miss"
      pattern: "throw redirect"
    - from: "src/data/useRealtimeBridge.ts"
      to: "queryClient.invalidateQueries"
      via: "postgres_changes callback"
      pattern: "invalidateQueries"
    - from: "src/data/useFamilySettings.ts"
      to: "queryClient.invalidateQueries(['current-family'])"
      via: "useMutation onSuccess invalidation so TopNav + ThemeProvider observe the change"
      pattern: "invalidateQueries"
---

<objective>
Wire the data layer (QueryClient, useCurrentFamily, useFamilySettings, useRealtimeBridge), the auth guards (requireAuthLoader, RequireFamily), the router (createBrowserRouter with errorElement on every route per D-16), and the RouteErrorFallback. This plan deliberately stops short of mounting visual UI — the layout, nav, theme provider, and offline banner ship in 01-04b. The split exists because 01-04 was 4 tasks / 28 files / autonomous, which violates the checker's scope_sanity gate; this half terminates with a human checkpoint reviewing the auth boundary and router topology before any visible surface mounts.

Purpose: Every domain feature (Phase 2+) reads through `useCurrentFamily` and writes through `useMutation` against a known-good QueryClient. The realtime bridge translates postgres_changes into cache invalidations. The router enforces auth at load-time (no flash of protected content per Pitfall 1). The `useFamilySettings` mutation hook lands here so 01-04b's ThemeToggle can deliver D-15's cross-device theme persistence without horizontal layering.

Output: A non-visible data + auth + routing skeleton. Running `npm run build` exits 0. The `npm test` suite covering queryClient, router (redirect when unauthenticated), and error-boundary turns GREEN. 01-04b mounts this skeleton inside a visual shell.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/01-foundation-walking-skeleton/01-CONTEXT.md
@.planning/phases/01-foundation-walking-skeleton/01-RESEARCH.md
@.planning/phases/01-foundation-walking-skeleton/01-PATTERNS.md
@.planning/phases/01-foundation-walking-skeleton/01-UI-SPEC.md
@.planning/phases/01-foundation-walking-skeleton/01-01-SUMMARY.md
@.planning/phases/01-foundation-walking-skeleton/01-02-SUMMARY.md
@.planning/phases/01-foundation-walking-skeleton/01-03-SUMMARY.md
@CLAUDE.md
@../family-app/src/context/AppContext.jsx
@src/data/supabase.ts
@src/data/types.ts
@src/auth/allowlist.ts
@src/lib/check.ts

<interfaces>
Established by this plan, consumed by 01-04b (RootLayout + shell) and Plan 05 (Wizard) and Phase 2+ (all domain features):

src/data/queryClient.ts exports a singleton QueryClient with offlineFirst mutations.

src/data/useCurrentFamily.ts exports useCurrentFamily() returning a UseQueryResult typed as the families row joined with its family_settings (or null if the user has no linked member). Joined shape allows ThemeProvider in 01-04b to read family_settings.theme without a second query.

src/data/useFamilySettings.ts exports useFamilySettings() returning a useMutation that PATCHes `public.family_settings` with the provided partial. ThemeToggle in 01-04b calls this with `{ theme: 'midnight' | 'lavender' }` on user click to satisfy D-15's "family-wide, all devices see the same theme" requirement.

src/data/useRealtimeBridge.ts exports useRealtimeBridge() with no arguments, mounted once inside RootLayout (in 01-04b).

src/auth/RequireAuth.tsx exports a requireAuthLoader function (loader for the `/` parent route) and a RequireAuth component (not used in Phase 1 but available for nested layouts).

src/auth/RequireFamily.tsx exports a RequireFamily component that wraps app-area routes and redirects to /onboarding/create-family when useCurrentFamily resolves to null.

src/routes/router.tsx exports the configured router built via createBrowserRouter.

The route table (placeholder children for the RootLayout subtree come from 01-04b; this plan declares the topology with stub elements that 01-04b replaces):
- /login (public — from Plan 03)
- /access-denied (public — from Plan 03)
- / (requireAuthLoader)
  - /onboarding/create-family (no RequireFamily wrapper; Plan 05 fills in the wizard)
  - RootLayout wrapper (with RequireFamily) — RootLayout component placeholder until 01-04b
    - /dashboard, /chores, /calendar, /meals, /groceries, /notes — placeholders until 01-04b
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 4a.1: QueryClient + useCurrentFamily + useFamilySettings + useRealtimeBridge data layer</name>
  <files>src/data/queryClient.ts, src/data/useCurrentFamily.ts, src/data/useFamilySettings.ts, src/data/useRealtimeBridge.ts</files>
  <read_first>.planning/phases/01-foundation-walking-skeleton/01-RESEARCH.md (Patterns 5, 6, 7 + Pitfalls 3, 7), .planning/phases/01-foundation-walking-skeleton/01-PATTERNS.md (sections for src/data/useCurrentFamily.ts and src/data/useRealtimeBridge.ts), .planning/phases/01-foundation-walking-skeleton/01-CONTEXT.md (D-11 single source of family_id + D-15 theme persisted family-wide), ../family-app/src/context/AppContext.jsx (the realtime block lines 62 to 74 is the model), src/data/supabase.ts, src/data/types.ts</read_first>
  <behavior>
    - queryClient is a singleton QueryClient with queries staleTime 30000, gcTime 300000, retry 1, refetchOnWindowFocus false, networkMode online; mutations networkMode offlineFirst, retry 0
    - useCurrentFamily returns UseQueryResult typed as `{ data: (FamiliesRow & { family_settings: FamilySettingsRow | null }) | null, isLoading, error }`. Query key is ['current-family']. staleTime Infinity. queryFn calls supabase.auth.getUser, returns null if no user, otherwise queries `from('members').select('family_id, families:family_id ( *, family_settings ( * ) )').eq('auth_user_id', user.id).maybeSingle()` and returns the embedded family object (with its embedded family_settings).
    - useFamilySettings returns a useMutation hook. mutationFn signature: `(patch: Partial<FamilySettingsRow>) => Promise<void>`. Reads familyId from useCurrentFamily; throws if familyId is undefined. Calls `supabase.from('family_settings').update(patch).eq('family_id', familyId)` and throws on error. onSuccess invalidates `['current-family']` so ThemeProvider re-reads the new value (and realtime will also push the change to the other device, satisfying D-15 cross-device sync).
    - useRealtimeBridge subscribes to a single channel named `family:<familyId>` with one `.on('postgres_changes', ...)` call per table in the FAMILY_SCOPED_TABLES tuple; on cleanup calls supabase.removeChannel(channel) NOT channel.unsubscribe
    - useRealtimeBridge bails out (returns early) when familyId is undefined, preventing the Pitfall 3 anonymous-subscription scenario
    - tests/unit/queryClient.test.ts passes asserting defaultOptions.mutations.networkMode equals 'offlineFirst' and defaultOptions.queries.networkMode equals 'online'
  </behavior>
  <action>
src/data/queryClient.ts per RESEARCH.md Pattern 5:

Import QueryClient from @tanstack/react-query. Export const queryClient = new QueryClient with defaultOptions.queries containing staleTime 30000, gcTime 300000, retry 1, refetchOnWindowFocus false, networkMode 'online'; defaultOptions.mutations containing networkMode 'offlineFirst', retry 0. Add a comment block explaining D-01 (offlineFirst on mutations) and D-02 (in-memory only, no persistQueryClient in Phase 1) sourced from CONTEXT.md.

src/data/useCurrentFamily.ts per RESEARCH.md Pattern 6 and PATTERNS.md section for src/data/useCurrentFamily.ts, EXTENDED to embed family_settings:

Import useQuery from @tanstack/react-query, import supabase from ./supabase, import Database from ./types. Define a local type alias `FamilyWithSettings = Database['public']['Tables']['families']['Row'] & { family_settings: Database['public']['Tables']['family_settings']['Row'] | null }`. Export function useCurrentFamily() returning useQuery with queryKey ['current-family'], queryFn an async function that calls supabase.auth.getUser, returns null when user is null, otherwise queries supabase.from('members').select with the embedded shape `'family_id, families:family_id ( *, family_settings ( * ) )'`. Use `.eq('auth_user_id', user.id).maybeSingle()`, throw on error, return `(data?.families as FamilyWithSettings) ?? null`. Set staleTime Infinity. Type the return as `UseQueryResult<FamilyWithSettings | null, Error>`.

NOTE: Postgres-REST nested embeds return arrays unless the FK is unique. `family_settings.family_id` has a unique partial index (added in Plan 02 migration as a backing index for the FK) so PostgREST returns a single object; the type alias treats it as `FamilySettingsRow | null`.

src/data/useFamilySettings.ts (NEW file — added per BLOCKER 1 fix to deliver D-15 cross-device theme persistence):

Import useMutation, useQueryClient from @tanstack/react-query. Import supabase from ./supabase. Import Database from ./types. Import useCurrentFamily from ./useCurrentFamily. Define local type alias `FamilySettingsRow = Database['public']['Tables']['family_settings']['Row']`.

Export function useFamilySettings() returning useMutation<void, Error, Partial<FamilySettingsRow>>. Inside the hook body: const qc = useQueryClient(); const { data: family } = useCurrentFamily(). The mutationFn signature `(patch: Partial<FamilySettingsRow>)`: if `!family?.id` throw new Error('No current family — cannot update settings'); call `await supabase.from('family_settings').update(patch).eq('family_id', family.id)`; throw on error. onSuccess: `qc.invalidateQueries({ queryKey: ['current-family'] })`. Return the useMutation result so callers can read isPending and error.

Add a JSDoc note: "Implements D-15 cross-device theme persistence. ThemeToggle (01-04b) calls `mutate({ theme })`; useRealtimeBridge's postgres_changes subscription on `family_settings` pushes the change to all other devices logged into the same family, where their `useCurrentFamily` invalidates and ThemeProvider re-reads. This closes the cross-device sync loop without polling."

src/data/useRealtimeBridge.ts per RESEARCH.md Pattern 7 and PATTERNS.md section for src/data/useRealtimeBridge.ts:

Define module-scoped const FAMILY_SCOPED_TABLES as a tuple ['families', 'members', 'family_settings', 'chores', 'chore_completions', 'events', 'meals', 'groceries', 'notes', 'push_subscriptions', 'notifications_queue']. Export function useRealtimeBridge:
- import useEffect from react, useQueryClient from @tanstack/react-query, supabase from ./supabase, useCurrentFamily from ./useCurrentFamily
- inside, get queryClient via useQueryClient and familyId via useCurrentFamily().data?.id
- in a useEffect with dependencies [familyId, queryClient]: if familyId is undefined return; otherwise build channel via supabase.channel(`family:${familyId}`); iterate FAMILY_SCOPED_TABLES and for each table call channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: table === 'families' ? `id=eq.${familyId}` : `family_id=eq.${familyId}` }, (payload) => queryClient.invalidateQueries({ queryKey: [table, familyId] })); call channel.subscribe; return cleanup arrow that calls supabase.removeChannel(channel)

Add JSDoc warning: This hook MUST be called inside RootLayout (after RequireAuth and RequireFamily pass) per RESEARCH.md Pitfall 3. Realtime authorization is set at subscribe time; subscribing before auth produces a silent dead channel.

DO NOT push realtime payloads directly into the cache (anti-pattern in CLAUDE.md and RESEARCH.md). Use invalidateQueries only.
  </action>
  <verify>
    <automated>npm test -- tests/unit/queryClient.test.ts && grep -c "networkMode: 'offlineFirst'" src/data/queryClient.ts | grep -E "^[1-9]" && grep -c "supabase.removeChannel" src/data/useRealtimeBridge.ts | grep -E "^[1-9]" && grep -c "channel.unsubscribe" src/data/useRealtimeBridge.ts | grep -E "^0$" && grep -c "from('family_settings').update" src/data/useFamilySettings.ts | grep -E "^[1-9]" && grep -c "family_settings ( \* )" src/data/useCurrentFamily.ts | grep -E "^[1-9]" && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - src/data/queryClient.ts contains the literal string networkMode: 'offlineFirst'
    - src/data/queryClient.ts contains staleTime: 30 (followed by 000)
    - src/data/useCurrentFamily.ts contains queryKey: ['current-family']
    - src/data/useCurrentFamily.ts contains the select string `family_id, families:family_id ( *, family_settings ( * ) )` (joined family_settings shape for D-15)
    - src/data/useFamilySettings.ts exists and exports a default or named `useFamilySettings`
    - src/data/useFamilySettings.ts contains `from('family_settings').update`
    - src/data/useFamilySettings.ts contains `invalidateQueries({ queryKey: ['current-family'] })`
    - src/data/useRealtimeBridge.ts contains supabase.removeChannel
    - src/data/useRealtimeBridge.ts does NOT contain channel.unsubscribe (grep returns 0)
    - src/data/useRealtimeBridge.ts contains all 11 family-scoped table names in the FAMILY_SCOPED_TABLES tuple
    - src/data/useRealtimeBridge.ts contains the filter expression `family_id=eq.${familyId}`
    - npm test -- tests/unit/queryClient.test.ts passes
    - npx tsc --noEmit exits 0
  </acceptance_criteria>
  <done>The data layer (QueryClient, current-family with embedded family_settings, family settings mutation hook, realtime bridge) is wired and tested. 01-04b's ThemeToggle can now call `useFamilySettings().mutate({ theme })` to write to Postgres; useRealtimeBridge will push the change to other devices.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4a.2: Auth guards + router with errorElement on every route</name>
  <files>src/auth/RequireAuth.tsx, src/auth/RequireFamily.tsx, src/routes/router.tsx, src/routes/RouteErrorFallback.tsx, src/routes/RouteErrorFallback.module.css</files>
  <read_first>.planning/phases/01-foundation-walking-skeleton/01-RESEARCH.md (Pattern 2 + Pitfall 1 + Open Question 3 (RESOLVED)), .planning/phases/01-foundation-walking-skeleton/01-UI-SPEC.md (Interaction Contracts row for Error boundary fallback + Copywriting Contract rows for Error boundary), src/data/supabase.ts, src/auth/allowlist.ts</read_first>
  <behavior>
    - requireAuthLoader (exported from RequireAuth.tsx) is an async function with no arguments that: calls supabase.auth.getSession; if no session throws redirect('/login'); otherwise calls isAllowedEmail(session.user.email); if false calls supabase.auth.signOut() and throws redirect('/access-denied?email=' + encodeURIComponent(session.user.email)); otherwise returns { user: session.user }
    - RequireFamily is a React component that calls useCurrentFamily; if isLoading renders a centered "Loading your family" placeholder; if data is null calls navigate('/onboarding/create-family', { replace: true }) inside a useEffect; otherwise renders children via {children}
    - router exports the default object built by createBrowserRouter with the route tree: /login, /access-denied, / (with requireAuthLoader and errorElement), nested onboarding/create-family route (no RequireFamily wrapper), and a RootLayout wrapper with the six placeholder children. Every route MUST declare errorElement: <RouteErrorFallback />
    - The RootLayout and per-tab route elements are placeholders in this plan (a sentinel `const Placeholder = () => null` or stub elements). 01-04b replaces them with the real components in the SAME router file — the route topology defined here is final, only the element references change.
    - RouteErrorFallback renders a card with heading "Something went wrong on this page" (in var(--pink-dark)) and body "We've logged the error. Try reloading, or head back to the dashboard." plus two CTAs: primary "Reload this page" (calls window.location.reload), secondary "Back to Dashboard" (Link to /dashboard)
    - Throwing a synthetic Error inside any route component causes RouteErrorFallback to render in place of that route's content (verified by tests/unit/error-boundary.test.tsx)
  </behavior>
  <action>
src/auth/RequireAuth.tsx per RESEARCH.md Pattern 2 (requireAuthLoader code block):

Import { redirect } from react-router, import supabase from ../data/supabase, import isAllowedEmail from ./allowlist. Export async function requireAuthLoader (no args). Body: `const { data: { session } } = await supabase.auth.getSession();` if `!session` throw `redirect('/login')`; `const allowed = await isAllowedEmail(session.user.email!);` if `!allowed` then `await supabase.auth.signOut();` and `throw redirect('/access-denied?email=' + encodeURIComponent(session.user.email!));` otherwise `return { user: session.user };`.

Also export a RequireAuth component (function returning {children}) for nested-layout use cases, even though Phase 1 uses the loader pattern exclusively. The component-level RequireAuth call sequence: useLoaderData to read the user, render children.

src/auth/RequireFamily.tsx per RESEARCH.md Pattern 2 (component-level boundary description):

Functional component RequireFamily accepting { children: ReactNode }. Import useCurrentFamily from ../data/useCurrentFamily, import useNavigate from react-router, import useEffect from react. Body: `const { data: family, isLoading } = useCurrentFamily(); const navigate = useNavigate();` useEffect calls `navigate('/onboarding/create-family', { replace: true })` if not isLoading and family is null, dependency array [family, isLoading, navigate]. While isLoading return a centered div with the literal string "Loading your family" (Heading 20px). When family is null return null (the useEffect handles the redirect). Otherwise return {children}.

src/routes/router.tsx per RESEARCH.md Pattern 2 (createBrowserRouter code block):

Import createBrowserRouter, redirect, Outlet from react-router. Import requireAuthLoader from ../auth/RequireAuth. Import RouteErrorFallback from ./RouteErrorFallback. Import Login from ./login, AccessDenied from ./access-denied. The RootLayout and tab routes (Dashboard, Chores, Calendar, Meals, Groceries, Notes) and the CreateFamily route do NOT yet have real components — 01-04b adds RootLayout + the six placeholders, Plan 05 adds the wizard. For this plan use stub default exports referenced via direct imports that 01-04b will replace. Concretely: define a single `const Stub = () => null` at the top of router.tsx and use it for RootLayout + the six tab elements + the CreateFamily element. Add a TODO comment listing exactly which imports 01-04b must add to replace the stubs. Do NOT name the stub `RootLayout` so that 01-04b's `import RootLayout from './RootLayout'` cleanly replaces the reference.

Build the route tree (verbatim from RESEARCH.md Pattern 2 with errorElement on every route per D-16):
- { path: '/login', element: <Login />, errorElement: <RouteErrorFallback /> }
- { path: '/access-denied', element: <AccessDenied />, errorElement: <RouteErrorFallback /> }
- { path: '/', loader: requireAuthLoader, errorElement: <RouteErrorFallback />, children: [
  - { path: 'onboarding/create-family', element: <Stub />, errorElement: <RouteErrorFallback /> }
  - { element: <Stub />, errorElement: <RouteErrorFallback />, children: [
    - { path: '', loader: () => redirect('/dashboard') }
    - { path: 'dashboard', element: <Stub />, errorElement: <RouteErrorFallback /> }
    - { path: 'chores', element: <Stub />, errorElement: <RouteErrorFallback /> }
    - { path: 'calendar', element: <Stub />, errorElement: <RouteErrorFallback /> }
    - { path: 'meals', element: <Stub />, errorElement: <RouteErrorFallback /> }
    - { path: 'groceries', element: <Stub />, errorElement: <RouteErrorFallback /> }
    - { path: 'notes', element: <Stub />, errorElement: <RouteErrorFallback /> }
  - ] }
- ] }
- { path: '*', element: <RouteErrorFallback /> }

Export const router = createBrowserRouter([...]). All imports from react-router only (NEVER react-router-dom).

src/routes/RouteErrorFallback.tsx per UI-SPEC Copywriting Contract:

Functional component. Use useRouteError() and isRouteErrorResponse from react-router to extract error context. Render div class styles.wrapper containing div class styles.card. Inside: h1 class styles.title with the literal string "Something went wrong on this page". p class styles.body with the literal string "We've logged the error. Try reloading, or head back to the dashboard." Two buttons: button class styles.primary onClick window.location.reload with label "Reload this page", and Link class styles.secondary to "/dashboard" with label "Back to Dashboard". console.error the raw error inside the component body so devtools surfaces the stack.

src/routes/RouteErrorFallback.module.css: .wrapper centered flex, min-height 100vh, padding 24px, background var(--bg). .card max-width 480px, background var(--card-bg), padding 24px, border-radius var(--radius), box-shadow var(--shadow), display flex flex-direction column gap 16px. .title color var(--pink-dark), font-size 20px, font-weight 700. .body color var(--text), font-size 14px. .primary background var(--lavender), color white, padding 12px 20px, border-radius var(--radius-sm), min-height 44px. .secondary background transparent, color var(--text), text-decoration none, padding 12px 20px, border 2px solid var(--border), border-radius var(--radius-sm), min-height 44px. On mobile (max-width 768px), stack the buttons vertically (flex-direction column on a button container). All hex colors via var(--token).
  </action>
  <verify>
    <automated>npm test -- tests/unit/error-boundary.test.tsx && npm test -- tests/unit/router.test.tsx ; grep -c "errorElement" src/routes/router.tsx | grep -E "^[1-9]" ; grep -c "throw redirect" src/auth/RequireAuth.tsx | grep -E "^[1-9]" ; grep -c "react-router-dom" src/routes/router.tsx | grep -E "^0$"</automated>
  </verify>
  <acceptance_criteria>
    - src/auth/RequireAuth.tsx contains supabase.auth.getSession AND isAllowedEmail AND supabase.auth.signOut AND `throw redirect`
    - src/auth/RequireFamily.tsx contains useCurrentFamily AND `navigate('/onboarding/create-family', { replace: true })`
    - src/routes/router.tsx contains createBrowserRouter AND requireAuthLoader
    - src/routes/router.tsx contains errorElement at least 10 times (one per route declaration plus the catch-all)
    - src/routes/router.tsx does NOT import from react-router-dom (grep returns 0)
    - src/routes/router.tsx contains a TODO comment naming the exact imports 01-04b must add (RootLayout, Dashboard, Chores, Calendar, Meals, Groceries, Notes) and Plan 05 must add (CreateFamily)
    - src/routes/RouteErrorFallback.tsx contains the literal string "Something went wrong on this page"
    - src/routes/RouteErrorFallback.tsx contains the literal string "Reload this page"
    - src/routes/RouteErrorFallback.tsx contains the literal string "Back to Dashboard"
    - npm test -- tests/unit/error-boundary.test.tsx passes
    - npm test -- tests/unit/router.test.tsx passes the unauthenticated redirect test
    - npx tsc --noEmit exits 0
  </acceptance_criteria>
  <done>The router exists with auth guards and error boundaries on every route. Unauthenticated traffic redirects to /login. Non-allowlisted traffic redirects to /access-denied with sign-out side effect. 01-04b replaces the Stub references with the real layout and tab components.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 4a.3: Auth boundary + router topology review</name>
  <what-built>
    - QueryClient singleton with offlineFirst mutations
    - useCurrentFamily query with embedded family_settings (D-15 prep)
    - useFamilySettings mutation hook for cross-device theme persistence (D-15)
    - useRealtimeBridge with single channel + removeChannel cleanup (ARCH-07)
    - requireAuthLoader signs out non-allowlisted users (ARCH-01 browser-side gate)
    - RequireFamily component redirects userless-family to wizard
    - createBrowserRouter with errorElement on every route (D-16, ARCH-08)
    - RouteErrorFallback matching UI-SPEC copy
  </what-built>
  <how-to-verify>
This checkpoint exists to review the auth boundary and data-layer security model BEFORE the visual shell mounts in 01-04b. The split exists because the combined 01-04 was 4 tasks / 28 files / autonomous, which is the highest-risk shape in the phase. Review the source artifacts at this gate so any boundary mistake is caught before it gets buried under nav + layout code.

1. Open src/auth/RequireAuth.tsx. Confirm the requireAuthLoader sequence is exactly: getSession → if no session throw redirect('/login') → isAllowedEmail check → if not allowed signOut then throw redirect('/access-denied?email=...') → otherwise return { user }. No early-return that could skip the allowlist check. No catch block that swallows the signOut error.

2. Open src/auth/RequireFamily.tsx. Confirm the navigate('/onboarding/create-family', { replace: true }) is inside a useEffect (not at component body) and that the dependency array is [family, isLoading, navigate]. Confirm the loading state renders the "Loading your family" placeholder (not null, not children).

3. Open src/routes/router.tsx. Confirm errorElement is declared on EVERY route entry including the parent `/` route, the RootLayout wrapper, all six tab routes, the onboarding/create-family route, the login route, the access-denied route, and the catch-all `*`. Run `grep -c errorElement src/routes/router.tsx` and confirm the count is ≥ 10. Confirm `react-router-dom` is NOT imported anywhere in the file.

4. Open src/data/useCurrentFamily.ts. Confirm the select string embeds family_settings: `'family_id, families:family_id ( *, family_settings ( * ) )'`. This is the substrate D-15 cross-device theme persistence depends on.

5. Open src/data/useFamilySettings.ts. Confirm the mutationFn throws if familyId is undefined (defensive: should never happen because ThemeToggle is inside RootLayout which is inside RequireFamily, but the throw documents the invariant). Confirm onSuccess invalidates ['current-family'].

6. Open src/data/useRealtimeBridge.ts. Confirm:
   a. The FAMILY_SCOPED_TABLES tuple has exactly 11 entries.
   b. The filter for `families` is `id=eq.${familyId}` (NOT family_id, which doesn't exist on families).
   c. The cleanup is `supabase.removeChannel(channel)` — `grep channel.unsubscribe` returns nothing.
   d. The hook bails out (returns) when familyId is undefined.

7. Run the test suite for the wave:
   `npm test -- tests/unit/queryClient.test.ts tests/unit/router.test.tsx tests/unit/error-boundary.test.tsx`
   All three should pass.

8. Run `npx tsc --noEmit` and confirm it exits 0. (At this point src/routes/router.tsx still uses `const Stub = () => null` for RootLayout + tab elements — that's expected. 01-04b removes the Stub.)

9. Source-level threat check: confirm the JSDoc on src/data/useRealtimeBridge.ts mentions Pitfall 3 (must be mounted after RequireFamily). Confirm src/data/useFamilySettings.ts JSDoc mentions D-15 cross-device persistence path.

If all checks pass, type `approved`. 01-04b will then proceed to mount the visual shell on this foundation.
  </how-to-verify>
  <files>n/a (verification-only)</files>
  <action>Halt automated execution and wait for the human to perform the boundary + topology review in <how-to-verify>. The human MUST verify: requireAuthLoader sign-out sequence, RequireFamily useEffect dependency array, router errorElement count ≥ 10, useCurrentFamily embeds family_settings, useFamilySettings invalidates ['current-family'], useRealtimeBridge uses removeChannel (not unsubscribe), test suite for the wave passes, npx tsc --noEmit exits 0. Then type approved.</action>
  <verify>
    <automated>npm test -- tests/unit/queryClient.test.ts tests/unit/router.test.tsx tests/unit/error-boundary.test.tsx && npx tsc --noEmit && grep -c "errorElement" src/routes/router.tsx | grep -E "^(1[0-9]|[2-9][0-9])$|^10$"</automated>
  </verify>
  <done>Human typed approved. Auth boundary, data layer, and router topology verified. 01-04b unblocked to mount the visual shell.</done>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser route loader -> Supabase Auth | requireAuthLoader reads session and allowlist BEFORE any protected component mounts. |
| browser -> Supabase Realtime WebSocket | Postgres changes flow over a server-pushed channel; RLS gates each row. |
| browser -> family_settings table (PATCH) | useFamilySettings mutation writes user-controlled theme; RLS gates target row. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04a-01 | Information Disclosure | Flash of protected content before auth check | mitigate | requireAuthLoader is a React Router v7 loader, runs BEFORE the route's element mounts. RESEARCH.md Pitfall 1 explicitly addresses this. |
| T-04a-02 | Information Disclosure | Realtime channel for family A leaks to family B | mitigate | The channel filter is `family_id=eq.<familyId>` sourced from useCurrentFamily — never from URL or user input. RLS is the backstop. |
| T-04a-03 | Tampering | Channel subscribed before auth resolves -> silent dead channel | mitigate | useRealtimeBridge bails out when familyId is undefined. It mounts inside RootLayout which is inside RequireFamily which is inside requireAuthLoader. Pitfall 3 mitigated. |
| T-04a-04 | Tampering | channel.unsubscribe leaving dangling reference | mitigate | useRealtimeBridge cleanup calls supabase.removeChannel — CLAUDE.md and RESEARCH.md anti-pattern called out explicitly. |
| T-04a-05 | Tampering | useFamilySettings mutates a different family's settings | mitigate | The `.eq('family_id', family.id)` filter uses `family.id` from useCurrentFamily — the authenticated user's own family. RLS family_settings_update policy gates by `family_id = private.current_family_id()` as backstop. Cross-family writes return 0 rows affected. |
| T-04a-06 | Information Disclosure | Open redirect via Link in RouteErrorFallback | mitigate | Link target is hardcoded /dashboard — no user-controlled href. |
| T-04a-07 | Denial of Service | Realtime channel keeps WebSocket open after sign-out | mitigate | RootLayout unmounts on navigation to /login (post sign-out). useEffect cleanup runs removeChannel. |
| T-04a-SC | Tampering | npm packages | mitigate | No new packages in this plan. |
</threat_model>

<verification>
1. npm test passes tests/unit/queryClient.test.ts, tests/unit/router.test.tsx, tests/unit/error-boundary.test.tsx.
2. npx tsc --noEmit exits 0.
3. npm run build exits 0 (the Stub placeholders compile cleanly).
4. Source-level review (Task 4a.3) confirms auth boundary and data layer integrity.
</verification>

<success_criteria>
- The data layer (QueryClient, useCurrentFamily with embedded family_settings, useFamilySettings, useRealtimeBridge) is wired and tested.
- The auth boundary (requireAuthLoader + RequireFamily) is in place and signs out non-allowlisted users.
- The router exists with errorElement on every route per D-16.
- D-15 cross-device theme persistence has its data path (useFamilySettings → DB → realtime invalidate → useCurrentFamily refetch) in place; 01-04b's ThemeToggle wires the user-facing handler.
- The split contains the autonomous file count to ~9 files with a human gate before the visual layer mounts (scope_sanity warning resolved).
</success_criteria>

<output>
Create `.planning/phases/01-foundation-walking-skeleton/01-04a-SUMMARY.md` when done.
</output>
</content>
</invoke>