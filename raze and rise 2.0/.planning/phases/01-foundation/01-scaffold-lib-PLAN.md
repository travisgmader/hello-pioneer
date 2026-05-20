---
phase: 01-foundation
plan: 01b
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/storage.ts
  - src/lib/supabase.ts
  - src/lib/powersync.ts
  - src/lib/schema.ts
  - src/lib/connector.ts
  - src/hooks/useSession.ts
  - src/hooks/useOnboardingState.ts
  - src/hooks/useMigrationStatus.ts
  - src/hooks/useTheme.ts
autonomous: true
requirements:
  - FOUND-06
  - FOUND-08

must_haves:
  truths:
    - "MMKV instance is encrypted at rest; encryption key stored in SecureStore Keychain"
    - "Supabase client uses MMKV adapter for session persistence"
    - "PowerSync AppSchema defines all 9 tables matching the Supabase schema"
    - "useSession returns { session, loading } and handles offline launch without clearing session"
    - "useOnboardingState reads MMKV key and mirrors against Supabase profiles.onboarded on startup"
    - "PowerSync connector implements fetchCredentials and uploadData with soft-delete pattern"
  artifacts:
    - path: "src/lib/storage.ts"
      provides: "MMKV + SecureStore hybrid init"
      exports: ["initStorage", "getStorage", "supabaseStorageAdapter"]
    - path: "src/lib/supabase.ts"
      provides: "Supabase client with MMKV adapter"
      exports: ["supabase"]
    - path: "src/lib/schema.ts"
      provides: "PowerSync AppSchema with all 9 tables"
      exports: ["AppSchema"]
    - path: "src/lib/connector.ts"
      provides: "PowerSync backend connector"
      exports: ["AppConnector"]
    - path: "src/lib/powersync.ts"
      provides: "PowerSync database instance"
      exports: ["powersync"]
  key_links:
    - from: "src/lib/supabase.ts"
      to: "src/lib/storage.ts"
      via: "supabaseStorageAdapter passed to createClient auth.storage"
      pattern: "supabaseStorageAdapter"
    - from: "src/lib/connector.ts"
      to: "src/lib/supabase.ts"
      via: "fetchCredentials reads supabase session access_token"
      pattern: "access_token"
    - from: "src/hooks/useSession.ts"
      to: "src/lib/supabase.ts"
      via: "supabase.auth.onAuthStateChange subscription"
      pattern: "onAuthStateChange"
---

<objective>
This plan implements the library layer: MMKV + SecureStore hybrid storage, the Supabase client, the PowerSync schema/connector/database instance, and the four core hooks (useSession, useOnboardingState, useMigrationStatus, useTheme). Runs in Wave 1 parallel with 01-scaffold-init-PLAN.md — no shared files.

Purpose: The library layer is consumed by every other plan. Hooks and clients defined here are imported by auth, onboarding, migration, and routing plans. These interfaces must be stable before Wave 2 work begins.

Output: All library files and hooks implemented and TypeScript-strict. No UI components in this plan.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-SKELETON.md

<interfaces>
<!-- MMKV storage pattern -->
initStorage(): awaited at app startup before Supabase client created
getStorage(): throws "Storage not initialized" if called before initStorage
supabaseStorageAdapter: { getItem, setItem, removeItem } wrapping MMKV instance

<!-- PowerSync AppSchema: 9 tables -->
Tables: profiles, split_settings, exercises, templates, template_exercises, sessions, session_sets, measurements, notification_preferences
All column types must match the Supabase migration in 01-schema-PLAN.md exactly.

<!-- Root layout routing logic (from 01-RESEARCH.md) -->
no session → (auth)
session + migration pending/in_progress/failed → /migration
session + not onboarded → (onboarding)/profile
session + onboarded → (tabs)

