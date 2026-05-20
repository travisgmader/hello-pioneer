---
phase: 01-foundation
plan: 01c
type: execute
wave: 2
depends_on:
  - 01-scaffold-init-PLAN.md
files_modified:
  - src/components/Button/index.tsx
  - src/components/TextInput/index.tsx
  - src/components/Label/index.tsx
  - src/components/HelperText/index.tsx
  - src/components/Divider/index.tsx
  - src/components/IconButton/index.tsx
  - src/components/Toggle/index.tsx
  - src/components/Chip/index.tsx
  - src/components/ProgressBar/index.tsx
  - src/components/Spinner/index.tsx
autonomous: true
requirements:
  - DESIGN-01
  - DESIGN-04

must_haves:
  truths:
    - "All 10 design-system atom components exist and export their default component"
    - "No raw hex values (#0A0A0B, #F2CA50, etc.) appear in any component file"
    - "No StyleSheet.create calls in any component file"
    - "All Text components have allowFontScaling={false}"
    - "ProgressBar animates width via react-native-reanimated with useReducedMotion() guard"
    - "Button primary variant uses bg-accent text-bg classes"
    - "TextInput password variant has Eye/EyeOff toggle with 44x44pt hitSlop"
  artifacts:
    - path: "src/components/Button/index.tsx"
      provides: "Button with primary, secondary, ghost, social-google, social-apple variants"
      exports: ["Button"]
    - path: "src/components/TextInput/index.tsx"
      provides: "TextInput with text, email, password variants"
      exports: ["TextInput"]
    - path: "src/components/ProgressBar/index.tsx"
      provides: "Animated progress bar with useReducedMotion guard"
      exports: ["ProgressBar"]
    - path: "src/components/Toggle/index.tsx"
      provides: "Binary two-pill toggle (e.g., lbs/kg, Sign In/Sign Up)"
      exports: ["Toggle"]
    - path: "src/components/Chip/index.tsx"
      provides: "Selectable chip card for goal/split selection"
      exports: ["Chip"]
  key_links:
    - from: "src/components/ProgressBar/index.tsx"
      to: "react-native-reanimated"
      via: "useSharedValue + withTiming + useReducedMotion"
      pattern: "useReducedMotion"
    - from: "src/components/Button/index.tsx"
      to: "tailwind.config.js"
      via: "bg-accent text-bg consumed via NativeWind className"
      pattern: "bg-accent|text-bg"
---

<objective>
This plan implements all 10 design-system atom components. Depends on 01-scaffold-init-PLAN.md (NativeWind config must exist before className tokens can be used). Runs in Wave 2 parallel with 01-scaffold-routing-PLAN.md — no shared files.

Purpose: All auth, onboarding, and tab screens consume these atoms. Having them as a stable library prevents ad-hoc inline styles and enforces the design token system throughout the app.

Output: 10 NativeWind-only atom components that can be imported by any subsequent plan.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/CONTEXT.md
@.planning/phases/01-foundation/01-UI-SPEC.md
@.planning/phases/01-foundation/01-scaffold-init-SUMMARY.md

<interfaces>
<!-- Design tokens — all components MUST use className names, NO raw hex or StyleSheet -->
bg-bg, bg-bg-elevated, bg-bg-input
text-fg, text-fg-muted, text-fg-subtle
text-accent, bg-accent, border-border, border-border-strong
bg-accent-dim, bg-danger-dim
text-danger, text-success
rounded-none, rounded-sm (2px), rounded-md (4px), rounded-lg (8px), rounded-full

<!-- Typography class names -->
text-caption (12px Manrope 400), text-body (16px Manrope 400), text-body-emphasis (16px Manrope 700)
text-heading (24px Noto Serif 700), text-display (32px Noto Serif 700)

<!-- Spacing class names -->
p-xs (4px), p-sm (8px), p-md (16px), p-lg (24px), p-xl (32px)
gap-xs, gap-sm, gap-md, gap-lg, gap-xl

<!-- Motion tokens (from UI-SPEC) -->
fast=150ms ease-out, default=200ms ease-out, slow=300ms ease-in-out
useReducedMotion() from react-native-reanimated MUST wrap all animated components

