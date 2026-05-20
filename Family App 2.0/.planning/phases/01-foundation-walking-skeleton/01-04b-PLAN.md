---
phase: 01-foundation-walking-skeleton
plan: 04b
type: execute
wave: 4
depends_on:
  - 01-04a
files_modified:
  - src/main.tsx
  - src/routes/router.tsx
  - src/routes/RootLayout.tsx
  - src/routes/RootLayout.module.css
  - src/routes/dashboard.tsx
  - src/routes/chores.tsx
  - src/routes/calendar.tsx
  - src/routes/meals.tsx
  - src/routes/groceries.tsx
  - src/routes/notes.tsx
  - src/routes/placeholder.module.css
  - src/components/TopNav.tsx
  - src/components/TopNav.module.css
  - src/components/BottomNav.tsx
  - src/components/BottomNav.module.css
  - src/components/OfflineBanner.tsx
  - src/components/OfflineBanner.module.css
  - src/components/ReconnectedToast.tsx
  - src/components/ReconnectedToast.module.css
  - src/components/ThemeToggle.tsx
  - src/components/ThemeToggle.module.css
  - src/theme/ThemeProvider.tsx
autonomous: true
requirements:
  - ARCH-02
  - ARCH-07
  - ARCH-09
user_setup: []

must_haves:
  truths:
    - "An authenticated user with a linked family sees the RootLayout: TopNav with family name + theme toggle + sign-out, BottomNav with six emoji tabs, an Outlet for the placeholder routes, and the OfflineBanner mount point"
    - "Clicking a bottom tab navigates client-side via NavLink, the URL updates, the active tab gets var(--lavender-light) tint plus a 2px upward translate, no full page reload"
    - "An authenticated user with the family present sees one of six placeholder pages (Dashboard, Chores, Calendar, Meals, Groceries, Notes) with the UI-SPEC heading and the Coming soon body copy referencing the future phase number"
    - "Setting navigator.onLine to false (DevTools throttle) causes OfflineBanner to slide down from top with the copy 'Offline — changes will sync when reconnected'; setting back to true triggers ReconnectedToast for 3 seconds then auto-dismiss"
    - "Changes made on one device appear on another device within ~1 second without page reload (realtime bridge + invalidateQueries delivers UI freshness)"
    - "Signing out immediately stops receiving realtime events (RootLayout unmounts, useEffect cleanup runs supabase.removeChannel)"
    - "Clicking the Midnight chip on ThemeToggle on device A persists `family_settings.theme = 'midnight'` to Postgres via useFamilySettings; device B (signed into the same family) observes the change within ~1 second via the realtime bridge and ThemeProvider applies it without a page reload — satisfying D-15 family-wide, all-devices theme persistence"
    - "Theme: on first load with no family, document.documentElement gets data-theme midnight if window.matchMedia('(prefers-color-scheme: dark)').matches, else no attribute (Lavender). After family loads, family_settings.theme overrides the OS preference"
  artifacts:
    - path: "src/routes/RootLayout.tsx"
      provides: "Authenticated shell with TopNav, BottomNav, Outlet, OfflineBanner, useRealtimeBridge mount"
      contains: "useRealtimeBridge"
    - path: "src/components/BottomNav.tsx"
      provides: "Six-tab mobile bottom bar with NavLink + emoji tabs"
      contains: "📝"
    - path: "src/components/OfflineBanner.tsx"
      provides: "Fixed-top banner driven by navigator.onLine + MutationCache.isPaused"
      contains: "getMutationCache"
    - path: "src/components/ThemeToggle.tsx"
      provides: "Inline chip pair writing user theme choice via useFamilySettings (D-15 cross-device persistence)"
      contains: "useFamilySettings"
    - path: "src/theme/ThemeProvider.tsx"
      provides: "OS-default + family_settings.theme reconciliation via document.documentElement.setAttribute"
      contains: "prefers-color-scheme"
    - path: "src/main.tsx"
      provides: "App composition: StrictMode + QueryClientProvider + ThemeProvider + RouterProvider + ReactQueryDevtools"
      contains: "RouterProvider"
  key_links:
    - from: "src/main.tsx"
      to: "QueryClientProvider + RouterProvider + ThemeProvider"
      via: "Component composition with queryClient and router imports"
      pattern: "RouterProvider"
    - from: "src/routes/RootLayout.tsx"
      to: "useRealtimeBridge"
      via: "Hook call at top of component"
      pattern: "useRealtimeBridge\\(\\)"
    - from: "src/components/OfflineBanner.tsx"
      to: "queryClient.getMutationCache().subscribe"
      via: "mutation cache event listener"
      pattern: "getMutationCache\\(\\)\\.subscribe"
    - from: "src/components/ThemeToggle.tsx"
      to: "useFamilySettings (from 01-04a)"
      via: "useMutation call on user click to PATCH family_settings.theme"
      pattern: "useFamilySettings"
