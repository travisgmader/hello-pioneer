# Design System: Family Hub

## 1. Visual Theme & Atmosphere

Soft, cheerful, and domestic. The aesthetic draws from an **Easter pastel palette** — the kind of colors you'd find on a spring tablecloth or a child's bedroom wall. The overall density is **light and breathable**: generous whitespace, rounded everything, and shadows so faint they feel more like ambient light than depth. Nothing competes for attention; the UI recedes and lets family data take center stage. Emoji are used deliberately as identity anchors (each family member has one) rather than decoration. The tone is warm and approachable — this is a home tool, not a productivity app.

---

## 2. Color Palette & Roles

### Page & Surface
| Name | Hex | Role |
|---|---|---|
| Whisper Violet (page background) | `#fdf6ff` | App background — a barely-there lavender tint that prevents pure white harshness |
| Cloud White (card surface) | `#ffffff` | All cards, panels, nav bar, and modals |
| Soft Lilac (border) | `#e8d5f5` | All dividers, card outlines, input strokes, and grid lines |

### Text
| Name | Hex | Role |
|---|---|---|
| Deep Plum (body text) | `#3d2c4e` | All primary text — headings, labels, values |
| Dusty Mauve (muted text) | `#8a7898` | Secondary labels, timestamps, placeholder hints, empty states |

### Member Identity Colors
Each family member owns a full tonal range (light tint → mid → dark) used consistently across their avatar, badges, progress bars, event chips, and calendar dots.

| Member | Tint | Mid | Dark |
|---|---|---|---|
| **Mom** — Petal Pink | `#fad4e0` | `#f4a0b5` | `#d4607a` |
| **Dad** — Sky Blue | `#c5e4f0` | `#87c4e0` | `#4a8fba` |
| **Stella** — Soft Lavender | `#ecdff7` | `#c9a8e0` | `#9b7bbf` |
| **Roman** — Spring Mint | `#cbedcb` | `#8ecf8e` | `#5fa85f` |
| **Layla** — Butter Yellow | `#fdf0b8` | `#f5d87a` | `#c9a830` |

### Functional / Semantic Colors
| Name | Hex | Role |
|---|---|---|
| Creamsicle Peach | `#f5c09a` | "Everyone" family events, meal recommendations, general-purpose accent |
| Peach Light | `#fde3ca` | Peach tint surfaces |
| Peach Dark | `#d07a40` | Peach text on light backgrounds |

### Meal Slot Colors (Calendar)
| Slot | Tint | Text |
|---|---|---|
| Breakfast | Butter Yellow light `#fdf0b8` | Butter Yellow dark `#c9a830` |
| Lunch | Spring Mint light `#cbedcb` | Spring Mint dark `#5fa85f` |
| Dinner | Soft Lavender light `#ecdff7` | Soft Lavender dark `#9b7bbf` |

### Shadow System
- **Resting shadow:** `0 4px 20px rgba(180, 140, 220, 0.12)` — purple-tinted, nearly invisible lift
- **Hover shadow:** `0 8px 30px rgba(180, 140, 220, 0.22)` — same hue, slightly more pronounced on interaction

---

## 3. Typography Rules

**Font family:** `'Segoe UI'`, `system-ui`, `-apple-system`, `sans-serif` — the native system stack, prioritizing Segoe UI on Windows. Feels familiar and domestic, not designed-to-impress.

| Level | Size | Weight | Usage |
|---|---|---|---|
| Page title (h1) | 28–36px | 700 | Dashboard hero, page headers |
| Section title (h2) | 17–18px | 600 | Card section headers, panel titles |
| Sub-heading (h3/h4) | 15–16px | 600 | Detail panel headers, day headers |
| Body | 15px | 400 | General content, descriptions |
| Label / meta | 13–14px | 400–500 | Form labels, badges, secondary info |
| Micro / uppercase label | 10–12px | 600–700 | Category tags, day-of-week headers, frequency badges — always uppercase with `letter-spacing: 0.5–0.8px` |

Line height is `1.5` throughout for readability. No serif or monospace fonts are used.

---

## 4. Component Stylings

### Navigation Bar
Sticky top bar on white with a 2px solid Soft Lilac (`#e8d5f5`) bottom border and a resting purple shadow. Logo text is 20px bold Deep Plum. Nav links are pill-shaped (20px border-radius) with transparent backgrounds by default; active state fills with the Mid color of the relevant palette entry (lavender for global pages, member color for member pages). Hover state uses the Tint variant of each color.

