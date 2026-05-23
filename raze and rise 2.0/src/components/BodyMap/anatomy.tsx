/**
 * anatomy.tsx — SVG path data for the BodyMap component.
 *
 * ViewBox: 0 0 200 400 (portrait, human silhouette).
 * Paths are simplified anatomical approximations — stylized silhouette shapes.
 * 32×32pt visible region minimum per UI-SPEC.md; 44×44pt touch via hitSlop.
 *
 * Selected fill: #F2CA50 (accent-dim)
 * Selected stroke: #D4AF37 (border-strong)
 *
 * Front muscles: chest, left shoulder, right shoulder, left bicep, right bicep,
 *   abs, left quad, right quad, left calf, right calf
 * Back muscles: traps, left lat, right lat, lower back, left glute, right glute,
 *   left hamstring, right hamstring
 */

export interface MuscleGroup {
  id: string;
  name: string;
  side: 'front' | 'back';
  /** SVG path data string — viewBox 0 0 200 400 */
  pathD: string;
}

/**
 * MUSCLE_GROUPS — complete list of tappable muscle regions.
 * At least 10 front + 8 back as required by Plan 09 acceptance criteria.
 */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  // ── Front ─────────────────────────────────────────────────────────────────

  {
    id: 'chest',
    name: 'Chest',
    side: 'front',
    // Chest — center pec region below neck, above abs
    pathD: 'M75,100 Q100,95 125,100 L128,130 Q100,138 72,130 Z',
  },
  {
    id: 'left-shoulder',
    name: 'Left Shoulder',
    side: 'front',
    // Left shoulder (anatomical left = viewer's right)
    pathD: 'M128,88 Q145,82 152,95 Q150,112 138,115 Q128,108 125,100 Z',
  },
  {
    id: 'right-shoulder',
    name: 'Right Shoulder',
    side: 'front',
    // Right shoulder (anatomical right = viewer's left)
    pathD: 'M72,88 Q55,82 48,95 Q50,112 62,115 Q72,108 75,100 Z',
  },
  {
    id: 'left-bicep',
    name: 'Left Bicep',
    side: 'front',
    // Left bicep — upper arm outer
    pathD: 'M138,115 Q152,118 155,138 Q148,152 138,148 Q130,140 128,128 Z',
  },
  {
    id: 'right-bicep',
    name: 'Right Bicep',
    side: 'front',
    // Right bicep — upper arm outer
    pathD: 'M62,115 Q48,118 45,138 Q52,152 62,148 Q70,140 72,128 Z',
  },
  {
    id: 'abs',
    name: 'Abs',
    side: 'front',
    // Abs — central core below chest
    pathD: 'M78,132 Q100,126 122,132 L120,180 Q100,186 80,180 Z',
  },
  {
    id: 'left-quad',
    name: 'Left Quad',
    side: 'front',
    // Left quad — upper front thigh
    pathD: 'M104,210 Q118,208 124,220 Q122,255 112,258 Q100,256 96,248 Q98,225 104,210 Z',
  },
  {
    id: 'right-quad',
    name: 'Right Quad',
    side: 'front',
    // Right quad — upper front thigh
    pathD: 'M96,210 Q82,208 76,220 Q78,255 88,258 Q100,256 104,248 Q102,225 96,210 Z',
  },
  {
    id: 'left-calf',
    name: 'Left Calf',
    side: 'front',
    // Left calf — lower leg
    pathD: 'M105,295 Q116,293 120,308 Q118,335 110,340 Q102,336 100,325 Q100,308 105,295 Z',
  },
  {
    id: 'right-calf',
    name: 'Right Calf',
    side: 'front',
    // Right calf — lower leg
    pathD: 'M95,295 Q84,293 80,308 Q82,335 90,340 Q98,336 100,325 Q100,308 95,295 Z',
  },

  // ── Back ──────────────────────────────────────────────────────────────────

  {
    id: 'traps',
    name: 'Trapezius',
    side: 'back',
    // Traps — upper back / neck base
    pathD: 'M76,88 Q100,82 124,88 Q128,105 125,110 Q100,116 75,110 Q72,105 76,88 Z',
  },
  {
    id: 'left-lat',
    name: 'Left Lat',
    side: 'back',
    // Left lat — upper back outer left (anatomical left = viewer's right)
    pathD: 'M125,112 Q142,110 148,125 Q145,155 132,158 Q120,152 118,138 Q118,122 125,112 Z',
  },
  {
    id: 'right-lat',
    name: 'Right Lat',
    side: 'back',
    // Right lat — upper back outer right (anatomical right = viewer's left)
    pathD: 'M75,112 Q58,110 52,125 Q55,155 68,158 Q80,152 82,138 Q82,122 75,112 Z',
  },
  {
    id: 'lower-back',
    name: 'Lower Back',
    side: 'back',
    // Lower back — lumbar region
    pathD: 'M80,162 Q100,156 120,162 L118,188 Q100,194 82,188 Z',
  },
  {
    id: 'left-glute',
    name: 'Left Glute',
    side: 'back',
    // Left glute — posterior upper thigh/hip
    pathD: 'M102,192 Q120,190 128,205 Q126,225 114,228 Q100,226 98,215 Q98,200 102,192 Z',
  },
  {
    id: 'right-glute',
    name: 'Right Glute',
    side: 'back',
    // Right glute — posterior upper thigh/hip
    pathD: 'M98,192 Q80,190 72,205 Q74,225 86,228 Q100,226 102,215 Q102,200 98,192 Z',
  },
  {
    id: 'left-hamstring',
    name: 'Left Hamstring',
    side: 'back',
    // Left hamstring — posterior upper thigh
    pathD: 'M104,232 Q118,230 122,245 Q120,272 110,275 Q98,272 96,260 Q98,242 104,232 Z',
  },
  {
    id: 'right-hamstring',
    name: 'Right Hamstring',
    side: 'back',
    // Right hamstring — posterior upper thigh
    pathD: 'M96,232 Q82,230 78,245 Q80,272 90,275 Q102,272 104,260 Q102,242 96,232 Z',
  },
];

/** Front anatomy subset */
export const FrontAnatomy: MuscleGroup[] = MUSCLE_GROUPS.filter((m) => m.side === 'front');

/** Back anatomy subset */
export const BackAnatomy: MuscleGroup[] = MUSCLE_GROUPS.filter((m) => m.side === 'back');
