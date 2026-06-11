# Phase 2: Members, Onboarding & Billing - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 22 new/modified files
**Analogs found:** 20 / 22

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/routes/members.tsx` | route | CRUD | `src/routes/onboarding/create-family.tsx` | role-match |
| `src/routes/join.tsx` | route | request-response | `src/routes/onboarding/create-family.tsx` | role-match |
| `src/components/members/MemberCard.tsx` | component | request-response | `src/components/BottomNav.tsx` (chip/button unit pattern) | partial |
| `src/components/members/AddEditMemberSheet.tsx` | component | CRUD | `src/routes/onboarding/create-family.tsx` | role-match |
| `src/components/members/InviteSheet.tsx` | component | request-response | `src/routes/onboarding/create-family.tsx` | partial |
| `src/components/members/CoppaConsentSheet.tsx` | component | request-response | `src/routes/onboarding/create-family.tsx` | partial |
| `src/components/members/PremiumGateSheet.tsx` | component | request-response | `src/components/OfflineBanner.tsx` (conditional render + state-driven display) | partial |
| `src/components/members/AvatarChipRow.tsx` | component | request-response | `src/components/BottomNav.tsx` | role-match |
| `src/components/members/ActingAsBanner.tsx` | component | event-driven | `src/components/OfflineBanner.tsx` | role-match |
| `src/components/BottomNav.tsx` | component | request-response | `src/components/BottomNav.tsx` (self) | exact |
| `src/routes/RootLayout.tsx` | route | request-response | `src/routes/RootLayout.tsx` (self) | exact |
| `src/routes/router.tsx` | config | request-response | `src/routes/router.tsx` (self) | exact |
| `src/data/useMembers.ts` | hook | CRUD | `src/data/useCurrentFamily.ts` | role-match |
| `src/data/useUpsertMember.ts` | hook | CRUD | `src/data/useFamilySettings.ts` | role-match |
| `src/data/useDeleteMember.ts` | hook | CRUD | `src/data/useFamilySettings.ts` | role-match |
| `src/data/useTier.ts` | hook | transform | `src/lib/trialEnd.ts` + `src/data/useCurrentFamily.ts` | role-match |
| `src/data/useFamilyInvites.ts` | hook | CRUD | `src/data/useFamilySettings.ts` | role-match |
| `src/auth/ActingAsProvider.tsx` | provider | event-driven | `src/theme/ThemeProvider.tsx` | role-match |
| `src/auth/useActingAs.ts` | hook | event-driven | `src/data/useCurrentFamily.ts` (hook pattern) | partial |
| `src/lib/memberColors.ts` | utility | transform | `src/lib/newId.ts` | role-match |
| `src/lib/memberEmojis.ts` | utility | transform | `src/routes/onboarding/create-family.tsx` (EMOJI_CHIPS pattern) | exact |
| `supabase/functions/invite-member/index.ts` | edge-function | request-response | `supabase/functions/revenuecat-webhook/index.ts` | role-match |
| `supabase/migrations/<ts>_phase2_member_management.sql` | migration | CRUD | `supabase/migrations/20260520000000_initial_schema.sql` | role-match |

---

## Pattern Assignments

### `src/routes/members.tsx` (route, CRUD)

**Analog:** `src/routes/onboarding/create-family.tsx`

**Imports pattern** (`create-family.tsx` lines 19-27):
```typescript
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { DateTime } from 'luxon';
import { supabase } from '../../data/supabase';
import { newId } from '../../lib/newId';
import { computeTrialEnd } from '../../lib/trialEnd';
import styles from './create-family.module.css';
```
For `members.tsx`, replace with:
```typescript
import { useState } from 'react';
import { useCurrentFamily } from '../data/useCurrentFamily';
import { useMembers } from '../data/useMembers';
import { useDeleteMember } from '../data/useDeleteMember';
import styles from './members.module.css';
```

**Core route pattern** (`create-family.tsx` lines 37-50 and 100-163): Route exports a default function component. State via `useState`. Mutation via `useMutation`. JSX with CSS Modules classNames. Error display pattern from lines 140-147:
```typescript
{createFamily.error && (
  <p className={styles.error}>
    {createFamily.error instanceof Error
      ? createFamily.error.message
      : String(createFamily.error)}
  </p>
)}
```

**Disabled state pattern** (`create-family.tsx` lines 150-157):
```typescript
<button
  className={styles.primary}
  type="submit"
  disabled={createFamily.isPending || !name.trim()}
  onClick={() => createFamily.mutate()}