### Cards & Panels
- **Corner radius:** Generously rounded — `16px` on all cards, panels, and section containers
- **Background:** Cloud White (`#ffffff`)
- **Border:** 1px solid Soft Lilac (`#e8d5f5`)
- **Shadow:** Resting purple-tinted shadow
- **Top accent border:** Member pages use a 3px solid top border in the member's Mid color to signal ownership
- **Hover:** `box-shadow` elevates to hover shadow variant; some cards translate up 3px (`translateY(-3px)`)

### Buttons
Three distinct button types:

| Type | Shape | Fill | Use |
|---|---|---|---|
| **Primary pill** | `border-radius: 20px`, 8–10px vertical padding | Solid Mid color, white text | Add actions, nav active state |
| **Secondary outline** | `border-radius: 12–16px` | White bg, 1.5px colored border, colored text | Filter chips, toggle pills |
| **Icon/compact** | `border-radius: 50%` (circles) or `4–8px` (square) | Transparent or tinted bg | Delete (✕), nav arrows, vote buttons |

Hover states always darken or fill: primary pills use `filter: brightness(0.9)` or a hardcoded dark variant; outline buttons swap to filled. No buttons use harsh black outlines.

### Inputs & Forms
- **Border:** 1.5px solid Soft Lilac, transitions to Lavender Mid (`#c9a8e0`) on `:focus`
- **Background:** Whisper Violet (`#fdf6ff`) inside cards, Cloud White in standalone forms
- **Corner radius:** Subtly rounded — `8px`
- **Font size:** 14px, inheriting body font
- Forms lay out as `flex-wrap` rows so fields reflow naturally on narrow widths

### Badges & Pills
Small inline labels (11–13px, font-weight 500–600) with `border-radius: 8–12px` and `padding: 2–4px 8–12px`. Always colored using a member's Tint as background and their Dark as text. Frequency badges (daily/weekly) use the Lavender tint/dark pair as a neutral option. Never use raw brand colors directly on text — always the Dark variant for contrast.

### Checkboxes
Custom square checkboxes: `22×22px`, `border-radius: 6px`, 2px colored border matching the assignee's Mid color. Checked state fills solid with the Mid color and shows a white `✓`. Transition is smooth (`0.2s`).

### Calendar Cells
- **Min height:** 110px to accommodate meal chips + event chips + custody icons
- **Grid gap:** 1px background trick — the grid container uses the border color as its background and `gap: 1px` creates the lines
- **Meal chips:** Unshaded plain text with slot emoji prefix (🌅/☀️/🌙), 10px bold, pinned to top of cell
- **Event chips:** 10px font, small `border-radius: 3px`, colored tint background with dark text and a 3px left accent border. Transport-assigned events use solid accent fill with white text and 🚗 prefix
- **Custody indicator:** Filled circle on the day number only (no cell background fill) — pink for Mom, blue for Dad

### Progress Bars
Full-width thin bars (`height: 6–8px`, `border-radius: 3–4px`) with a faint `rgba(0,0,0,0.08)` track. Fill uses the member's Mid color with a smooth `0.4s ease` width transition.

---

## 5. Layout Principles

**Max-width containers:** All pages cap at `900–1100px` centered with `margin: 0 auto` and `padding: 32px 24px`. Nothing stretches edge-to-edge on large screens.

**Vertical rhythm:** Pages use `gap: 20–32px` in a flex column stack. Sections inside cards use `gap: 14–20px`. Item lists use `gap: 8–12px`. The spacing scale is loose — breathing room is prioritized over density.

**Two-column splits:** Detail pages (member pages, groceries) use a `1fr / 1fr` or `1fr / 1.4fr` CSS grid that collapses to a single column below 700–800px.

**Sticky navigation:** The nav bar is `position: sticky; top: 0; z-index: 100` so it remains accessible while scrolling long calendar or grocery pages.

**Tables:** The chore table uses `border-collapse: collapse` with alternating hover states using the Lavender tint. Delete actions are invisible until row hover (opacity 0 → 1 on `:hover`) to reduce visual noise.

**Calendar grid:** CSS grid with `grid-template-columns: repeat(7, 1fr)`, 1px gap rendered via background color trick. Day headers and slot labels live in the same grid flow.

**Meal planner grid:** `grid-template-columns: 90px repeat(7, 1fr)` — a fixed 90px slot label column plus seven equal day columns.

**Whitespace philosophy:** Err toward spacious. Padding inside cards is never less than `14px`. Section titles have at least `14–16px` bottom margin before their content. Empty states always include a brief friendly message rather than showing nothing.
