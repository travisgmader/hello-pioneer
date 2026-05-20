# Phase 1: Foundation & Walking Skeleton — Pattern Map

**Mapped:** 2026-05-19
**Files analyzed:** 22 new files
**Analogs found:** 14 / 22 (8 are greenfield — documented in §No Analog Found)

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `src/theme/theme.css` | config | — | `../family-app/src/index.css` | exact — port verbatim |
| `src/styles/globals.css` | config | — | `../family-app/src/index.css` (base rules) | exact — port verbatim |
| `src/lib/supabase.ts` (was `supabase.js`) | config | request-response | `../family-app/src/lib/supabase.js` | role-match (v2 replaces init; PKCE added) |
| `src/routes/login.tsx` | component | request-response | `../family-app/src/pages/Login.jsx` | exact |
| `src/routes/login.module.css` | config | — | `../family-app/src/pages/Login.module.css` | exact — port verbatim |
| `src/routes/access-denied.tsx` | component | request-response | `../family-app/src/App.jsx` (inline block lines 38–51) | partial |
| `src/components/TopNav.tsx` | component | request-response | `../family-app/src/components/Nav.jsx` | role-match (member links removed) |
| `src/components/BottomNav.tsx` | component | request-response | `../family-app/src/components/Nav.jsx` (bottomBar section) | exact |
| `src/components/TopNav.module.css` + `BottomNav.module.css` | config | — | `../family-app/src/components/Nav.module.css` | exact — port verbatim |
| `src/components/OfflineBanner.tsx` | component | event-driven | `../family-app/src/context/AppContext.jsx` (dbError toast, lines 210–216) | partial |
| `src/components/ThemeToggle.tsx` | component | event-driven | `../family-app/src/components/ThemePanel.jsx` | role-match |
| `src/auth/allowlist.ts` | utility | request-response | `../family-app/src/lib/allowedEmails.js` | partial (DB replaces hardcoded array) |
| `src/data/supabase.ts` | config | request-response | `../family-app/src/lib/supabase.js` | role-match |
| `src/data/useCurrentFamily.ts` | hook | CRUD | `../family-app/src/context/AppContext.jsx` (loadAll pattern, lines 46–58) | partial |
| `src/data/useRealtimeBridge.ts` | hook | event-driven | `../family-app/src/context/AppContext.jsx` (realtime block, lines 62–74) | role-match |
| `src/data/queryClient.ts` | config | — | no analog | none |
| `src/routes/router.ts` | config | request-response | no analog | none |
| `src/routes/RootLayout.tsx` | component | request-response | no analog | none |
| `src/routes/onboarding/create-family.tsx` | component | CRUD | no analog | none |
| `src/theme/ThemeProvider.tsx` | provider | event-driven | `../family-app/src/App.jsx` (theme useEffect, lines 24–27) | partial |
| `supabase/functions/stripe-create-customer/index.ts` | service | request-response | no analog | none |
| `supabase/functions/stripe-webhook/index.ts` | service | event-driven | no analog | none |

---

## Pattern Assignments

### `src/theme/theme.css` (config)

**Analog:** `../family-app/src/index.css`
**Directive: Port the `:root` and `[data-theme="midnight"]` blocks verbatim. Drop the `[data-theme="electric"]` block entirely (out of scope per REQUIREMENTS.md SETT-02).**

**Lavender palette — `:root` block (lines 1–29):**
```css
:root {
  --lavender: #c9a8e0;
  --lavender-light: #ecdff7;
  --lavender-dark: #9b7bbf;
  --mint: #8ecf8e;
  --mint-light: #cbedcb;
  --mint-dark: #5fa85f;
  --yellow: #f5d87a;
  --yellow-light: #fdf0b8;
  --yellow-dark: #c9a830;
  --pink: #f4a0b5;
  --pink-light: #fad4e0;
  --pink-dark: #d4607a;
  --blue: #87c4e0;
  --blue-light: #c5e4f0;
  --blue-dark: #4a8fba;
  --peach: #f5c09a;
  --peach-light: #fde3ca;
  --peach-dark: #d07a40;
  --bg: #fdf6ff;
  --card-bg: #ffffff;
  --text: #3d2c4e;
  --text-muted: #8a7898;
  --border: #e8d5f5;
  --shadow: 0 4px 20px rgba(180, 140, 220, 0.12);
  --shadow-hover: 0 8px 30px rgba(180, 140, 220, 0.22);
  --radius: 16px;
  --radius-sm: 8px;
}
```