>
  {createFamily.isPending ? 'Setting up your family…' : 'Create my family'}
</button>
```

---

### `src/routes/join.tsx` (route, request-response)

**Analog:** `src/routes/onboarding/create-family.tsx`

This route is structurally a one-screen form like `create-family.tsx` but calls an RPC instead of doing sequential INSERTs. Apply the same card/form layout. Critical: mount OUTSIDE RootLayout (same as `create-family`) — see router.tsx lines 51-55:
```typescript
{
  path: 'onboarding/create-family',
  element: <CreateFamily />,
  errorElement: <RouteErrorFallback />,
},
```
`/join` follows the same sibling position.

**Query client invalidation pattern** (`create-family.tsx` lines 92-99): After a successful claim, invalidate `['current-family']` using `qc.removeQueries` to force a fresh family lookup:
```typescript
onSuccess: () => {
  qc.removeQueries({ queryKey: ['current-family'] });
  navigate('/dashboard', { replace: true });
},
```

---

### `src/components/members/MemberCard.tsx` (component, request-response)

**Analog:** `src/components/BottomNav.tsx`

**Static items pattern** (`BottomNav.tsx` lines 13-20): Constant array of data items rendered into JSX elements:
```typescript
const BOTTOM_BAR_ITEMS = [
  { to: '/dashboard', emoji: '🏠', label: 'Dashboard' },
  // ...
] as const;
```
For MemberCard, member data comes from props typed against `Database['public']['Tables']['members']['Row']`.

**CSS Modules + aria pattern** (`BottomNav.tsx` lines 33-36):
```typescript
<span aria-label={item.label}>{item.emoji}</span>
```
All interactive elements need `min-height: 44px` (touch target — see `BottomNav.module.css` line 32).

**Conditional class pattern** (`BottomNav.tsx` lines 27-32):
```typescript
className={({ isActive }) =>
  isActive
    ? `${styles.bottomTab} ${styles.bottomTabActive}`
    : styles.bottomTab
}
```
For MemberCard, use `data-active` attribute pattern from `create-family.module.css` lines 73-76 instead (element-level state, not NavLink).

---

### `src/components/members/AddEditMemberSheet.tsx` (component, CRUD)

**Analog:** `src/routes/onboarding/create-family.tsx`

**Emoji chip grid pattern** (`create-family.tsx` lines 28 and 122-135):
```typescript
const EMOJI_CHIPS = ['🏠', '🌳', '🌟', '🌈', '🏡', '🦊', '🐝', '🌻'] as const;

// JSX:
<div className={styles.emojiRow}>
  {EMOJI_CHIPS.map((chip) => (
    <button
      key={chip}
      type="button"
      className={styles.emojiChip}
      data-active={emoji === chip}
      onClick={() => setEmoji(chip)}
      aria-label={`Select emoji ${chip}`}
    >
      {chip}
    </button>
  ))}