<!-- Hook signatures (consumed by 01-scaffold-routing-PLAN.md and 01-auth-PLAN.md) -->
useSession(): { session: Session | null, loading: boolean }
useOnboardingState(): { onboardingComplete: boolean }
useMigrationStatus(userId?: string): { migrationStatus: MigrationStatus, loading: boolean }
useTheme(): { theme: 'light' | 'dark' | 'system', setTheme: (t: string) => void }
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Storage + Supabase client + PowerSync schema/connector/database</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Session Storage section, Offline Sync section, Code Examples — Supabase client with MMKV adapter, PowerSync connector)
    .planning/phases/01-foundation/CONTEXT.md (Inherited Decisions — MMKV + SecureStore hybrid)
  </read_first>
  <behavior>
    - initStorage() returns MMKV instance; calling getStorage() before initStorage() throws with message "Storage not initialized"
    - supabaseStorageAdapter.getItem(key) returns null when key is absent (not undefined)
    - Supabase client has autoRefreshToken: true, persistSession: true, detectSessionInUrl: false
    - AppState listener wires startAutoRefresh/stopAutoRefresh on foreground/background
    - AppSchema has exactly 9 Table entries — one for each v2 table
    - connector.uploadData uses upsert for PUT, update for PATCH, and sets is_deleted=true for DELETE (never hard-delete per DATA-02)
    - powersync.ts does NOT call powersync.init() or connect() at module load — those are called from app startup
  </behavior>
  <action>
    src/lib/storage.ts:
    Implement initStorage() that calls SecureStore.getItemAsync("mmkv.encryption.key"), creates a UUID key via Crypto.randomUUID() if absent, stores it in SecureStore using SecureStoreOptions.keychainAccessible = AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY, then creates MMKV({ id: "razeandrise.session", encryptionKey }). Implement getStorage() that throws if storageInstance is null. Export supabaseStorageAdapter: { getItem: (k) => getStorage().getString(k) ?? null, setItem: (k,v) => getStorage().set(k,v), removeItem: (k) => getStorage().delete(k) }.

    src/lib/supabase.ts:
    Import supabaseStorageAdapter from ./storage. Create client with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. Auth options: storage: supabaseStorageAdapter as any, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false. Wire AppState.addEventListener to start/stop auto-refresh on foreground/background. Export `supabase`.

    src/lib/schema.ts:
    Define AppSchema using Schema + Table from @powersync/react-native. Include all 9 tables: profiles, split_settings, exercises, templates, template_exercises, sessions, session_sets, measurements, notification_preferences. Column types must match the Supabase migration exactly (use column() from @powersync/react-native for each field). Export `AppSchema`.

    src/lib/connector.ts:
    Implement PowerSyncBackendConnector with:
    fetchCredentials(): reads supabase session via supabase.auth.getSession(), returns { endpoint: EXPO_PUBLIC_POWERSYNC_URL, token: session.access_token }.
    uploadData(database): processes CRUD operations from the PowerSync upload queue. For each op: PUT → supabase.from(op.table).upsert(op.opData, { onConflict: 'id' }); PATCH → supabase.from(op.table).update(op.opData).eq('id', op.id); DELETE → supabase.from(op.table).update({ is_deleted: true }).eq('id', op.id) (soft delete only — never hard-delete per DATA-02). Export `AppConnector`.

    src/lib/powersync.ts:
    Create PowerSyncDatabase({ schema: AppSchema, database: { dbFilename: "razeandrise.db" } }). Export `powersync`. Do NOT call powersync.init() here — that is called from app/_layout.tsx startup.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `grep "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY" src/lib/storage.ts` returns a match
    - `grep "supabaseStorageAdapter" src/lib/supabase.ts` returns a match
    - `grep "is_deleted" src/lib/connector.ts` returns a match (soft delete pattern)
    - `grep -c "new Table" src/lib/schema.ts` returns 9 (one table definition per v2 table)
    - `grep "init\(\)\|connect\(" src/lib/powersync.ts` returns NO matches (not called at module load)
  </acceptance_criteria>
  <done>MMKV + SecureStore hybrid storage initialized. Supabase client wired with MMKV adapter. PowerSync schema (9 tables), connector (fetchCredentials + soft-delete uploadData), and database instance created. All TypeScript strict.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Core hooks (useSession, useOnboardingState, useMigrationStatus, useTheme)</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Session Storage section pitfall 3 — offline launch bug; Pitfall 9 — onboarding flag reinstall scenario)
    .planning/phases/01-foundation/CONTEXT.md (Decision 4b — Tab Nav During Onboarding, MMKV key "onboarding.complete")
    src/lib/supabase.ts (supabase export — used in all hooks)
  </read_first>
  <behavior>
    - useSession: loading=true initially; loading=false after onAuthStateChange fires; session=null when not signed in
    - useSession: wraps auth init in try/catch; network errors on offline launch do NOT clear existing session (RESEARCH.md Pitfall 3)
    - useOnboardingState: reads MMKV key "onboarding.complete"; if MMKV flag is absent but profiles.onboarded=true in Supabase, sets the MMKV flag (guards reinstall — RESEARCH.md Pitfall 9)
    - useMigrationStatus: uses TanStack Query refetchInterval — refetches every 2000ms when status is pending or in_progress; stops when complete or failed
    - useTheme: reads MMKV string "theme.override"; falls back to useColorScheme() ?? "dark"
  </behavior>
  <action>
    src/hooks/useSession.ts:
    Subscribe to supabase.auth.onAuthStateChange, return { session, loading }. Handle offline-launch bug: wrap auth init in try/catch; suppress network errors without clearing the session (RESEARCH.md Pitfall 3). Set loading=false in both success and error paths.

    src/hooks/useOnboardingState.ts:
    Read/write MMKV key "onboarding.complete" (boolean stored as string "true"/"false"). Also mirror against supabase `profiles.onboarded` on startup — if MMKV flag is missing but profiles.onboarded is true, set the MMKV flag (guards reinstall scenario per RESEARCH.md Pitfall 9). Export useOnboardingState() returning { onboardingComplete: boolean } and setOnboardingComplete() + updateOnboardingStep().

    src/hooks/useMigrationStatus.ts:
    TanStack Query hook that polls `supabase.from("profiles").select("migration_status").eq("user_id", userId).single()`. Use refetchInterval: (data) => (data?.migration_status === 'pending' || data?.migration_status === 'in_progress') ? 2000 : false. Returns { migrationStatus: MigrationStatus, loading: boolean }.

    src/hooks/useTheme.ts:
    Read MMKV string "theme.override" (values: "light" | "dark" | "system"). Fall back to useColorScheme() ?? "dark". Export useTheme() returning { theme, setTheme }.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `grep "try.*catch\|catch.*err" src/hooks/useSession.ts` returns a match (offline error suppression)
    - `grep "profiles.onboarded\|onboarding.complete" src/hooks/useOnboardingState.ts` returns matches (both MMKV + Supabase sides)
    - `grep "refetchInterval" src/hooks/useMigrationStatus.ts` returns a match
    - `grep "theme.override\|useColorScheme" src/hooks/useTheme.ts` returns matches
  </acceptance_criteria>
  <done>All 4 core hooks implemented. useSession handles offline launch safely. useOnboardingState mirrors MMKV + Supabase on startup. useMigrationStatus polls conditionally. useTheme reads MMKV with system fallback. TypeScript strict passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Device local storage → App code | MMKV encrypted at rest; SecureStore holds encryption key in OS Keychain/Keystore |