**Midnight palette — `[data-theme="midnight"]` block (lines 118–216):**
```css
[data-theme="midnight"] {
  --lavender: #e9c176;
  --lavender-light: #221c0d;
  --lavender-dark: #f0d490;
  --mint: #10b981;
  --mint-light: #041a10;
  --mint-dark: #6ee7b7;
  --yellow: #f97316;
  --yellow-light: #1e0d03;
  --yellow-dark: #fdba74;
  --pink: #e879a0;
  --pink-light: #1e0815;
  --pink-dark: #f9a8d4;
  --blue: #60a5fa;
  --blue-light: #060f1e;
  --blue-dark: #93c5fd;
  --peach: #a78bfa;
  --peach-light: #110e20;
  --peach-dark: #c4b5fd;
  --bg: #0c0b0f;
  --card-bg: #16141f;
  --text: #e5e2e1;
  --text-muted: #8b8680;
  --border: rgba(233, 193, 118, 0.12);
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(233, 193, 118, 0.12);
  --shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(233, 193, 118, 0.22), 0 0 24px rgba(233, 193, 118, 0.08);
  --radius: 4px;
  --radius-sm: 2px;
}

[data-theme="midnight"] body {
  font-family: 'Manrope', 'Segoe UI', sans-serif;
  background-color: #0c0b0f;
  background-image:
    linear-gradient(rgba(233, 193, 118, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(233, 193, 118, 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  background-attachment: fixed;
}

[data-theme="midnight"] h1,
[data-theme="midnight"] h2,
[data-theme="midnight"] h3,
[data-theme="midnight"] h4 {
  font-family: 'Noto Serif', Georgia, serif;
  letter-spacing: -0.02em;
}

[data-theme="midnight"] nav {
  background: rgba(22, 20, 31, 0.82) !important;
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom-color: rgba(233, 193, 118, 0.1) !important;
}

[data-theme="midnight"] input,
[data-theme="midnight"] textarea,
[data-theme="midnight"] select {
  background: var(--card-bg);
  color: var(--text);
  border-color: rgba(233, 193, 118, 0.2);
}

[data-theme="midnight"] input:focus,
[data-theme="midnight"] textarea:focus,
[data-theme="midnight"] select:focus {
  outline-color: var(--lavender);
  border-color: var(--lavender);
}
```

**What to drop:** The `[data-theme="electric"]` block (lines 31–116). Electric theme is out of scope.

---

### `src/styles/globals.css` (config)

**Analog:** `../family-app/src/index.css` (base rules, lines 218–271)
**Directive: Port the reset + body + mobile globals verbatim. Update `font-size` from 15px → 16px (UI-SPEC decision).**

**Base reset and body (lines 218–253):**
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  font-size: 16px;   /* v1 was 15px; v2 bumps to 16px per UI-SPEC */
  line-height: 1.5;
}

#root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

button {
  cursor: pointer;
  font-family: inherit;
  border: none;
}

input, textarea, select {
  font-family: inherit;
  font-size: 14px;
}