</div>
```
Phase 2 extends `EMOJI_CHIPS` to `memberEmojis.ts` (~24 curated values). The `data-active` CSS pattern from `create-family.module.css` lines 73-76 drives selected state:
```css
.emojiChip[data-active='true'] {
  border-color: var(--lavender);
  background: var(--lavender-light);
}
```

**Form input pattern** (`create-family.module.css` lines 39-55): All inputs `min-height: 44px`, `border: 2px solid var(--border)`, focus ring `outline: 2px solid var(--lavender)`.

**COPPA gate inside save handler** (RESEARCH.md Pattern 5):
```typescript
const handleSave = async () => {
  if (isUnder13 && !coppaConfirmed) {
    setShowCoppaSheet(true);
    return;
  }
  await upsertMember.mutateAsync({ ... });
};
```

---

### `src/components/members/InviteSheet.tsx` (component, request-response)

**Analog:** `src/routes/onboarding/create-family.tsx` (form shell) + `src/components/OfflineBanner.tsx` (conditional render)

No exact analog for the two-panel invite sheet. Use `create-family.tsx` form patterns for the email input section. The Web Share API call is a new pattern — no codebase analog exists. The copy/share button should call `navigator.share()` with fallback to `navigator.clipboard.writeText()`.

**Error display pattern** (`create-family.tsx` lines 140-147): Same error `<p className={styles.error}>` pattern applies to email send errors.

---

### `src/components/members/CoppaConsentSheet.tsx` (component, request-response)

**Analog:** `src/routes/onboarding/create-family.tsx`

Simple confirmation form — one checkbox, one paragraph of text, one confirm button. Apply `create-family.tsx` card layout patterns. No complex state needed beyond `const [checked, setChecked] = useState(false)`.

---

### `src/components/members/PremiumGateSheet.tsx` (component, request-response)

**Analog:** `src/components/OfflineBanner.tsx`

Like `OfflineBanner`, this is a state-driven conditional display — shown when `useTier().tier === 'free'` and an invite action is attempted. No network calls in this component; it just renders and calls an `onUpgrade` or `onClose` prop callback.

**Conditional render pattern** (`OfflineBanner.tsx` lines 53-60):
```typescript
if (online && !hasPausedMutations) return null;

return (
  <div role="status" className={styles.banner}>
    {'Offline — changes will sync when reconnected'}
  </div>
);
```

---

### `src/components/members/AvatarChipRow.tsx` (component, request-response)

**Analog:** `src/components/BottomNav.tsx`

A horizontally-scrolling strip of buttons. Mirrors `BottomNav.tsx`'s render loop pattern but maps over live `useMembers()` data rather than a static constant.

**Container + loop pattern** (`BottomNav.tsx` lines 22-39):
```typescript
export default function BottomNav() {
  return (
    <div className={styles.bottomBar}>
      {BOTTOM_BAR_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => ...}
        >
          <span aria-label={item.label}>{item.emoji}</span>
        </NavLink>
      ))}
    </div>
  );
}
```
For AvatarChipRow: replace `NavLink` with `<button>`, replace `BOTTOM_BAR_ITEMS` with `members`, apply `style={{ '--member-color': member.color }}` for dynamic CSS variable theming.

**Member color as CSS variable:** Apply inline style `style={{ '--member-color': member.color } as React.CSSProperties}` and reference `var(--member-color)` in the `.module.css` — consistent with the CSS-variable-first approach used throughout `theme.css`.

---

### `src/components/members/ActingAsBanner.tsx` (component, event-driven)

**Analog:** `src/components/OfflineBanner.tsx`

Both are persistent banners that appear based on application state. `OfflineBanner` listens to online/offline events; `ActingAsBanner` reads from `useActingAs()` context.

**Banner CSS pattern** (`OfflineBanner.module.css` lines 1-33): `position: fixed` (or `position: sticky; top: <topnav-height>`), full-width, `z-index: 250`, CSS animation on entry, all colors via `var(--token)`. For `ActingAsBanner`, use `style={{ backgroundColor: actingAsMember.color }}` as a dynamic override on top of the CSS Module base class.

**Conditional render pattern** (`OfflineBanner.tsx` lines 53-60):
```typescript
if (online && !hasPausedMutations) return null;
return <div role="status" className={styles.banner}>...</div>;
```
For `ActingAsBanner`: `if (!actingAsId || actingAsId === ownMember?.id) return null;`

**slideDown animation** (`OfflineBanner.module.css` lines 22-32): Copy this animation for the banner entrance.

---

### `src/components/BottomNav.tsx` EDIT (component, request-response)

**Analog:** `src/components/BottomNav.tsx` (self — structural edit)

**Add 7th tab:** Extend `BOTTOM_BAR_ITEMS` constant (line 13) with `{ to: '/members', emoji: '👥', label: 'Members' }`.

**Wrap with container for AvatarChipRow** (RESEARCH.md Pattern 8):
```tsx
// Before (line 22-39):
export default function BottomNav() {
  return (
    <div className={styles.bottomBar}>
      {BOTTOM_BAR_ITEMS.map(...)}
    </div>
  );
}