| PowerSync connector → Supabase | fetchCredentials reads active JWT; uploadData runs as authenticated user |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01b-I-01 | Information Disclosure | Supabase session (JWT) in device storage | mitigate | MMKV AES-256 encrypted with key from Keychain (iOS) / Keystore (Android); SecureStoreOptions.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY |
| T-01b-I-02 | Information Disclosure | MMKV key extraction (rooted/jailbroken) | accept | Residual risk; Keychain AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY reduces accessibility; acceptable for fitness app threat model |
| T-01b-T-01 | Tampering | connector.uploadData hard-deleting rows | mitigate | Only soft-delete (is_deleted=true) in connector; no DELETE SQL statements (DATA-02) |
| T-01b-SC | Tampering | npm installs | mitigate | Gated by 01-scaffold-init-PLAN.md Task 0 blocking checkpoint |
</threat_model>

<verification>
1. `npx tsc --noEmit` exits 0 across all lib + hook files
2. `grep "AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY" src/lib/storage.ts` — present
3. `grep "is_deleted" src/lib/connector.ts` — soft-delete pattern confirmed
4. `grep "refetchInterval" src/hooks/useMigrationStatus.ts` — polling wired
</verification>

<success_criteria>
- MMKV + SecureStore hybrid initialized at startup with encryption key in SecureStore (FOUND-08)
- PowerSync schema (9 tables) defined in src/lib/schema.ts; connector wired (FOUND-06 client-side)
- All hooks exportable and TypeScript strict
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-scaffold-lib-SUMMARY.md` when done.
</output>