h1, h2, h3, h4 {
  color: var(--text);
  font-weight: 600;
}
```

**Mobile globals (lines 255–271) — port verbatim:**
```css
@media (max-width: 768px) {
  body { font-size: 14px; }

  button { min-height: 36px; }

  main {
    padding-bottom: calc(64px + max(env(safe-area-inset-bottom, 12px), 12px));
  }

  footer {
    margin-bottom: calc(64px + max(env(safe-area-inset-bottom, 12px), 12px));
  }
}
```

---

### `src/routes/login.tsx` (component, request-response)

**Analog:** `../family-app/src/pages/Login.jsx`

**Core component structure (lines 1–37):**
```tsx
// v1 JSX — translate to TSX with typed state
export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
      // v2 difference: origin + trailing slash; v1 used bare origin
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* icon/logo here */}
        <h1 className={styles.title}>Family Plan</h1>
        <p className={styles.subtitle}>Sign in to access your family's dashboard</p>
        {error && <p className={styles.error}>{error}</p>}
        <button
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : <><GoogleIcon /> Sign in with Google</>}
        </button>
      </div>
    </div>
  );
}
```

**GoogleIcon SVG (lines 39–48):** Copy verbatim from v1 `Login.jsx` — it is the correct multi-path Google logo SVG with FFC107/FF3D00/4CAF50/1976D2 fill colors.

**v1 → v2 differences to apply:**
- Import from `'../data/supabase'` not `'../lib/supabase'`
- `redirectTo` must be `${window.location.origin}/` (with trailing slash) for PKCE flow
- Use CSS Modules import (`import styles from './login.module.css'`)
- No `isConfigured` guard needed — v2 always has Supabase configured

---

### `src/routes/login.module.css` (config)

**Analog:** `../family-app/src/pages/Login.module.css`
**Directive: Port verbatim. The card geometry (380px max-width, 48px×40px padding, 12px gap) and Google button styles match the UI-SPEC exactly.**

**Full file (lines 1–78):**
```css
.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg);
  padding: 24px;
}

.card {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 48px 40px;
  text-align: center;
  max-width: 380px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  margin-top: 4px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.error {
  color: var(--pink-dark);
  font-size: 13px;
  background: var(--pink-light);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  width: 100%;
}

.googleBtn {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  width: 100%;
  padding: 12px 20px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card-bg);
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  margin-top: 8px;
  min-height: 44px;   /* add: WCAG 2.5.5 touch target */
}

.googleBtn:hover:not(:disabled) {
  border-color: var(--lavender);
  box-shadow: var(--shadow);
}

.googleBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

### `src/routes/access-denied.tsx` (component, request-response)

**Analog:** `../family-app/src/App.jsx` lines 38–51 (inline access-denied block)

**v1 inline pattern (lines 38–51) — the visual model, not a copy:**
```jsx
// v1 — inline in App.jsx, no route, email from hardcoded ALLOWED_EMAILS check
if (isConfigured && user && !ALLOWED_EMAILS.includes(user.email?.toLowerCase())) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Access Denied</div>
      <div style={{ fontSize: 14, maxWidth: 320 }}>
        <strong>{user.email}</strong> is not authorized to access Family Plan.
      </div>
      <button onClick={() => supabase.auth.signOut()}>Sign out</button>
    </div>
  );
}
```

**v2 pattern — extract to route, use CSS Modules, read email from URL param, use UI-SPEC copy:**
```tsx
// src/routes/access-denied.tsx
import { useSearchParams } from 'react-router';
import { supabase } from '../data/supabase';
import styles from './access-denied.module.css';  // reuse login card layout

export default function AccessDenied() {
  const [params] = useSearchParams();
  const email = params.get('email') ?? 'your account';

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>This email isn't on the family list</h1>
        <p className={styles.body}>
          <strong>{email}</strong> doesn't have access to this Family Plan.
          Ask a parent to add you, then sign in again.
        </p>
        <button
          className={styles.signOutBtn}
          onClick={() => supabase.auth.signOut()}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
```

Note: `access-denied.module.css` shares the `.wrapper` + `.card` pattern from `login.module.css`.

---

### `src/components/TopNav.tsx` (component, request-response)

**Analog:** `../family-app/src/components/Nav.jsx`

**NAV_ITEMS declaration pattern (lines 8–15):**
```tsx
// v1
const NAV_ITEMS = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'chores',    label: '✅ Chores' },
  { id: 'calendar',  label: '📅 Calendar' },
  { id: 'meals',     label: '🍽️ Meals' },
  { id: 'groceries', label: '🛒 Groceries' },
  { id: 'notes',     label: '📝 Notes' },
];

// v2 — identical item set; use NavLink from react-router instead of onClick setPage
const NAV_ITEMS = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/chores',    label: '✅ Chores' },
  { to: '/calendar',  label: '📅 Calendar' },
  { to: '/meals',     label: '🍽️ Meals' },
  { to: '/groceries', label: '🛒 Groceries' },
  { to: '/notes',     label: '📝 Notes' },
] as const;
```

