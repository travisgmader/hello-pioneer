---
phase: 01-foundation
plan: 06
type: execute
wave: 4
depends_on:
  - 01-scaffold-init-PLAN.md
  - 01-scaffold-lib-PLAN.md
  - 01-scaffold-ui-PLAN.md
  - 01-scaffold-routing-PLAN.md
  - 01-schema-PLAN.md
  - 01-auth-PLAN.md
  - 01-navigation-onboarding-PLAN.md
  - 01-migration-PLAN.md
files_modified:
  - tests/e2e/walking-skeleton.test.ts
  - .maestro/walking-skeleton.yaml
  - .maestro/powersync-init.yaml
  - .maestro/session-persistence.yaml
  - .planning/phases/01-foundation/VERIFICATION.md
autonomous: false
requirements:
  - FOUND-05
  - FOUND-06
  - FOUND-09

must_haves:
  truths:
    - "New user can open app → sign up → complete onboarding → reach Dashboard"
    - "Developer helper in Settings logs a test set offline; set appears in PowerSync local SQLite immediately and syncs to Supabase dashboard on reconnect (full session UI in Phase 2)"
    - "When connectivity returns, the set is visible in Supabase session_sets table"
    - "Session persists across app kill + relaunch (MMKV + SecureStore)"
    - "PowerSync local SQLite database initializes at app launch"
    - "EAS development build installs and runs on physical iOS device"
    - "All 5 success criteria in ROADMAP Phase 1 are verifiable (manual checklist)"
  artifacts:
    - path: ".maestro/walking-skeleton.yaml"
      provides: "End-to-end Walking Skeleton Maestro test: sign-up → onboarding → Dashboard → offline set log"
    - path: ".maestro/powersync-init.yaml"
      provides: "Verifies PowerSync SQLite file is created at app launch"
    - path: ".maestro/session-persistence.yaml"
      provides: "Verifies session survives app kill + relaunch"
    - path: ".planning/phases/01-foundation/VERIFICATION.md"
      provides: "Phase 1 verification report — automated results + manual checklist"
  key_links:
    - from: ".maestro/walking-skeleton.yaml"
      to: "src/lib/powersync.ts"
      via: "set logged offline → PowerSync uploads on reconnect"
      pattern: "session_sets"
---

<objective>
This is the Walking Skeleton verification plan — the final gating plan for Phase 1. It proves that all architectural layers compose correctly end-to-end: the thin vertical slice that is the acceptance test for the entire Foundation phase.

The slice: User opens app → creates account → completes required onboarding → lands on Dashboard → starts a session and logs one set with airplane mode ON → set visible immediately → reconnects → set syncs to Supabase via PowerSync.

This plan also produces the Phase 1 VERIFICATION.md document listing automated test results and the manual checklist for items that cannot be automated (AUTH-03, AUTH-06, DATA-03, DESIGN-04, FOUND-09).

Purpose: The Walking Skeleton is the proof that Phase 1 is complete and Phase 2 can begin. If this plan fails, there is a gap in one of the prior plans — fix it, do not ship.

Output: Walking Skeleton Maestro test file, session persistence test, PowerSync init test, VERIFICATION.md, and a checkpoint for the developer to run the full manual checklist.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-SKELETON.md
@.planning/phases/01-foundation/01-scaffold-SUMMARY.md
@.planning/phases/01-foundation/01-schema-SUMMARY.md
@.planning/phases/01-foundation/01-auth-SUMMARY.md
@.planning/phases/01-foundation/01-navigation-onboarding-SUMMARY.md
@.planning/phases/01-foundation/01-migration-SUMMARY.md

<interfaces>
<!-- Phase 1 ROADMAP success criteria (what must be true for Phase 1 to be complete) -->
1. User can create account with email/password, sign in with Google OAuth, or Apple — all three paths reach the app without errors
2. New user who completes onboarding (profile → split → template → practice set) lands on Dashboard with split type and first template configured
3. App can start and log a set with no network connection; set visible immediately; syncs to Supabase when connectivity returns
4. All 5 tabs work offline; active tab highlighted
5. v1 user data queryable from normalized v2 tables after migration

