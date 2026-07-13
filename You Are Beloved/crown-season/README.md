# The Crown Season

A mobile-first companion app for **The Crown Season** 10-week men's group.
Everything a member needs for the week — the reading summary, all the Scriptures,
the discussion questions, and the weekly challenge — split across three short days,
plus a daily gratitude + reflection check-in. No book to carry, works offline.

## What it does

- **10 weeks, 3 days each** (30 study days). Each week's material is spread across:
  - **Day 1 · The Reading** — big idea, the week's reading, and the first Scriptures + teaching.
  - **Day 2 · Go Deeper** — the rest of the teaching and time to sit with the Word.
  - **Day 3 · Prepare to Gather** — the discussion questions and the week's challenge.
- **Daily check-in** — gratitude + a rotating reflection prompt, saved per day.
- **Journal** — every past day's gratitude and reflection in one place.
- **Local-first** — no login, no server. Progress and journal live only on the device.
- **Installable PWA** — add to home screen; works offline.

## Content source

Member curriculum is parsed from `../Crown_Season_10Week_Curriculum.html` into
`src/data/curriculum.json`. Leader-only notes and member profiles are **excluded**
from the member data and shipped only in the leader build (below).

```bash
npm run parse        # rebuild src/data/curriculum.json (member content)
npm run parse:leader # rebuild src/data/leader.json (LEADER-ONLY, sensitive)
npm run dev          # local dev server (leader mode ON for development)
npm run build        # MEMBER build → dist/ (no leader data, verified excluded)
npm run build:leader # LEADER build → dist/ (includes leader mode, PIN-gated)
```

## Leader mode & the two builds

Leader mode adds a leadership dashboard, member profile pages, hot-topics/struggles
analysis, and per-week "who to watch" activations. Its data (real names, pastoral
notes) is **sensitive**, so it is gated by a build flag. **Phone numbers and email
addresses are stripped out of the leader data entirely** (`parse-leader.mjs`) — they
are never bundled.

- **`npm run build`** — what the group installs. `VITE_LEADER` is unset, so the
  leader chunk and `leader.json` are dead-code-eliminated. Verified: the member
  bundle contains no member names, contact info, Supabase, or leader strings.
- **`npm run build:leader`** — only for the leader, on a private URL. Includes leader
  mode behind a **Google sign-in** (reachable from About → "Leader access").

**Deploy the two builds to two different URLs.** Never serve the leader build to the group.

### Leader login (Google via Supabase)

Access to leader mode = Google sign-in, restricted to a single email
(`VITE_LEADER_EMAIL`, default `travis.g.mader@gmail.com`). Any other Google account is
rejected. Set these in the **leader** build's environment at deploy:

```
VITE_LEADER_EMAIL=travis.g.mader@gmail.com
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable anon key>
```

Deploy checklist for the login:
1. Create (or reuse) a Supabase project; copy its URL + anon key.
2. Supabase → Authentication → Providers → enable **Google** (add a Google OAuth client).
3. Supabase → Authentication → URL config → add the leader deployment URL to
   **Redirect URLs** (the app redirects to `origin + BASE_URL`).
4. Set the three env vars above on the leader deployment and `npm run build:leader`.

When the Supabase vars are absent (local dev), the gate offers a **dev-only bypass** so
the console is reachable while building; in a deployed build with no config it stays locked.

> Note (current tradeoff): the leader build still bundles `leader.json` (names + notes).
> The login gates the UI, but keep the leader URL private. Planned follow-up: move leader
> data into Supabase behind row-level security so nothing sensitive ships in the bundle.

## Regenerating icons

```bash
node scripts/make-icons.mjs   # renders the stag emblem to PWA/home-screen PNGs
```

## Stack

Vite · React · TypeScript · React Router (hash) · vite-plugin-pwa · local-first (localStorage).
Styling is token-driven in `src/styles.css` so a future `DESIGN.md` can reskin the whole app
by editing CSS custom properties.