**Desktop nav structure (lines 36–76) — what to keep vs replace:**

Keep from v1:
- `<nav className={styles.nav}>` wrapper
- `.logo` button pattern (family name left-aligned)
- `.links` flex container with `.link` + `.active` pills for each NAV_ITEM
- `.signOut` button (right-aligned, pink hover)
- `@keyframes slideDown` dropdown

Replace in v2:
- `setPage(id)` → `<NavLink to={item.to}>` — React Router handles active state via `className={({ isActive }) => ...}`
- `MEMBERS.map(...)` section — removed entirely (D-14: members are Phase 2)
- `ThemePanel` → `ThemeToggle` (inline chip pair per UI-SPEC)
- `user.email` from AppContext → from React Router loader data

**Sign-out button pattern (lines 72–76):**
```tsx
// v1
{isConfigured && user && (
  <button className={styles.signOut} onClick={signOut} title={user.email}>
    Sign out
  </button>
)}

// v2 — always mounted (RequireAuth guarantees user exists); no isConfigured guard
<button className={styles.signOut} onClick={() => supabase.auth.signOut()}>
  Sign out
</button>
```

---

### `src/components/BottomNav.tsx` (component, request-response)

**Analog:** `../family-app/src/components/Nav.jsx` lines 17–23 and 110–122 (BOTTOM_BAR_ITEMS + bottomBar JSX)

**v1 mobile bottom bar (lines 17–23 + 110–122):**
```jsx
// v1 — only 5 items; v2 adds Notes (6 total, per D-13)
const BOTTOM_BAR_ITEMS = [
  { id: 'dashboard', emoji: '🏠' },
  { id: 'chores',    emoji: '✅' },
  { id: 'calendar',  emoji: '📅' },
  { id: 'meals',     emoji: '🍽️' },
  { id: 'groceries', emoji: '🛒' },
];

<div className={styles.bottomBar}>
  {BOTTOM_BAR_ITEMS.map(item => (
    <button
      key={item.id}
      className={`${styles.bottomTab} ${page === item.id ? styles.bottomTabActive : ''}`}
      onClick={() => navigate(item.id)}
    >
      {item.emoji}
    </button>
  ))}
</div>
```

**v2 — add Notes as 6th tab, replace onClick with NavLink:**
```tsx
const BOTTOM_BAR_ITEMS = [
  { to: '/dashboard', emoji: '🏠', label: 'Dashboard' },
  { to: '/chores',    emoji: '✅', label: 'Chores' },
  { to: '/calendar',  emoji: '📅', label: 'Calendar' },
  { to: '/meals',     emoji: '🍽️', label: 'Meals' },
  { to: '/groceries', emoji: '🛒', label: 'Groceries' },
  { to: '/notes',     emoji: '📝', label: 'Notes' },
] as const;
```

---

### `src/components/TopNav.module.css` + `src/components/BottomNav.module.css` (config)

**Analog:** `../family-app/src/components/Nav.module.css`
**Directive: Port the relevant sections verbatim. Split into two files.**

**TopNav.module.css — port (lines 1–218):**
```css
/* Port verbatim: .nav, .logo, .links, .divider, .link, .link.active,
   .mobileRight, .mobilePageLabel, .hamburger, .bar, .barTop/.barMid/.barBot,
   .dropdown, @keyframes slideDown, .dropSection, .dropDivider, .dropLink,
   .dropActive, .signOut, .dropSignOut
   Drop: all .member color variants — member links removed in Phase 1 */
```

Key rules to carry:
```css
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--card-bg);
  border-bottom: 2px solid var(--border);
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 200;
}

.link.active {
  background: var(--lavender);
  color: white;
  box-shadow: 0 2px 8px rgba(180, 140, 220, 0.3);
}

.signOut:hover {
  background: var(--pink-light);
  color: var(--pink-dark);
  border-color: var(--pink);
}
```

