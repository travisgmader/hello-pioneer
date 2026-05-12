import { validateTemplate } from './upload.js'
import { PPL_ORDER, BODY_PART_ORDER } from './split.js'

export const HYBRID_SEQUENCE = [
  ['Chest', 'Shoulders'],
  ['Back'],
  ['Legs'],
  ['Chest', 'Shoulders'],
  ['Back', 'Arms'],
]

const HYBRID_TEMPLATE_DATA = {
  'Chest + Shoulders': [
    { name: 'Incline Press', sets: 4, repLow: 6, repHigh: 10 },
    { name: 'Bench Press',           sets: 4, repLow: 8, repHigh: 12 },
    { name: 'Overhead Press',        sets: 3, repLow: 8, repHigh: 12 },
    { name: 'Lateral Raise',         sets: 4, repLow: 12, repHigh: 15 },
    { name: 'Rear Delt Fly',         sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Cable Fly',             sets: 3, repLow: 12, repHigh: 15 },
  ],
  'Back': [
    { name: 'Pull-Up',                    sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Barbell Row',                sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Lat Pulldown',               sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row',           sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Face Pull',                  sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Single-Arm Dumbbell Row',    sets: 3, repLow: 10, repHigh: 12 },
  ],
  'Legs': [
    { name: 'Squat',              sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Romanian Deadlift',  sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Leg Press',          sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Curl',           sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Extension',      sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Calf Raise',         sets: 4, repLow: 15, repHigh: 20 },
  ],
  'Back + Arms': [
    { name: 'Lat Pulldown',               sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row',           sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Single-Arm Dumbbell Row',    sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Tricep Pushdown',            sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Skull Crusher',              sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Tricep Overhead Extension',  sets: 3, repLow: 10, repHigh: 12 },
  ],
}

export const DEFAULTS = {
  Chest: [
    { name: 'Bench Press', sets: 4, repLow: 8, repHigh: 12 },
    { name: 'Incline Dumbbell Press', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Cable Fly', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Dip', sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Push-Up', sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Pec Deck', sets: 3, repLow: 12, repHigh: 15 },
  ],
  Back: [
    { name: 'Pull-Up', sets: 4, repLow: 6, repHigh: 10 },
    { name: 'Barbell Row', sets: 4, repLow: 8, repHigh: 12 },
    { name: 'Lat Pulldown', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Face Pull', sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Single-Arm Dumbbell Row', sets: 3, repLow: 10, repHigh: 12 },
  ],
  Legs: [
    { name: 'Squat', sets: 4, repLow: 6, repHigh: 10 },
    { name: 'Romanian Deadlift', sets: 3, repLow: 8, repHigh: 12 },
    { name: 'Leg Press', sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Curl', sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Extension', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Calf Raise', sets: 4, repLow: 15, repHigh: 20 },
  ],
  Shoulders: [
    { name: 'Overhead Press', sets: 4, repLow: 8, repHigh: 12 },
    { name: 'Lateral Raise', sets: 4, repLow: 12, repHigh: 15 },
    { name: 'Front Raise', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Rear Delt Fly', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Arnold Press', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Cable Lateral Raise', sets: 3, repLow: 12, repHigh: 15 },
  ],
  Arms: [
    { name: 'Barbell Curl', sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Tricep Pushdown', sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Hammer Curl', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Skull Crusher', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Incline Dumbbell Curl', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Tricep Overhead Extension', sets: 3, repLow: 10, repHigh: 12 },
  ],
  Push: [
    { name: 'Bench Press', sets: 4, repLow: 8, repHigh: 12 },
    { name: 'Overhead Press', sets: 3, repLow: 8, repHigh: 12 },
    { name: 'Incline Dumbbell Press', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Lateral Raise', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Tricep Pushdown', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Cable Fly', sets: 3, repLow: 12, repHigh: 15 },
  ],
  Pull: [
    { name: 'Pull-Up', sets: 4, repLow: 6, repHigh: 10 },
    { name: 'Barbell Row', sets: 4, repLow: 8, repHigh: 12 },
    { name: 'Lat Pulldown', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Barbell Curl', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Face Pull', sets: 3, repLow: 15, repHigh: 20 },
  ],
}

export function buildDefaultTemplates(split) {
  if (split === 'hybrid') {
    const templates = {}
    for (const [dayLabel, exercises] of Object.entries(HYBRID_TEMPLATE_DATA)) {
      const t = validateTemplate({ dayLabel, exercises })
      templates[t.dayLabel] = t
    }
    return templates
  }
  const labels =
    split === 'ppl' ? PPL_ORDER :
    split === 'body-part' ? BODY_PART_ORDER :
    []
  const templates = {}
  for (const label of labels) {
    const exercises = (DEFAULTS[label] ?? []).slice(0, 6)
    if (exercises.length === 0) continue
    const t = validateTemplate({ dayLabel: label, exercises })
    templates[t.dayLabel] = t
  }
  return templates
}
