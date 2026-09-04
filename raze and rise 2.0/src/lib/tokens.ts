/**
 * Design tokens as JavaScript constants.
 *
 * NativeWind `className` is the styling system for every React Native view in
 * this app. This file exists for the one place className cannot reach: the
 * Victory Native XL / Skia canvas. Chart primitives take plain JS style objects
 * (`color`, `fontSize`, `strokeWidth`, …) and never accept class names, so the
 * values below are the single source of truth for chart theming.
 *
 * Every value here mirrors a token in tailwind.config.js — keep them in sync.
 * Do NOT write raw hex inline in chart components; import from here instead
 * (03-UI-SPEC "Token export pattern").
 */

// -------------------------------------------------------------------------
// Typography
// -------------------------------------------------------------------------

/** Caption / axis-label size in points. Mirrors tailwind `text-caption`. */
export const FONT_SIZE_CAPTION = 12;

/** Body size in points. Mirrors tailwind `text-body`. */
export const FONT_SIZE_BODY = 16;

/** Victory axis tick-label size. Alias of the caption scale step. */
export const FONT_SIZE_CHART_AXIS = 12;

/**
 * Chart axis font family. Backed by the bundled TTF at
 * assets/fonts/Manrope-Medium.ttf — Skia's `useFont` needs a real font file,
 * it cannot resolve a family name from the system.
 */
export const FONT_FAMILY_CHART = 'Manrope';

// -------------------------------------------------------------------------
// Surface + foreground colors (mirror tailwind theme.extend.colors)
// -------------------------------------------------------------------------

/** tailwind `fg-muted` — secondary text and axis labels. */
export const COLOR_FG_MUTED = '#99907C';

/** tailwind `accent` — primary gold. */
export const COLOR_ACCENT = '#F2CA50';

/** tailwind `bg-elevated` — card / chart panel surface. */
export const COLOR_BG_ELEVATED = '#141416';

// -------------------------------------------------------------------------
// Phase 3 chart colors
// -------------------------------------------------------------------------

/** Weight-progression line stroke. Alias of `accent` — the most important data. */
export const COLOR_CHART_LINE = '#F2CA50';

/** Volume bar fill. Dimmed so the line chart reads as primary. */
export const COLOR_CHART_BAR = 'rgba(212, 175, 55, 0.35)';

/** Body-measurement line stroke. Blue, to distinguish body data from workout data. */
export const COLOR_CHART_MEASUREMENT = '#60A5FA';

/** Chart grid lines. `fg-subtle` hue at 30% so it never competes with the data. */
export const COLOR_CHART_GRID = 'rgba(92, 86, 75, 0.30)';