<!-- Component inventory (from 01-UI-SPEC.md Component Inventory — Atoms section) -->
Button: primary, secondary, ghost, social-google, social-apple
TextInput: text, email, password (with eye toggle)
Label: text, 16px Manrope 400, text-fg
HelperText: default/error/success
Divider: with-label variant
IconButton: back variant (ChevronLeft)
Toggle: binary two-pill
Chip: selectable card with optional icon + check mark when selected
ProgressBar: animated fill, 4px height
Spinner: ActivityIndicator (accent color)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Button, TextInput, Label, HelperText, Divider, IconButton</name>
  <read_first>
    .planning/phases/01-foundation/01-UI-SPEC.md (Component Inventory — Atoms: Button, TextInput, Label, HelperText, Divider, IconButton sections; Interaction Patterns; Accessibility section)
    .planning/phases/01-foundation/CONTEXT.md (Decision 3 — inline errors only, no Alert.alert except sign-out)
  </read_first>
  <behavior>
    - Button primary: has className bg-accent text-bg and active:opacity-80 press feedback
    - Button disabled: opacity-60 applied when disabled=true
    - Button loading: shows Spinner instead of label text
    - TextInput password: Eye/EyeOff icon button toggles secureTextEntry; icon has 44x44pt hitSlop
    - TextInput focused: border changes to border-strong (via onFocus/onBlur state)
    - TextInput error: border-danger + bg-danger-dim background
    - HelperText error variant: shows AlertCircle icon (14px) prefixed + bg-danger-dim background
    - No StyleSheet.create in any component; all styling via className
    - All Text elements have allowFontScaling={false}
  </behavior>
  <action>
    All components use NativeWind className props — NO StyleSheet, NO raw hex values. All Pressable components use active:opacity-80 for press feedback. allowFontScaling={false} on all Text components (Phase 1 default per UI-SPEC Accessibility section).

    Button (primary, secondary, ghost, social-google, social-apple variants):
      primary: bg-accent text-bg font-bold rounded-md h-12 (48pt) w-full text-body-emphasis — loading state shows Spinner(bg) instead of label
      secondary: bg-bg-elevated text-fg border border-border rounded-md h-12 w-full
      ghost: transparent text-fg-muted h-12 (used ONLY for "Skip for now" on practice-set)
      social-google: bg-bg-elevated border border-border h-12 w-full flex-row items-center justify-center gap-sm
      social-apple: uses AppleAuthentication.AppleAuthenticationButton (native widget) — never custom-styled (Apple HIG)
      disabled: opacity-60 on non-loading disabled states

    TextInput (text, email, password variants):
      Base: bg-bg-elevated border border-border rounded-sm h-12 px-md text-body text-fg
      focused state: border-border-strong via onFocus/onBlur state
      error state: border-danger bg-danger-dim
      password variant: flex-row with TextInput (flex-1) + IconButton (Eye/EyeOff 20px, 44x44pt hitSlop)
      returnKeyType wired per form field (email→next, password→go on sign-in, password→next on sign-up, confirm-password→go)

    Label: Text, 16px Manrope 400 (text-body), text-fg, allowFontScaling={false}

    HelperText (default/error/success): 12px Manrope 400 (text-caption). error: text-danger with AlertCircle 14px icon prefixed, bg-danger-dim background. success: text-success.

    Divider with-label: flex-row with 1px bg-border lines flanking a bg-bg-input capsule containing "or" in 12px fg-muted.

    IconButton back: 44x44pt Pressable with hitSlop, ChevronLeft 24px text-fg, accessibilityRole="button" accessibilityLabel="Back".
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `grep -r "StyleSheet.create\|#0A0A0B\|#F2CA50\|#E5E2E1" src/components/Button src/components/TextInput src/components/Label src/components/HelperText src/components/Divider src/components/IconButton` returns NO matches
    - `grep -r "allowFontScaling" src/components/Button src/components/TextInput src/components/Label src/components/HelperText` returns matches on Text elements
    - `grep "bg-accent" src/components/Button/index.tsx` returns a match (primary variant)
    - `grep "Eye\|EyeOff" src/components/TextInput/index.tsx` returns matches (password toggle)
    - `grep "hitSlop" src/components/TextInput/index.tsx` returns a match (44x44pt)
  </acceptance_criteria>
  <done>Button, TextInput, Label, HelperText, Divider, IconButton implemented with NativeWind tokens only. No raw hex values. allowFontScaling=false on all Text. Password variant has eye toggle with correct hitSlop. TypeScript strict passes.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Toggle, Chip, ProgressBar, Spinner</name>
  <read_first>
    .planning/phases/01-foundation/01-UI-SPEC.md (Component Inventory — Toggle, Chip, ProgressBar, Spinner; Interaction Patterns — haptics, animations; Accessibility section)
    .planning/phases/01-foundation/01-RESEARCH.md (Code Examples — react-native-reanimated usage)
  </read_first>
  <behavior>
    - Toggle selected pill: bg-accent-dim border-border-strong text-accent font-bold accessibilityState.selected=true
    - Toggle unselected: text-fg-muted (no accent)
    - Chip selected: border-border-strong + bg-accent-dim + Lucide Check 16px top-right corner + accessibilityRole="radio"
    - ProgressBar: 4px height, track bg-border, fill bg-accent, animates width via useSharedValue + withTiming(200ms ease-out)
    - ProgressBar with useReducedMotion ON: width snaps to final value without animation
    - ProgressBar has accessibilityRole="progressbar" with accessibilityValue
    - Spinner: ActivityIndicator with color accent (#F2CA50) — this is the ONE place accent hex is used directly (ActivityIndicator does not accept className)
  </behavior>
  <action>
    Toggle binary: two-pill layout. Selected pill: bg-accent-dim border-border-strong text-accent font-bold accessibilityState.selected=true. Unselected: text-fg-muted. Full-width by default; each pill takes 50% width. Pressable wrapper fires onChange(value). Use Haptics.selectionAsync() on change — wired as an optional prop (some consumers want haptics, others don't — default: true).

    Chip: Pressable card with label + optional icon (Lucide icon component passed as prop). Selected: border-border-strong bg-accent-dim + Lucide Check 16px absolute top-right (position: absolute). accessibilityRole="radio". Unselected: border-border bg-bg-elevated. Text: text-body-emphasis when selected, text-fg when unselected. On press: Haptics.impactAsync(Light) (optional prop, default: true).

    ProgressBar: 4px height View, track bg-border rounded-full, fill bg-accent rounded-full. Width animated using react-native-reanimated useSharedValue + withTiming(200ms ease-out). Check useReducedMotion() — if true, skip animation and set width directly. accessibilityRole="progressbar" with accessibilityValue={{ now: Math.round(progress * 100), min: 0, max: 100 }}. Props: progress (0.0 to 1.0).

    Spinner: ActivityIndicator with color="#F2CA50" (accent — ActivityIndicator requires hex string, not NativeWind class), size props: default="small", inline="small". Note in comment: "ActivityIndicator color must be hex string — NativeWind className not supported on this prop".
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run test:unit -- --run</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0
    - `grep -r "StyleSheet.create" src/components/Toggle src/components/Chip src/components/ProgressBar src/components/Spinner` returns NO matches
    - `grep "useReducedMotion" src/components/ProgressBar/index.tsx` returns a match
    - `grep "withTiming\|useSharedValue" src/components/ProgressBar/index.tsx` returns matches
    - `grep "accessibilityRole.*progressbar\|progressbar" src/components/ProgressBar/index.tsx` returns a match
    - `grep "accessibilityRole.*radio\|radio" src/components/Chip/index.tsx` returns a match
    - `grep "Check" src/components/Chip/index.tsx` returns a match (Lucide Check icon for selected state)
    - `grep "F2CA50" src/components/Spinner/index.tsx` returns a match (ActivityIndicator hex — acceptable exception)
  </acceptance_criteria>
  <done>Toggle, Chip, ProgressBar, Spinner implemented. ProgressBar animates via reanimated with useReducedMotion guard. Chip has accessibility radio role. Spinner uses hex for ActivityIndicator color (documented exception). TypeScript strict passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| User input → TextInput | Client-side display only; no data leaves device from this plan |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01c-I-01 | Information Disclosure | Password field contents visible | mitigate | secureTextEntry={true} on password TextInput by default; Eye toggle enables/disables secureTextEntry — user-initiated only |
| T-01c-SC | Tampering | npm installs | mitigate | Gated by 01-scaffold-init-PLAN.md Task 0 blocking checkpoint |
</threat_model>

<verification>
1. `npx tsc --noEmit` exits 0
2. `grep -r "StyleSheet.create\|#0A0A0B\|#F2CA50\|#E5E2E1" src/components/` returns NO matches (except Spinner's ActivityIndicator hex which is documented)
3. `grep -r "allowFontScaling" src/components/` returns matches on Text components
4. `grep "useReducedMotion" src/components/ProgressBar/index.tsx` returns a match
</verification>

<success_criteria>
- All 10 design-system atom components implemented using NativeWind tokens only (DESIGN-01)
- ProgressBar uses react-native-reanimated with useReducedMotion() guard (DESIGN-04)
- No raw hex values in component files (except Spinner's ActivityIndicator color — documented exception)
- TypeScript strict passes
</success_criteria>

<output>
Create `.planning/phases/01-foundation/01-scaffold-ui-SUMMARY.md` when done.
</output>