// After:
export default function BottomNav() {
  return (
    <div className={styles.container}>
      <AvatarChipRow />
      <div className={styles.bottomBar}>
        {BOTTOM_BAR_ITEMS.map(...)}
      </div>
    </div>
  );
}
```
Move `position: fixed; bottom: 0` from `.bottomBar` to the new `.container` wrapper in CSS.

---

### `src/routes/RootLayout.tsx` EDIT (route, request-response)

**Analog:** `src/routes/RootLayout.tsx` (self)

**Current structure** (lines 35-51):
```typescript
export default function RootLayout() {
  useRealtimeBridge();
  return (
    <RequireFamily>
      <div className={styles.shell}>
        <OfflineBanner />
        <ReconnectedToast />
        <TopNav />
        <main className={styles.main}>
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </RequireFamily>
  );
}
```

**Phase 2 additions:** Wrap in `<ActingAsProvider>` (outermost, inside `<RequireFamily>`), add `<ActingAsBanner />` as a sibling of `<TopNav>` (between TopNav and main):
```typescript
import { ActingAsProvider } from '../auth/ActingAsProvider';
import ActingAsBanner from '../components/members/ActingAsBanner';

export default function RootLayout() {
  useRealtimeBridge();
  return (
    <RequireFamily>
      <ActingAsProvider>
        <div className={styles.shell}>
          <OfflineBanner />
          <ReconnectedToast />
          <TopNav />
          <ActingAsBanner />   {/* NEW: sibling of TopNav, above main */}
          <main className={styles.main}>
            <Outlet />
          </main>
          <BottomNav />
        </div>
      </ActingAsProvider>
    </RequireFamily>
  );
}
```

---

### `src/routes/router.tsx` EDIT (config, request-response)

**Analog:** `src/routes/router.tsx` (self)

**Add `/join` as sibling of `create-family`** (lines 51-55 pattern):
```typescript
{
  path: 'join',
  element: <Join />,
  errorElement: <RouteErrorFallback />,
},
```

**Add `/members` inside RootLayout children** (lines 61-94 pattern):
```typescript
{
  path: 'members',
  element: <Members />,
  errorElement: <RouteErrorFallback />,
},
```

---

### `src/data/useMembers.ts` (hook, CRUD)

**Analog:** `src/data/useCurrentFamily.ts`

**Query hook pattern** (`useCurrentFamily.ts` lines 35-69):
```typescript
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { supabase } from './supabase';
import type { Database } from './types';

type MembersRow = Database['public']['Tables']['members']['Row'];

export function useMembers(familyId: string | undefined): UseQueryResult<MembersRow[], Error> {
  return useQuery<MembersRow[], Error>({
    queryKey: ['members', familyId],
    queryFn: async () => {
      if (!familyId) return [];
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!familyId,
    staleTime: Infinity,  // invalidated by useRealtimeBridge on members changes
  });
}
```

**staleTime: Infinity + Realtime invalidation** (`useCurrentFamily.ts` lines 27-30 jsdoc): The pattern for all family-scoped queries — `staleTime: Infinity` because `useRealtimeBridge` handles invalidation via `queryClient.invalidateQueries({ queryKey: ['members', familyId] })`.

---

### `src/data/useUpsertMember.ts` (hook, CRUD)

**Analog:** `src/data/useFamilySettings.ts`

**Mutation hook structure** (`useFamilySettings.ts` lines 28-54):
```typescript
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useCurrentFamily } from './useCurrentFamily';
import type { Database } from './types';