**BottomNav.module.css — port the `@media (max-width: 768px)` bottom bar section (lines 225–265):**
```css
.bottomBar {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 300;
  background: var(--card-bg);
  border-top: 1px solid var(--border);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
  padding-bottom: max(env(safe-area-inset-bottom, 12px), 12px);
}

.bottomTab {
  flex: 1;
  background: none;
  border: none;
  font-size: 24px;
  padding: 10px 0;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
  border-radius: 0;
  line-height: 1;
  min-height: 44px;   /* add: WCAG 2.5.5 */
}

.bottomTab:hover {
  background: var(--lavender-light);
}

.bottomTabActive {
  background: var(--lavender-light);
  transform: translateY(-2px);
}
```

---

### `src/auth/allowlist.ts` (utility, request-response)

**Analog:** `../family-app/src/lib/allowedEmails.js`

**v1 pattern — hardcoded array (lines 1–9):**
```js
export const ALLOWED_EMAILS = [
  'travis.g.mader@gmail.com',
  'angelia.m.merryman14@gmail.com',
  // ...
];
// Usage in App.jsx: ALLOWED_EMAILS.includes(user.email?.toLowerCase())
```

**v2 pattern — DB query (email list is the source of bootstrap emails for the migration):**
```typescript
// src/auth/allowlist.ts
import { supabase } from '../data/supabase';

export async function isAllowedEmail(email: string): Promise<boolean> {
  const lowered = email.toLowerCase().trim();
  const { data, error } = await supabase
    .from('allowed_emails')
    .select('email')
    .eq('email', lowered)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}
```

**Bootstrap emails from v1 `allowedEmails.js` (lines 3–9)** — used verbatim as the `INSERT INTO allowed_emails` seed in the migration SQL:
- `travis.g.mader@gmail.com`
- `angelia.m.merryman14@gmail.com`
- `laylamerryman11@gmail.com`
- `stellamader6@gmail.com`
- `maderroman5@gmail.com`

---

### `src/data/supabase.ts` (config, request-response)

**Analog:** `../family-app/src/lib/supabase.js`

**v1 pattern (lines 1–8):**
```js
import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isConfigured = !!(url && key);
export const supabase = isConfigured ? createClient(url, key) : null;
```

**v2 differences to apply:**
- Remove `isConfigured` guard — v2 always has env vars; fail fast with `!` assertion
- Add `auth` config block for PKCE + session persistence
- Parameterize with generated `Database` type
- Add `signInWithGoogle()` helper

```typescript
// src/data/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,  // REQUIRED for PKCE code exchange
      flowType: 'pkce',
    },
  },
);

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
}
```

---

### `src/data/useCurrentFamily.ts` (hook, CRUD)

**Analog:** `../family-app/src/context/AppContext.jsx` lines 46–58 (load-once auth pattern)

**v1 pattern — one-shot load after auth (lines 46–58):**
```js
useEffect(() => {
  if (!isConfigured || authLoading) return;
  if (!user) { setLoading(false); return; }
  db.loadAll().then((data) => { /* setChores, setEvents, etc. */ })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [authLoading, user]);
```

**v2 pattern — TanStack Query hook (replaces the useEffect load):**
```typescript
// src/data/useCurrentFamily.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export function useCurrentFamily() {
  return useQuery({
    queryKey: ['current-family'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('members')
        .select('family_id, families(*)')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.families ?? null;
    },
    staleTime: Infinity,  // realtime bridge invalidates ['current-family'] on change
  });
}
```

**`check()` helper — carry forward from v1 `db.js` (lines 3–5), TypeScript version:**
```typescript
// src/data/supabase.ts or src/lib/check.ts
import type { PostgrestError } from '@supabase/supabase-js';

export function check<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw res.error;
  if (res.data === null) throw new Error('No data returned');
  return res.data;
}
```

---

### `src/data/useRealtimeBridge.ts` (hook, event-driven)

**Analog:** `../family-app/src/context/AppContext.jsx` lines 62–74 (realtime subscription block)

**v1 pattern — per-table subscriptions that call loaders (lines 62–74):**
```js
const channel = supabase
  .channel('family-realtime')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'chores' },
      () => db.loadChores().then(setChores))
  // ... one .on() per table
  .subscribe();
return () => supabase.removeChannel(channel);  // v1 already uses removeChannel — carry forward
```

