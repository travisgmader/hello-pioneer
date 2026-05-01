# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # Production build → dist/
npm run lint         # ESLint
npx playwright test  # Full E2E test suite (against live Vercel deployment)
npx playwright test --grep "chores"   # Run a single named test or group
npx playwright test tests/family-app.spec.js:39  # Run test at specific line
```

Playwright tests run against `https://family-hub-amber.vercel.app`. A saved Google auth session is required at `tests/.auth/session.json`. If it's missing, the global setup opens a Chrome window for manual Google sign-in and then saves the session automatically.

## Deployment

**Always deploy code changes, and verify the new build is live before reporting a task complete.** Do not call a task done on the basis of "I pushed" or "Vercel said success" alone — confirm the production URL is actually serving the new bundle.

Production is `https://family-hub-amber.vercel.app`, served by the Vercel project `family-hub` (this directory is linked via `.vercel/project.json`). `git push origin main` auto-deploys.

Standard flow after editing code:
1. Commit and `git push origin main`.
2. Verify the deploy is live. Easiest check: compare asset hashes.
   ```bash
   npm run build  # note the dist/assets/index-XXXX.css hash
   curl -s https://family-hub-amber.vercel.app/ | grep -oE '/assets/index-[^"]+\.css'
   ```
   The deployed hash must match the local one. You can also confirm the GitHub commit status reports Vercel `state: success`:
   ```bash
   gh api repos/travisgmader/hello-pioneer/commits/<sha>/status
   ```
3. If auto-deploy is broken or slow, deploy manually from this directory: `vercel --prod --yes`.

If the deployed hash doesn't match after a reasonable wait, investigate (Vercel project link, Git integration, build error) — don't shrug it off as "cache."

## Architecture

### No router — manual page state

`App.jsx` holds a `page` string in `useState` and renders the matching page component directly. Navigation is passed down as `setPage`. There is no React Router.

### Single global context

`src/context/AppContext.jsx` is the entire data layer. It holds all state (chores, events, custody, mealPlan, mealRecs, groceries, groceryRequests) and exposes all mutation functions. Every page/component reads from `useApp()`.

### Dual storage: Supabase or localStorage

`src/lib/supabase.js` exports `isConfigured` (true when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set). The context uses this flag to decide whether to call Supabase or persist to localStorage. When Supabase is configured, all mutations optimistically update local state and then fire the async Supabase write; failures surface as a toast banner via `dbError` state.

### Database layer (`src/lib/db.js`)

All Supabase CRUD lives here. Every table has explicit `*FromRow` / `*ToRow` transforms that map between snake_case DB columns and camelCase app state. Times are normalized to `HH:MM` on read via `normalizeTime()`. Use the per-table `load*` exports for real-time subscription callbacks; use `loadAll()` for initial page load.

### Real-time sync

The context subscribes to all 7 tables via a single Supabase channel (`family-realtime`). Any `postgres_changes` event re-fetches that table and replaces its slice of state.

### Date/time conventions

- All dates are `YYYY-MM-DD` strings in **local time** (never UTC). Use `localToday()` and `localDateStr()` from `src/lib/utils.js`.
- Times are stored as `HH:MM` (24-hour). Display uses `formatTimeRange()` which converts to 12-hour AM/PM.
- Recurring chores: toggling a non-`once` chore that isn't yet complete briefly shows a checkmark, then advances `dueDate` by the frequency interval via `nextDueDate()`.

### Auth & access control

Google OAuth via Supabase Auth. `src/lib/allowedEmails.js` contains two lists:
- `ALLOWED_EMAILS` — the five family accounts permitted to log in
- `PARENT_EMAILS` — mom and dad, who can schedule meals and approve grocery requests

The `user.email` from the Supabase session is checked against these lists in `App.jsx` (allow/deny) and in individual page components (parent vs. child UI).

### Serverless API (`api/`)

Vercel serverless functions, not part of the Vite build:
- `api/calendar.ics.js` — generates an iCal feed by querying Supabase directly (uses `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as server-side env vars)
- `api/resend-webhook.js` — email webhook handler

### Styling

CSS Modules throughout (`*.module.css` paired with each component). Theme switching is done by setting `data-theme` on `<html>` (stored in `localStorage` as `family-theme`). Current themes: `lavender`, with design specs in `DESIGN.md` and `DESIGN_lavender.md`.

### Schema

`supabase/schema.sql` is the canonical DB definition. Migrations are in `supabase/migrations/`. RLS is enabled on all tables with permissive public-access policies (single-family app gated at the application layer via `ALLOWED_EMAILS`).

### Family members

IDs used throughout: `mom`, `dad`, `stella`, `roman`, `layla`. These are hardcoded in `App.jsx` (`MEMBER_IDS`) and in the Supabase `member_id` column on events.
