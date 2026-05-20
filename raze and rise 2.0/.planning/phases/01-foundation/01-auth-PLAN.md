---
phase: 01-foundation
plan: 03
type: execute
wave: 3
depends_on:
  - 01-scaffold-lib-PLAN.md
  - 01-scaffold-routing-PLAN.md
  - 01-schema-PLAN.md
files_modified:
  - app/(auth)/index.tsx
  - app/(auth)/forgot-password.tsx
  - app/(tabs)/settings.tsx
  - src/services/auth/email.ts
  - src/services/auth/google.ts
  - src/services/auth/apple.ts
  - src/services/auth/signOut.ts
  - src/components/AuthScreen/index.tsx
  - .maestro/auth-email.yaml
  - .maestro/auth-google.yaml
  - .maestro/change-password.yaml
  - .maestro/sign-out.yaml
autonomous: false
requirements:
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
  - AUTH-05
  - AUTH-06
  - AUTH-08

must_haves:
  truths:
    - "User can create an account with email and password"
    - "User can sign in with existing email and password"
    - "User can sign in with Google OAuth — session created in Supabase"
    - "User can sign in with Apple Sign-In on iOS — session created in Supabase"
    - "User can request a password reset email"
    - "User can change their password while logged in from Settings"
    - "Sign Out from Settings clears the MMKV session and routes to (auth)"
    - "Auth errors show inline (never as toast/snackbar/alert), per CONTEXT.md Decision 3"
    - "Apple Sign-In button is hidden on Android (not shown with error)"
  artifacts:
    - path: "src/services/auth/email.ts"
      provides: "Email auth service functions"
      exports: ["signUpEmail", "signInEmail", "resetPassword", "changePassword"]
    - path: "src/services/auth/google.ts"
      provides: "Google OAuth via expo-auth-session"
      exports: ["signInGoogle"]
    - path: "src/services/auth/apple.ts"
      provides: "Apple Sign-In via expo-apple-authentication"
      exports: ["signInApple"]
    - path: "src/components/AuthScreen/index.tsx"
      provides: "Single auth screen handling Sign In / Sign Up toggle with all 3 providers"
      contains: "mode state, AuthScreen, inline error HelperText"
  key_links:
    - from: "src/components/AuthScreen/index.tsx"
      to: "src/services/auth/email.ts"
      via: "signInEmail / signUpEmail called on Continue press"
      pattern: "signInEmail|signUpEmail"
    - from: "src/components/AuthScreen/index.tsx"
      to: "src/services/auth/google.ts"
      via: "signInGoogle called on Continue with Google press"
      pattern: "signInGoogle"
    - from: "app/(auth)/index.tsx"
      to: "src/components/AuthScreen/index.tsx"
      via: "AuthScreen rendered in auth route"
      pattern: "AuthScreen"

user_setup:
  - service: supabase
    why: "Google OAuth and Apple Sign-In require dashboard configuration before client code can use them"
    dashboard_config:
      - task: "Supabase Dashboard → Authentication → Providers → Google → Enable → paste Client ID and Client Secret from Google Cloud Console"
        location: "Supabase Dashboard and console.cloud.google.com"
      - task: "Supabase Dashboard → Authentication → Providers → Apple → Enable → paste Services ID, Key ID, Team ID, and private key from Apple Developer Portal"
        location: "Supabase Dashboard and developer.apple.com"
      - task: "Supabase Dashboard → Authentication → URL Configuration → add razeandrise://** and exp://** to Allowed Redirect URLs"
        location: "Supabase Dashboard → Authentication → URL Configuration"
      - task: "Supabase Dashboard → Authentication → MFA → Phone → Enable → configure Twilio or Vonage SMS provider (AUTH-06)"
        location: "Supabase Dashboard → Authentication → MFA"
      - task: "Run: eas credentials — provision Apple Sign-In entitlement for iOS (requires Apple Developer Account)"
        location: "Terminal"
---

<objective>
This plan implements all auth screens and services for Phase 1: email sign-up/sign-in, Google OAuth, Apple Sign-In, password reset, change password, SMS MFA setup, and sign-out. The full AuthScreen component (per UI-SPEC layout) is built here, along with the Forgot Password screen and the Settings auth section.

