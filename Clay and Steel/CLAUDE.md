# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test or lint tooling is configured.

## Architecture

**Clay and Steel** is a client-side-only React/Vite SPA for workout template management and tracking. There is no backend, no API, and no authentication — `localStorage` is the sole persistence layer.

### State

All application state lives in `App.jsx` as a single `useState` object, serialized to `localStorage` under the key `steel-and-clay-state` via `src/lib/storage.js`.

```js
{
  settings: { split: 'ppl' | 'body-part' | 'hybrid', hybridSequence: [] },
  templates: { [dayLabel]: { id, dayLabel, exercises: [], uploadedAt } },
  rotation: { pointer: 0 },             // position in the split cycle
  session: { dayLabel, startedAt, sets: {} }, // active workout
  history: []                           // completed workouts
}
```

### Key files

| File | Role |
|---|---|
| `src/App.jsx` | Top-level state, routing between Dashboard / Workouts / Settings |
| `src/lib/storage.js` | `loadState()` / `saveState()` — localStorage persistence |
| `src/lib/upload.js` | Parses uploaded `.xlsx` / `.csv` / `.json` files into exercise templates |
| `src/lib/split.js` | `deriveDayOrder`, `currentDayLabels` — split rotation logic (PPL, Body Part, Hybrid) |
| `src/pages/Dashboard.jsx` | Active workout tracking page |
| `src/pages/Workouts.jsx` | Template upload and management |
| `src/pages/Settings.jsx` | Split configuration |
| `src/components/ExerciseCard/` | Per-exercise UI with set tracking |
| `src/components/Nav/` | Tab navigation |
| `src/index.css` | Global design tokens (CSS custom properties, dark theme, Inter font) |

### Design tokens (index.css)

Dark theme: background `#0f1115`, surface `#1a1d24`, text `#e8eaed`. Accent colors: green `#22c55e` (Go), red `#ef4444` (No-Go), cyan `#38bdf8` (primary). Border radius: `--radius: 14px`, `--radius-sm: 10px`. All components use CSS Modules for scoped styles.

### Constraints

- React 19 with JSX (no TypeScript source — only `@types/*` dev deps for IDE support)
- No state management library — keep state in `App.jsx` and pass via props
- File parsing (`upload.js`) auto-detects headers and day labels from spreadsheet structure
