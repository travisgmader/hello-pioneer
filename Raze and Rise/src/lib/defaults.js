import { validateTemplate } from './upload.js'
import { PPL_ORDER, BODY_PART_ORDER, FULL_BODY_LABELS } from './split.js'

export const HYBRID_SEQUENCE = [
  ['Chest', 'Shoulders'],
  ['Back'],
  ['Legs'],
  ['Chest', 'Shoulders'],
  ['Back', 'Arms'],
]

// ── Phase 0 — Hypertrophy (8–15 reps, 3–4 sets) ──────────────────────────────

const HYBRID_TEMPLATE_DATA = {
  'Chest + Shoulders': [
    { name: 'Incline Press',   sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Bench Press',     sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Overhead Press',  sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Lateral Raise',   sets: 4, repLow: 12, repHigh: 15 },
    { name: 'Rear Delt Fly',   sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Cable Fly',       sets: 3, repLow: 12, repHigh: 15 },
  ],
  'Back': [
    { name: 'Pull-Up',           sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Barbell Row',       sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Lat Pulldown',      sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row',  sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Face Pull',         sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Single-Arm DB Row', sets: 3, repLow: 10, repHigh: 12 },
  ],
  'Legs': [
    { name: 'Squat',             sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Romanian Deadlift', sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Leg Press',         sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Curl',          sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Extension',     sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Calf Raise',        sets: 4, repLow: 15, repHigh: 20 },
  ],
  'Back + Arms': [
    { name: 'Lat Pulldown',              sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row',          sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Single-Arm DB Row',         sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Tricep Pushdown',           sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Skull Crusher',             sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Tricep Overhead Extension', sets: 3, repLow: 10, repHigh: 12 },
  ],
}

const FULL_BODY_TEMPLATE_DATA = {
  'Full-A': [
    { name: 'Goblet Squat',               sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Push-Up',                    sets: 4, repLow: 12, repHigh: 20 },
    { name: 'Dumbbell Romanian Deadlift', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Row',               sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Overhead Press',    sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Lunge',             sets: 3, repLow: 10, repHigh: 12 },
  ],
  'Full-B': [
    { name: 'Dumbbell Deadlift',   sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Pull-Up',             sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Goblet Squat',        sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Push-Up',             sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Dumbbell Bicep Curl', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Tricep Dip',          sets: 3, repLow: 10, repHigh: 15 },
  ],
  'Full-C': [
    { name: 'Dumbbell Thruster',    sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Pull-Up',              sets: 3, repLow: 6,  repHigh: 10 },
    { name: 'Dumbbell Split Squat', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Floor Press', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Row',         sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Push-Up',              sets: 3, repLow: 15, repHigh: 20 },
  ],
  'Full-D': [
    { name: 'Dumbbell Deadlift',              sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Dumbbell Floor Press',           sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Pull-Up',                        sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Dumbbell Bulgarian Split Squat', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Shoulder Press',        sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Hammer Curl',           sets: 3, repLow: 12, repHigh: 15 },
  ],
}

export const DEFAULTS = {
  // Incline before flat on all press days
  Chest: [
    { name: 'Incline Dumbbell Press', sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Bench Press',            sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Cable Fly',              sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Dip',                    sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Push-Up',                sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Pec Deck',               sets: 3, repLow: 12, repHigh: 15 },
  ],
  Back: [
    { name: 'Pull-Up',           sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Barbell Row',       sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Lat Pulldown',      sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row',  sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Face Pull',         sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Single-Arm DB Row', sets: 3, repLow: 10, repHigh: 12 },
  ],
  Legs: [
    { name: 'Squat',             sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Romanian Deadlift', sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Leg Press',         sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Curl',          sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Leg Extension',     sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Calf Raise',        sets: 4, repLow: 15, repHigh: 20 },
  ],
  Shoulders: [
    { name: 'Overhead Press',      sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Lateral Raise',       sets: 4, repLow: 12, repHigh: 15 },
    { name: 'Front Raise',         sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Rear Delt Fly',       sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Arnold Press',        sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Cable Lateral Raise', sets: 3, repLow: 12, repHigh: 15 },
  ],
  Arms: [
    { name: 'Barbell Curl',              sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Tricep Pushdown',           sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Hammer Curl',               sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Skull Crusher',             sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Incline Dumbbell Curl',     sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Tricep Overhead Extension', sets: 3, repLow: 10, repHigh: 12 },
  ],
  Push: [
    // Incline before flat
    { name: 'Incline Dumbbell Press', sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Bench Press',            sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Overhead Press',         sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Lateral Raise',          sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Tricep Pushdown',        sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Cable Fly',              sets: 3, repLow: 12, repHigh: 15 },
  ],
  Pull: [
    { name: 'Pull-Up',          sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Barbell Row',      sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Lat Pulldown',     sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Seated Cable Row', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Barbell Curl',     sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Face Pull',        sets: 3, repLow: 15, repHigh: 20 },
  ],
}

// ── Phase 1 — Powerbuilding (Month 2) ─────────────────────────────────────────
// Compounds shift to 4–8 reps for strength. All new exercise selection for
// movement variety. Incline always precedes flat press.

const PHASE_1_HYBRID_TEMPLATE_DATA = {
  'Chest + Shoulders': [
    { name: 'Incline Barbell Press',      sets: 4, repLow: 5,  repHigh: 8  },
    { name: 'Low Incline Dumbbell Press', sets: 4, repLow: 8,  repHigh: 10 },
    { name: 'Seated Dumbbell Press',      sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Cable Lateral Raise',        sets: 4, repLow: 12, repHigh: 15 },
    { name: 'Cable Face Pull',            sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Dumbbell Chest Fly',         sets: 3, repLow: 12, repHigh: 15 },
  ],
  'Back': [
    { name: 'Weighted Pull-Up',      sets: 4, repLow: 4,  repHigh: 8  },
    { name: 'T-Bar Row',             sets: 4, repLow: 8,  repHigh: 10 },
    { name: 'Straight-Arm Pulldown', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Chest-Supported Row',   sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Low Cable Row',         sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Cable Face Pull',       sets: 3, repLow: 15, repHigh: 20 },
  ],
  'Legs': [
    { name: 'Front Squat',          sets: 4, repLow: 4,  repHigh: 8  },
    { name: 'Bulgarian Split Squat', sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Hack Squat',           sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Lying Leg Curl',       sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Leg Extension',        sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Seated Calf Raise',    sets: 4, repLow: 15, repHigh: 20 },
  ],
  // Back + Arms flips to bicep focus — Phase 0 was all triceps on this day
  'Back + Arms': [
    { name: 'Close-Grip Lat Pulldown', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Pendlay Row',             sets: 3, repLow: 8,  repHigh: 10 },
    { name: 'Cable Row',               sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Barbell Curl',            sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Incline Dumbbell Curl',   sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Hammer Curl',             sets: 3, repLow: 12, repHigh: 15 },
  ],
}

const PHASE_1_FULL_BODY_TEMPLATE_DATA = {
  'Full-A': [
    { name: 'Dumbbell Sumo Deadlift',         sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Dumbbell Incline Press',          sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Reverse Lunge',          sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Seal Row',               sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Lateral Raise',          sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Dumbbell Bicep Curl',             sets: 3, repLow: 12, repHigh: 15 },
  ],
  'Full-B': [
    { name: 'Pull-Up',                         sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Dumbbell Bulgarian Split Squat',  sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Floor Press',            sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Stiff-Leg Deadlift',     sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Arnold Press',           sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Tricep Kickback',        sets: 3, repLow: 12, repHigh: 15 },
  ],
  'Full-C': [
    { name: 'Dumbbell Romanian Deadlift',      sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Dumbbell Push Press',             sets: 3, repLow: 8,  repHigh: 10 },
    { name: 'Dumbbell Step-Up',                sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Bent-Over Row',          sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Incline Push-Up',                 sets: 3, repLow: 12, repHigh: 20 },
    { name: 'Dumbbell Hammer Curl',            sets: 3, repLow: 12, repHigh: 15 },
  ],
  'Full-D': [
    { name: 'Dumbbell Goblet Squat',           sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Pull-Up',                         sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Dumbbell Single-Leg RDL',         sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Close-Grip Floor Press', sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Dumbbell Renegade Row',           sets: 3, repLow: 8,  repHigh: 10 },
    { name: 'Dumbbell Lateral Raise',          sets: 3, repLow: 12, repHigh: 15 },
  ],
}

export const PHASE_1_DEFAULTS = {
  // Incline before flat on all press days, all new exercises from Phase 0
  Chest: [
    { name: 'Incline Barbell Press', sets: 4, repLow: 5,  repHigh: 8  },
    { name: 'Incline Dumbbell Fly',  sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Flat Dumbbell Press',   sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Weighted Dip',          sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Cable Crossover',       sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Machine Chest Press',   sets: 3, repLow: 10, repHigh: 12 },
  ],
  Back: [
    { name: 'Weighted Pull-Up',      sets: 4, repLow: 4,  repHigh: 8  },
    { name: 'T-Bar Row',             sets: 4, repLow: 8,  repHigh: 10 },
    { name: 'Straight-Arm Pulldown', sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Chest-Supported Row',   sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Low Cable Row',         sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Cable Face Pull',       sets: 3, repLow: 15, repHigh: 20 },
  ],
  Legs: [
    { name: 'Front Squat',           sets: 4, repLow: 4,  repHigh: 8  },
    { name: 'Bulgarian Split Squat', sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Hack Squat',            sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Lying Leg Curl',        sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Leg Extension',         sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Seated Calf Raise',     sets: 4, repLow: 15, repHigh: 20 },
  ],
  Shoulders: [
    { name: 'Seated Dumbbell Press', sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Cable Lateral Raise',   sets: 4, repLow: 12, repHigh: 15 },
    { name: 'Upright Row',           sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Rear Delt Cable Fly',   sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Cable Face Pull',       sets: 3, repLow: 15, repHigh: 20 },
    { name: 'Plate Front Raise',     sets: 3, repLow: 10, repHigh: 12 },
  ],
  Arms: [
    { name: 'EZ-Bar Curl',                    sets: 4, repLow: 8,  repHigh: 12 },
    { name: 'Close-Grip Bench Press',          sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Preacher Curl',                   sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Tricep Dip',                      sets: 3, repLow: 10, repHigh: 15 },
    { name: 'Cable Curl',                      sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Tricep Cable Overhead Extension', sets: 3, repLow: 12, repHigh: 15 },
  ],
  Push: [
    // Incline before flat
    { name: 'Incline Barbell Press',          sets: 4, repLow: 5,  repHigh: 8  },
    { name: 'Flat Dumbbell Press',            sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Seated Dumbbell Shoulder Press', sets: 3, repLow: 6,  repHigh: 10 },
    { name: 'Cable Lateral Raise',            sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Close-Grip Bench Press',         sets: 3, repLow: 8,  repHigh: 12 },
    { name: 'Cable Chest Fly',                sets: 3, repLow: 12, repHigh: 15 },
  ],
  Pull: [
    { name: 'Weighted Pull-Up',       sets: 4, repLow: 4,  repHigh: 8  },
    { name: 'Pendlay Row',            sets: 4, repLow: 6,  repHigh: 10 },
    { name: 'Straight-Arm Pulldown',  sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Incline Dumbbell Curl',  sets: 3, repLow: 12, repHigh: 15 },
    { name: 'Low Cable Row',          sets: 3, repLow: 10, repHigh: 12 },
    { name: 'Hammer Curl',            sets: 3, repLow: 12, repHigh: 15 },
  ],
}

// ── Phase 2 — Power (2–5 reps, 5–6 sets, heaviest compound movements) ────────

const PHASE_2_HYBRID_TEMPLATE_DATA = {
  'Chest + Shoulders': [
    { name: 'Incline Barbell Press', sets: 5, repLow: 3,  repHigh: 5  },
    { name: 'Bench Press',           sets: 5, repLow: 3,  repHigh: 5  },
    { name: 'Overhead Press',        sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Push Press',            sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Weighted Dip',          sets: 3, repLow: 5,  repHigh: 7  },
    { name: 'Lateral Raise',         sets: 3, repLow: 10, repHigh: 12 },
  ],
  'Back': [
    { name: 'Weighted Pull-Up', sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Deadlift',         sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Barbell Row',      sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Rack Pull',        sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Pendlay Row',      sets: 3, repLow: 3,  repHigh: 5  },
    { name: 'Face Pull',        sets: 3, repLow: 12, repHigh: 15 },
  ],
  'Legs': [
    { name: 'Back Squat',            sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Deadlift',              sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Front Squat',           sets: 3, repLow: 3,  repHigh: 5  },
    { name: 'Bulgarian Split Squat', sets: 4, repLow: 4,  repHigh: 6  },
    { name: 'Leg Press',             sets: 3, repLow: 6,  repHigh: 8  },
    { name: 'Calf Raise',            sets: 4, repLow: 8,  repHigh: 12 },
  ],
  'Back + Arms': [
    { name: 'Weighted Pull-Up', sets: 5, repLow: 3,  repHigh: 5  },
    { name: 'Deadlift',         sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Barbell Row',      sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Barbell Curl',     sets: 5, repLow: 4,  repHigh: 6  },
    { name: 'Close Grip Bench', sets: 4, repLow: 4,  repHigh: 6  },
    { name: 'Skull Crusher',    sets: 3, repLow: 4,  repHigh: 6  },
  ],
}

const PHASE_2_FULL_BODY_TEMPLATE_DATA = {
  'Full-A': [
    { name: 'Pistol Squat (Assisted)', sets: 4, repLow: 4, repHigh: 6 },
    { name: 'Archer Push-Up',          sets: 4, repLow: 6, repHigh: 8 },
    { name: 'Single-Leg DB RDL',       sets: 4, repLow: 6, repHigh: 8 },
    { name: 'Renegade Row',            sets: 4, repLow: 5, repHigh: 8 },
    { name: 'Dumbbell Push Press',     sets: 4, repLow: 5, repHigh: 7 },
    { name: 'Dumbbell Reverse Lunge',  sets: 4, repLow: 6, repHigh: 8 },
  ],
  'Full-B': [
    { name: 'Single-Leg DB Deadlift', sets: 5, repLow: 4, repHigh: 6 },
    { name: 'Weighted Pull-Up',       sets: 5, repLow: 3, repHigh: 5 },
    { name: 'DB Goblet Squat',        sets: 4, repLow: 6, repHigh: 8 },
    { name: 'Explosive Push-Up',      sets: 4, repLow: 5, repHigh: 8 },
    { name: 'Dumbbell Zottman Curl',  sets: 4, repLow: 6, repHigh: 8 },
    { name: 'L-Sit Tricep Dip',       sets: 4, repLow: 5, repHigh: 8 },
  ],
  'Full-C': [
    { name: 'Dumbbell Hang Clean',  sets: 5, repLow: 4,  repHigh: 6  },
    { name: 'Weighted Pull-Up',     sets: 5, repLow: 3,  repHigh: 5  },
    { name: 'Shrimp Squat',         sets: 4, repLow: 4,  repHigh: 6  },
    { name: 'Dumbbell Floor Press', sets: 5, repLow: 4,  repHigh: 6  },
    { name: 'Renegade Row',         sets: 4, repLow: 5,  repHigh: 7  },
    { name: 'Explosive Push-Up',    sets: 3, repLow: 6,  repHigh: 10 },
  ],
  'Full-D': [
    { name: 'Single-Leg DB Deadlift',         sets: 5, repLow: 3, repHigh: 5 },
    { name: 'Dumbbell Floor Press',           sets: 6, repLow: 4, repHigh: 6 },
    { name: 'Weighted Pull-Up',               sets: 5, repLow: 3, repHigh: 5 },
    { name: 'Dumbbell Bulgarian Split Squat', sets: 5, repLow: 4, repHigh: 6 },
    { name: 'Dumbbell Push Press',            sets: 4, repLow: 4, repHigh: 6 },
    { name: 'Dumbbell Hammer Curl',           sets: 4, repLow: 6, repHigh: 8 },
  ],
}

export const PHASE_2_DEFAULTS = {
  Chest: [
    { name: 'Incline Barbell Press', sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Bench Press',           sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Weighted Dip',          sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Pause Bench Press',     sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Close Grip Bench',      sets: 3, repLow: 4,  repHigh: 6  },
    { name: 'Cable Fly',             sets: 3, repLow: 10, repHigh: 12 },
  ],
  Back: [
    { name: 'Weighted Pull-Up', sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Deadlift',         sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Barbell Row',      sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Pendlay Row',      sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Rack Pull',        sets: 3, repLow: 3,  repHigh: 5  },
    { name: 'Face Pull',        sets: 3, repLow: 12, repHigh: 15 },
  ],
  Legs: [
    { name: 'Back Squat',            sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Deadlift',              sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Front Squat',           sets: 3, repLow: 3,  repHigh: 5  },
    { name: 'Bulgarian Split Squat', sets: 4, repLow: 4,  repHigh: 6  },
    { name: 'Romanian Deadlift',     sets: 3, repLow: 4,  repHigh: 6  },
    { name: 'Calf Raise',            sets: 4, repLow: 8,  repHigh: 12 },
  ],
  Shoulders: [
    { name: 'Overhead Press',    sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Push Press',        sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Behind Neck Press', sets: 3, repLow: 4,  repHigh: 6  },
    { name: 'Lateral Raise',     sets: 4, repLow: 10, repHigh: 12 },
    { name: 'Rear Delt Row',     sets: 3, repLow: 8,  repHigh: 10 },
    { name: 'Face Pull',         sets: 3, repLow: 12, repHigh: 15 },
  ],
  Arms: [
    { name: 'Barbell Curl',     sets: 5, repLow: 4, repHigh: 6 },
    { name: 'Close Grip Bench', sets: 5, repLow: 3, repHigh: 5 },
    { name: 'Incline DB Curl',  sets: 4, repLow: 5, repHigh: 7 },
    { name: 'Skull Crusher',    sets: 4, repLow: 4, repHigh: 6 },
    { name: 'Preacher Curl',    sets: 4, repLow: 5, repHigh: 7 },
    { name: 'Weighted Dip',     sets: 3, repLow: 6, repHigh: 10 },
  ],
  Push: [
    // Incline before flat
    { name: 'Incline Barbell Press', sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Bench Press',           sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Push Press',            sets: 4, repLow: 2,  repHigh: 4  },
    { name: 'Weighted Dip',          sets: 4, repLow: 4,  repHigh: 6  },
    { name: 'Close Grip Bench',      sets: 3, repLow: 4,  repHigh: 6  },
    { name: 'Lateral Raise',         sets: 3, repLow: 10, repHigh: 12 },
  ],
  Pull: [
    { name: 'Weighted Pull-Up', sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Deadlift',         sets: 5, repLow: 2,  repHigh: 4  },
    { name: 'Barbell Row',      sets: 4, repLow: 3,  repHigh: 5  },
    { name: 'Rack Pull',        sets: 3, repLow: 3,  repHigh: 5  },
    { name: 'Barbell Curl',     sets: 4, repLow: 5,  repHigh: 7  },
    { name: 'Face Pull',        sets: 3, repLow: 12, repHigh: 15 },
  ],
}

// ── Template builder ──────────────────────────────────────────────────────────

export function buildDefaultTemplates(split, days, phase = 0) {
  const defaults     = phase === 2 ? PHASE_2_DEFAULTS                   : phase === 1 ? PHASE_1_DEFAULTS                   : DEFAULTS
  const hybridData   = phase === 2 ? PHASE_2_HYBRID_TEMPLATE_DATA       : phase === 1 ? PHASE_1_HYBRID_TEMPLATE_DATA       : HYBRID_TEMPLATE_DATA
  const fullBodyData = phase === 2 ? PHASE_2_FULL_BODY_TEMPLATE_DATA    : phase === 1 ? PHASE_1_FULL_BODY_TEMPLATE_DATA    : FULL_BODY_TEMPLATE_DATA

  if (split === 'hybrid') {
    const templates = {}
    for (const [dayLabel, exercises] of Object.entries(hybridData)) {
      const t = validateTemplate({ dayLabel, exercises })
      templates[t.dayLabel] = t
    }
    return templates
  }

  if (split === 'full-body') {
    const templates = {}
    const dayCount = days ?? 3
    for (const label of FULL_BODY_LABELS.slice(0, dayCount)) {
      const exercises = fullBodyData[label] ?? []
      if (exercises.length === 0) continue
      const t = validateTemplate({ dayLabel: label, exercises })
      templates[t.dayLabel] = t
    }
    return templates
  }

  const labels =
    split === 'ppl'       ? PPL_ORDER       :
    split === 'body-part' ? BODY_PART_ORDER :
    []

  const templates = {}
  for (const label of labels) {
    const exercises = (defaults[label] ?? []).slice(0, 6)
    if (exercises.length === 0) continue
    const t = validateTemplate({ dayLabel: label, exercises })
    templates[t.dayLabel] = t
  }
  return templates
}