export function useFamilySettings(): UseMutationResult<void, Error, Partial<FamilySettingsRow>> {
  const qc = useQueryClient();
  const { data: family } = useCurrentFamily();

  return useMutation<void, Error, Partial<FamilySettingsRow>>({
    mutationFn: async (patch) => {
      if (!family?.id) {
        throw new Error('No current family — cannot update settings');
      }
      const { error } = await supabase
        .from('family_settings')
        .update(patch)
        .eq('family_id', family.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['current-family'] });
    },
  });
}
```

**Optimistic update extension** (CLAUDE.md §TanStack Query v5 Patterns + RESEARCH.md Pattern 6): `useUpsertMember` requires the full optimistic cycle not present in `useFamilySettings`. Extend the base with:
```typescript
onMutate: async (input) => {
  await qc.cancelQueries({ queryKey: ['members', familyId] });
  const prev = qc.getQueryData<MemberRow[]>(['members', familyId]);
  qc.setQueryData<MemberRow[]>(['members', familyId], (old) => {
    // ... optimistic update logic
  });
  return { prev };
},
onError: (_e, _input, ctx) => {
  if (ctx?.prev) qc.setQueryData(['members', familyId], ctx.prev);
},
onSettled: () => {
  qc.invalidateQueries({ queryKey: ['members', familyId] });
},
```

**newId() for optimistic inserts** (`create-family.tsx` line 52): `const familyId = newId();` — same pattern for new member `id`.

---

### `src/data/useDeleteMember.ts` (hook, CRUD)

**Analog:** `src/data/useFamilySettings.ts`

Same mutation hook structure as `useFamilySettings.ts`. The `mutationFn` calls `supabase.from('members').delete().eq('id', memberId)`. Apply optimistic update: remove the member from the `['members', familyId]` cache array in `onMutate`, restore in `onError`, invalidate in `onSettled`.

---

### `src/data/useTier.ts` (hook, transform)

**Analog:** `src/lib/trialEnd.ts` + `src/data/useCurrentFamily.ts`

**Luxon date arithmetic pattern** (`trialEnd.ts` lines 1-19):
```typescript
import { DateTime } from 'luxon';

export function computeTrialEnd(now: DateTime): DateTime {
  return now.plus({ days: 7 });
}
```

**Data derivation from `useCurrentFamily`** (`TopNav.tsx` lines 24-26):
```typescript
const { data: family } = useCurrentFamily();
const familyName = family?.name ?? 'Family Plan';
```

Full `useTier()` implementation follows RESEARCH.md Pattern 3 exactly — it is a pure derivation hook with no Supabase queries of its own. Reads `family?.family_settings?.subscription_status` and `family?.family_settings?.trial_ends_at`.

---

### `src/data/useFamilyInvites.ts` (hook, CRUD)

**Analog:** `src/data/useFamilySettings.ts`

Two mutations: `useGenerateInviteCode()` calls `supabase.rpc('generate_invite_code', ...)` and `useClaimInviteCode()` calls `supabase.rpc('claim_family_invite', ...)`. Both follow the same mutation structure. No optimistic updates needed — server is source of truth for codes.

**RPC call pattern** (analogous to supabase client calls in `useCurrentFamily.ts`):
```typescript
const { data, error } = await supabase.rpc('generate_invite_code', {
  p_family_id: family.id,
});
if (error) throw error;
return data as string;
```

---

### `src/auth/ActingAsProvider.tsx` (provider, event-driven)

**Analog:** `src/theme/ThemeProvider.tsx`

**Context provider structure** (`ThemeProvider.tsx` lines 29-45):
```typescript
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: family } = useCurrentFamily();

  useEffect(() => {
    // side effect driven by data
  }, [family]);

  return <>{children}</>;
}
```

Phase 2's `ActingAsProvider` is more complex — uses `createContext`, `useState`, `sessionStorage`. Full implementation follows RESEARCH.md Pattern 4. Key structural conventions to follow:
- Import `{ createContext, useContext, useEffect, useState, type ReactNode }` from `'react'`
- Export both the provider component AND the `useActingAs()` hook from the same file
- Use `sessionStorage` (not `localStorage`) per D-05

---

### `src/auth/useActingAs.ts` (hook, event-driven)

**Analog:** `src/data/useCurrentFamily.ts` (hook export pattern)

If `ActingAsProvider.tsx` exports `useActingAs()` directly (as in RESEARCH.md Pattern 4), this file may simply re-export:
```typescript
export { useActingAs } from './ActingAsProvider';
```
Or it may be a standalone file consuming the context. Either way, the hook pattern follows `useCurrentFamily.ts` — a named export function that calls a single React hook and returns typed data.

---

### `src/lib/memberColors.ts` (utility, transform)

**Analog:** `src/lib/newId.ts`

`newId.ts` is a minimal pure utility export (1 line). `memberColors.ts` follows the same pattern — a static named export constant, no imports needed:
```typescript
// newId.ts pattern (line 15):
export const newId = (): string => crypto.randomUUID();

