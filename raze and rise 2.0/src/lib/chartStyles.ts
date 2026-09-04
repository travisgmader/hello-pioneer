/**
 * Shared Victory Native XL style objects.
 *
 * Victory renders on a Skia canvas, so it takes plain JS style objects rather
 * than NativeWind class names. Every chart component in Phase 3
 * (WeightProgressionChart, VolumeChart, MeasurementChart) imports from here so
 * axis typography, grid color and stroke widths stay identical across charts.
 *
 * Rule: no raw hex or magic numbers in this file — every value comes from
 * '@/lib/tokens'.
 */

import {
  COLOR_CHART_BAR,
  COLOR_CHART_GRID,
  COLOR_CHART_LINE,
  COLOR_CHART_MEASUREMENT,
  COLOR_FG_MUTED,
  FONT_FAMILY_CHART,
  FONT_SIZE_CHART_AXIS,
} from '@/lib/tokens';

/**
 * Axis tick-label style. Spread into Victory's `style` prop:
 *   <CartesianChart ... > ... </CartesianChart>
 *   axisOptions={{ labelColor: chartStyles.tickLabels.fill, ... }}
 */
export const tickLabels = {
  fontSize: FONT_SIZE_CHART_AXIS,
  fill: COLOR_FG_MUTED,
  fontFamily: FONT_FAMILY_CHART,
} as const;

/** Axis line / tick color. */
export const axisLineColor = COLOR_CHART_GRID;

/** Grid line color. */
export const gridLineColor = COLOR_CHART_GRID;

/** Axis and grid hairline width in points. */
export const axisLineWidth = 1;

/** Data line stroke width for progression charts. */
export const dataLineWidth = 2;

/** Corner radius applied to volume bars. */
export const barRoundedCorners = 4;

/** Minimum chart panel height in points (03-UI-SPEC: 200pt per chart). */
export const chartMinHeight = 200;

/** Stroke color for the workout weight-progression line. */
export const lineColor = COLOR_CHART_LINE;

/** Fill color for the volume bars. */
export const barColor = COLOR_CHART_BAR;

/** Stroke color for the body-measurement line. */
export const measurementLineColor = COLOR_CHART_MEASUREMENT;

/**
 * Convenience bundle for Victory's `axisOptions` prop. Charts may spread this
 * and then override only `font`, which must be a Skia font object obtained
 * from `useFont(require('../../assets/fonts/Manrope-Medium.ttf'), FONT_SIZE_CHART_AXIS)`.
 */
export const axisOptionsBase = {
  labelColor: tickLabels.fill,
  lineColor: axisLineColor,
  lineWidth: axisLineWidth,
} as const;
