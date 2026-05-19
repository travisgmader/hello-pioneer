// Each array is a swap group — exercises targeting the same primary movers.
// Substitutions are session-level on the Dashboard (doesn't change the template)
// and template-level in the Workouts view (permanent).

const SWAP_GROUPS = [
  // Back: vertical pull (lat-dominant)
  [
    'Pull-Up',
    'Weighted Pull-Up',
    'Assisted Pull-Up',
    'Lat Pulldown',
    'Close-Grip Lat Pulldown',
    'Straight-Arm Pulldown',
    'Band Pull-Down',
    'Ring Row',
    'TRX Row',
  ],

  // Back: horizontal pull (mid-back, rhomboids)
  [
    'Barbell Row',
    'Pendlay Row',
    'T-Bar Row',
    'Seated Cable Row',
    'Low Cable Row',
    'Cable Row',
    'Single-Arm DB Row',
    'Dumbbell Row',
    'Dumbbell Bent-Over Row',
    'Dumbbell Seal Row',
    'Dumbbell Renegade Row',
    'Renegade Row',
    'Chest-Supported Row',
    'Machine Row',
    'Resistance Band Row',
    'Inverted Row',
  ],

  // Back: deadlift / hinge compound
  [
    'Deadlift',
    'Rack Pull',
    'Dumbbell Deadlift',
    'Single-Leg DB Deadlift',
    'Trap Bar Deadlift',
    'Dumbbell Hang Clean',
  ],

  // Rear delt / upper back (face pull pattern)
  [
    'Face Pull',
    'Cable Face Pull',
    'Rear Delt Fly',
    'Rear Delt Cable Fly',
    'Rear Delt Row',
    'Reverse Fly',
    'Band Pull-Apart',
    'Dumbbell Reverse Fly',
  ],

  // Chest: horizontal push (flat)
  [
    'Bench Press',
    'Pause Bench Press',
    'Dumbbell Bench Press',
    'Dumbbell Floor Press',
    'Machine Chest Press',
    'Push-Up',
    'Explosive Push-Up',
    'Archer Push-Up',
    'Resistance Band Press',
  ],

  // Chest: incline push
  [
    'Incline Press',
    'Incline Barbell Press',
    'Incline Dumbbell Press',
    'Low Incline Dumbbell Press',
    'Dumbbell Incline Press',
    'Incline Push-Up',
    'Incline Dumbbell Fly',
    'Dumbbell Chest Fly',
  ],

  // Chest: fly / isolation
  [
    'Cable Fly',
    'Cable Crossover',
    'Cable Chest Fly',
    'Dumbbell Chest Fly',
    'Dumbbell Fly',
    'Pec Deck',
    'Resistance Band Fly',
  ],

  // Chest / tricep: dip pattern
  [
    'Dip',
    'Weighted Dip',
    'Tricep Dip',
    'L-Sit Tricep Dip',
    'Bench Dip',
  ],

  // Shoulders: vertical push (overhead)
  [
    'Overhead Press',
    'Seated Dumbbell Press',
    'Seated Dumbbell Shoulder Press',
    'Dumbbell Overhead Press',
    'Dumbbell Shoulder Press',
    'Arnold Press',
    'Dumbbell Arnold Press',
    'Push Press',
    'Dumbbell Push Press',
    'Behind Neck Press',
    'Landmine Press',
    'Z-Press',
  ],

  // Shoulders: lateral / medial delt isolation
  [
    'Lateral Raise',
    'Cable Lateral Raise',
    'Dumbbell Lateral Raise',
    'Front Raise',
    'Plate Front Raise',
    'Upright Row',
    'Resistance Band Lateral Raise',
  ],

  // Legs: squat / quad-dominant
  [
    'Squat',
    'Back Squat',
    'Front Squat',
    'Goblet Squat',
    'DB Goblet Squat',
    'Dumbbell Goblet Squat',
    'Dumbbell Sumo Deadlift',
    'Leg Press',
    'Hack Squat',
    'Pistol Squat (Assisted)',
    'Shrimp Squat',
    'Dumbbell Thruster',
    'Air Squat',
    'Box Squat',
  ],

  // Legs: hip hinge / hamstring-dominant
  [
    'Romanian Deadlift',
    'Dumbbell Romanian Deadlift',
    'Dumbbell Stiff-Leg Deadlift',
    'Dumbbell Single-Leg RDL',
    'Single-Leg DB RDL',
    'Good Morning',
    'Leg Curl',
    'Lying Leg Curl',
    'Nordic Curl',
    'Glute Ham Raise',
  ],

  // Legs: single-leg / lunge pattern
  [
    'Bulgarian Split Squat',
    'Dumbbell Bulgarian Split Squat',
    'Lunge',
    'Dumbbell Lunge',
    'Dumbbell Reverse Lunge',
    'Reverse Lunge',
    'Step-Up',
    'Dumbbell Step-Up',
    'Dumbbell Split Squat',
    'Single-Leg Press',
    'Lateral Lunge',
  ],

  // Legs: knee isolation
  [
    'Leg Extension',
    'Leg Curl',
    'Lying Leg Curl',
  ],

  // Calves
  [
    'Calf Raise',
    'Seated Calf Raise',
    'Standing Calf Raise',
    'Donkey Calf Raise',
    'Single-Leg Calf Raise',
  ],

  // Arms: biceps
  [
    'Barbell Curl',
    'EZ-Bar Curl',
    'Dumbbell Bicep Curl',
    'Hammer Curl',
    'Dumbbell Hammer Curl',
    'Incline Dumbbell Curl',
    'Incline DB Curl',
    'Preacher Curl',
    'Cable Curl',
    'Dumbbell Zottman Curl',
    'Resistance Band Curl',
    'Concentration Curl',
  ],

  // Arms: triceps
  [
    'Tricep Pushdown',
    'Skull Crusher',
    'Tricep Overhead Extension',
    'Tricep Cable Overhead Extension',
    'Close-Grip Bench Press',
    'Close Grip Bench',
    'Dumbbell Tricep Kickback',
    'Overhead Tricep Extension',
    'Resistance Band Tricep Pushdown',
  ],
]

// Build a normalized lookup: lowercased name → group index
const _lookup = new Map()
SWAP_GROUPS.forEach((group, i) => {
  group.forEach(name => {
    const key = name.toLowerCase()
    if (!_lookup.has(key)) _lookup.set(key, i)
  })
})

/**
 * Returns alternative exercises for the same muscle group.
 * Excludes the current exercise name from the results.
 */
export function getSubstitutions(exerciseName) {
  const key = exerciseName.toLowerCase().trim()
  const groupIndex = _lookup.get(key)
  if (groupIndex === undefined) return []
  return SWAP_GROUPS[groupIndex].filter(n => n.toLowerCase() !== key)
}