// memberColors.ts analog:
export const MEMBER_COLORS = [
  { name: 'lavender', hex: '#b09fd8' },
  // ... 10 colors
] as const;
```

---

### `src/lib/memberEmojis.ts` (utility, transform)

**Analog:** `src/routes/onboarding/create-family.tsx` (EMOJI_CHIPS constant, line 28)

```typescript
// create-family.tsx line 28:
const EMOJI_CHIPS = ['🏠', '🌳', '🌟', '🌈', '🏡', '🦊', '🐝', '🌻'] as const;
```
Lift this pattern to a shared module and expand to ~24 member-appropriate emojis:
```typescript
export const MEMBER_EMOJIS = [
  '🙂', '😊', '🧑', '👦', '👧', '🧒',
  // ... ~24 total
] as const;
```

---

### `supabase/functions/invite-member/index.ts` (edge-function, request-response)

**Analog:** `supabase/functions/revenuecat-webhook/index.ts`

**Edge Function structure** (`revenuecat-webhook/index.ts` lines 25-96):
```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  // 1. Auth check
  const auth = req.headers.get('authorization');
  if (!auth || auth !== WEBHOOK_AUTH_HEADER) {
    return new Response('unauthorized', { status: 401 });
  }

  // 2. Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid json', { status: 400 });
  }

  // 3. Business logic with admin client
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const { error } = await admin.from('family_settings').update({ ... }).eq('family_id', appUserId);
  if (error) {
    console.error('revenuecat-webhook: DB update failed', error);
    return new Response(error.message, { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
```

**invite-member diverges** by creating a dual-client (anon JWT client to verify caller role + admin client for privileged calls) per RESEARCH.md Pattern 1. The `jsr:@supabase/supabase-js@2` import specifier and `Deno.env.get()` for secrets are the same.

**deno.json:** Copy `supabase/functions/revenuecat-webhook/deno.json` as the template for `supabase/functions/invite-member/deno.json`.

---

### `supabase/migrations/<ts>_phase2_member_management.sql` (migration, CRUD)

**Analog:** `supabase/migrations/20260520000000_initial_schema.sql`

**Migration header comment pattern** (`initial_schema.sql` lines 1-30): Always include a header block listing what the migration applies and explicitly what it defers. Use `-- ── Section header ───` dividers.

**Table creation pattern** (`initial_schema.sql` lines 39-63):
```sql
create table public.members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  -- ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create unique index <table>_<cols>_idx on public.<table>(...);
```

**RLS pattern** (`initial_schema.sql` — each table follows `alter table enable row level security` + named policies):
```sql
alter table public.family_invites enable row level security;

create policy family_invites_select on public.family_invites
  for select to authenticated
  using (family_id = private.current_family_id() and private.auth_is_parent());
```

**SECURITY DEFINER function pattern** (`initial_schema.sql`): Functions use `security definer`, `set search_path = ''`, explicit auth check via `auth.uid()` / `private.auth_is_parent()`, and `EXCEPTION WHEN OTHERS THEN RAISE WARNING` to avoid blocking transactions.

**Realtime publication** (`initial_schema.sql` comment line 16): `alter publication supabase_realtime add table public.family_invites;`

---

## Shared Patterns

### TanStack Query — query key convention
**Source:** `src/data/useCurrentFamily.ts` line 48; `src/data/useRealtimeBridge.ts` lines 38-68
**Apply to:** All new `src/data/use*.ts` hooks
```typescript
// Always array form: ['tableName', familyId] or ['tableName']
queryKey: ['members', familyId]
queryKey: ['family_invites', familyId]
queryKey: ['current-family']   // stable singleton key — no familyId suffix
```
`useRealtimeBridge.ts` fires `queryClient.invalidateQueries({ queryKey: [table, familyId] })` for every table in `FAMILY_SCOPED_TABLES`. Phase 2 must add `'family_invites'` to that constant (line 38-50).

### TanStack Query — staleTime: Infinity + Realtime invalidation
**Source:** `src/data/useCurrentFamily.ts` lines 27-30 (jsdoc) and line 67
**Apply to:** `useMembers`, any query hook for family-scoped data
```typescript
staleTime: Infinity,  // Realtime bridge handles invalidation — no polling needed
```

### TanStack Query — optimistic mutation cycle
**Source:** CLAUDE.md §TanStack Query v5 Patterns; `src/data/useFamilySettings.ts` (base); RESEARCH.md Pattern 6 (full cycle)
**Apply to:** `useUpsertMember`, `useDeleteMember`
```typescript
onMutate: async (input) => {
  await qc.cancelQueries({ queryKey: ['members', familyId] });  // cancel before snapshot
  const prev = qc.getQueryData<MemberRow[]>(['members', familyId]);
  qc.setQueryData(...);  // optimistic update
  return { prev };       // must return snapshot
},
onError: (_e, _input, ctx) => {
  if (ctx?.prev) qc.setQueryData(['members', familyId], ctx.prev);  // rollback
},
onSettled: () => {
  qc.invalidateQueries({ queryKey: ['members', familyId] });  // NOT onSuccess
},
```

### CSS Modules — all colors via CSS variables
**Source:** `src/components/BottomNav.module.css` (comment line 3); `src/routes/onboarding/create-family.module.css` (comment line 2)
**Apply to:** All new `.module.css` files
```css
/* Rule: All colors via var(--token) — no raw hex values (UI-SPEC §Color rules) */
background: var(--card-bg);
border: 2px solid var(--border);
color: var(--text);
```
Exception: member color chips use inline `style={{ '--member-color': member.color }}` dynamic CSS variable injection.

### Touch target size
**Source:** `src/components/BottomNav.module.css` line 32; `src/routes/onboarding/create-family.module.css` line 46
**Apply to:** All interactive elements in new components
```css
min-height: 44px;  /* iOS HIG minimum touch target */
```

### Import from 'react-router' (not 'react-router-dom')
**Source:** `src/routes/router.tsx` line 21; `src/components/BottomNav.tsx` line 10; `src/auth/RequireFamily.tsx` line 31
**Apply to:** All route files and components using navigation
```typescript
import { NavLink, useNavigate, redirect } from 'react-router';
// NOT: import { ... } from 'react-router-dom'
```

### Supabase client import
**Source:** All `src/data/*.ts` files
**Apply to:** All new data hooks and edge functions
```typescript
// Browser/client:
import { supabase } from './supabase';  // or '../data/supabase'

// Edge Function (Deno):
import { createClient } from 'jsr:@supabase/supabase-js@2';
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
```

### Supabase Realtime cleanup
**Source:** `src/data/useRealtimeBridge.ts` lines 73-76
**Apply to:** Any component/hook that subscribes to a Realtime channel
```typescript
return () => {
  supabase.removeChannel(channel);  // NOT channel.unsubscribe()
};
```

### newId() for client-generated UUIDs
**Source:** `src/lib/newId.ts` line 15; `src/routes/onboarding/create-family.tsx` line 52
**Apply to:** `useUpsertMember` when inserting a new member (optimistic create needs an ID immediately)
```typescript
import { newId } from '../lib/newId';
const id = input.id ?? newId();
```

### SQL SECURITY DEFINER function with auth guard
**Source:** `supabase/migrations/20260520000000_initial_schema.sql` (private schema pattern); RESEARCH.md Pattern 1 and Pattern 2
**Apply to:** `generate_invite_code()` and `claim_family_invite()` RPCs in the Phase 2 migration
```sql
create or replace function public.my_function(...)
returns ...
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Auth guard first
  if not exists (
    select 1 from public.members m
    where m.auth_user_id = auth.uid() and m.role = 'parent'
  ) then
    raise exception 'forbidden';
  end if;
  -- ... body ...
exception when others then
  raise warning 'my_function failed: %', sqlerrm;
  -- re-raise or return safe default
end;
$$;
grant execute on function public.my_function(...) to authenticated;
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `vaul` Drawer integration inside any Sheet component | component | request-response | No bottom-sheet/modal pattern exists in the codebase yet. Phase 2 introduces it for the first time. Use `vaul`'s `<Drawer.Root>`, `<Drawer.Content>` primitives per RESEARCH.md §Don't Hand-Roll. |
| `navigator.share()` / clipboard copy in `InviteSheet.tsx` | utility | request-response | No Web Share API usage in the codebase. Pure Web API — no analog needed, but no existing helper to copy from either. |

---

## Metadata

**Analog search scope:** `src/` (all subdirectories), `supabase/functions/`, `supabase/migrations/`
**Files scanned:** 47 source files
**Pattern extraction date:** 2026-06-10