Purpose: Authentication is the entry point to the entire app. Every subsequent plan depends on a valid Supabase session existing. This plan must fully implement the single auth screen with all 3 providers, all inline error states, and the correct routing behavior.

Output: AuthScreen renders correctly with Sign In / Sign Up toggle, all providers, inline errors per UI-SPEC. All 4 Maestro E2E stubs updated to real test flows. Settings screen has Change Password and Sign Out.
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
@.planning/phases/01-foundation/01-UI-SPEC.md
@.planning/phases/01-foundation/01-SKELETON.md
@.planning/phases/01-foundation/01-scaffold-init-SUMMARY.md
@.planning/phases/01-foundation/01-scaffold-lib-SUMMARY.md
@.planning/phases/01-foundation/01-schema-SUMMARY.md

<interfaces>
<!-- From 01-scaffold-PLAN.md — components available -->
Button variants: primary, secondary, ghost, social-google, social-apple
TextInput variants: text, email, password (with eye toggle)
Label, HelperText (default/error/success), Divider (with-label), IconButton (back), Toggle (binary), Spinner

<!-- Auth service function signatures to implement -->
src/services/auth/email.ts:
  signUpEmail(email: string, password: string): Promise<AuthResponse>
  signInEmail(email: string, password: string): Promise<AuthResponse>
  resetPassword(email: string): Promise<{ error: AuthError | null }>
  changePassword(newPassword: string): Promise<{ error: AuthError | null }>

src/services/auth/google.ts:
  signInGoogle(): Promise<AuthResponse | null>  // null = cancelled (no error shown)

src/services/auth/apple.ts:
  signInApple(): Promise<AuthResponse>  // throws if not iOS or Apple credential missing

src/services/auth/signOut.ts:
  signOut(): Promise<void>

<!-- AuthScreen layout from 01-UI-SPEC.md -->
Top: 32px Noto Serif "Raze and Rise" wordmark in gold-shimmer gradient (accent-deep → accent → accent-deep) — 3xl (64pt) from safe area top
Sign In / Sign Up Toggle (binary Toggle component) — full-width below lg gap
Email TextInput (email variant) + Password TextInput (password variant) — lg gap between toggle and fields
Sign In only: "Forgot password?" caption link in accent color, sm gap below password
Continue / Create account primary Button (full-width) — lg gap below fields (or below forgot-password)
Divider with-label ("or") — lg gap above and below
"Continue with Google" social-google Button — sm gap below divider
Apple Sign-In button (native, Platform.OS === 'ios' only) — sm gap below Google
Errors: field-level under respective field; form-level under primary CTA — ALL inline HelperText, NEVER toast/alert

Error message strings from 01-UI-SPEC.md Copywriting Contract:
  Invalid email: "Enter a valid email address."
  Empty email: "Email is required."
  Empty password: "Password is required."
  Password < 8 chars (sign up): "Password must be at least 8 characters."
  Confirm password mismatch: "Passwords don't match."
  Wrong credentials: "Email or password is incorrect."
  Email exists: "An account already exists for this email. Sign in instead?"
  Network failure: "Can't reach the server. Check your connection and try again."
  OAuth cancelled: silent (no error shown)
  OAuth error: "Sign-in with {provider} failed. Try again or use email."

Keyboard behavior:
  Email field returnKeyType="next" → focuses Password
  Password field (sign in): returnKeyType="go" → submits
  Password field (sign up): returnKeyType="next" → focuses Confirm Password
  Confirm Password: returnKeyType="go" → submits

Validation timing: on blur for field-level; on submit for cross-field and API errors. NEVER validate while user is typing.