---

<objective>
Mount the visual app shell on the foundation 01-04a established: TopNav + BottomNav + RootLayout, six placeholder route components, the OfflineBanner + ReconnectedToast, the ThemeProvider that reconciles OS preference with `family_settings.theme`, and the ThemeToggle that PERSISTS the user's choice to Postgres (D-15 cross-device family-wide theme). Replace the `Stub` references in `src/routes/router.tsx` with the real components. Wire `src/main.tsx` to compose StrictMode + QueryClientProvider + ThemeProvider + RouterProvider + ReactQueryDevtools.

Purpose: This is the visual half of the post-auth shell. After 01-04b ships, an allowlisted user with a family sees the full UI-SPEC navigation pattern. The ThemeToggle's DB write (via useFamilySettings from 01-04a) closes D-15's "family-wide, all devices" loop — a change on one device propagates to all others through Supabase Realtime + queryClient.invalidateQueries.

Output: A clickable, themed, RLS-protected app shell with six placeholder routes. `npm run build` exits 0. `npm test` covering offline-banner turns GREEN. The deployed preview URL (Plan 06) will smoke this end to end.
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
@.planning/phases/01-foundation-walking-skeleton/01-04a-SUMMARY.md
@CLAUDE.md
@../family-app/src/components/Nav.jsx
@../family-app/src/components/Nav.module.css
@../family-app/src/App.jsx
@src/data/queryClient.ts
@src/data/useCurrentFamily.ts
@src/data/useFamilySettings.ts
@src/data/useRealtimeBridge.ts
@src/auth/RequireFamily.tsx
@src/routes/router.tsx

<interfaces>
Consumed from 01-04a:

- queryClient (singleton from src/data/queryClient.ts)
- useCurrentFamily() — returns `{ data: FamilyWithSettings | null }` where FamilyWithSettings embeds family_settings
- useFamilySettings() — useMutation hook accepting Partial<FamilySettingsRow>; ThemeToggle calls `.mutate({ theme })`
- useRealtimeBridge() — mounted once inside RootLayout
- RequireFamily component — wraps RootLayout
- router (from src/routes/router.tsx) — topology declared in 01-04a; this plan replaces the Stub references with real components

Established by this plan, consumed by Plan 05 (Family Creation Wizard) and Phase 2+ (all domain features):