<!-- Walking Skeleton slice (from SKELETON.md + RESEARCH.md section 10) -->
New user → sign up with email → complete 3 required onboarding steps → skip practice set → Dashboard → start session → log 1 set with airplane mode ON → verify set in local SQLite → turn airplane mode OFF → wait → verify set in Supabase session_sets table

<!-- Manual-only items from VALIDATION.md -->
AUTH-03: Apple Sign-In — test on real iOS device; verify session in Supabase dashboard
AUTH-06: SMS MFA — enable phone factor in Supabase dashboard; test with real phone number
DATA-03: v2 deploy URL parallel to v1 — verify both URLs live simultaneously
DESIGN-04: 150ms transitions — slow-motion camera or Maestro video review
FOUND-09: OTA fingerprint — publish OTA, verify older build does not receive it

<!-- PowerSync offline logging pattern (from RESEARCH.md Code Examples) -->
powersync.execute(
  "INSERT INTO session_sets (id, session_id, exercise_id, set_number, weight_kg, result, logged_at) VALUES (?,?,?,?,?,?,?)",
  [uuid, sessionId, exerciseId, 1, 100.0, 'go', now.toISOString()]
)
Query to verify: powersync.execute("SELECT * FROM session_sets WHERE session_id = ?", [sessionId])
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Walking Skeleton Maestro test + PowerSync init test + session persistence test</name>
  <read_first>
    .planning/phases/01-foundation/01-SKELETON.md (Skeleton Slice — Layer-by-Layer Exercise table)
    .planning/phases/01-foundation/01-VALIDATION.md (Per-Task Verification Map, Wave 0 Requirements)
    .planning/phases/01-foundation/01-RESEARCH.md (Code Examples — Logging a set offline, PowerSync hook)
    .maestro/auth-email.yaml (existing auth flow — walking skeleton extends this)
    .maestro/onboarding.yaml (existing onboarding flow — walking skeleton extends this)
  </read_first>
  <action>
    .maestro/walking-skeleton.yaml:
    Full end-to-end walking skeleton test. This YAML file calls sub-flows from other Maestro files where possible (Maestro supports include patterns).
    Flow:
    1. launchApp (appId: com.razeandrise.app)
    2. waitForAnimationToEnd
    3. Sign Up: tapOn "Sign Up" toggle → inputText "Email" testwalking@example.com → inputText "Password" testWalking123 → inputText "Confirm password" testWalking123 → tapOn "Create account" → waitForAnimationToEnd
    4. Onboarding step 1: assertVisible "Set up your profile" → inputText "Display name" "Walker" → tapOn "Continue" → waitForAnimationToEnd
    5. Onboarding step 2: assertVisible "Choose your split" → tapOn "Full Body" → tapOn "Continue" → waitForAnimationToEnd
    6. Onboarding step 3: assertVisible "Pick a starter template" → tapOn first template card (use assertVisible then tapOn) → tapOn "Continue" → waitForAnimationToEnd
    7. Practice set: assertVisible "Try logging a set" → tapOn "Skip for now" → waitForAnimationToEnd
    8. Dashboard: assertVisible "Welcome, Walker" (confirms display name written to Supabase and read back)
    9. Comment: "# === OFFLINE SET LOG: Airplane mode must be toggled manually or via device automation ==="
    10. Comment: "# The following steps require airplane mode ON — run this section manually on real device"
    11. Comment steps (not automatable inline — document as manual section):
      a. Enable airplane mode on device
      b. Navigate to Settings tab → Developer Tools section
      c. Tap "Log test set offline" button — this uses the __DEV__ helper added by this plan (not the full workout session UI, which ships in Phase 2)
      d. Note the session UUID displayed in the status message
      e. Verify set visible in local SQLite immediately (status message confirms local write succeeded)
      f. Disable airplane mode
      g. Wait 10 seconds
      h. Verify in Supabase Dashboard: session_sets table contains the set row matching the session UUID

    Note: In Phase 1, the full workout session UI lives in Phase 2. The walking skeleton offline set write is verified via the __DEV__ Developer Tools helper in Settings (see Task 1 action below). This matches the reframed must_have: "Developer helper in Settings logs a test set offline; set appears in PowerSync local SQLite immediately and syncs to Supabase dashboard on reconnect".

    Add to app/(tabs)/settings.tsx (development-only section):
    If __DEV__: render a "Developer Tools" section with:
    - "Log test set offline" button: creates a session row + session_sets row directly via powersync.execute, then shows a status message with the session UUID. Used for Walking Skeleton verification only.

    .maestro/powersync-init.yaml:
    Update from stub to real test: launchApp → waitForAnimationToEnd (2000ms) → runScript that checks if razeandrise.db exists (note: Maestro doesn't have direct file access; use a runScript action or assertVisible on a developer-mode status indicator). Alternative: add a developer-mode indicator text "PowerSync: connected" on the Dashboard (DEV only) — Maestro asserts on this text. Text: "PowerSync: ready" only visible when __DEV__ and powersync.currentStatus is 'connected'.

    .maestro/session-persistence.yaml:
    Update from stub to real test: launchApp (signed-in user) → assertVisible "Welcome" (Dashboard confirms session loaded) → pressKey back (or swipe home — simulate app backgrounding) → relaunchApp → assertVisible "Welcome" (session restored without sign-in prompt). This tests that MMKV + SecureStore session survives relaunch.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - .maestro/walking-skeleton.yaml exists and contains "Welcome, Walker" assertion
    - .maestro/powersync-init.yaml contains "PowerSync: ready" or equivalent assertion string
    - .maestro/session-persistence.yaml contains at least 2 launchApp or relaunchApp invocations
    - Dev-only "Log test set offline" button exists in settings.tsx when __DEV__ (grep "__DEV__" app/\(tabs\)/settings.tsx)
    - Dev-only "PowerSync: ready" indicator exists on Dashboard (grep "__DEV__" app/\(tabs\)/index.tsx)
  </acceptance_criteria>
  <done>Walking Skeleton Maestro test written. PowerSync init test updated with real assertion. Session persistence test updated with relaunch flow. Dev-only test helpers added to settings and dashboard for offline set logging and PowerSync status verification.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2 [BLOCKING]: Full Walking Skeleton verification — automated + manual checklist</name>
  <read_first>
    .planning/phases/01-foundation/01-SKELETON.md (Layers Exercised table — all 17 layers)
    .planning/phases/01-foundation/01-VALIDATION.md (Manual-Only Verifications table)
    .planning/ROADMAP.md (Phase 1 Success Criteria — 5 items)
  </read_first>
  <what-built>
    All Phase 1 plans have been executed. This is the final verification gate before declaring Phase 1 complete. You must verify all automated tests pass AND complete the manual checklist for items that cannot be automated.
  </what-built>
  <how-to-verify>
    Run automated tests first:
    1. npm run test:unit -- --run (expect: all pass)
    2. npm run test:integration -- --run (expect: rls.test.ts + migrate.test.ts pass)
    3. npx tsc --noEmit (expect: exits 0)
    4. maestro test .maestro/auth-email.yaml (real device or simulator with Google Play services)
    5. maestro test .maestro/onboarding.yaml (real device)
    6. maestro test .maestro/tabs.yaml (real device)
    7. maestro test .maestro/sign-out.yaml (real device)
    8. maestro test .maestro/session-persistence.yaml (real device)
    9. maestro test .maestro/walking-skeleton.yaml (real device)

    Manual checklist (FOUND-09, AUTH-03, AUTH-06, DATA-03, DESIGN-04):
    A. EAS dev build installs and runs on physical iOS device (FOUND-05):
       - Run: eas build --profile development --platform ios
       - Install the .ipa on your device via EAS internal distribution
       - Confirm app launches and tab nav is functional

    B. Apple Sign-In (AUTH-03):
       - On real iOS device, tap "Sign in with Apple" on auth screen
       - Complete Apple authentication sheet
       - Verify Supabase Dashboard → Authentication → Users shows a new Apple Sign-In user

    C. SMS MFA (AUTH-06):
       - In Supabase Dashboard → Authentication → MFA → Phone: confirm Twilio/Vonage is configured
       - In app Settings → Two-factor authentication: verify instructions are visible and link works

    D. Offline set log and sync (ROADMAP success criteria 3):
       - Enable airplane mode on device
       - Navigate to Settings → Developer Tools → "Log test set offline"
       - Tap the button — note the session UUID shown
       - Verify set appears in local session (check status indicator on Dashboard)
       - Disable airplane mode
       - Wait 10-15 seconds
       - Open Supabase Dashboard → Table Editor → session_sets
       - Search for the session UUID — confirm row is present

    E. All 5 tabs offline (ROADMAP success criteria 4):
       - Enable airplane mode
       - Navigate to all 5 tabs — confirm no crash, no infinite spinner
       - Active tab is highlighted in gold accent color
       - Re-enable airplane mode after verification

    F. v1 Migration (ROADMAP success criteria 5):
       - Sign in as travis.g.mader@gmail.com (existing v1 user)
       - Migration screen should appear (if migration_status is pending/none with v1 data)
       - Wait for completion
       - Check Supabase: sessions table has rows matching v1 history, templates table has v1 templates

    G. v2 deploy URL parallel to v1 (DATA-03):
       - Verify raze-and-rise.vercel.app (v1) still loads and functions
       - Verify v2 app connects to jmtogdlsgpfoefbgdubm without affecting v1 functionality

    H. OTA fingerprint policy (FOUND-09):
       - Run: eas update --branch development --message "test OTA"
       - Verify update channel is "development" only
       - Confirm in EAS Dashboard that update fingerprint is locked to development build fingerprint

    I. Transitions (DESIGN-04):
       - Navigate between onboarding steps — observe slide_from_right animation (~300ms)
       - Toggle Sign In/Sign Up on auth screen — observe color transition (~150ms)
       - Progress bar on onboarding — observe animated fill (~200ms)
       - Enable Reduce Motion in iOS Settings → Accessibility — confirm animations snap to final state (no animation)

    Report results:
    Create .planning/phases/01-foundation/VERIFICATION.md with:
    - Automated test results (pass/fail for each command above)
    - Manual checklist items: A through I with PASS / FAIL / BLOCKED status for each
    - Any failures noted with the exact error and plan that needs to be revisited
  </how-to-verify>
  <resume-signal>Type "Phase 1 verified" when ALL automated tests pass AND all manual checklist items are PASS or documented BLOCKED with rationale. If any item fails, paste the failure details so the relevant plan can be revisited.</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| PowerSync sync queue | Unsynced sets sit in local SQLite; no privacy risk while offline |
| EAS dev build distribution | Internal distribution (not public App Store); only team members can install |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-I-01 | Information Disclosure | __DEV__ test helpers visible in development builds | accept | Dev-only components gated on __DEV__ flag; stripped by Metro bundler in production builds. EAS production profile builds do not include dev helpers. |
| T-06-T-01 | Tampering | Walking skeleton test user (testwalking@example.com) remains in Supabase | accept | Test user is a known test account; no PII; can be deleted from Supabase dashboard after verification. |
| T-06-D-01 | Denial of Service | PowerSync reconnect storm after airplane mode re-enable | accept | PowerSync handles reconnect gracefully with exponential backoff; single-user app; no concern at this scale |
| T-06-SC | Tampering | npm/pip/cargo installs | mitigate | No new packages in this plan; verification-only |
</threat_model>

<verification>
All verification is done inside Task 2's manual checklist. The final automated gate:
- npm run test:unit -- --run: PASS
- npm run test:integration -- --run: PASS
- npx tsc --noEmit: exits 0
- maestro test .maestro/walking-skeleton.yaml: runs to completion on real device
</verification>

<success_criteria>
Phase 1 is complete when:
- All 5 ROADMAP Phase 1 success criteria verified (email auth + Google + Apple, onboarding → Dashboard, offline set → sync, all 5 tabs offline, v1 migration)
- EAS development build installable on physical iOS device (FOUND-05)
- PowerSync local SQLite initializes at startup (FOUND-06 client-side)
- Runtime fingerprint policy configured in eas.json (FOUND-09)
- VERIFICATION.md written with all automated + manual results
- Phase 2 can begin: auth, onboarding, schema, migration all working end-to-end
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-skeleton-verification-SUMMARY.md` when done.
Also create `.planning/phases/01-foundation/VERIFICATION.md` with test results.
</output>