**v2 pattern — single channel, invalidateQueries instead of setters:**
```typescript
// The removeChannel cleanup is carried from v1 verbatim:
return () => { supabase.removeChannel(channel); };

// v2 adds: filter per table, invalidateQueries instead of loader callbacks
channel = channel.on(
  'postgres_changes',
  { event: '*', schema: 'public', table, filter },
  () => qc.invalidateQueries({ queryKey: [table, familyId] }),
);
```

---

### `src/components/OfflineBanner.tsx` (component, event-driven)

**Analog:** `../family-app/src/context/AppContext.jsx` lines 210–216 (dbError toast)

**v1 pattern — fixed error toast on db write failure (lines 210–216):**
```jsx
{dbError && (
  <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                background: '#dc2626', color: 'white', padding: '10px 18px',
                borderRadius: 8, zIndex: 9999, fontSize: 13 }}>
    <span>Save failed: {dbError}</span>
    <button onClick={() => setDbError(null)} style={{ ... }}>✕</button>
  </div>
)}
```

**v2 pattern — fixed top banner, MutationCache subscription (not db error toast):**
```tsx
// Position: fixed top (not bottom-center); slides down; key visual differences
// See RESEARCH.md Pattern 8 for full implementation.
// What to keep from v1: fixed positioning z-index pattern, conditional render
// What to replace: position (top not bottom), trigger (MutationCache not write error),
//                  dismissal (auto not manual), content (OFFLINE copy not error message)
```

CSS from UI-SPEC:
```css
.banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 250;  /* above nav (200) but below bottom-bar (300) */
  height: 36px;  /* 32px mobile */
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  animation: slideDown 200ms ease-out;
}
@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
}
```

---

### `src/theme/ThemeProvider.tsx` (provider, event-driven)

**Analog:** `../family-app/src/App.jsx` lines 22–27 (theme useEffect)

**v1 pattern — theme from localStorage, document attribute (lines 22–27):**
```js
const [theme, setTheme] = useState(() => localStorage.getItem('family-theme') || 'lavender');

useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('family-theme', theme);
}, [theme]);
```

**v2 pattern — OS preference on first load, family_settings.theme thereafter:**
```tsx
// src/theme/ThemeProvider.tsx
// What to keep: document.documentElement.setAttribute('data-theme', ...) — verbatim
// What to replace:
//   - localStorage source → useCurrentFamily().data?.family_settings?.theme
//   - localStorage fallback → window.matchMedia('(prefers-color-scheme: dark)') check
//   - 'lavender' default → osDefault() function

function osDefault(): 'lavender' | 'midnight' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'lavender';
}

// Apply theme:
const theme = family?.family_settings?.theme ?? osDefault();
if (theme === 'midnight') {
  document.documentElement.setAttribute('data-theme', 'midnight');
} else {
  document.documentElement.removeAttribute('data-theme');  // Lavender = no attribute
}
```

---

## Shared Patterns

### `check()` Helper — Carry Forward from v1 `db.js`
**Source:** `../family-app/src/lib/db.js` lines 3–5
**Apply to:** All `src/data/` hooks that call Supabase
**v1 implementation:**
```js
const check = (res) => { if (res.error) throw res.error; return res; };
const checked = (q) => q.then(check);
```
**v2 TypeScript version (place in `src/data/supabase.ts` or `src/lib/check.ts`):**
```typescript
import type { PostgrestError } from '@supabase/supabase-js';

export function check<T>(res: { data: T | null; error: PostgrestError | null }): T {
  if (res.error) throw res.error;
  if (res.data === null) throw new Error('no data');
  return res.data;
}
```

### `supabase.removeChannel()` Cleanup Pattern
**Source:** `../family-app/src/context/AppContext.jsx` line 73
**Apply to:** `useRealtimeBridge.ts` and any future realtime hook
```js
// v1 — already correct, copy verbatim:
return () => supabase.removeChannel(channel);
// NOT: channel.unsubscribe()
```

