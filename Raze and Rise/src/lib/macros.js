const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  active:    1.725,
  very:      1.9,
}

export const GOALS = [
  {
    key:     'weight_loss',
    label:   'Weight Loss',
    desc:    '~1 lb/week fat loss',
    calAdj:  -500,
    protein: 0.40,
    carbs:   0.30,
    fat:     0.30,
    note:    'Moderate 500 kcal deficit targeting ~1 lb/week of fat loss',
  },
  {
    key:     'aggressive_loss',
    label:   'Aggressive Loss',
    desc:    '~1.5 lb/week fat loss',
    calAdj:  -750,
    protein: 0.45,
    carbs:   0.25,
    fat:     0.30,
    note:    'Aggressive deficit — keep protein high to preserve lean mass',
  },
  {
    key:     'body_composition',
    label:   'Body Composition',
    desc:    'Mild cut, preserve muscle',
    calAdj:  -250,
    protein: 0.40,
    carbs:   0.35,
    fat:     0.25,
    note:    'Small deficit with high protein to shed fat while maintaining muscle',
  },
  {
    key:     'recomposition',
    label:   'Recomposition',
    desc:    'Lose fat, gain muscle simultaneously',
    calAdj:  0,
    protein: 0.40,
    carbs:   0.35,
    fat:     0.25,
    note:    'Maintenance calories — works best for beginners or those returning to training',
  },
  {
    key:     'maintenance',
    label:   'Maintenance',
    desc:    'Hold current weight and composition',
    calAdj:  0,
    protein: 0.30,
    carbs:   0.45,
    fat:     0.25,
    note:    'Balanced macros to sustain current weight and performance',
  },
  {
    key:     'muscle_gain',
    label:   'Muscle Gain',
    desc:    'Lean bulk, ~0.25–0.5 lb/week',
    calAdj:  +300,
    protein: 0.30,
    carbs:   0.50,
    fat:     0.20,
    note:    'Modest surplus to maximize muscle growth with minimal fat gain',
  },
  {
    key:     'athletic_performance',
    label:   'Athletic Performance',
    desc:    'Carb-forward fueling for training',
    calAdj:  +200,
    protein: 0.25,
    carbs:   0.55,
    fat:     0.20,
    note:    'Higher carbs to fuel intense training sessions and aid recovery',
  },
]

export const ACTIVITY_LEVELS = [
  { key: 'sedentary', label: 'Sedentary',         desc: 'Desk job, little to no exercise' },
  { key: 'light',     label: 'Lightly Active',    desc: '1–3 workouts per week' },
  { key: 'moderate',  label: 'Moderately Active', desc: '3–5 workouts per week' },
  { key: 'active',    label: 'Very Active',       desc: '6–7 workouts per week' },
  { key: 'very',      label: 'Extremely Active',  desc: 'Physical job + daily training' },
]

function parseHeightCm(str) {
  if (!str) return null
  const ftIn = str.match(/(\d+)\s*[''′ft]+\s*(\d+)?/)
  if (ftIn) return (parseInt(ftIn[1], 10) * 12 + parseInt(ftIn[2] ?? '0', 10)) * 2.54
  const cm = str.match(/(\d+\.?\d*)\s*cm/)
  if (cm) return parseFloat(cm[1])
  // bare number treated as inches
  const bare = str.match(/^(\d+\.?\d*)$/)
  if (bare) return parseFloat(bare[1]) * 2.54
  return null
}

export function calculateMacros(profile, measurements, macroGoal) {
  const { age, height, sex } = profile ?? {}
  const { weight } = measurements ?? {}
  const { goal, activityLevel } = macroGoal ?? {}

  if (!age || !height || !sex || !weight || !goal || !activityLevel) return null

  const kg  = parseFloat(weight) * 0.453592
  const cm  = parseHeightCm(height)
  const yrs = parseFloat(age)
  if (!cm || !kg || !yrs) return null

  // Mifflin-St Jeor
  const bmr  = 10 * kg + 6.25 * cm - 5 * yrs + (sex === 'male' ? 5 : -161)
  const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55)
  const cfg  = GOALS.find(g => g.key === goal)
  if (!cfg) return null

  const calories = Math.round(tdee + cfg.calAdj)
  return {
    calories,
    protein: Math.round((calories * cfg.protein) / 4),
    carbs:   Math.round((calories * cfg.carbs)   / 4),
    fat:     Math.round((calories * cfg.fat)      / 9),
    tdee:    Math.round(tdee),
    note:    cfg.note,
  }
}