- src/routes/RootLayout.tsx default export — the authenticated shell
- src/routes/dashboard.tsx, chores.tsx, calendar.tsx, meals.tsx, groceries.tsx, notes.tsx — six placeholder default exports
- src/components/TopNav, BottomNav, OfflineBanner, ReconnectedToast, ThemeToggle — composable components
- src/theme/ThemeProvider — must wrap RouterProvider in main.tsx
- src/main.tsx — final app composition
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 4b.1: Nav components + ThemeProvider + ThemeToggle (with D-15 DB write)</name>
  <files>src/components/TopNav.tsx, src/components/TopNav.module.css, src/components/BottomNav.tsx, src/components/BottomNav.module.css, src/components/ThemeToggle.tsx, src/components/ThemeToggle.module.css, src/theme/ThemeProvider.tsx</files>
  <read_first>../family-app/src/components/Nav.jsx, ../family-app/src/components/Nav.module.css, ../family-app/src/App.jsx (theme useEffect lines 22 to 27), .planning/phases/01-foundation-walking-skeleton/01-PATTERNS.md (sections for TopNav, BottomNav, ThemeProvider), .planning/phases/01-foundation-walking-skeleton/01-UI-SPEC.md (Color section + Interaction Contracts rows for nav + theme), .planning/phases/01-foundation-walking-skeleton/01-CONTEXT.md (D-15 theme persisted to family_settings), src/data/useCurrentFamily.ts, src/data/useFamilySettings.ts</read_first>
  <behavior>
    - TopNav renders sticky top: 0, z-index 200, var(--card-bg) background, 2px var(--border) bottom border. Left: family name from useCurrentFamily (defaults to "Family Plan" if family is null). Center on desktop (>=769px): six NavLinks rendered as pills using NAV_ITEMS tuple. Right: ThemeToggle + Sign out button. Member avatar chips are NOT rendered (D-14: Phase 2).
    - BottomNav renders fixed bottom: 0, z-index 300, full-width, var(--card-bg) background, 1px top border, padding-bottom: max(env(safe-area-inset-bottom, 12px), 12px). Six tabs (Dashboard 🏠, Chores ✅, Calendar 📅, Meals 🍽️, Groceries 🛒, Notes 📝) — per UI-SPEC note Phase 1 v2 shows all 6. Each tab is a NavLink with className using isActive from react-router; active tab gets var(--lavender-light) tint plus translateY(-2px).
    - ThemeToggle renders an inline chip pair: two buttons labeled "Lavender" and "Midnight"; the currently selected chip uses accent fill (background var(--lavender), color white). Clicking a chip immediately calls document.documentElement.setAttribute or removeAttribute AND calls `useFamilySettings().mutate({ theme: 'midnight' | 'lavender' })` to write the choice to `family_settings.theme` in Postgres. This satisfies D-15: family-wide, all devices see the same theme — the DB write propagates via realtime to any other signed-in device on the same family.
    - ThemeProvider applies osDefault on first mount, then reconciles with `useCurrentFamily.data.family_settings.theme` once the family loads (the joined shape established in 01-04a). Activation uses document.documentElement.setAttribute('data-theme', 'midnight') for Midnight; removeAttribute('data-theme') for Lavender. Renders {children}.
  </behavior>
  <action>
src/components/TopNav.tsx per PATTERNS.md section for TopNav and UI-SPEC Interaction Contracts:

Functional default-export component. Define a module-scoped const NAV_ITEMS as a tuple of objects: { to: '/dashboard', label: '🏠 Dashboard' }, { to: '/chores', label: '✅ Chores' }, { to: '/calendar', label: '📅 Calendar' }, { to: '/meals', label: '🍽️ Meals' }, { to: '/groceries', label: '🛒 Groceries' }, { to: '/notes', label: '📝 Notes' }. Import NavLink, useNavigate from react-router; import useCurrentFamily from ../data/useCurrentFamily; import { supabase } from ../data/supabase; import ThemeToggle from ./ThemeToggle.

Render nav class styles.nav. Logo div class styles.logo with the family name from `useCurrentFamily().data?.name` or fallback string "Family Plan". Links div class styles.links containing one NavLink per item with className driven by the isActive arg `({ isActive }) => isActive ? styles.link + ' ' + styles.active : styles.link`. Right side: ThemeToggle component, then button class styles.signOut type button onClick to `() => supabase.auth.signOut()` with label Sign out.

DO NOT include the v1 .memberChips section. DO NOT include MEMBERS.map. DO NOT include the ThemePanel dropdown — UI-SPEC uses an inline chip pair.

src/components/TopNav.module.css per PATTERNS.md (port verbatim minus member variants):

Port the .nav, .logo, .links, .link, .link.active, .mobileRight (if any), .signOut, and hover variants from v1 Nav.module.css. Drop all .member-* color variants. Confirm .nav has position sticky top 0 z-index 200 background var(--card-bg) border-bottom 2px solid var(--border) box-shadow var(--shadow). Confirm .link.active has background var(--lavender) color white box-shadow per v1 (the 0 2px 8px rgba(180, 140, 220, 0.3) shadow). Confirm .signOut:hover has background var(--pink-light) color var(--pink-dark) border-color var(--pink). All colors via var(--token).

src/components/BottomNav.tsx per PATTERNS.md and UI-SPEC:

Functional default-export. Define BOTTOM_BAR_ITEMS tuple with six entries each containing { to, emoji, label }. Import NavLink from react-router. Render div class styles.bottomBar (mobile-only; hide via @media in CSS or rely on the parent's @media (max-width: 768px) flow). For each item render NavLink with className driven by isActive: `styles.bottomTab + (isActive ? ' ' + styles.bottomTabActive : '')` — content is the emoji wrapped in a span (aria-label is the label string for screen-reader accessibility).

src/components/BottomNav.module.css per PATTERNS.md:

.bottomBar: display flex (only shown on mobile via @media max-width 768px in this file or by parent). Position fixed bottom 0 left 0 right 0 z-index 300. background var(--card-bg) border-top 1px solid var(--border) box-shadow 0 -2px 12px rgba(0,0,0,0.08) padding-bottom max(env(safe-area-inset-bottom, 12px), 12px). On desktop (min-width 769px) display none.
.bottomTab: flex 1, background none, border none, font-size 24px, padding 10px 0, cursor pointer, transition background 0.15s transform 0.15s, line-height 1, min-height 44px (WCAG).
.bottomTab:hover: background var(--lavender-light).
.bottomTabActive: background var(--lavender-light); transform translateY(-2px). All colors via var(--token).

src/components/ThemeToggle.tsx per UI-SPEC Interaction Contracts row for Theme toggle AND BLOCKER 1 fix (D-15 DB persistence):

Functional default-export. Imports: useState, useEffect from react; useCurrentFamily from ../data/useCurrentFamily; useFamilySettings from ../data/useFamilySettings.

Inside: const { data: family } = useCurrentFamily(); const settingsMutation = useFamilySettings(); const currentTheme: 'lavender' | 'midnight' = (family?.family_settings?.theme as 'lavender' | 'midnight' | undefined) ?? osDefault(); Define an inline osDefault function returning 'midnight' if `window.matchMedia('(prefers-color-scheme: dark)').matches` else 'lavender'.

Define a setTheme handler `(next: 'lavender' | 'midnight') => void`:
1. Immediately apply DOM attribute (optimistic UI): if next === 'midnight' document.documentElement.setAttribute('data-theme', 'midnight'); else document.documentElement.removeAttribute('data-theme').
2. If `family?.family_settings` exists, call `settingsMutation.mutate({ theme: next })` — this PATCHes family_settings.theme in Postgres. useFamilySettings invalidates ['current-family'] on success; useRealtimeBridge will push the change to other devices on the same family. If no family yet (initial wizard pre-submit), do not call mutate — the wizard's INSERT in Plan 05 will set theme directly.

Render div class styles.chipPair containing two buttons. Left button class styles.chip data-active={currentTheme === 'lavender'} disabled={settingsMutation.isPending} onClick to `() => setTheme('lavender')` with text "Lavender". Right button class styles.chip data-active={currentTheme === 'midnight'} disabled={settingsMutation.isPending} onClick to `() => setTheme('midnight')` with text "Midnight".

Add JSDoc note: "ThemeToggle delivers D-15: clicking a chip writes family_settings.theme via useFamilySettings (PATCH against Postgres). The change persists family-wide and propagates to other signed-in devices on the same family within ~1 second via the realtime bridge. DOM application is optimistic for instant visual feedback."

src/components/ThemeToggle.module.css: .chipPair flex gap 4px; .chip padding 6px 12px, border-radius var(--radius-sm), border 1px solid var(--border), background transparent, color var(--text-muted), font-size 14px, min-height 36px, cursor pointer. .chip[data-active=true] background var(--lavender) color white border-color var(--lavender). .chip:disabled cursor not-allowed opacity 0.6.

src/theme/ThemeProvider.tsx per RESEARCH.md Pattern 12 and PATTERNS.md section for ThemeProvider:

Functional component accepting `{ children: ReactNode }`. Import useEffect from react. Import useCurrentFamily from ../data/useCurrentFamily. Define an inner helper function osDefault returning 'midnight' if `window.matchMedia('(prefers-color-scheme: dark)').matches` else 'lavender'. Use useCurrentFamily to read the family. useEffect with dep `[family]`: const theme = `(family?.family_settings?.theme as 'lavender' | 'midnight' | undefined) ?? osDefault()`; if theme === 'midnight' call `document.documentElement.setAttribute('data-theme', 'midnight')` else `document.documentElement.removeAttribute('data-theme')`. Return `{children}`.

Note: The Family Creation Wizard in Plan 05 INSERTs family_settings.theme on submit with the OS default. Subsequent user changes flow through ThemeToggle → useFamilySettings → Postgres → realtime → ThemeProvider re-read.
  </action>
  <verify>
    <automated>grep -c "📝" src/components/BottomNav.tsx | grep -E "^[1-9]" ; grep -c "NavLink" src/components/TopNav.tsx | grep -E "^[1-9]" ; grep -c "prefers-color-scheme" src/theme/ThemeProvider.tsx | grep -E "^[1-9]" ; grep -c "useFamilySettings" src/components/ThemeToggle.tsx | grep -E "^[1-9]" ; grep -Ev "^[[:space:]]*--" src/components/TopNav.module.css src/components/BottomNav.module.css src/components/ThemeToggle.module.css | grep -E "#[0-9a-fA-F]{3,6}" | grep -v "^[^:]*:[[:space:]]*\*" | head ; npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - src/components/TopNav.tsx contains exactly the six NAV_ITEMS to paths /dashboard /chores /calendar /meals /groceries /notes
    - src/components/TopNav.tsx imports NavLink from react-router
    - src/components/TopNav.tsx does NOT contain any reference to MEMBERS or memberChips or MEMBER_IDS
    - src/components/BottomNav.tsx contains six entries including the 📝 (Notes) tab — UI-SPEC explicitly notes v2 adds the 6th tab
    - src/components/BottomNav.module.css contains position: fixed AND bottom: 0 AND z-index: 300 AND safe-area-inset-bottom
    - src/components/BottomNav.module.css contains min-height: 44px (WCAG)
    - src/theme/ThemeProvider.tsx contains prefers-color-scheme AND `setAttribute('data-theme', 'midnight')`
    - src/components/ThemeToggle.tsx imports useFamilySettings from ../data/useFamilySettings
    - src/components/ThemeToggle.tsx contains `settingsMutation.mutate({ theme:` (the DB write per D-15)
    - The CSS Module files contain no raw hex colors (grep returns nothing in any .module.css from this task)
    - npx tsc --noEmit exits 0
  </acceptance_criteria>
  <done>The visual shell components are built and the theme write path goes to Postgres (D-15 satisfied). RootLayout (next task) composes them.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4b.2: Placeholder page routes + OfflineBanner + ReconnectedToast</name>
  <files>src/routes/RootLayout.tsx, src/routes/RootLayout.module.css, src/routes/dashboard.tsx, src/routes/chores.tsx, src/routes/calendar.tsx, src/routes/meals.tsx, src/routes/groceries.tsx, src/routes/notes.tsx, src/routes/placeholder.module.css, src/components/OfflineBanner.tsx, src/components/OfflineBanner.module.css, src/components/ReconnectedToast.tsx, src/components/ReconnectedToast.module.css</files>
  <read_first>.planning/phases/01-foundation-walking-skeleton/01-RESEARCH.md (Pattern 8), .planning/phases/01-foundation-walking-skeleton/01-UI-SPEC.md (Copywriting Contract for placeholder pages + Interaction Contracts for OfflineBanner and ReconnectedToast), src/data/queryClient.ts, src/data/useRealtimeBridge.ts, src/components/TopNav.tsx, src/components/BottomNav.tsx, src/theme/ThemeProvider.tsx</read_first>
  <behavior>
    - RootLayout wraps the authenticated app area: mounts useRealtimeBridge once at the top, renders `<RequireFamily>{...}</RequireFamily>`, inside which it composes OfflineBanner + ReconnectedToast + TopNav + `<main><Outlet /></main>` + BottomNav
    - Each placeholder route (dashboard, chores, calendar, meals, groceries, notes) renders a single Page section: h1 (UI-SPEC Heading 20px) with the section name, p (UI-SPEC Label 14px) with the Coming soon copy referencing the future phase number per UI-SPEC Copywriting Contract
    - Dashboard placeholder copy: "Your family at a glance — coming soon."
    - Chores copy: "Coming soon — this section ships in Phase 3."
    - Calendar copy: "Coming soon — this section ships in Phase 4."
    - Meals / Groceries / Notes copy: "Coming soon — this section ships in Phase 5."
    - OfflineBanner subscribes to queryClient.getMutationCache().subscribe AND window online/offline events. While navigator.onLine is false OR any mutation is paused, render fixed-top banner with copy "**Offline** — changes will sync when reconnected" (Offline word in strong). Height 36px desktop, 32px mobile. z-index 250 (above nav 200, below bottom-bar 300). Slides down 200ms ease-out.
    - ReconnectedToast: When transitioning from offline to online (online event fires AND there were paused mutations), render a fixed-position top-right (desktop) or full-width-below-nav (mobile) toast with copy "Back online — syncing your changes" for 3 seconds, then auto-dismiss via setTimeout.
  </behavior>
  <action>
src/routes/RootLayout.tsx per RESEARCH.md System Architecture diagram and CONTEXT.md D-13:

Functional default-export component. Import useRealtimeBridge from ../data/useRealtimeBridge; RequireFamily from ../auth/RequireFamily; TopNav from ../components/TopNav; BottomNav from ../components/BottomNav; OfflineBanner from ../components/OfflineBanner; ReconnectedToast from ../components/ReconnectedToast; Outlet from react-router. Inside the component, call `useRealtimeBridge()` (one line, no arguments — the hook reads family from useCurrentFamily internally). Return `<RequireFamily><div class={styles.shell}><OfflineBanner /><ReconnectedToast /><TopNav /><main class={styles.main}><Outlet /></main><BottomNav /></div></RequireFamily>`.

src/routes/RootLayout.module.css: .shell display flex flex-direction column min-height 100vh. .main flex 1, padding 24px, padding-bottom calc(64px + max(env(safe-area-inset-bottom, 12px), 12px)) per UI-SPEC mobile safe-area pattern from PATTERNS.md globals.

src/routes/dashboard.tsx + chores.tsx + calendar.tsx + meals.tsx + groceries.tsx + notes.tsx — six small files. Each is a functional default-export Placeholder component returning `<section class={styles.placeholder}><h1 class={styles.title}>{NAME}</h1><p class={styles.body}>{COPY}</p></section>` with the per-route copy from UI-SPEC Copywriting Contract. Share src/routes/placeholder.module.css across all six. Names: Dashboard, Chores, Calendar, Meals, Groceries, Notes. Copy from UI-SPEC.

src/routes/placeholder.module.css: .placeholder padding 24px, display flex flex-direction column gap 16px, max-width 720px. .title font-size 20px, font-weight 700, color var(--text). .body font-size 14px, color var(--text-muted). No raw hex.

src/components/OfflineBanner.tsx per RESEARCH.md Pattern 8:

Functional default-export. Import useEffect, useState from react; useQueryClient from @tanstack/react-query. Inside: `const queryClient = useQueryClient(); const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true); const [hasPausedMutations, setHasPausedMutations] = useState(false);`. First useEffect: `const update = () => setHasPausedMutations(queryClient.getMutationCache().getAll().some(m => m.state.isPaused)); update(); const unsubscribe = queryClient.getMutationCache().subscribe(update); return unsubscribe;`. Second useEffect: `window.addEventListener('online', () => setOnline(true));` and `'offline', () => setOnline(false);` cleanup removes both. When `online && !hasPausedMutations` return null. Otherwise render `<div role="status" class={styles.banner}><strong>Offline</strong>{' — changes will sync when reconnected'}</div>`.

src/components/OfflineBanner.module.css per UI-SPEC Interaction Contracts row for Offline banner:

.banner position fixed top 0 left 0 right 0 z-index 250 height 36px background var(--card-bg) border-bottom 1px solid var(--border) display flex align-items center justify-content center font-size 14px animation slideDown 200ms ease-out color var(--text). @keyframes slideDown: from transform translateY(-100%) opacity 0; to transform translateY(0) opacity 1. @media max-width 768px height 32px.

src/components/ReconnectedToast.tsx per UI-SPEC Interaction Contracts:

Functional default-export. Use useEffect plus useState<boolean>(false) for visible. Hook into window 'online' event: if document had been offline (track via ref) AND online event fires, setVisible(true), setTimeout 3000 setVisible(false). When visible is false return null. Otherwise render `<div role="status" class={styles.toast}>Back online — syncing your changes</div>`.

src/components/ReconnectedToast.module.css: .toast position fixed top 12px right 12px z-index 260 background var(--card-bg) border 1px solid var(--border) border-radius var(--radius-sm) padding 12px 16px box-shadow var(--shadow) font-size 14px color var(--text) animation slideDown 200ms ease-out. @media max-width 768px: position fixed top 36px left 12px right 12px (below nav).
  </action>
  <verify>
    <automated>npm test -- --run --changed 2>/dev/null || npm test -- tests/unit/offline-banner.test.tsx && grep -c "useRealtimeBridge" src/routes/RootLayout.tsx | grep -E "^[1-9]" && grep -c "Coming soon" src/routes/chores.tsx src/routes/calendar.tsx src/routes/meals.tsx src/routes/groceries.tsx src/routes/notes.tsx | wc -l && npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - src/routes/RootLayout.tsx contains useRealtimeBridge() AND `<RequireFamily>` AND `<Outlet />`
    - src/routes/dashboard.tsx contains "Your family at a glance"
    - src/routes/chores.tsx contains "Phase 3"
    - src/routes/calendar.tsx contains "Phase 4"
    - src/routes/meals.tsx contains "Phase 5"
    - src/routes/groceries.tsx contains "Phase 5"
    - src/routes/notes.tsx contains "Phase 5"
    - src/components/OfflineBanner.tsx contains getMutationCache().subscribe AND navigator.onLine AND `<strong>Offline</strong>`
    - src/components/OfflineBanner.tsx contains the literal substring "changes will sync when reconnected"
    - src/components/ReconnectedToast.tsx contains "Back online — syncing your changes"
    - npm test -- tests/unit/offline-banner.test.tsx passes
    - npx tsc --noEmit exits 0
  </acceptance_criteria>
  <done>RootLayout, six placeholder routes, OfflineBanner, and ReconnectedToast are all created. Task 4b.3 will wire them into router.tsx and main.tsx.</done>
</task>

<task type="auto">
  <name>Task 4b.3: Router rewire + main.tsx composition</name>
  <files>src/routes/router.tsx, src/main.tsx</files>
  <read_first>src/routes/router.tsx (the Stub references from 01-04a must be replaced), src/data/queryClient.ts, src/theme/ThemeProvider.tsx</read_first>
  <behavior>
    - src/routes/router.tsx is updated: the `const Stub = () => null` is REMOVED. RootLayout, Dashboard, Chores, Calendar, Meals, Groceries, Notes are imported as default exports and the route entries reference them. The onboarding/create-family element remains a `Stub`-style placeholder until Plan 05 replaces it (per Plan 05 Task 5.2).
    - main.tsx imports queryClient, router, ThemeProvider, ReactQueryDevtools. Wraps the app: `<StrictMode><QueryClientProvider client={queryClient}><ThemeProvider><RouterProvider router={router} /></ThemeProvider><ReactQueryDevtools initialIsOpen={false} /></QueryClientProvider></StrictMode>`.
  </behavior>
  <action>
src/routes/router.tsx — UPDATE the file from 01-04a:
1. REMOVE the `const Stub = () => null` line (or leave only for the `onboarding/create-family` route which Plan 05 will replace).
2. ADD imports: `import RootLayout from './RootLayout'; import Dashboard from './dashboard'; import Chores from './chores'; import Calendar from './calendar'; import Meals from './meals'; import Groceries from './groceries'; import Notes from './notes';`.
3. REPLACE the route element references: RootLayout wrapper `element: <Stub />` → `element: <RootLayout />`. Dashboard route → `element: <Dashboard />`. And the same for chores/calendar/meals/groceries/notes. Leave the `onboarding/create-family` route's element as the Stub placeholder; Plan 05 Task 5.2 replaces it with `import CreateFamily from './onboarding/create-family'`.
4. UPDATE the TODO comment in router.tsx: remove the "01-04b must add: RootLayout, Dashboard, Chores, Calendar, Meals, Groceries, Notes" line (since this plan IS adding them). Keep the "Plan 05 must add: CreateFamily from './onboarding/create-family'" TODO.

src/main.tsx — REPLACE the Plan 01 placeholder with the real composition:

Imports: StrictMode from react, createRoot from react-dom/client, RouterProvider from react-router, QueryClientProvider from @tanstack/react-query, ReactQueryDevtools from @tanstack/react-query-devtools, router from ./routes/router, queryClient from ./data/queryClient, ThemeProvider from ./theme/ThemeProvider. Side-effect imports `'./styles/globals.css'` and `'./theme/theme.css'`. Body: `createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={queryClient}><ThemeProvider><RouterProvider router={router} /></ThemeProvider><ReactQueryDevtools initialIsOpen={false} /></QueryClientProvider></StrictMode>);`.
  </action>
  <verify>
    <automated>npm run build && grep -c "import RootLayout from './RootLayout'" src/routes/router.tsx | grep -E "^[1-9]" && grep -c "RouterProvider" src/main.tsx | grep -E "^[1-9]"</automated>
  </verify>
  <acceptance_criteria>
    - src/routes/router.tsx imports RootLayout from './RootLayout' AND each of the six tab routes from their respective files
    - src/routes/router.tsx no longer contains `const Stub = () => null` for any route except onboarding/create-family
    - src/main.tsx contains QueryClientProvider AND ThemeProvider AND RouterProvider AND ReactQueryDevtools
    - npm run build exits 0 and produces dist/index.html
    - npx tsc --noEmit exits 0
  </acceptance_criteria>
  <done>The full app shell is wired. An authenticated user with a family sees all six placeholder routes through TopNav + BottomNav, with realtime bridge active and offline banner armed. Theme changes persist family-wide via useFamilySettings. Plan 05 will replace the onboarding/create-family Stub with the real wizard.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser DOM -> theme attribute | document.documentElement.setAttribute is the only theme application surface; values constrained to two string literals. |
| browser -> family_settings PATCH | useFamilySettings call routes through Supabase REST under RLS family_settings_update policy. |
| browser realtime channel -> theme propagation | Other devices receive the family_settings UPDATE via postgres_changes and invalidate ['current-family']. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-04b-01 | Tampering | Theme written to family_settings by an attacker via XSS | accept (mitigated by stack) | Phase 1 has zero user-generated HTML rendering. The theme value is constrained to two literals ('lavender' \| 'midnight') so even a successful prototype pollution cannot inject anything other than an attribute value. |
| T-04b-02 | Tampering | useFamilySettings mutates a different family's settings via crafted family.id | mitigate | The family.id used in the mutation comes from useCurrentFamily which derives it from the authenticated session via the members table. Cannot be set from URL or user input. RLS `family_settings_update` policy gates by `family_id = private.current_family_id()` as backstop. |
| T-04b-03 | Information Disclosure | Theme change leaks family identity across realtime channels | accept | The change is broadcast on the family:<id> channel; only members of that family receive it (RLS-gated postgres_changes). Theme value carries no PII. |
| T-04b-04 | Spoofing | Family name displayed in TopNav from useCurrentFamily | accept | Family name is set by the user themselves in the Wizard (Plan 05). React's default JSX escaping handles any HTML in the string. |
| T-04b-05 | Denial of Service | Mutation cache subscription leak on unmount | mitigate | OfflineBanner returns the unsubscribe function from the useEffect — React calls it on unmount. ReconnectedToast clears its setTimeout via cleanup. |
| T-04b-SC | Tampering | npm packages | mitigate | No new packages in this plan. |
</threat_model>

<verification>
1. npm test passes tests/unit/offline-banner.test.tsx.
2. npx tsc --noEmit exits 0.
3. npm run build exits 0 and produces dist/.
4. Source-level: src/components/ThemeToggle.tsx imports useFamilySettings and calls .mutate({ theme }) on chip click — verifies D-15 persistence path.
5. Source-level: src/routes/router.tsx no longer references the `Stub` for the layout/tab routes — RootLayout and six tab components are imported.
6. Deployed preview smoke (Plan 06 Task 6.4): Theme change on device A appears on device B within ~1 second.
</verification>

<success_criteria>
- Authenticated users land on /dashboard with the full app shell rendered.
- All six placeholder routes are reachable from BottomNav and TopNav.
- The realtime bridge subscribes to one channel and translates postgres_changes into invalidateQueries.
- The offline UX (banner + reconnect toast) is functional via TanStack Query mutation pause/resume per ARCH-09.
- Theme reconciles OS preference with `family_settings.theme` per D-15. User changes persist family-wide via useFamilySettings → Postgres → realtime, satisfying the "all devices" requirement.
- Realtime truths in must_haves are stated as user-observable outcomes (cross-device sync within ~1 second, sign-out stops events) rather than implementation invariants.
</success_criteria>

<output>
Create `.planning/phases/01-foundation-walking-skeleton/01-04b-SUMMARY.md` when done.
</output>
</content>
</invoke>