### CSS Module + CSS Variable Pattern
**Source:** `../family-app/src/components/Nav.module.css` and `Login.module.css`
**Apply to:** All v2 component `.module.css` files
- All colors via `var(--token)` — never raw hex values
- Border radius via `var(--radius)` or `var(--radius-sm)` — never raw px
- Shadow via `var(--shadow)` or `var(--shadow-hover)` — never raw box-shadow

### `data-theme` Attribute Switch Pattern
**Source:** `../family-app/src/App.jsx` lines 24–27
**Apply to:** `ThemeProvider.tsx`
```js
document.documentElement.setAttribute('data-theme', 'midnight');  // Midnight
document.documentElement.removeAttribute('data-theme');           // Lavender = no attribute
```

### Row Transform Anti-Pattern (DO NOT CARRY FORWARD)
**Source:** `../family-app/src/lib/db.js` lines 9–79 (`choreFromRow`, `eventFromRow`, etc.)
**Do NOT use** in v2. These transform functions exist because v1's schema didn't match the app state shape. v2 schema columns are designed to match TypeScript types directly (snake_case in DB, matching types in generated `Database` type). Use Supabase generated types instead.

### AppContext Anti-Pattern (DO NOT CARRY FORWARD)
**Source:** `../family-app/src/context/AppContext.jsx`
**Do NOT replicate** in v2. The `AppProvider` holding all server state in React context is exactly what v2 replaces with TanStack Query per-feature hooks. No global server state context.

### Hardcoded Member IDs Anti-Pattern (DO NOT CARRY FORWARD)
**Source:** `../family-app/src/App.jsx` line 17: `const MEMBER_IDS = ['mom', 'dad', 'stella', 'roman', 'layla']`
**Do NOT carry** any string-literal member references. All member data comes from the `members` table.

---

## No Analog Found

Files with no close match in the v1 codebase — planner should use RESEARCH.md patterns directly.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/data/queryClient.ts` | config | — | v1 had no TanStack Query. Use RESEARCH.md Pattern 5 verbatim. |
| `src/routes/router.ts` | config | request-response | v1 used `useState('dashboard')` page routing — no equivalent. Use RESEARCH.md Pattern 2 verbatim. |
| `src/routes/RootLayout.tsx` | component | request-response | v1 had no layout abstraction. Use RESEARCH.md Pattern 2 for `<Outlet/>` structure. |
| `src/routes/onboarding/create-family.tsx` | component | CRUD | v1 had no family creation concept. Use RESEARCH.md Pattern 10 verbatim. |
| `src/routes/RouteErrorFallback.tsx` | component | request-response | v1 had no error boundaries. See UI-SPEC §Interaction Contracts for the two-button card layout. |
| `src/components/ReconnectedToast.tsx` | component | event-driven | No toast pattern in v1. See UI-SPEC: fixed top-right 3s auto-dismiss, "Back online — syncing your changes". |
| `supabase/functions/stripe-create-customer/index.ts` | service | request-response | No Stripe in v1. Use RESEARCH.md Pattern 10 verbatim. |
| `supabase/functions/stripe-webhook/index.ts` | service | event-driven | No Stripe in v1. Use RESEARCH.md Pattern 11 verbatim. |
| `src/lib/newId.ts` | utility | — | v1 used `'c' + Date.now()` (anti-pattern). v2 is `export const newId = () => crypto.randomUUID();` |
| `src/lib/env.ts` | utility | — | No typed env pattern in v1. Simple typed wrapper: `export const env = { supabaseUrl: import.meta.env.VITE_SUPABASE_URL! }` |
| `supabase/migrations/20260520_000_initial_schema.sql` | migration | — | v1 had no migrations. Use RESEARCH.md §Supabase Schema & RLS verbatim. |

---

## Metadata

**Analog search scope:** `../family-app/src/` — all subdirectories
**Files scanned:** 14 v1 source files
**Key analogs:** `index.css`, `App.jsx`, `lib/db.js`, `lib/supabase.js`, `lib/allowedEmails.js`, `components/Nav.jsx`, `components/Nav.module.css`, `pages/Login.jsx`, `pages/Login.module.css`, `context/AppContext.jsx`
**Pattern extraction date:** 2026-05-19