Haptics:
  Toggle change (Sign In ↔ Sign Up): Haptics.selectionAsync()
  Auth error: Haptics.notificationAsync(NotificationFeedbackType.Error)
  Auth success: Haptics.notificationAsync(NotificationFeedbackType.Success)
  CTA tap: NO haptic
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Auth services (email + Google + Apple + sign-out)</name>
  <read_first>
    .planning/phases/01-foundation/01-RESEARCH.md (Authentication section — email, Google OAuth, Apple Sign-In, Sign Out, Deep Link handler)
    .planning/phases/01-foundation/CONTEXT.md (Decision 3 — Auth Screen Layout)
    src/lib/supabase.ts (supabase client export)
  </read_first>
  <behavior>
    - signUpEmail("test@example.com", "password123") calls supabase.auth.signUp and returns AuthResponse
    - signInEmail("bad@example.com", "wrong") returns error.message (not throw)
    - resetPassword("test@example.com") calls supabase.auth.resetPasswordForEmail with redirectTo "razeandrise://reset-password"
    - changePassword("newpass123") calls supabase.auth.updateUser({ password })
    - signInGoogle(): calls WebBrowser.openAuthSessionAsync; returns null when result.type !== 'success'
    - signInApple(): throws Error("Apple Sign-In iOS only") when Platform.OS !== 'ios'
    - signOut(): calls supabase.auth.signOut()
    - tests/unit/auth/reset.test.ts: resetPassword is an async function, signUpEmail is an async function
  </behavior>
  <action>
    src/services/auth/email.ts:
    Import supabase from @/lib/supabase. Implement:
    signUpEmail(email, password) → supabase.auth.signUp({ email, password })
    signInEmail(email, password) → supabase.auth.signInWithPassword({ email, password })
    resetPassword(email) → supabase.auth.resetPasswordForEmail(email, { redirectTo: 'razeandrise://reset-password' })
    changePassword(newPassword) → supabase.auth.updateUser({ password: newPassword })
    All four are async, all return the raw Supabase result (AuthResponse or error-bearing response) — callers handle error display.

    src/services/auth/google.ts:
    Import * as AuthSession from 'expo-auth-session', * as WebBrowser from 'expo-web-browser', supabase. Call WebBrowser.maybeCompleteAuthSession() at module top. redirectTo = AuthSession.makeRedirectUri({ scheme: 'razeandrise', path: 'auth-callback' }). signInGoogle():
    1. Call supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } })
    2. Open auth URL with WebBrowser.openAuthSessionAsync(data.url, redirectTo)
    3. If result.type !== 'success' return null (cancelled — caller shows no error)
    4. Parse access_token and refresh_token from result.url hash fragment (URL hash, not query string)
    5. Call supabase.auth.setSession({ access_token, refresh_token })
    6. Return the session result

    src/services/auth/apple.ts:
    Import * as AppleAuthentication from 'expo-apple-authentication', Platform, supabase. signInApple():
    1. if Platform.OS !== 'ios' throw new Error('Apple Sign-In iOS only')
    2. AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })
    3. if !credential.identityToken throw new Error('Apple did not return an identity token')
    4. supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken })
    5. Return the result

    src/services/auth/signOut.ts:
    signOut() → await supabase.auth.signOut(). No need to manually clear MMKV — the supabaseStorageAdapter.removeItem() is called automatically by the Supabase JS client on sign-out.

    Update tests/unit/auth/reset.test.ts from placeholder to real unit test: mock supabase.auth.resetPasswordForEmail and assert it is called with correct args by resetPassword().
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --run` passes including tests/unit/auth/reset.test.ts
    - `grep "razeandrise://reset-password" src/services/auth/email.ts` returns a match
    - `grep "skipBrowserRedirect" src/services/auth/google.ts` returns a match
    - `grep "Platform.OS !== 'ios'" src/services/auth/apple.ts` returns a match (platform guard present)
    - `grep "identityToken" src/services/auth/apple.ts` returns a match
    - All 4 files export their named functions (grep "export async function" in each file)
  </acceptance_criteria>
  <done>All 4 auth service modules implemented with correct patterns from RESEARCH.md. resetPassword wired to razeandrise:// deep link. Google OAuth parses hash fragment. Apple Sign-In has platform guard. Unit tests pass.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: AuthScreen component + auth screens + Settings auth section + Maestro stubs</name>
  <read_first>
    .planning/phases/01-foundation/01-UI-SPEC.md (Auth Screen layout, Forgot Password Screen, Copywriting Contract, Interaction Patterns, Accessibility section)
    .planning/phases/01-foundation/CONTEXT.md (Decision 3 — single screen layout, inline errors only)
    src/components/Button/index.tsx (social-apple uses AppleAuthentication.AppleAuthenticationButton)
    src/services/auth/email.ts, google.ts, apple.ts, signOut.ts
  </read_first>
  <behavior>
    - AuthScreen in sign-in mode: renders Email + Password fields, Continue button, "or" divider, Google button, Apple button (iOS only), Forgot password link
    - AuthScreen in sign-up mode: renders Email + Password + Confirm Password fields, Create account button, no Forgot password link
    - Submit with empty email → "Email is required." HelperText appears under email field
    - Submit with invalid email format → "Enter a valid email address." HelperText under email field
    - Sign-up with password < 8 chars → "Password must be at least 8 characters." under password field
    - Sign-up with password mismatch → "Passwords don't match." under confirm password field
    - Supabase sign-in error → "Email or password is incorrect." under primary CTA
    - No error HelperText visible while user is actively typing (validation fires on blur/submit only)
    - Toggle between Sign In / Sign Up fires Haptics.selectionAsync()
    - Google OAuth cancelled (returns null) → no error shown
    - Apple button absent on Android
    - Loading state replaces button label with Spinner while request is in-flight
  </behavior>
  <action>
    src/components/AuthScreen/index.tsx:
    Implement the full AuthScreen organism from 01-UI-SPEC.md. Use react-hook-form + zod for form state. Zod schema:
      signInSchema: email (z.string().email("Enter a valid email address.").min(1,"Email is required.")), password (z.string().min(1,"Password is required."))
      signUpSchema: extends signInSchema with password.min(8,"Password must be at least 8 characters."), confirmPassword + .refine(p.confirm === p.password, { message:"Passwords don't match.", path:["confirmPassword"] })
    Validate on blur (trigger("fieldName") in onBlur handlers). Do NOT trigger while user is typing. On submit, call service functions; map Supabase error codes to the copywriting contract strings.

    Layout (top → bottom, per UI-SPEC Auth Screen layout):
    - SafeAreaView (bg-bg, flex-1)
    - ScrollView with KeyboardAvoidingView (behavior="padding" on iOS, "height" on Android) — TouchableWithoutFeedback wrapper dismisses keyboard on tap
    - 3xl (64pt) padding-top from safe area
    - "Raze and Rise" display text (32px Noto Serif 700) — use a LinearGradient or text with color: accent (#F2CA50) — if LinearGradient not available, use accent color solid. The gradient effect (accent-deep → accent → accent-deep) requires a shimmer animation from react-native-reanimated — implement as a simple left-to-right animated gradient using Animated.Value. If complexity is too high in Phase 1, use solid accent color with a comment "shimmer animation TODO Phase 2".
    - xl (32pt) gap
    - Toggle component (Sign In | Sign Up) full-width — onChange calls Haptics.selectionAsync() and resets form errors
    - lg (24pt) gap
    - Label + Email TextInput (email variant, returnKeyType="next")
    - md (16pt) gap
    - Label + Password TextInput (password variant) — (sign in: returnKeyType="go" + submit; sign up: returnKeyType="next" + focus confirm)
    - Sign-up only: md gap + Label + Confirm Password TextInput (password variant, returnKeyType="go" + submit)
    - sm (8pt) gap
    - Sign-in only: "Forgot password?" — Pressable Text (12px Manrope 400, text-accent, hitSlop 44pt) → navigate to (auth)/forgot-password
    - lg (24pt) gap
    - Primary Button (Continue / Create account based on mode) — loading prop wired to form submission state
    - Form-level error HelperText (error variant) under the button — visible when API error exists
    - lg gap
    - Divider with-label ("or")
    - lg gap
    - social-google Button ("Continue with Google") → calls signInGoogle(); on null return (cancelled) → no error; on error → HelperText "Sign-in with Google failed. Try again or use email."
    - sm (8pt) gap
    - Platform.OS === 'ios' ? AppleAuthentication.AppleAuthenticationButton(SignIn type, white-on-black style, height 48pt) : null — Apple button calls signInApple() wrapped in try/catch; AbortError from Apple cancellation → silent; other errors → "Sign-in with Apple failed. Try again or use email."
    After successful sign-in or sign-up: Haptics.notificationAsync(NotificationFeedbackType.Success) — root layout handles navigation automatically via session state change.
    On any auth error: Haptics.notificationAsync(NotificationFeedbackType.Error).

    app/(auth)/index.tsx:
    Replace placeholder with: renders AuthScreen component.

    app/(auth)/forgot-password.tsx:
    Simple screen with OnboardingStepLayout-style layout (or a custom SafeAreaView). Per UI-SPEC Forgot Password Screen copywriting:
    - IconButton back → navigate back to (auth)
    - Heading "Reset your password" (24px Noto Serif 700)
    - Body "We'll email you a link to set a new one." (16px Manrope 400, fg-muted)
    - Label + Email TextInput
    - Primary Button "Send reset link" → calls resetPassword(email) → shows success state
    - Success state (replaces form): CheckCircle2 icon (success color, 32px) + Heading "Check your email" + Body "If an account exists for {email}, the reset link is on its way." + Text link "Back to sign in" in accent color → navigate back to (auth)
    - Error state (under button): HelperText error variant
    No HelperText for "account not found" — security requirement: do not confirm email existence.

    app/(tabs)/settings.tsx:
    Expand from placeholder to minimal real settings screen with:
    - Section heading "Account" (24px Noto Serif 700)
    - Change Password item → navigates to a modal or inline change-password form. Change Password form: current password TextInput + new password TextInput (min 8 chars) + Confirm new password TextInput. On submit: call changePassword(newPassword). Success: HelperText success "Password updated." Error: HelperText error.
    - Sign Out item: Text "Sign out" (16px Manrope 400, text-danger). On press: Alert.alert("Sign out?", "You'll need to sign in again to see your workouts.", [{text:"Cancel",style:"cancel"},{text:"Sign out",style:"destructive",onPress:()=>signOut()}]) — this is the ONE permitted Alert.alert exception per UI-SPEC.
    - Section heading "Appearance"
    - Dark/Light mode Toggle — reads useTheme() MMKV override; setTheme writes "theme.override" to MMKV (DESIGN-01).
    - Section heading "Two-factor authentication" (AUTH-06)
    - SMS MFA item: Text "Set up SMS verification" → shows inline instructions to enable in Supabase dashboard (manual-only for Phase 1 — Supabase MFA UI requires a separate MFA enrollment flow; stub with a message "Manage 2FA in Supabase account settings" with a deep link to supabase.com or a mailto:support link).

    Maestro YAML files — update from stub to real flows:
    .maestro/auth-email.yaml: launchApp → waitForAnimationToEnd → tapOn("Sign Up") → inputText("Email", "testuser@example.com") → inputText("Password", "testpass123") → inputText("Confirm password", "testpass123") → tapOn("Create account") → assertVisible("Dashboard") (or any post-onboarding indicator). Second flow: tapOn("Sign In") → enter same creds → assertVisible Dashboard.
    .maestro/sign-out.yaml: assumes user already signed in, navigates to Settings → tapOn("Sign out") → tapOn("Sign out" destructive button) → assertVisible("Sign In").
    .maestro/change-password.yaml: user signed in → Settings → Change Password → enter new password → assert success HelperText visible.
    .maestro/auth-google.yaml: comment "# Google OAuth requires real device with Google account — automated test runs on real device only" + launchApp step + tapOn("Continue with Google") + assertVisible("Continue") (Safari in-app browser opens). Add TODO comment for manual verification steps.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `npm run test:unit -- --run` passes
    - `grep "Forgot password?" app/\(auth\)/index.tsx` or `grep "Forgot password?" src/components/AuthScreen/index.tsx` returns a match (copy correct)
    - `grep "Alert.alert" app/\(tabs\)/settings.tsx` returns exactly 1 match (the sign-out confirmation — the ONLY permitted one)
    - `grep "toast\|snackbar\|Toast\|Snackbar" src/components/AuthScreen/index.tsx` returns NO matches
    - `grep "Platform.OS.*ios" src/components/AuthScreen/index.tsx` returns a match (Apple button platform guard)
    - `grep "selectionAsync\|notificationAsync" src/components/AuthScreen/index.tsx` returns matches (haptics wired)
    - .maestro/auth-email.yaml contains "Create account" text (real flow, not placeholder comment)
    - .maestro/sign-out.yaml contains "Sign out" text
  </acceptance_criteria>
  <done>Full AuthScreen implemented per UI-SPEC with all 3 providers, inline error states, haptics, keyboard handling. Forgot Password screen implemented. Settings has Change Password, Sign Out (with Alert confirmation), and theme toggle. AUTH-06 stubbed with manual instructions. Maestro YAML files updated to real flows for email auth, sign-out, and change-password.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Auth form → Supabase Auth API | User-supplied email + password; validate before sending |
| OAuth deep link → app | razeandrise:// scheme carries tokens; must be parsed carefully |
| Apple identity token → Supabase | Apple-signed JWT; Supabase validates via JWKS |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-S-01 | Spoofing | OAuth deep link handler — token injection | mitigate | URL scheme validation in _layout.tsx deep link handler; Supabase validates tokens server-side before issuing session |
| T-03-S-02 | Spoofing | Apple identity token replay | mitigate | expo-apple-authentication returns fresh credential per request; Supabase validates nonce + JWKS |
| T-03-S-03 | Spoofing | Google OAuth state tampering | mitigate | expo-auth-session includes PKCE + state param; hash fragment used (not query string — harder to log) |
| T-03-T-01 | Tampering | Zod validation bypass (client-only) | accept | Client zod is UX-only; Supabase Auth enforces password policy server-side; no PII leaves device without server validation |
| T-03-I-01 | Information Disclosure | Auth error messages that reveal account existence | mitigate | resetPassword shows generic "If an account exists..." message regardless of outcome; wrong-credentials error does not confirm whether email exists |
| T-03-I-02 | Information Disclosure | Password field contents visible in logs | mitigate | secureTextEntry={true} on password TextInput; no password logged to console |
| T-03-E-01 | Elevation | SMS MFA (AUTH-06) — Phase 1 stub | accept | Phase 1 ships a manual-instructions stub; full Supabase MFA enrollment flow is not implemented. Risk accepted for walking skeleton; not gating production launch |
| T-03-SC | Tampering | npm/pip/cargo installs | mitigate | slopcheck + blocking human checkpoint for [ASSUMED]/[SUS] packages (already gated in scaffold plan Task 0) |
</threat_model>

<verification>
1. `npx tsc --noEmit` exits 0
2. `npm run test:unit -- --run` passes including auth unit tests
3. Manual: Run on iOS simulator — AuthScreen renders, Sign In / Sign Up toggle works, Google + Apple buttons visible
4. Manual: Run on Android simulator — Apple button absent, no crash
5. Manual: `maestro test .maestro/auth-email.yaml` — sign-up creates Supabase user (verify in Supabase Dashboard → Authentication → Users)
6. Manual AUTH-03: On real iOS device — tap "Sign in with Apple" → Apple native sheet appears → complete → session created
7. Manual AUTH-06: Verify Settings screen shows SMS MFA section with instructions
8. Manual: Tap "Forgot password?" → enter email → tap "Send reset link" → success state appears; check email inbox for reset link
</verification>

<success_criteria>
- Email sign-up and sign-in create/use Supabase sessions (AUTH-01)
- Google OAuth signs user into Supabase (AUTH-02)
- Apple Sign-In on iOS creates Supabase session; button hidden on Android (AUTH-03)
- Password reset link triggered via resetPassword() with razeandrise:// redirectTo (AUTH-04)
- Change password from Settings calls changePassword() with success/error feedback (AUTH-05)
- SMS MFA section present in Settings with manual instructions (AUTH-06)
- Sign Out from Settings clears session, routes to auth (AUTH-08)
- All errors display inline — zero toasts, snackbars, or Alert.alert except sign-out confirmation
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-auth-SUMMARY.md` when done.
</output>
